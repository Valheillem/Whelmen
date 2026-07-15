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
            this.scene.startTurn('player');
        }

        // Both host and guest listen for state changes
        this.startFirebaseListener();
    }\n


    serializeState() {
        const myKey = this.scene.myRole;
        const oppKey = this.scene.myRole === 'host' ? 'guest' : 'host';

        return {
            deck: this.scene.sharedDeck.slice(),
            discard: this.scene.sharedDiscard.slice(),
            cycleIndex: this.scene.cycleIndex,
            firstCycleIndex: this.scene.firstCycleIndex,
            turn: this.scene.turn === 'player' ? myKey : oppKey,
            phase: this.scene.phase,
            actionUsed: this.scene.actionUsedThisTurn,
            [`${myKey}Hand`]: this.scene.player.hand.slice(),
            [`${myKey}Board`]: this.scene.player.board.slice(),
            [`${myKey}Shield`]: this.scene.player.shield,
            [`${myKey}Life`]: this.scene.player.life,
            [`${myKey}SteamDebuff`]: this.scene.player.steamDebuff || false,
            [`${oppKey}Hand`]: this.scene.ai.hand.slice(),
            [`${oppKey}Board`]: this.scene.ai.board.slice(),
            [`${oppKey}Shield`]: this.scene.ai.shield,
            [`${oppKey}Life`]: this.scene.ai.life,
            [`${oppKey}SteamDebuff`]: this.scene.ai.steamDebuff || false,
            reactionTargetSpell: this.scene.reactionTargetSpell || null,
            reactionResponseSpell: this.scene.reactionResponseSpell || null,
            reactionSource: this.scene.reactionSource || null,
            reactionCaster: this.scene.reactionCaster || null,
            discardTargetCount: this.scene.discardTargetCount || 0,
            seq: Date.now()
        };
    }\n

 syncToFirebase(actionType) {
        if (this.scene.mode !== 'online' || !this.scene.lobbyCode) return;

        try {
            const state = this.serializeState();
            const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);
            await ref.update({
                gameState: state,
                lastActionBy: this.scene.myRole,
                status: this.scene.phase === 'gameover' ? 'finished' : 'playing'
            });
        } catch (err) {
            console.error('[Whelmen Online] Sync error:', err);
            this.scene.duelHistory.logMessage('⚠ Network sync error. Retrying...');
        }
    }\n


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
    }\n


    loadFromFirebase(state) {
        const myKey = this.scene.myRole;
        const oppKey = this.scene.myRole === 'host' ? 'guest' : 'host';

        // Update deck and discard
        this.scene.sharedDeck = state.deck ? state.deck.slice() : [];
        this.scene.sharedDiscard = state.discard ? state.discard.slice() : [];

        // Update cycle
        this.scene.cycleIndex = state.cycleIndex || 0;
        this.scene.firstCycleIndex = state.firstCycleIndex || 1;

        // Map MY data to this.scene.player
        this.scene.player.hand = (state[`${myKey}Hand`] || []).slice();
        this.scene.player.board = (state[`${myKey}Board`] || []).slice();
        this.scene.player.shield = state[`${myKey}Shield`] || 0;
        this.scene.player.life = this.scene.player.hand.length + this.scene.player.board.length;
        this.scene.player.steamDebuff = state[`${myKey}SteamDebuff`] || false;

        // Map OPPONENT data to this.scene.ai
        this.scene.ai.hand = (state[`${oppKey}Hand`] || []).slice();
        this.scene.ai.board = (state[`${oppKey}Board`] || []).slice();
        this.scene.ai.shield = state[`${oppKey}Shield`] || 0;
        this.scene.ai.life = this.scene.ai.hand.length + this.scene.ai.board.length;
        this.scene.ai.steamDebuff = state[`${oppKey}SteamDebuff`] || false;

        // Update action state
        this.scene.actionUsedThisTurn = state.actionUsed || false;
        this.scene.phase = state.phase || 'action';

        // Determine whose turn it is locally
        const isMyTurn = state.turn === myKey;
        this.scene.turn = isMyTurn ? 'player' : 'ai';

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
            this.scene.duelHistory.logMessage("--- YOUR TURN ---");
            this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            this.scene.duelHistory.logMessage('It is your turn. Choose an action.');
        } else {
            this.scene.enablePlayerControls(false);
            this.scene.duelHistory.logMessage('Waiting for opponent...');
        }
    }\n


    cleanupOnline() {
        if (this.scene.firebaseUnsub) {
            this.scene.firebaseUnsub();
            this.scene.firebaseUnsub = null;
        }
        if (this.scene.lobbyCode) {
            firebase.database().ref(`lobbies/${this.scene.lobbyCode}/status`).set('finished').catch(() => {});
        }
    }\n


    refreshAllUI() {
        this.scene.updatePlayerHandDisplay();
        this.scene.updatePlayerBoardDisplay();
        this.scene.updatePlayerLifeDisplay();
        this.scene.updateAIHandDisplay();
        this.scene.updateAIBoardDisplay();
        this.scene.updateAILifeDisplay();
        this.scene.updateDeckDiscardDisplay();
        // Update cycle indicator rotation directly
        if (this.scene.cycleContainer) {
            this.scene.cycleContainer.rotation = -(this.scene.cycleIndex - 1) * (Math.PI / 2);
            this.scene.updateCycleDisplayColor(this.scene.cycleElements[this.scene.cycleIndex]);
        }
        this.scene.updateComboPreview();

        // Update shield visuals
        this.scene.updateShieldDisplay('player');
        this.scene.updateShieldDisplay('ai');
    }\n

}
