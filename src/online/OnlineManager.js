export class OnlineManager {
    constructor(scene) {
        this.scene = scene;
    }


    setupOnlineGame() {
        this.scene.duelHistory.logMessage(`Online mode: you are the ${this.scene.myRole.toUpperCase()}.`);
        this.scene.duelHistory.logMessage(`Lobby: ${this.scene.lobbyCode}`);

        if (this.scene.myRole === 'host') {
            // Host initializes the game state
            this.scene.initSharedDeck();
            this.scene.dealStartingHands();

            // Write initial state to Firebase so guest can load it
            this.syncToFirebase('init');

            // Host goes first
            this.scene.startTurn(this.scene.myRole);
        }

        // Both host and guest listen for state changes
        this.startFirebaseListener();
    }


    serializeState() {
        const state = {
            deck: this.scene.sharedDeck.slice(),
            discard: this.scene.sharedDiscard.slice(),
            cycleIndex: this.scene.cycleIndex,
            firstCycleIndex: this.scene.firstCycleIndex,
            turn: this.scene.turn,
            phase: this.scene.phase,
            actionUsed: this.scene.actionUsedThisTurn || false,
            manaPlacedThisTurn: this.scene.manaPlacedThisTurn || false,
            spellCastThisTurn: this.scene.spellCastThisTurn || false,
            reactionTargetSpell: this.scene.reactionTargetSpell || null,
            reactionResponseSpell: this.scene.reactionResponseSpell || null,
            reactionSource: this.scene.reactionSource || null,
            reactionCaster: this.scene.reactionCaster || null,
            discardTargetCount: this.scene.discardTargetCount || 0,
            seq: Date.now(),
            playersData: {}
        };

        for (const pid of this.scene.playerIds) {
            const p = this.scene.players[pid];
            state.playersData[pid] = {
                hand: p.hand.slice(),
                board: p.board.slice(),
                shield: p.shield,
                life: p.life,
                steamDebuff: p.steamDebuff || false,
                status: Object.assign({}, p.status)
            };
        }

        return state;
    }

 async syncToFirebase(actionType) {
        if (this.scene.mode !== 'online' || !this.scene.lobbyCode) return;

        // M4 fix: real exponential-backoff retry (was just logging "Retrying..." with no actual retry)
        const MAX_ATTEMPTS = 3;
        let delay = 500; // ms

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            try {
                const state = this.serializeState();
                const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);
                await ref.update({
                    gameState: state,
                    lastActionBy: this.scene.myRole,
                    status: this.scene.phase === 'gameover' ? 'finished' : 'playing'
                });
                return; // success — exit retry loop
            } catch (err) {
                console.error(`[Whelmen Online] Sync error (attempt ${attempt}/${MAX_ATTEMPTS}):`, err);
                if (attempt < MAX_ATTEMPTS) {
                    this.scene.duelHistory.logMessage(`⚠ Network error. Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2; // exponential backoff
                } else {
                    this.scene.duelHistory.logMessage('⚠ Network sync failed after 3 attempts. Check your connection.');
                }
            }
        }
    }


    startFirebaseListener() {
        const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);

        const handler = (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.gameState) return;

            const state = data.gameState;
            const lastBy = data.lastActionBy;

            // Ignore our own writes
            if (lastBy === this.scene.myRole) return;

            // Handle disconnection
            if (data.status === 'abandoned' || data.status === 'disconnected') {
                this.scene.duelHistory.logMessage('⚠ Opponent disconnected!');
                this.scene.gameOverScreen.showDisconnectOverlay();
                return;
            }

            // Load the remote state
            this.loadFromFirebase(state);
        };

        ref.on('value', handler);
        this.scene.firebaseUnsub = () => ref.off('value', handler);
    }


    loadFromFirebase(state) {
        // Update deck and discard
        this.scene.sharedDeck = state.deck ? state.deck.slice() : [];
        this.scene.sharedDiscard = state.discard ? state.discard.slice() : [];

        // Update cycle
        this.scene.cycleIndex = state.cycleIndex || 0;
        this.scene.firstCycleIndex = state.firstCycleIndex || 1;

        // Load all players
        if (state.playersData) {
            for (const pid of this.scene.playerIds) {
                const pData = state.playersData[pid];
                if (pData) {
                    this.scene.players[pid].hand = (pData.hand || []).slice();
                    this.scene.players[pid].board = (pData.board || []).slice();
                    this.scene.players[pid].shield = pData.shield || 0;
                    this.scene.players[pid].life = (pData.hand ? pData.hand.length : 0) + (pData.board ? pData.board.length : 0);
                    this.scene.players[pid].steamDebuff = pData.steamDebuff || false;
                    if (pData.status) {
                        this.scene.players[pid].status = Object.assign({}, pData.status);
                    }
                }
            }
        }

        // Update action state
        this.scene.actionUsedThisTurn = state.actionUsed || false;
        this.scene.manaPlacedThisTurn = state.manaPlacedThisTurn || false;
        this.scene.spellCastThisTurn = state.spellCastThisTurn || false;
        this.scene.phase = state.phase || 'action';
        this.scene.turn = state.turn || this.scene.playerIds[0];

        // Determine whose turn it is locally
        const isMyTurn = (state.turn === this.scene.getLocalPlayerId());

        // Refresh all UI
        this.refreshAllUI();

        // Handle game over
        if (state.phase === 'gameover') {
            this.scene.phase = 'gameover';
            return;
        }

        // Handle Request/Response phases FIRST
        if (state.phase === 'reaction_request' && !isMyTurn) {
            // We are the guest and need to react
            this.scene.reactionTargetSpell = state.reactionTargetSpell;
            this.scene.reactionSource = state.reactionSource;
            this.scene.reactionCaster = state.reactionCaster;
            
            this.scene.phase = 'reaction_request_active';
            this.scene.duelHistory.logMessage(`Reaction window triggers for you!`);
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            return;
        }

        if (state.phase === 'reaction_response' && isMyTurn) {
            // We are the host and the guest responded
            this.scene.phase = 'action'; // Reset phase internally
            const responseSpell = state.reactionResponseSpell || null;
            this.scene.combat.resolveDefendingReaction(responseSpell);
            return;
        }

        if (state.phase === 'discard_request' && !isMyTurn) {
            this.scene.cardsToDiscardCount = state.discardTargetCount;
            this.scene.phase = 'discard_request_active';
            this.scene.promptDiscardSelection();
            return;
        }

        if (state.phase === 'discard_response' && isMyTurn) {
            this.scene.phase = 'action';
            // Complete the attack process
            this.scene.time.delayedCall(600, () => {
                if (this.scene.pendingExtraAction) {
                    this.scene.pendingExtraAction = false;
                    this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                    this.scene.duelHistory.logMessage('You get another action!');
                    this.scene.enablePlayerControls(true);
                } else {
                    this.scene.checkTurnContinuation();
                }
            });
            return;
        }

        // Normal Turn Logic
        if (isMyTurn) {
            // Turn announcement removed per request
            if (state.phase !== 'action') {
                this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
            }
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            this.scene.duelHistory.logMessage('It is your turn. Choose an action.');
        } else {
            this.scene.enablePlayerControls(false);
            this.scene.duelHistory.logMessage('Waiting for opponent...');
        }
    }


    cleanupOnline() {
        if (this.scene.firebaseUnsub) {
            this.scene.firebaseUnsub();
            this.scene.firebaseUnsub = null;
        }
        if (this.scene.lobbyCode) {
            firebase.database().ref(`lobbies/${this.scene.lobbyCode}/status`).set('finished').catch(() => {});
        }
    }


    refreshAllUI() {
        for (const pid of this.scene.playerIds) {
            this.scene.updatePlayerHandDisplay(pid);
            this.scene.updatePlayerBoardDisplay(pid);
            this.scene.updatePlayerLifeDisplay(pid);
            this.scene.updateShieldDisplay(pid);
        }
        
        this.scene.updateDeckDiscardDisplay();
        // Update cycle indicator rotation directly
        if (this.scene.cycleContainer) {
            this.scene.cycleContainer.rotation = -(this.scene.cycleIndex - 1) * (Math.PI / 2);
            this.scene.updateCycleDisplayColor(this.scene.cycleElements[this.scene.cycleIndex]);
        }
        this.scene.updateComboPreview();
    }

}
