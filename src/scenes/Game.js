// --- SYNTHESIZED WEB AUDIO HELPER ---
class AudioSynthHelper {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    play(type) {
        try {
            this.init();
            if (!this.ctx) return;
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            const now = this.ctx.currentTime;

            if (type === 'click') {
                osc.frequency.setValueAtTime(500, now);
                osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } 
            else if (type === 'draw') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(250, now);
                osc.frequency.exponentialRampToValueAtTime(700, now + 0.22);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
                osc.start(now);
                osc.stop(now + 0.22);
            } 
            else if (type === 'fire') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
                osc.start(now);
                osc.stop(now + 0.45);
            } 
            else if (type === 'shield') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(350, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } 
            else if (type === 'water') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.linearRampToValueAtTime(300, now + 0.2);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            }
            else if (type === 'air') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(450, now);
                osc.frequency.linearRampToValueAtTime(750, now + 0.3);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            }
            else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(80, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.35);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            }
        } catch (e) {
            // Autoplay blocking safety
        }
    }
}

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        document.body.classList.add('in-game');
        // Attempt to lock orientation to landscape for the game board
        try { screen.orientation.lock('landscape').catch(() => {}); } catch(e) {}
        // Mode: 'ai' (default, single-player), 'online' (multiplayer via Firebase), or 'test' (Sandbox Test Range)
        this.mode = data?.mode || 'ai';
        this.lobbyCode = data?.lobbyCode || null;
        this.myRole = data?.myRole || 'host'; // 'host' or 'guest'
        this.playerId = data?.playerId || null;
        this.firebaseUnsub = null;
        this.isOnlineInitialized = false;
        if (this.mode === 'test') {
            this.dummyMode = 'passive'; // 'passive' or 'active'
        }
    }

    preload() {
        this.load.image('icon_fire', 'assets/icons/Fire.png');
        this.load.image('icon_earth', 'assets/icons/Earth.png');
        this.load.image('icon_water', 'assets/icons/Water.png');
        this.load.image('icon_air', 'assets/icons/Air.png');
        this.load.image('game-bg', './assets/WHELMEN_background_horizontal.png');
        this.load.image('sigil', './assets/WHELMEN_sigil.png');
    }

    createCardCanvas(key, w, h, drawFn) {
        if (this.textures.exists(key)) return;
        let canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        let ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        drawFn(ctx);
        this.textures.addCanvas(key, canvas);
    }

    create() {
        // Hide the main menu overlay
        document.getElementById('main-menu-overlay').classList.add('hidden');

        // Ensure game size is strictly landscape for the main game board
        this.scale.setGameSize(1560, 720);

        // Generate beautiful custom card textures dynamically using canvas
        const cardWidth = 100;
        const cardHeight = 150;

        // Card Back
        let cb = this.createCardCanvas('card_back', cardWidth, cardHeight, (ctx) => {
            let grad = ctx.createLinearGradient(0, 0, 0, cardHeight);
            grad.addColorStop(0, '#1a103c');
            grad.addColorStop(1, '#080516');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, cardWidth, cardHeight);
            
            // Celestial Gold Ring
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 2;
            ctx.strokeRect(6, 6, cardWidth - 12, cardHeight - 12);
            
            ctx.beginPath();
            ctx.arc(cardWidth / 2, cardHeight / 2, 20, 0, Math.PI * 2);
            ctx.stroke();

            // Star Core
            ctx.fillStyle = '#d4af37';
            ctx.font = '24px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', cardWidth / 2, cardHeight / 2);
        });

        // Fire Card
        this.createCardCanvas('card_fire', cardWidth, cardHeight, (ctx) => {
            let grad = ctx.createLinearGradient(0, 0, 0, cardHeight);
            grad.addColorStop(0, '#33050a');
            grad.addColorStop(0.5, '#590a13');
            grad.addColorStop(1, '#140204');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, cardWidth, cardHeight);
            ctx.strokeStyle = '#df1b2d'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);
            let img = this.textures.get('icon_fire').getSourceImage();
            ctx.drawImage(img, cardWidth/2 - 40, cardHeight/2 - 40, 80, 80);
        });

        // Earth Card
        this.createCardCanvas('card_earth', cardWidth, cardHeight, (ctx) => {
            let grad = ctx.createLinearGradient(0, 0, 0, cardHeight);
            grad.addColorStop(0, '#2e1d0d');
            grad.addColorStop(0.5, '#4d3216');
            grad.addColorStop(1, '#140c05');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, cardWidth, cardHeight);
            ctx.strokeStyle = '#a67032'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);
            let img = this.textures.get('icon_earth').getSourceImage();
            ctx.drawImage(img, cardWidth/2 - 40, cardHeight/2 - 40, 80, 80);
        });

        // Water Card
        this.createCardCanvas('card_water', cardWidth, cardHeight, (ctx) => {
            let grad = ctx.createLinearGradient(0, 0, 0, cardHeight);
            grad.addColorStop(0, '#061a2e');
            grad.addColorStop(0.5, '#0a2b4d');
            grad.addColorStop(1, '#020912');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, cardWidth, cardHeight);
            ctx.strokeStyle = '#1084e9'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);
            let img = this.textures.get('icon_water').getSourceImage();
            ctx.drawImage(img, cardWidth/2 - 40, cardHeight/2 - 40, 80, 80);
        });

        // Air Card
        this.createCardCanvas('card_air', cardWidth, cardHeight, (ctx) => {
            let grad = ctx.createLinearGradient(0, 0, 0, cardHeight);
            grad.addColorStop(0, '#1f1433');
            grad.addColorStop(0.5, '#332054');
            grad.addColorStop(1, '#0d0817');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, cardWidth, cardHeight);
            ctx.strokeStyle = '#bf8cff'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);
            let img = this.textures.get('icon_air').getSourceImage();
            ctx.drawImage(img, cardWidth/2 - 40, cardHeight/2 - 40, 80, 80);
        });

        const w = this.scale.width;
        const h = this.scale.height;

        this.synth = new AudioSynthHelper();

        // Background space
        this.add.rectangle(0, 0, w, h, 0x1a1410).setOrigin(0);
        const bgImg = this.add.image(w / 2, h / 2, 'game-bg');
        bgImg.setAlpha(1);
        bgImg.setDisplaySize(w, h);

        // Grid overlay
        this.grid = this.add.grid(w/2, h/2, w, h, 80, 80, 0x4a4a4a, 0.03, 0xffffff, 0.01);

        // Core Game variables
        this.sharedDeck = [];
        this.sharedDiscard = [];
        this.cycleElements = ['neutral', 'fire', 'earth', 'air', 'water'];
        this.cycleIndex = 0; // Neutral start
        this.firstCycleIndex = Math.floor(Math.random() * 4) + 1; // 1 to 4
        this.turn = 'player'; // Player starts
        this.phase = 'action'; // Starting action phase
        this.manaPlacedThisTurn = false; this.spellCastThisTurn = false; // Player can do 1 action per turn

        this.player = {
            hand: [],
            board: [],
            shield: 0,
            life: 8,
            maxHand: 8,
            consecutiveDiscards: 0,
            shieldG: null,
            shieldT: null,
                        steamDebuff: false,
            status: { bonusManaPlays: 0, loseManaOnDraw: 0, shieldDamageDebuff: 0, missChance: 0, autoPlayDraw: 0, everyoneDraw3: 0, discardReplaceHand: 0, rotateHands: 0, damageImmunity: 0, randomTargeting: 0, manaPlayDamage: 0, extraDrawIfShield: 0, bonusSpellPlays: 0, redrawMana: 0, oppManaPlayDamage: 0, retaliationDamage: 0, noDrawDebuff: 0, oppDraw4: 0, spellFailChance: 0 }
        };

        this.ai = {
            hand: [],
            board: [],
            shield: 0,
            life: 8,
            maxHand: 8,
            consecutiveDiscards: 0,
            shieldG: null,
            shieldT: null,
                        steamDebuff: false,
            status: { bonusManaPlays: 0, loseManaOnDraw: 0, shieldDamageDebuff: 0, missChance: 0, autoPlayDraw: 0, everyoneDraw3: 0, discardReplaceHand: 0, rotateHands: 0, damageImmunity: 0, randomTargeting: 0, manaPlayDamage: 0, extraDrawIfShield: 0, bonusSpellPlays: 0, redrawMana: 0, oppManaPlayDamage: 0, retaliationDamage: 0, noDrawDebuff: 0, oppDraw4: 0, spellFailChance: 0 }
        };

        // Spells Selected by player for casting
        this.selectedBoardMana = [];
        this.pendingExtraAction = false;

        // Particles
        this.setupParticles();

        // Drawing fields FIRST (UI must exist before game logic references it)
        this.drawActionLog();
        this.drawCycleIndicator();
        this.drawPlayerStats();
        this.drawAIStats();
        this.drawMagicSigils();
        this.drawDeckDiscardPiles();
        this.drawUIControls();
        this.createTopRightUI();

        // ONLINE MODE: show waiting indicator and set up differently
        if (this.mode === 'online') {
            this.setupOnlineGame();
        } else {
            // AI MODE: initialize locally as before
            this.initSharedDeck();
            this.dealStartingHands();
            this.startTurn('player');
            if (this.mode === 'test') {
                this.buildSandboxDashboard();
            }
        }
    }

    // --- SOUND ENGINE ---
    playSound(type) {
        this.synth.play(type);
    }

    // --- GAME ENGINE SETUP ---
    initSharedDeck() {
        // 88 cards, 22 of each element
        const elements = ['fire', 'earth', 'water', 'air'];
        elements.forEach(el => {
            for (let i = 0; i < 22; i++) {
                this.sharedDeck.push(el);
            }
        });
        this.shuffle(this.sharedDeck);
        this.logMessage("Initialized 88-card shared deck.");
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    drawCard(silent = false) {
        if (this.sharedDeck.length === 0) {
            if (this.sharedDiscard.length === 0) {
                this.logMessage("Deck and Discard are empty!");
                return null;
            }
            this.logMessage("Deck dry! Reshuffling Discard Pile...");
            this.sharedDeck = [...this.sharedDiscard];
            this.sharedDiscard = [];
            this.shuffle(this.sharedDeck);
            this.updateDeckDiscardDisplay();
        }
        if (!silent) this.playSound('draw');
        const card = this.sharedDeck.pop();
        this.updateDeckDiscardDisplay();
        return card;
    }

    dealStartingHands() {
        for (let i = 0; i < 4; i++) {
            this.player.hand.push(this.drawCard(true));
            this.ai.hand.push(this.drawCard(true));
        }
        this.updatePlayerHandDisplay();
        this.updateAIHandDisplay();
        this.updatePlayerLifeDisplay();
        this.updateAILifeDisplay();
    }

    // --- STATE MACHINE TURNS ---
    startTurn(who) {
        this.turn = who;
        let char = who === 'player' ? this.player : this.ai;
        let opp = who === 'player' ? this.ai : this.player;

        // Apply start of turn effects BEFORE decrementing
        if (char.status.everyoneDraw3 > 0) {
            for(let i=0;i<3;i++) { 
                let d = this.drawCard(); if(d) char.hand.push(d); 
                let d2 = this.drawCard(); if(d2) opp.hand.push(d2); 
            }
            this.logMessage("Everyone draws 3 mana!");
            char.status.everyoneDraw3 = 0; opp.status.everyoneDraw3 = 0;
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }
        
        if (char.status.discardReplaceHand > 0) {
            let chCount = char.hand.length; let opCount = opp.hand.length;
            while(char.hand.length>0) this.sharedDiscard.push(char.hand.pop());
            while(opp.hand.length>0) this.sharedDiscard.push(opp.hand.pop());
            for(let i=0;i<chCount;i++) { let d = this.drawCard(); if(d) char.hand.push(d); }
            for(let i=0;i<opCount;i++) { let d = this.drawCard(); if(d) opp.hand.push(d); }
            char.status.discardReplaceHand = 0; opp.status.discardReplaceHand = 0;
            this.logMessage("Hands were discarded and replaced!");
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }

        if (char.status.rotateHands > 0) {
            let temp = [...char.hand];
            char.hand = [...opp.hand];
            opp.hand = temp;
            char.status.rotateHands = 0; opp.status.rotateHands = 0;
            this.logMessage("Hands were rotated!");
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }
        
        if (char.status.oppDraw4 > 0) {
            for(let i=0;i<4;i++) { let d = this.drawCard(); if(d) char.hand.push(d); }
            char.status.oppDraw4 = 0;
            this.logMessage(`${who.toUpperCase()} is flooded with 4 extra mana!`);
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }
        
        if (char.status.extraDrawIfShield > 0 && char.shield > 0) {
            let d = this.drawCard(); if(d) char.hand.push(d);
            this.logMessage(`${who.toUpperCase()} draws extra mana from Shield!`);
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }

        // Quagmire redrawMana: discard up to 2 hand cards and draw replacements
        if (char.status.redrawMana > 0 && char.hand.length > 0) {
            const redrawCount = Math.min(2, char.hand.length);
            for (let i = 0; i < redrawCount; i++) {
                const discIdx = Math.floor(Math.random() * char.hand.length);
                this.sharedDiscard.push(char.hand.splice(discIdx, 1)[0]);
            }
            for (let i = 0; i < redrawCount; i++) {
                let d = this.drawCard(); if(d) char.hand.push(d);
            }
            char.status.redrawMana = 0;
            this.logMessage(`${who.toUpperCase()} redraws ${redrawCount} mana!`);
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }

        // Decrease statuses AFTER applying effects
        for (let k in char.status) {
            if (char.status[k] > 0) char.status[k]--;
        }
        
        this.phase = 'action';
        this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
        this.selectedBoardMana = [];
        this.updateComboPreview();

        const displayName = (this.mode === 'online' && who === 'player') ? 'YOUR' :
                            (this.mode === 'online' && who === 'ai') ? "OPPONENT'S" :
                            who.toUpperCase() + "'S";
        this.logMessage(`--- ${displayName} TURN ---`);

        // Draw phase
        
        let card = null;
        if (char.status.noDrawDebuff > 0) {
            this.logMessage(`${who.toUpperCase()} cannot draw this turn!`);
        } else {
            card = this.drawCard();
        }
    
        if (card) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (char.status.autoPlayDraw > 0 && char.board.length < 3) {
                char.board.push(card);
                this.logMessage(`${who.toUpperCase()}'s drawn mana is auto-played to board!`);
            } else {
                char.hand.push(card);
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (char.status.loseManaOnDraw > 0 && char.hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * char.hand.length);
                const lost = char.hand.splice(lostIdx, 1)[0];
                this.sharedDiscard.push(lost);
                this.logMessage(`${who.toUpperCase()} lost a hand mana from drawing!`);
            }

            if (who === 'player') {
                this.updatePlayerHandDisplay();
                this.updatePlayerBoardDisplay();
                this.updatePlayerLifeDisplay();
            } else {
                this.updateAIHandDisplay();
                this.updateAIBoardDisplay();
                this.updateAILifeDisplay();
            }
        }

        // Toggle action controls
        if (who === 'player') {
            this.enablePlayerControls(true);
            if (this.mode === 'online') {
                this.logMessage('It is your turn. Choose an action.');
            }
        } else {
            this.enablePlayerControls(false);
            if (this.mode === 'ai') {
                this.time.delayedCall(1200, () => {
                    this.runAITurn();
                });
            } else if (this.mode === 'test') {
                if (this.dummyMode === 'passive') {
                    this.logMessage("Dummy is passive. Passing turn back to Player.");
                    this.time.delayedCall(800, () => {
                        this.endTurn();
                    });
                } else {
                    this.time.delayedCall(1200, () => {
                        this.runAITurn();
                    });
                }
            } else {
                // ONLINE: wait for opponent — Firebase listener handles it
                this.logMessage('Waiting for opponent...');
            }
        }
    }

    endTurn() {
        // Rotate Cycle
        this.rotateCycle();

        // Enforce hand limit cleanup
        this.cleanupHandLimit('player');
        this.cleanupHandLimit('ai');

        // Check defeat
        if (this.checkDefeatCondition('player')) return;
        if (this.checkDefeatCondition('ai')) return;

        // Toggle turn
        const nextTurn = this.turn === 'player' ? 'ai' : 'player';
        this.startTurn(nextTurn);

        // ONLINE: sync state to Firebase AFTER transitioning to opponent's turn.
        // This ensures the opponent's newly drawn card and correct turn flag are synced.
        if (this.mode === 'online' && this.turn === 'ai') {
            this.syncToFirebase('endTurn');
        }
    }

    cleanupHandLimit(who) {
        const char = who === 'player' ? this.player : this.ai;
        if (char.hand.length > char.maxHand) {
            const discardCount = char.hand.length - char.maxHand;
            this.logMessage(`${who.toUpperCase()} discards ${discardCount} card(s) to match Hand Limit.`);
            for (let i = 0; i < discardCount; i++) {
                const discarded = char.hand.pop();
                this.sharedDiscard.push(discarded);
            }
            char.consecutiveDiscards++;
            if (char.consecutiveDiscards >= 2) {
                char.maxHand = Math.max(1, char.maxHand - 1);
                char.consecutiveDiscards = 0;
                this.logMessage(`OVERWHELMED! ${who.toUpperCase()}'s Max Hand Size decreases by 1!`);
                this.playSound('damage');
            }
            if (who === 'player') {
                this.updatePlayerHandDisplay();
                this.updatePlayerLifeDisplay();
            } else {
                this.updateAIHandDisplay();
                this.updateAILifeDisplay();
            }
            this.updateDeckDiscardDisplay();
        } else {
            char.consecutiveDiscards = 0;
        }
    }

    rotateCycle() {
        if (this.cycleIndex === 0) {
            this.cycleIndex = this.firstCycleIndex || 1;
        } else {
            this.cycleIndex = (this.cycleIndex + 1) % this.cycleElements.length;
            if (this.cycleIndex === 0) this.cycleIndex = 1;
        }
        
        const el = this.cycleElements[this.cycleIndex];
        this.logMessage(`The Cycle rotates to: [${el.toUpperCase()}]`);

        // Rotate graphic dial
        this.tweens.add({
            targets: this.cycleContainer,
            rotation: -(this.cycleIndex - 1) * (Math.PI / 2),
            duration: 500,
            ease: 'Cubic.easeOut'
        });

        // Pulsing active particle flash
        this.triggerCycleParticles(el);
    }

    checkDefeatCondition(who) {
        const char = who === 'player' ? this.player : this.ai;
        const totalCards = char.hand.length + char.board.length;
        if (totalCards === 0) {
            if (this.mode === 'test') {
                if (who === 'ai') {
                    this.showSandboxNotification("Dummy Defeated! Reviving...");
                    this.logMessage("--- DUMMY DEFEATED! Reviving Dummy... ---");
                    this.resetDummyState();
                } else {
                    this.showSandboxNotification("You Died! Reviving...");
                    this.logMessage("--- PLAYER DEFEATED! Reviving Player... ---");
                    this.resetPlayerState();
                }
                
                // Clear any locked sandbox phases
                this.phase = 'action';
                this.cardsToDiscardCount = 0;
                this.selectedBoardMana = [];
                if (this.discardPromptText) this.discardPromptText.setVisible(false);
                this.updateComboPreview();
                this.enablePlayerControls(true);

                // Advance turn cleanly
                this.time.delayedCall(800, () => {
                    this.endTurn();
                });
                return true;
            }

            this.phase = 'gameover';
            this.enablePlayerControls(false);
            this.showGameOver(who === 'player' ? 'DEFEAT' : 'VICTORY');

            // ONLINE: sync game over state so opponent sees result
            if (this.mode === 'online') {
                this.syncToFirebase('gameover');
            }
            return true;
        }
        return false;
    }

    // --- RENDER VISUAL LAYOUT ---
    setupParticles() {
        this.emitters = {};
        const elements = ['fire', 'earth', 'water', 'air'];
        const colors = { fire: 0xdf1b2d, earth: 0xa67032, water: 0x1084e9, air: 0xbf8cff };

        elements.forEach(el => {
            this.emitters[el] = this.add.particles(0, 0, 'star', {
                color: colors[el],
                scale: { start: 0.8, end: 0 },
                alpha: { start: 0.8, end: 0 },
                speed: { min: 50, max: 200 },
                lifespan: 800,
                emitting: false
            });
        });
    }

    triggerSpellVisual(element, startX, startY, endX, endY, onComplete) {
        if (element === 'n/a' || !this.emitters[element]) {
            element = 'air'; // Default to a valid element to prevent crash
        }
        
        this.playSound(element === 'earth' ? 'shield' : element);
        
        let visual = this.add.circle(startX, startY, 20, 
            element === 'fire' ? 0xdf1b2d : 
            element === 'earth' ? 0xa67032 : 
            element === 'water' ? 0x1084e9 : 0xbf8cff
        );
        visual.setStrokeStyle(4, 0xffffff);

        // Dynamic tail particle flow
        const emitter = this.emitters[element];
        emitter.startFollow(visual);
        emitter.start();

        this.tweens.add({
            targets: visual,
            x: endX,
            y: endY,
            duration: 800,
            ease: 'Quad.easeOut',
            onComplete: () => {
                visual.destroy();
                emitter.stop();
                
                // Explode particles
                emitter.explode(25, endX, endY);
                this.playSound('hit');
                onComplete();
            }
        });
    }

    drawCycleIndicator() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.cycleContainer = this.add.container(w / 2 - 20, h / 2 - 40);
        this.cycleLabels = [];

        // 4 Elements around the circle
        const ringPositions = [
            { x: 0, y: -65, color: 0xdf1b2d, icon: 'icon_fire', label: 'FIRE' },
            { x: 65, y: 0, color: 0xa67032, icon: 'icon_earth', label: 'EARTH' },
            { x: 0, y: 65, color: 0xbf8cff, icon: 'icon_air', label: 'AIR' },
            { x: -65, y: 0, color: 0x1084e9, icon: 'icon_water', label: 'WATER' }
        ];

        ringPositions.forEach((pos) => {
            const glow = this.add.graphics();
            glow.lineStyle(1.5, pos.color, 0.3);
            glow.strokeCircle(pos.x, pos.y, 22);
            this.cycleContainer.add(glow);

            const label = this.add.image(pos.x, pos.y, pos.icon).setDisplaySize(44, 44);
            this.cycleContainer.add(label);
            this.cycleLabels.push(label);
        });

        // Center wheel indicator
        this.cycleCenterText = this.add.text(0, 0, 'CYCLE', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '15px',
            fontWeight: '800',
            color: '#1a1a1a'
        }).setOrigin(0.5);
        this.cycleContainer.add(this.cycleCenterText);

        this.updateCycleDisplayColor(this.cycleElements[this.cycleIndex]);
    }

    updateCycleDisplayColor(element) {
        if (!this.cycleCenterText) return;

        const color = element === 'fire' ? 0xdf1b2d :
                      element === 'water' ? 0x257ee4 :
                      element === 'earth' ? 0x4db15b :
                      element === 'air' ? 0x9247d5 : 0x4a4a4a; // neutral fallback

        const hexColor = element === 'fire' ? '#df1b2d' :
                         element === 'water' ? '#257ee4' :
                         element === 'earth' ? '#4db15b' :
                         element === 'air' ? '#9247d5' : '#1a1a1a';

        // Update center text
        this.cycleCenterText.setText(element.toUpperCase());
        this.cycleCenterText.setColor(hexColor);
    }

    triggerCycleParticles(element) {
        if (element === 'neutral') return;
        const emitter = this.emitters[element];
        emitter.explode(40, this.scale.width / 2, this.scale.height / 2 - 40);
        this.updateCycleDisplayColor(element);
    }

    playElementalBurst(x, y, element) {
        // Play corresponding sound effect
        if (element === 'fire') {
            this.playSound('fire'); // Sizzle
        } else if (element === 'water') {
            this.playSound('water'); // Splash
        } else if (element === 'earth') {
            this.playSound('earth'); // Thud
        } else if (element === 'air') {
            this.playSound('air'); // Whoosh
        }

        // Create a localized particle explosion at the card's position
        const color = element === 'fire' ? 0xdf1b2d :
                      element === 'water' ? 0x257ee4 :
                      element === 'earth' ? 0x4db15b :
                      element === 'air' ? 0x9247d5 : 0xffffff;

        const emitter = this.add.particles(0, 0, 'particle', {
            x: x,
            y: y,
            speed: { min: 50, max: 200 },
            angle: { min: 180, max: 360 }, // Burst upwards
            scale: { start: 0.6, end: 0 },
            tint: color,
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            gravityY: 400, // Particles fall down
            blendMode: 'ADD'
        });

        emitter.explode(30);

        // Cleanup emitter after explosion finishes
        this.time.delayedCall(1000, () => {
            emitter.destroy();
        });
    }

    drawPlayerStats() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.playerZone = this.add.container(0, h - 195);



        // Draw Player Shield indicator
        this.player.shieldG = this.add.graphics();
        this.playerZone.add(this.player.shieldG);

        this.player.shieldT = this.add.text(600, -31, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            color: '#a67032'
        });
        this.playerZone.add(this.player.shieldT);
    }

    createTopRightUI() {
        const w = this.scale.width;
        
        // Resign Button
        const btnResign = this.add.text(w - 40, 25, 'RESIGN', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#df1b2d',
            backgroundColor: 'rgba(13,11,28,0.85)',
            padding: { x: 14, y: 8 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(2000);
        
        btnResign.on('pointerover', () => {
            btnResign.setColor('#ffffff');
            btnResign.setBackgroundColor('#df1b2d');
        });
        btnResign.on('pointerout', () => {
            btnResign.setColor('#df1b2d');
            btnResign.setBackgroundColor('rgba(13,11,28,0.85)');
        });
        
        btnResign.on('pointerdown', () => {
            if (this.mode === 'online') {
                this.stopFirebaseListener();
            }
            this.scene.start('Start');
        });
    }

    drawAIStats() {
        const w = this.scale.width;

        this.aiZone = this.add.container(0, 30);



        // Draw AI Shield indicator
        this.ai.shieldG = this.add.graphics();
        this.aiZone.add(this.ai.shieldG);

        this.ai.shieldT = this.add.text(600, 169, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            color: '#a67032'
        });
        this.aiZone.add(this.ai.shieldT);
    }

    drawMagicSigils() {
        const w = this.scale.width;
        const h = this.scale.height;
        this.drawMagicSigil(w / 2 - 20, h / 2 - 40, 0x1a1a1a); // Shared board sigil
    }

    drawMagicSigil(x, y, colorHex) {
        const sigil = this.add.image(x, y, 'sigil').setScale(440 / 864);
        sigil.setAlpha(0.35); // Transparent to blend into background
        
        // Subtle breathing animation for a premium element feel
        this.tweens.add({
            targets: sigil,
            alpha: 0.15,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    updatePlayerLifeDisplay() {
        const total = this.player.hand.length + this.player.board.length;
        this.player.life = total;
    }

    updateAILifeDisplay() {
        const total = this.ai.hand.length + this.ai.board.length;
        this.ai.life = total;
    }

    updateShieldDisplay(who) {
        const char = who === 'player' ? this.player : this.ai;
        char.shieldG.clear();
        if (char.shield > 0) {
            char.shieldG.fillStyle(0xa67032, 0.15);
            char.shieldG.lineStyle(2, 0xa67032, 0.7);
            if (who === 'player') {
                // Place below the player hand (relative to playerZone) to avoid overlap
                char.shieldG.fillRoundedRect(80, 150, 140, 24, 6);
                char.shieldG.strokeRoundedRect(80, 150, 140, 24, 6);
                char.shieldT.setPosition(90, 154);
            } else {
                // Place below the AI hand (relative to aiZone)
                char.shieldG.fillRoundedRect(80, 160, 140, 24, 6);
                char.shieldG.strokeRoundedRect(80, 160, 140, 24, 6);
                char.shieldT.setPosition(90, 164);
            }
            char.shieldT.setText(`🛡️ SHIELD: ${char.shield}`);
        } else {
            char.shieldT.setText('');
        }
    }

    drawDeckDiscardPiles() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Create actual image representations for Deck and Discard
        this.deckCardImg = this.add.image(w / 2 - 180, h / 2 - 40, 'card_back')
            .setScale(0.75)
            .setVisible(true);

        this.discardCardImg = this.add.image(w / 2 + 140, h / 2 - 40, 'card_back')
            .setScale(0.75)
            .setVisible(false);

        // Graphics to draw empty slot outline when discard is empty
        this.discardOutlineG = this.add.graphics();

        // Text labels positioned under the card images
        this.deckT = this.add.text(w / 2 - 180, h / 2 + 35, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#1a1a1a',
            align: 'center'
        }).setOrigin(0.5, 0);

        this.discardT = this.add.text(w / 2 + 140, h / 2 + 35, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#1a1a1a',
            align: 'center'
        }).setOrigin(0.5, 0);

        this.updateDeckDiscardDisplay();
    }

    updateDeckDiscardDisplay() {
        const w = this.scale.width;
        const h = this.scale.height;

        if (!this.deckCardImg || !this.discardCardImg) return;

        // Update Deck representation
        if (this.sharedDeck.length > 0) {
            this.deckCardImg.setVisible(true);
            this.deckT.setText(`DECK\n(${this.sharedDeck.length})`);
        } else {
            this.deckCardImg.setVisible(false);
            this.deckT.setText('DECK\n(EMPTY)');
        }

        // Update Discard representation
        this.discardOutlineG.clear();
        if (this.sharedDiscard.length > 0) {
            const topEl = this.sharedDiscard[this.sharedDiscard.length - 1];
            this.discardCardImg.setTexture(`card_${topEl}`);
            this.discardCardImg.setVisible(true);
            this.discardT.setText(`DISCARD\n(${this.sharedDiscard.length})`);
        } else {
            this.discardCardImg.setVisible(false);
            this.discardT.setText('DISCARD\n(EMPTY)');

            // Draw a clean, semi-transparent card slot outline for empty discard
            const cardW = 100 * 0.75;
            const cardH = 150 * 0.75;
            this.discardOutlineG.lineStyle(1.5, 0x1a1a1a, 0.6);
            this.discardOutlineG.strokeRoundedRect(
                w / 2 + 140 - cardW / 2, 
                h / 2 - 40 - cardH / 2, 
                cardW, 
                cardH, 
                6
            );
        }
    }

    drawUIControls() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Primed Spell Preview Panel
        const panelW = 264;
        const panelH = 132;
        
        this.primedSpellPanel = this.add.container(80, h - 350).setVisible(false);
        
        this.primedSpellBg = this.add.graphics();
        this.primedSpellPanel.add(this.primedSpellBg);
        
        this.primedSpellTitle = this.add.text(14, 12, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '15px',
            fontWeight: '800',
            color: '#ffffff'
        });
        this.primedSpellPanel.add(this.primedSpellTitle);

        this.primedSpellIcon = this.add.image(198, 66, '').setAlpha(0.5).setVisible(false);
        this.primedSpellPanel.add(this.primedSpellIcon);
        
        this.primedSpellCombo = this.add.text(14, 34, '', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            fontWeight: '700',
            color: '#a0a0b0',
            letterSpacing: 0.5
        });
        this.primedSpellPanel.add(this.primedSpellCombo);
        
        this.primedSpellDesc = this.add.text(14, 53, '', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '12px',
            fontWeight: '500',
            color: '#cbd5e1',
            wordWrap: { width: panelW - 28 }
        });
        this.primedSpellPanel.add(this.primedSpellDesc);

        this.primedSpellAdvantage = this.add.text(14, 110, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '11.5px',
            fontWeight: '800',
            color: '#a67032',
            letterSpacing: 0.5
        });
        this.primedSpellPanel.add(this.primedSpellAdvantage);

        // --- INCOMING SPELL PANEL ---
        this.incomingSpellPanel = this.add.container(80, 200).setVisible(false);
        
        this.incomingSpellBg = this.add.graphics();
        this.incomingSpellPanel.add(this.incomingSpellBg);
        
        this.incomingSpellTitle = this.add.text(14, 12, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '15px',
            fontWeight: '800',
            color: '#ffffff'
        });
        this.incomingSpellPanel.add(this.incomingSpellTitle);

        this.incomingSpellIcon = this.add.image(198, 66, '').setAlpha(0.5).setVisible(false);
        this.incomingSpellPanel.add(this.incomingSpellIcon);
        
        this.incomingSpellCombo = this.add.text(14, 34, '', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            fontWeight: '700',
            color: '#a0a0b0',
            letterSpacing: 0.5
        });
        this.incomingSpellPanel.add(this.incomingSpellCombo);
        
        this.incomingSpellDesc = this.add.text(14, 53, '', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '12px',
            fontWeight: '500',
            color: '#cbd5e1',
            wordWrap: { width: panelW - 28 }
        });
        this.incomingSpellPanel.add(this.incomingSpellDesc);

        this.incomingSpellAdvantage = this.add.text(14, 110, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '11.5px',
            fontWeight: '800',
            color: '#a67032',
            letterSpacing: 0.5
        });
        this.incomingSpellPanel.add(this.incomingSpellAdvantage);

        // Action Menu Container
        this.btnHowToPlay = this.createActionButton(w - 180, h - 250, 'HOW TO PLAY', () => this.handleHowToPlayOption());
        this.btnSpellBook = this.createActionButton(w - 180, h - 190, 'SPELL BOOK', () => this.handleSpellBookOption());
        this.btnCastSpell = this.createActionButton(w - 180, h - 130, 'CAST SPELL', () => this.handleCastSpellOption());
        this.btnPassDraw = this.createActionButton(w - 180, h - 70, 'PASS & DRAW', () => this.handlePassDrawOption());

        // Select Discard prompt overlay container
        this.discardPromptText = this.add.text(w / 2 - 20, h / 2 + 250, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '22px',
            fontWeight: '800',
            color: '#df1b2d',
            backgroundColor: '#040212',
            padding: { x: 10, y: 5 },
            align: 'center'
        }).setOrigin(0.5).setVisible(false).setDepth(200);

        // Defend Reaction Alert/Countdown timer
        this.reactionTimerBg = this.add.graphics();
        this.reactionTimerText = this.add.text(w / 2 - 20, h / 2 - 240, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '28px',
            fontWeight: '800',
            color: '#bf8cff',
            align: 'center'
        }).setOrigin(0.5).setVisible(false).setDepth(200);
    }

    createActionButton(x, y, label, onClick) {
        const g = this.add.graphics();
        const text = this.add.text(x, y, label, {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '15px',
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: 1
        }).setOrigin(0.5);

        const btnW = 200;
        const btnH = 45;

        const drawState = (lineColor, fill, textColor) => {
            g.clear();
            g.lineStyle(2, lineColor, 1);
            g.fillStyle(fill, 0.9);
            g.fillRect(x - btnW/2, y - btnH/2, btnW, btnH);
            g.strokeRect(x - btnW/2, y - btnH/2, btnW, btnH);
            
            // Rivets
            g.fillStyle(0x1a1a1a, 1);
            g.fillCircle(x - btnW/2 + 6, y - btnH/2 + 6, 2);
            g.fillCircle(x + btnW/2 - 6, y - btnH/2 + 6, 2);
            g.fillCircle(x - btnW/2 + 6, y + btnH/2 - 6, 2);
            g.fillCircle(x + btnW/2 - 6, y + btnH/2 - 6, 2);
            text.setColor(textColor);
        };

        drawState(0x4a4a4a, 0x261a12, '#888899'); // Default disabled state style

        const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });

        let enabled = false;

        zone.on('pointerover', () => {
            if (!enabled) return;
            drawState(0xbf8cff, 0x3d2b1f, '#bf8cff');
            this.playSound('click');
        });

        zone.on('pointerout', () => {
            if (!enabled) return;
            drawState(0x4a4a4a, 0x261a12, '#ffffff');
        });

        zone.on('pointerdown', () => {
            if (!enabled) return;
            drawState(0xffffff, 0x4a4a4a, '#ffffff');
            this.time.delayedCall(100, () => {
                onClick();
                // Redraw normal state
                if (enabled) drawState(0x4a4a4a, 0x261a12, '#ffffff');
            });
        });

        return {
            setEnabled: (state) => {
                enabled = state;
                if (state) {
                    drawState(0x4a4a4a, 0x261a12, '#ffffff');
                    zone.setInteractive();
                } else {
                    drawState(0x1a1410, 0x05040a, '#555566');
                    zone.disableInteractive();
                }
            },
            setText: (t) => text.setText(t)
        };
    }

    enablePlayerControls(state) {
        if (this.phase === 'discard' || this.phase === 'discard_request_active') {
            this.btnHowToPlay.setEnabled(true);
            this.btnSpellBook.setEnabled(true);
            this.btnCastSpell.setEnabled(false);
            this.btnPassDraw.setEnabled(false);
            return;
        }

        if (this.phase === 'reaction' || this.phase === 'reaction_request_active') {
            this.btnHowToPlay.setEnabled(true);
            this.btnSpellBook.setEnabled(true);
            // Can cast shield reaction spell if combo selected
            this.btnCastSpell.setEnabled(this.selectedBoardMana.length > 0 && this.selectedBoardMana.length <= 3);
            this.btnPassDraw.setEnabled(true); // Serve as "Pass Reaction" option!
            return;
        }
        if (!state) {
            this.btnHowToPlay.setEnabled(true);
            this.btnSpellBook.setEnabled(true);
            this.btnCastSpell.setEnabled(false);
            this.btnPassDraw.setEnabled(false);
        } else {
            this.btnHowToPlay.setEnabled(true);
            this.btnSpellBook.setEnabled(true);
            
            if (this.manaPlacedThisTurn || this.spellCastThisTurn) {
                this.btnPassDraw.setText('END TURN');
            } else {
                this.btnPassDraw.setText('PASS & DRAW');
            }
            this.btnPassDraw.setEnabled(true);

            this.btnCastSpell.setEnabled(!this.spellCastThisTurn && this.selectedBoardMana.length > 0 && this.selectedBoardMana.length <= 3);
        }
    }

    drawActionLog() {
        const w = this.scale.width;
        this.add.text(w - 370, 25, 'DUEL HISTORY:', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            color: '#1a1a1a',
            letterSpacing: 1
        });

        this.allLogTextLines = [];
        this.logContainer = this.add.container(w - 370, 50);

        // Drawer backing
        const logBg = this.add.graphics();
        logBg.fillStyle(0x1a1410, 0.8);
        logBg.lineStyle(1, 0x4a4a4a, 0.25);
        logBg.fillRoundedRect(0, 0, 340, 380, 8);
        logBg.strokeRoundedRect(0, 0, 340, 380, 8);
        this.logContainer.add(logBg);

        // Scrolling container for log lines
        this.logScrollContainer = this.add.container(0, 0);
        this.logContainer.add(this.logScrollContainer);

        // Mask to restrict visible area to the inside of the history box
        // Viewport bounds: X = w - 370 + 8, Y = 50 + 10, Width = 324, Height = 360
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(w - 370 + 8, 50 + 10, 324, 360, 8);
        const mask = maskShape.createGeometryMask();
        this.logScrollContainer.setMask(mask);

        // Scrollbar track and handle graphics
        this.logScrollbarGraphics = this.add.graphics();
        this.logContainer.add(this.logScrollbarGraphics);

        // Setup global pointer listeners for drag-scrolling and scrollbar dragging
        this.isDraggingHistory = false;
        this.isDraggingScrollbar = false;
        this.dragStartY = 0;
        this.dragStartScrollY = 0;

        // Mouse wheel scrolling bounds checking
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const w = this.scale.width;
            const relativeX = pointer.x - (w - 370);
            const relativeY = pointer.y - 50;
            // Check if pointer is inside the history box
            if (relativeX >= 0 && relativeX <= 340 && relativeY >= 0 && relativeY <= 380) {
                this.scrollDuelHistory(deltaY);
            }
        });

        this.input.on('pointerdown', (pointer) => {
            const w = this.scale.width;
            const relativeX = pointer.x - (w - 370);
            const relativeY = pointer.y - 50;

            // Check if pointer is inside the history box
            if (relativeX >= 0 && relativeX <= 340 && relativeY >= 0 && relativeY <= 380) {
                // If it is inside the scrollbar area (X: 320 to 338, Y: 10 to 370)
                if (relativeX >= 320 && relativeX <= 338 && relativeY >= 10 && relativeY <= 370) {
                    const totalHeight = this.getLogTotalHeight();
                    const viewportHeight = 360;
                    if (totalHeight > viewportHeight) {
                        this.isDraggingScrollbar = true;
                        const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
                        this.scrollHistoryByScrollbarY(relativeY, handleHeight);
                    }
                } else {
                    // Otherwise, it is a drag-scroll on the text area
                    this.isDraggingHistory = true;
                    this.dragStartY = pointer.y;
                    this.dragStartScrollY = this.logScrollContainer.y;
                }
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isDraggingScrollbar) {
                const relativeY = pointer.y - 50;
                const totalHeight = this.getLogTotalHeight();
                const viewportHeight = 360;
                const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
                this.scrollHistoryByScrollbarY(relativeY, handleHeight);
            } else if (this.isDraggingHistory) {
                const deltaY = pointer.y - this.dragStartY;
                this.scrollDuelHistoryTo(this.dragStartScrollY + deltaY);
            }
        });

        this.input.on('pointerup', () => {
            this.isDraggingHistory = false;
            this.isDraggingScrollbar = false;
        });
    }

    logMessage(msg) {
        console.log(`[Whelmen] ${msg}`);

        // Safety: if log UI not ready yet, just console log
        if (!this.allLogTextLines || !this.logScrollContainer) return;

        // Keep a maximum of 150 messages in history to prevent any massive memory build-up over long play sessions
        if (this.allLogTextLines.length >= 150) {
            const old = this.allLogTextLines.shift();
            const shiftY = old.height + 6;
            old.destroy();
            this.allLogTextLines.forEach(line => {
                line.y -= shiftY;
            });
        }

        // Add new
        const color = msg.includes('VICTORY') ? '#a67032' :
                      msg.includes('DEFEAT') ? '#df1b2d' :
                      msg.includes('Reaction') ? '#bf8cff' :
                      msg.includes('---') ? '#d4af37' : '#cbd5e1';

        let targetY = 15;
        if (this.allLogTextLines.length > 0) {
            const lastLine = this.allLogTextLines[this.allLogTextLines.length - 1];
            targetY = lastLine.y + lastLine.height + 6;
        }

        const textLine = this.add.text(12, targetY, msg, {
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            color: color,
            wordWrap: { width: 305 }
        });

        // Make interactive for hovering spell details
        textLine.setInteractive();
        textLine.originalColor = color;
        textLine.on('pointerover', (pointer) => {
            const spell = this.findSpellInMessage(msg);
            if (spell) {
                textLine.setColor('#ffffff');
                const isAI = msg.toLowerCase().includes('ai') || msg.toLowerCase().includes('opponent');
                this.showLogTooltip(spell, isAI);
            }
        });
        textLine.on('pointerout', () => {
            textLine.setColor(textLine.originalColor);
            this.hideLogTooltip();
        });

        this.logScrollContainer.add(textLine);
        this.allLogTextLines.push(textLine);

        // Auto-scroll to the bottom when a new message is added
        const totalHeight = this.getLogTotalHeight();
        const viewportHeight = 360;
        if (totalHeight > viewportHeight) {
            this.logScrollContainer.y = viewportHeight - totalHeight;
        } else {
            this.logScrollContainer.y = 0;
        }
        this.updateScrollbar();
    }

    // --- CARD HAND RENDERING ---
    updatePlayerHandDisplay() {
        // Destroy existing hand card objects
        if (this.playerHandGroup) {
            this.playerHandGroup.destroy(true);
        }

        this.playerHandGroup = this.add.group();
        const startX = 60;
        const spaceX = 90;
        const h = this.scale.height;

        this.player.hand.forEach((el, index) => {
            const x = startX + index * spaceX;
            const y = 80;

            const cardObj = this.add.image(x, y, `card_${el}`)
                .setScale(0.8)
                .setInteractive({ useHandCursor: true });

            this.playerZone.add(cardObj);
            this.playerHandGroup.add(cardObj);

            // Bind click to play mana or select for discard depending on state
            cardObj.on('pointerdown', () => {
                if (this.phase === 'discard' || this.phase === 'discard_request_active') {
                    this.discardCardFromZone('hand', index, 'player');
                } else if (this.phase === 'action' && !this.manaPlacedThisTurn && this.turn === 'player') {
                    // Quick Action: Play as Board Mana directly on click!
                    this.playHandCardToBoard(index);
                }
            });

            // Gentle Hover Scaling
            cardObj.on('pointerover', () => {
                this.playSound('click');
                this.tweens.add({
                    targets: cardObj,
                    y: 60,
                    scaleX: 0.88,
                    scaleY: 0.88,
                    duration: 100,
                    ease: 'Quad.easeOut'
                });
            });

            cardObj.on('pointerout', () => {
                this.tweens.add({
                    targets: cardObj,
                    y: 80,
                    scaleX: 0.8,
                    scaleY: 0.8,
                    duration: 100,
                    ease: 'Quad.easeOut'
                });
            });
        });
    }

    updateAIHandDisplay() {
        if (this.aiHandGroup) {
            this.aiHandGroup.destroy(true);
        }

        this.aiHandGroup = this.add.group();
        const startX = 60;
        const spaceX = 60;

        this.ai.hand.forEach((el, index) => {
            const x = startX + index * spaceX;
            const y = 80;

            // Facedown cards
            const cardObj = this.add.image(x, y, 'card_back')
                .setScale(0.55);

            this.aiZone.add(cardObj);
            this.aiHandGroup.add(cardObj);
        });
    }

    // --- BOARD MANA DISPLAY ---
    updatePlayerBoardDisplay() {
        if (this.playerBoardGroup) {
            this.playerBoardGroup.destroy(true);
        }

        this.playerBoardGroup = this.add.group();
        const w = this.scale.width;
        const h = this.scale.height;
        const y = h / 2 - 40 + 160;

        // Group player board elements dynamically
        const stacks = {};
        const uniqueElements = [];
        this.player.board.forEach((el, index) => {
            if (!stacks[el]) {
                stacks[el] = {
                    element: el,
                    count: 0,
                    indices: [],
                    selectedCount: 0
                };
                uniqueElements.push(el);
            }
            stacks[el].count++;
            stacks[el].indices.push(index);
            if (this.selectedBoardMana.includes(index)) {
                stacks[el].selectedCount++;
            }
        });

        // Dynamic symmetric centering around player board
        const centerX = w / 2 - 20;
        const spaceX = 75;
        const startX = centerX - ((uniqueElements.length - 1) * spaceX) / 2;

        uniqueElements.forEach((el, index) => {
            const x = startX + index * spaceX;
            const stack = stacks[el];
            const hasSelected = stack.selectedCount > 0;

            const cardObj = this.add.image(x, y, `card_${el}`)
                .setScale(hasSelected ? 0.72 : 0.65)
                .setInteractive({ useHandCursor: true });

            // Glowing pulsing border highlight if any card in stack is selected
            if (hasSelected) {
                const borderW = cardObj.width * 0.72 + 8;
                const borderH = cardObj.height * 0.72 + 8;
                
                const borderHighlight = this.add.graphics();
                
                // Outer glow shadow ring
                borderHighlight.lineStyle(1.5, 0xbf8cff, 0.45);
                borderHighlight.strokeRoundedRect(
                    x - borderW / 2 - 2, 
                    y - borderH / 2 - 2, 
                    borderW + 4, 
                    borderH + 4, 
                    12
                );
                
                // Core bright border stroke
                borderHighlight.lineStyle(3, 0x00ffff, 0.95);
                borderHighlight.strokeRoundedRect(
                    x - borderW / 2, 
                    y - borderH / 2, 
                    borderW, 
                    borderH, 
                    10
                );

                this.playerBoardGroup.add(borderHighlight);

                // Breathing pulse animation for premium feel
                this.tweens.add({
                    targets: borderHighlight,
                    alpha: 0.4,
                    duration: 900,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            this.playerBoardGroup.add(cardObj);

            // Click listener
            cardObj.on('pointerdown', () => {
                if (this.phase === 'discard' || this.phase === 'discard_request_active') {
                    // Discard the last index in the stack
                    const discardIdx = stack.indices[stack.indices.length - 1];
                    this.discardCardFromZone('board', discardIdx, 'player');
                    return;
                }

                // If in action or reaction, select card for casting combos
                if (this.turn === 'player' || this.phase === 'reaction' || this.phase === 'reaction_request_active') {
                    const unselectedIndices = stack.indices.filter(idx => !this.selectedBoardMana.includes(idx));
                    const selectedIndices = stack.indices.filter(idx => this.selectedBoardMana.includes(idx));

                    if (unselectedIndices.length > 0 && this.selectedBoardMana.length < 3) {
                        // Select one more
                        const nextToSelect = unselectedIndices[0];
                        this.selectedBoardMana.push(nextToSelect);
                    } else {
                        // Deselect all selected cards of this element in the stack
                        selectedIndices.forEach(idx => {
                            const selIdx = this.selectedBoardMana.indexOf(idx);
                            if (selIdx > -1) {
                                this.selectedBoardMana.splice(selIdx, 1);
                            }
                        });
                    }
                    this.playSound('click');
                    this.updatePlayerBoardDisplay();
                    this.updateComboPreview();
                    this.enablePlayerControls(true);
                }
            });

            // Float hover
            cardObj.on('pointerover', () => {
                if (this.phase === 'discard') {
                    cardObj.setTint(0xdf1b2d);
                } else if (!hasSelected) {
                    cardObj.setScale(0.7);
                }
            });

            cardObj.on('pointerout', () => {
                if (this.phase === 'discard') {
                    cardObj.clearTint();
                } else if (!hasSelected) {
                    cardObj.setScale(0.65);
                }
            });

            // Calculate exact corners relative to current scale
            const currentScale = hasSelected ? 0.72 : 0.65;
            const wHalf = (100 * currentScale) / 2;
            const hHalf = (150 * currentScale) / 2;

            // 1. Draw Total Count Badge (Top-Right)
            if (stack.count > 1) {
                const badgeX = x + wHalf - 8;
                const badgeY = y - hHalf + 8;
                
                const elementColors = {
                    fire: 0xdf1b2d,
                    earth: 0xa67032,
                    water: 0x1084e9,
                    air: 0xbf8cff
                };
                const elementColorHex = elementColors[el] || 0xffffff;

                const countBadgeG = this.add.graphics();
                countBadgeG.fillStyle(0x261a12, 0.95);
                countBadgeG.lineStyle(1.5, elementColorHex, 0.9);
                countBadgeG.fillCircle(badgeX, badgeY, 11);
                countBadgeG.strokeCircle(badgeX, badgeY, 11);
                this.playerBoardGroup.add(countBadgeG);
                
                const countText = this.add.text(badgeX, badgeY, `${stack.count}`, {
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#ffffff'
                }).setOrigin(0.5);
                this.playerBoardGroup.add(countText);
            }

            // 2. Draw Selected Count Badge (Bottom-Right)
            if (stack.selectedCount > 0) {
                const badgeX = x + wHalf - 8;
                const badgeY = y + hHalf - 8;
                
                const selBadgeG = this.add.graphics();
                const isAllSelected = (stack.selectedCount === stack.count);
                
                if (isAllSelected) {
                    selBadgeG.fillStyle(0x00ffff, 0.95);
                    selBadgeG.lineStyle(1.5, 0xffffff, 1);
                    selBadgeG.fillCircle(badgeX, badgeY, 11);
                    selBadgeG.strokeCircle(badgeX, badgeY, 11);
                } else {
                    selBadgeG.fillStyle(0x1a1410, 0.95);
                    selBadgeG.lineStyle(2, 0xbf8cff, 0.95);
                    selBadgeG.fillCircle(badgeX, badgeY, 11);
                    selBadgeG.strokeCircle(badgeX, badgeY, 11);
                }
                this.playerBoardGroup.add(selBadgeG);
                
                const selTextVal = isAllSelected ? `✓` : `${stack.selectedCount}`;
                const selText = this.add.text(badgeX, badgeY, selTextVal, {
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: isAllSelected ? '#040212' : '#bf8cff'
                }).setOrigin(0.5);
                this.playerBoardGroup.add(selText);
            }
        });
    }

    updateAIBoardDisplay() {
        if (this.aiBoardGroup) {
            this.aiBoardGroup.destroy(true);
        }

        this.aiBoardGroup = this.add.group();
        const w = this.scale.width;
        const h = this.scale.height;
        const y = h / 2 - 40 - 160;

        // Group AI board elements dynamically
        const stacks = {};
        const uniqueElements = [];
        this.ai.board.forEach((el, index) => {
            if (!stacks[el]) {
                stacks[el] = {
                    element: el,
                    count: 0
                };
                uniqueElements.push(el);
            }
            stacks[el].count++;
        });

        // Dynamic symmetric centering around AI board
        const centerX = w / 2 - 20;
        const spaceX = 75;
        const startX = centerX - ((uniqueElements.length - 1) * spaceX) / 2;

        uniqueElements.forEach((el, index) => {
            const x = startX + index * spaceX;
            const stack = stacks[el];

            const cardObj = this.add.image(x, y, `card_${el}`)
                .setScale(0.65);
            this.aiBoardGroup.add(cardObj);

            // Total Count Badge (Top-Right)
            if (stack.count > 1) {
                const wHalf = (100 * 0.65) / 2;
                const hHalf = (150 * 0.65) / 2;
                const badgeX = x + wHalf - 8;
                const badgeY = y - hHalf + 8;

                const elementColors = {
                    fire: 0xdf1b2d,
                    earth: 0xa67032,
                    water: 0x1084e9,
                    air: 0xbf8cff
                };
                const elementColorHex = elementColors[el] || 0xffffff;

                const countBadgeG = this.add.graphics();
                countBadgeG.fillStyle(0x261a12, 0.95);
                countBadgeG.lineStyle(1.5, elementColorHex, 0.9);
                countBadgeG.fillCircle(badgeX, badgeY, 11);
                countBadgeG.strokeCircle(badgeX, badgeY, 11);
                this.aiBoardGroup.add(countBadgeG);

                const countText = this.add.text(badgeX, badgeY, `${stack.count}`, {
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: '#ffffff'
                }).setOrigin(0.5);
                this.aiBoardGroup.add(countText);
            }
        });
    }

    updatePanelVisuals(isAI, spell) {
        const titleObj = isAI ? this.incomingSpellTitle : this.primedSpellTitle;
        const comboObj = isAI ? this.incomingSpellCombo : this.primedSpellCombo;
        const descObj = isAI ? this.incomingSpellDesc : this.primedSpellDesc;
        const advObj = isAI ? this.incomingSpellAdvantage : this.primedSpellAdvantage;
        const bgObj = isAI ? this.incomingSpellBg : this.primedSpellBg;
        const panelObj = isAI ? this.incomingSpellPanel : this.primedSpellPanel;
        
        const cycle = this.cycleElements[this.cycleIndex];
        let isEmp = false;
        if (spell.synergyType === 'constructive' && cycle === spell.element) isEmp = true;
        else if (spell.synergyType === 'destructive' && cycle !== spell.element && spell.combo.includes(cycle)) isEmp = true;
        else if (spell.synergyType === 'prestructive' && spell.combo && !spell.combo.includes(cycle)) isEmp = true;
        else if (spell.synergyType === 'force_cycle') isEmp = true;
        
        const colors = { fire: 0xdf1b2d, earth: 0xa67032, water: 0x1084e9, air: 0xbf8cff, 'n/a': 0x4a4a4a };
        const colorHex = colors[spell.element] || 0x4a4a4a;

        const iconObj = isAI ? this.incomingSpellIcon : this.primedSpellIcon;

        if (spell.element === 'n/a' || !spell.element) {
            iconObj.setVisible(false);
        } else {
            iconObj.setVisible(true);
            iconObj.setTexture(`icon_${spell.element}`);
        }
        
        titleObj.setText(`${spell.name.toUpperCase()}`);
        titleObj.setColor(
            spell.element === 'fire' ? '#df1b2d' :
            spell.element === 'earth' ? '#a67032' :
            spell.element === 'water' ? '#1084e9' :
            spell.element === 'air' ? '#bf8cff' : '#a0a0b0'
        );

        let comboStr = '';
        for (const key in this.spellsCatalog) {
            if (this.spellsCatalog[key].name === spell.name) {
                comboStr = key.split(',').map(el => el.toUpperCase()).join(' + ');
                break;
            }
        }
        comboObj.setText(`PRIMED COMBO: ${comboStr}`);

        descObj.setText(spell.desc);

        if (isEmp) {
            advObj.setText('⚡ SYNERGY ACTIVE');
            advObj.setColor('#a67032');
            advObj.setVisible(true);
        } else {
            advObj.setText('⚪ NO SYNERGY');
            advObj.setColor('#a0a0b0');
            advObj.setVisible(true);
        }

        bgObj.clear();
        bgObj.fillStyle(0x090518, 0.95);
        bgObj.lineStyle(2, colorHex, 0.9);
        bgObj.fillRoundedRect(0, 0, 264, 132, 10);
        bgObj.strokeRoundedRect(0, 0, 264, 132, 10);
        
        panelObj.setVisible(true);
    }

    updateComboPreview() {
        if (!this.primedSpellPanel) return;

        if (this.selectedBoardMana.length === 0) {
            this.primedSpellPanel.setVisible(false);
            return;
        }

        const elements = this.selectedBoardMana.map(idx => this.player.board[idx]);
        const spell = this.getSpellFromCombo(elements);
        const panelW = 264;
        const panelH = 132;
        
        this.primedSpellBg.clear();
        this.primedSpellPanel.setVisible(true);

        if (spell) {
            this.updatePanelVisuals(false, spell);
        } else {
            this.primedSpellIcon.setVisible(false);
            this.primedSpellTitle.setText('INVALID COMBO');
            this.primedSpellTitle.setColor('#df1b2d');
            this.primedSpellCombo.setText('FORMULA UNKNOWN');
            this.primedSpellDesc.setText('Select valid elemental cards on your board to prime a spell.');
            this.primedSpellAdvantage.setVisible(false);

            this.primedSpellBg.fillStyle(0x090518, 0.95);
            this.primedSpellBg.lineStyle(2, 0xdf1b2d, 0.6);
            this.primedSpellBg.fillRoundedRect(0, 0, panelW, panelH, 10);
            this.primedSpellBg.strokeRoundedRect(0, 0, panelW, panelH, 10);
        }
    }

    // --- STRATEGIC PLAY ACTIONS ---
    playHandCardToBoard(index) {
        if (this.manaPlacedThisTurn) return;

        const el = this.player.hand[index];
        this.manaPlacedThisTurn = true;
        this.playSound('draw');
        this.logMessage(`Player plays [${el.toUpperCase()}] mana to board.`);
        this.enablePlayerControls(false);

        // Calculate Start Position (from hand)
        const startX = this.playerZone.x + 60 + index * 90;
        const startY = this.playerZone.y + 80;

        // Apply state changes to calculate target layout
        this.player.hand.splice(index, 1);
        this.player.board.push(el);

        const w = this.scale.width;
        const h = this.scale.height;
        const uniqueElements = [...new Set(this.player.board)];
        const elIndex = uniqueElements.indexOf(el);
        const centerX = w / 2 - 20;
        const spaceX = 75;
        const targetX = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
        const targetY = h / 2 - 40 + 160;

        // Create the phantom card sprite
        const phantom = this.add.image(startX, startY, `card_${el}`)
            .setScale(0.8)
            .setDepth(100);

        // Hide the original card in hand immediately (if it hasn't been destroyed by render yet)
        if (this.playerHandGroup) {
            const handCards = this.playerHandGroup.getChildren();
            if (handCards[index]) handCards[index].setVisible(false);
        }

        // Tween phantom to the board
        this.tweens.add({
            targets: phantom,
            x: targetX,
            y: targetY,
            scaleX: 0.65,
            scaleY: 0.65,
            angle: (Math.random() - 0.5) * 15, // slight dramatic rotation
            duration: 350,
            ease: 'Power2',
            onComplete: () => {
                phantom.destroy();
                this.updatePlayerHandDisplay();
                this.updatePlayerBoardDisplay();
                this.updatePlayerLifeDisplay();
                
                this.playElementalBurst(targetX, targetY, el);

                // Status hooks for mana play
                if (this.player.status.manaPlayDamage > 0) {
                    this.forceDiscardRandom('ai', 1);
                    this.logMessage(`Player's mana play deals 1 damage to AI!`);
                }
                if (this.ai.status.oppManaPlayDamage > 0) {
                    this.forceDiscardRandom('player', 1);
                    this.logMessage(`Player takes 1 damage from playing mana due to AI Surge!`);
                }

                // Check bonusManaPlays: allow a second mana play
                this.time.delayedCall(450, () => {
                    if (this.player.status.bonusManaPlays > 0) {
                        this.player.status.bonusManaPlays = 0;
                        this.manaPlacedThisTurn = false;
                        this.logMessage(`Player can play a second mana!`);
                        this.phase = 'action';
                        this.enablePlayerControls(true);
                    } else if (this.manaPlacedThisTurn && this.spellCastThisTurn) {
                        this.endTurn();
                    } else {
                        this.phase = 'action';
                        this.enablePlayerControls(true);
                    }
                });
            }
        });
    }

    handleHowToPlayOption() {
        const tutorialModal = document.getElementById('tutorial-overlay-ingame');
        if (tutorialModal) {
            tutorialModal.classList.add('active');
            this.input.enabled = false;
            
            // Set up close actions
            const closeBtn = document.getElementById('close-tutorial-ingame');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    tutorialModal.classList.remove('active');
                    this.input.enabled = true;
                };
            }
            
            tutorialModal.onclick = (e) => {
                if (e.target === tutorialModal) {
                    tutorialModal.classList.remove('active');
                    this.input.enabled = true;
                }
            };
        }
    }

    handleSpellBookOption() {
        const spellbookModal = document.getElementById('spellbook-overlay');
        if (spellbookModal) {
            spellbookModal.classList.add('active');
            this.input.enabled = false;
            
            // Set up close actions
            const closeBtn = document.getElementById('close-spellbook');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    spellbookModal.classList.remove('active');
                    this.input.enabled = true;
                };
            }
            
            spellbookModal.onclick = (e) => {
                if (e.target === spellbookModal) {
                    spellbookModal.classList.remove('active');
                    this.input.enabled = true;
                }
            };
        }
    }

    forceDiscardRandom(who, count) {
        const char = who === 'player' ? this.player : this.ai;
        const actualCount = Math.min(count, char.hand.length);
        this.logMessage(`${who.toUpperCase()} is forced to discard ${actualCount} card(s)!`);
        for (let i = 0; i < actualCount; i++) {
            const randIdx = Math.floor(Math.random() * char.hand.length);
            const discarded = char.hand.splice(randIdx, 1)[0];
            this.sharedDiscard.push(discarded);
        }
        if (who === 'player') {
            this.updatePlayerHandDisplay();
            this.updatePlayerLifeDisplay();
        } else {
            this.updateAIHandDisplay();
            this.updateAILifeDisplay();
        }
        this.updateDeckDiscardDisplay();
    }

    handlePassDrawOption() {
        if (this.phase === 'reaction' || this.phase === 'reaction_request_active') {
            // Serve as "Pass Reaction" option!
            this.logMessage("Player passes Reaction Window.");
            if (this.phase === 'reaction_request_active') {
                this.phase = 'reaction_response';
                this.reactionResponseSpell = null;
                this.syncToFirebase('reaction_response');
                this.enablePlayerControls(false);
                this.logMessage('Reaction sent. Waiting for resolution...');
            } else {
                this.resolveDefendingReaction(null);
            }
            return;
        }

        if (this.manaPlacedThisTurn || this.spellCastThisTurn) {
            this.logMessage("Player ends turn.");
            this.enablePlayerControls(false);
            this.time.delayedCall(450, () => {
                this.endTurn();
            });
            return;
        }

        this.logMessage("Player chooses Pass to Draw.");
        const extraCard = this.drawCard();
        if (extraCard) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (this.player.status.autoPlayDraw > 0 && this.player.board.length < 3) {
                this.player.board.push(extraCard);
                this.logMessage(`Player's drawn mana is auto-played to board!`);
            } else {
                this.player.hand.push(extraCard);
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (this.player.status.loseManaOnDraw > 0 && this.player.hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * this.player.hand.length);
                const lost = this.player.hand.splice(lostIdx, 1)[0];
                this.sharedDiscard.push(lost);
                this.logMessage(`Player lost a hand mana from drawing!`);
            }

            this.updatePlayerHandDisplay();
            this.updatePlayerBoardDisplay();
            this.updatePlayerLifeDisplay();
        }

        this.enablePlayerControls(false);
        this.time.delayedCall(450, () => {
            this.endTurn();
        });
    }

    handleCastSpellOption() {
        if (this.selectedBoardMana.length === 0) return;
        const elements = this.selectedBoardMana.map(idx => this.player.board[idx]);
        const spell = this.getSpellFromCombo(elements);

        if (!spell) {
            this.logMessage("Cannot cast: invalid combo selected.");
            return;
        }

        if (this.phase === 'reaction' || this.phase === 'reaction_request_active') {
            // Defender casting reaction
            this.selectedBoardMana.sort((a,b) => b-a);
            this.selectedBoardMana.forEach(idx => {
                const consumed = this.player.board.splice(idx, 1)[0];
                this.sharedDiscard.push(consumed);
            });
            this.updatePlayerBoardDisplay();
            this.updateDeckDiscardDisplay();
            this.updatePlayerLifeDisplay();

            if (this.phase === 'reaction_request_active') {
                this.phase = 'reaction_response';
                this.reactionResponseSpell = spell;
                this.syncToFirebase('reaction_response');
                this.enablePlayerControls(false);
                this.logMessage('Reaction sent. Waiting for resolution...');
            } else {
                this.resolveDefendingReaction(spell);
            }
            return;
        }

        // Normal turn attack spell casting
        if (this.spellCastThisTurn) return;
        this.spellCastThisTurn = true;
        this.enablePlayerControls(false);

        // Consume cards
        // Sort indices descending to avoid splice shifting bugs
        this.selectedBoardMana.sort((a, b) => b - a);
        this.selectedBoardMana.forEach(idx => {
            const consumed = this.player.board.splice(idx, 1)[0];
            this.sharedDiscard.push(consumed);
        });

        this.updatePlayerBoardDisplay();
        this.updatePlayerLifeDisplay();
        this.updateDeckDiscardDisplay();

        this.selectedBoardMana = [];
        this.updateComboPreview();

        this.logMessage(`Player casts: ${spell.name}!`);

        // Visual spell fire from player center to AI center
        const w = this.scale.width;
        this.triggerSpellVisual(spell.element, w / 2 - 100, 500, w / 2 - 100, 100, () => {
            this.initiateAttack('player', 'ai', spell);
        });
    }

    // --- COMBAT RESOLUTION & REACTION WINDOW ---
    initiateAttack(attacker, defender, spell) {
        let defChar = defender === 'player' ? this.player : this.ai;
        let attChar = attacker === 'player' ? this.player : this.ai;
        const cycle = this.cycleElements[this.cycleIndex];

        // Status: Random Targeting
        if (attChar.status.randomTargeting > 0) {
            if (Math.random() < 0.5) {
                defender = attacker;
                defChar = attChar;
                this.logMessage(`Chaos! ${attacker.toUpperCase()}'s spell targets themselves!`);
            }
        }
        
        // Status: Spell Fail Chance
        if (attChar.status.spellFailChance > 0) {
            if (Math.random() < 0.5) {
                this.logMessage(`${attacker.toUpperCase()}'s spell fizzled out!`);
                this.time.delayedCall(800, () => this.endTurn());
                return;
            }
        }

        // Synergy logic
        let isEmp = false;
        if (spell.synergyType === 'constructive' && cycle === spell.element) isEmp = true;
        else if (spell.synergyType === 'destructive' && cycle !== spell.element && spell.combo.includes(cycle)) isEmp = true;
        else if (spell.synergyType === 'prestructive' && !spell.combo.includes(cycle)) isEmp = true;

        let finalDmg = spell.damage;
        let finalShield = spell.shield;
        let finalDraw = spell.draw;
        let finalDrain = spell.drain;
        
        // Miss Chance Status
        if (attChar.status.missChance > 0 && finalDmg > 0) {
            if (Math.random() < 0.5) {
                finalDmg = 0;
                this.logMessage(`${attacker.toUpperCase()}'s attack missed!`);
            }
        }

        // Damage Immunity Status
        if (defChar.status.damageImmunity > 0) {
            finalDmg = 0;
            this.logMessage(`${defender.toUpperCase()} is immune to damage this round!`);
        }

        if (isEmp) {
            // Apply Empowered value overrides (immediate stat changes only)
            if (spell.name === 'Breeze') finalDrain = 2;
            if (spell.name === 'Stream') finalDraw = 2;
            if (spell.name === 'Spark') finalDmg = 3;
            if (spell.name === 'Shell') finalShield = 5;
            if (spell.name === 'Gust') finalDrain = 3;
            if (spell.name === 'Rain') finalDraw = 3;
            if (spell.name === 'Blast') finalDmg = 5;
            if (spell.name === 'Carapace') finalShield = 8;
            
            // Immediate synergy effects (not deferred status)
            if (spell.name === 'Wildfire') this.pendingExtraAction = true;
            if (spell.name === 'Billow') { this.logMessage('Top 3 cards cycled!'); for(let i=0;i<3;i++) { let d = this.sharedDeck.shift(); if(d) this.sharedDeck.push(d); } }
            if (spell.name === 'Vaporize') { this.logMessage('Top 3 cards destroyed!'); for(let i=0;i<3;i++) { let d = this.sharedDeck.shift(); if(d) this.sharedDiscard.push(d); } this.updateDeckDiscardDisplay(); }
            if (spell.name === 'Scour') { defChar.shield = 0; this.updateShieldDisplay(defender); this.logMessage(`${defender.toUpperCase()}'s shield scoured!`); }
        }

        // Force Cycle always triggers (not gated by isEmp)
        if (spell.synergyType === 'force_cycle') {
            const fcMap = { 'Tempest': 'air', 'Pillar': 'earth', 'Blaze': 'fire', 'Deluge': 'water' };
            const fcEl = fcMap[spell.name];
            if (fcEl) {
                this.cycleIndex = this.cycleElements.indexOf(fcEl);
                this.logMessage(`The Cycle is forced to ${fcEl.toUpperCase()}!`);
                this.cycleCenterText.setText(fcEl.toUpperCase());
                this.triggerCycleParticles(fcEl);
            }
        }

        // Apply self buffs immediately (like shields)
        if (finalShield > 0) {
            if (attChar.status.shieldDamageDebuff > 0) {
                this.forceDiscardRandom(attacker, 1);
                this.logMessage(`${attacker.toUpperCase()} takes 1 damage from unstable shield!`);
            }
            attChar.shield += finalShield;
            this.updateShieldDisplay(attacker);
            this.logMessage(`${attacker.toUpperCase()} gains ${finalShield} Shield.`);
        }

        // Draw logic
        if (finalDraw > 0) {
            for (let i = 0; i < finalDraw; i++) {
                const drawn = this.drawCard();
                if (drawn) {
                    if (attChar.status.autoPlayDraw > 0 && attChar.board.length < 3) {
                        attChar.board.push(drawn);
                        this.logMessage(`Auto-played drawn mana!`);
                    } else {
                        attChar.hand.push(drawn);
                    }
                    if (attChar.status.loseManaOnDraw > 0 && attChar.board.length > 0) {
                        this.sharedDiscard.push(attChar.board.pop());
                        this.logMessage(`${attacker.toUpperCase()} lost a board mana from drawing!`);
                    }
                }
            }
            this.updatePlayerHandDisplay(); this.updatePlayerBoardDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAIBoardDisplay(); this.updateAILifeDisplay();
        }
        
        // Drain logic
        if (finalDrain > 0) {
            this.forceDiscardRandom(defender, finalDrain);
        }

        // DEFERRED STATUS EFFECTS: Applied AFTER shield/draw/drain so they
        // don't fire during the same spell that set them (Bug 4 fix)
        // Statuses checked during action/draw phase use value 2 to survive
        // the startTurn decrement (they decrement to 1, still > 0 when checked)
        if (isEmp) {
            if (spell.name === 'Ignition') attChar.status.bonusManaPlays = 2;
            if (spell.name === 'Haze') { this.player.status.loseManaOnDraw = 2; this.ai.status.loseManaOnDraw = 2; }
            if (spell.name === 'Quake') attChar.status.shieldDamageDebuff = 2;
            if (spell.name === 'Dust') { this.player.status.missChance = 2; this.ai.status.missChance = 2; }
            if (spell.name === 'Typhoon') attChar.status.autoPlayDraw = 2;
            if (spell.name === 'Enrich') { this.player.status.everyoneDraw3 = 1; this.ai.status.everyoneDraw3 = 1; }
            if (spell.name === 'Firestorm') attChar.status.manaPlayDamage = 2;
            if (spell.name === 'Fortress') attChar.status.extraDrawIfShield = 1;
            if (spell.name === 'Quagmire') attChar.status.redrawMana = 1;
            if (spell.name === 'Surge') defChar.status.oppManaPlayDamage = 2;
            if (spell.name === 'Crucible') attChar.status.retaliationDamage = 1;
            if (spell.name === 'Hurricane') defChar.status.noDrawDebuff = 2;
            if (spell.name === 'Flood') defChar.status.oppDraw4 = 1;
            if (spell.name === 'Tower') defChar.status.spellFailChance = 2;
            if (spell.name === 'Mudslide') { this.player.status.discardReplaceHand = 1; this.ai.status.discardReplaceHand = 1; }
            if (spell.name === 'Tide') { this.player.status.rotateHands = 1; this.ai.status.rotateHands = 1; }
            if (spell.name === 'Aegis') { this.player.status.damageImmunity = 2; this.ai.status.damageImmunity = 2; }
            if (spell.name === 'Cataclysm') { this.player.status.randomTargeting = 2; this.ai.status.randomTargeting = 2; }
        }
        
        // Trigger reaction window if there's incoming damage and defender has active mana
        if (finalDmg > 0 && defChar.board.length > 0) {
            this.startReactionPhase(attacker, defender, { ...spell, damage: finalDmg, bypassShield: false });
        } else {
            // Direct hit
            if (finalDmg > 0) {
                if (defChar.status.retaliationDamage > 0) {
                    this.forceDiscardRandom(attacker, 1);
                    this.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
                }
                this.applyDamage(defender, finalDmg, false);
            } else {
                // Done with spelling, auto-end turn after a slight delay
                this.time.delayedCall(800, () => {
                    if (this.pendingExtraAction) {
                        this.pendingExtraAction = false;
                        this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                        this.logMessage(`${this.turn.toUpperCase()} gets another action!`);
                        if (this.turn === 'player') {
                            this.phase = 'action';
                            this.enablePlayerControls(true);
                        } else {
                            this.runAITurn();
                        }
                    } else {
                        this.checkTurnContinuation();
                    }
                });
            }
        }
    }

    startReactionPhase(attacker, defender, incomingSpell) {
        this.phase = 'reaction';
        this.reactionTargetSpell = incomingSpell;
        this.reactionSource = attacker;
        this.reactionCaster = defender;

        this.logMessage(`Reaction window triggers for ${defender.toUpperCase()}!`);

        if (defender === 'player') {
            this.selectedBoardMana = [];
            this.updateComboPreview();
            this.enablePlayerControls(true);
        } else {
            if (this.mode === 'online') {
                this.logMessage('Waiting for opponent to react...');
                this.phase = 'reaction_request';
                this.syncToFirebase('reaction_request');
            } else {
                // AI Reaction automation
                this.time.delayedCall(1000, () => {
                    const reactionSpell = this.calculateAIReaction(incomingSpell.damage);
                    this.resolveDefendingReaction(reactionSpell);
                });
            }
        }
    }

    resolveDefendingReaction(reactionSpell) {

        const defender = this.reactionCaster;
        const attacker = this.reactionSource;
        const defChar = defender === 'player' ? this.player : this.ai;
        const attChar = attacker === 'player' ? this.player : this.ai;

        if (reactionSpell) {
            this.logMessage(`${defender.toUpperCase()} casts reaction: ${reactionSpell.name}!`);

            // Apply synergy using the new three-way system
            const cycle = this.cycleElements[this.cycleIndex];
            let isEmp = false;
            if (reactionSpell.synergyType === 'constructive' && cycle === reactionSpell.element) isEmp = true;
            else if (reactionSpell.synergyType === 'destructive' && cycle !== reactionSpell.element && reactionSpell.combo.includes(cycle)) isEmp = true;
            else if (reactionSpell.synergyType === 'prestructive' && reactionSpell.combo && !reactionSpell.combo.includes(cycle)) isEmp = true;

            let rDmg = reactionSpell.damage;
            let rShield = reactionSpell.shield;

            if (isEmp) {
                // Apply empowered value overrides for reaction spells
                if (reactionSpell.name === 'Shell') rShield = 5;
                if (reactionSpell.name === 'Spark') rDmg = 3;
                if (reactionSpell.name === 'Carapace') rShield = 8;
                if (reactionSpell.name === 'Blast') rDmg = 5;
                this.logMessage(`${reactionSpell.name} is empowered by synergy!`);
            }

            // Apply reaction shield
            if (rShield > 0) {
                defChar.shield += rShield;
                this.updateShieldDisplay(defender);
                this.logMessage(`${defender.toUpperCase()} gains ${rShield} Reaction Shield.`);
            }

            // Counter damage check
            if (rDmg > 0) {
                this.logMessage(`Reaction deals ${rDmg} counter damage back!`);
                this.applyDamage(attacker, rDmg);
            }
        } else {
            this.logMessage(`${defender.toUpperCase()} takes the direct hit.`);
        }

        // Retaliaton damage: fires when defender has retaliationDamage status
        if (defChar.status.retaliationDamage > 0) {
            this.forceDiscardRandom(attacker, 1);
            this.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
        }

        // Apply incoming damage minus final shield
        const finalDmg = this.reactionTargetSpell.damage;
        this.applyDamage(defender, finalDmg, this.reactionTargetSpell.bypassShield || false);
    }

    applyDamage(who, amount, bypassShield = false) {
        const char = who === 'player' ? this.player : this.ai;
        
        // Shield absorption (Lava Surge bypasses shields entirely)
        if (bypassShield) {
            this.logMessage(`Lava Surge bypasses ${who.toUpperCase()}'s shield!`);
        } else if (char.shield > 0) {
            if (char.shield >= amount) {
                char.shield -= amount;
                this.logMessage(`${who.toUpperCase()}'s shield absorbed all ${amount} DMG!`);
                amount = 0;
            } else {
                amount -= char.shield;
                this.logMessage(`${who.toUpperCase()}'s shield absorbed ${char.shield} DMG. ${amount} DMG passes through!`);
                char.shield = 0;
            }
            this.updateShieldDisplay(who);
        }

        // Clean giant fortress temporary shield
        if (who === 'player' && char.shield > 90) char.shield = 0;
        if (who === 'ai' && char.shield > 90) char.shield = 0;
        this.updateShieldDisplay(who);

        if (amount > 0) {
            this.logMessage(`${who.toUpperCase()} is hit for ${amount} DMG!`);
            this.playSound('hit');

            // Set state to discard
            this.phase = 'discard';
            this.enablePlayerControls(false);

            if (who === 'player') {
                this.cardsToDiscardCount = amount;
                this.promptDiscardSelection();
            } else {
                if (this.mode === 'online') {
                    this.phase = 'discard_request';
                    this.discardTargetCount = amount;
                    this.syncToFirebase('discard_request');
                    this.logMessage('Waiting for opponent to discard...');
                } else {
                    // AI automatically discards
                    this.runAIDiscardAutomation(amount);
                }
            }
        } else {
            // Attack completed without card losses
            this.time.delayedCall(800, () => {
                if (this.pendingExtraAction) {
                    this.pendingExtraAction = false;
                    this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                    this.logMessage(`${this.turn.toUpperCase()} gets another action!`);
                    if (this.turn === 'player') {
                        this.phase = 'action';
                        this.enablePlayerControls(true);
                    } else {
                        this.runAITurn();
                    }
                } else {
                    this.checkTurnContinuation();
                }
            });
        }
    }

    // --- PLAYER MANUAL DISCARD HANDLING ---
    promptDiscardSelection() {
        // Double check if player has enough cards left to discard
        const total = this.player.hand.length + this.player.board.length;
        if (total === 0 || total <= this.cardsToDiscardCount) {
            this.logMessage("Player is out of cards!");
            this.player.hand = [];
            this.player.board = [];
            this.updatePlayerHandDisplay();
            this.updatePlayerBoardDisplay();
            this.updatePlayerLifeDisplay();
            this.checkDefeatCondition('player');
            return;
        }

        this.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
        this.discardPromptText.setVisible(true);
    }

    discardCardFromZone(zone, index, who) {
        if (who === 'player' && (this.phase === 'discard' || this.phase === 'discard_request_active') && this.cardsToDiscardCount > 0) {
            const char = this.player;
            let discarded;
            if (zone === 'hand') {
                discarded = char.hand.splice(index, 1)[0];
                this.updatePlayerHandDisplay();
            } else {
                discarded = char.board.splice(index, 1)[0];
                this.updatePlayerBoardDisplay();
            }

            this.sharedDiscard.push(discarded);
            this.updateDeckDiscardDisplay();
            this.updatePlayerLifeDisplay();

            this.cardsToDiscardCount--;
            this.playSound('fire');

            if (this.cardsToDiscardCount <= 0) {
                this.discardPromptText.setVisible(false);
                this.logMessage("Player finished discarding cards.");
                
                if (this.phase === 'discard_request_active') {
                    this.phase = 'discard_response';
                    this.syncToFirebase('discard_response');
                    this.enablePlayerControls(false);
                    this.logMessage('Waiting for turn resolution...');
                } else {
                    this.phase = 'action';
                    // End turn and rotate (or grant extra action)
                    this.time.delayedCall(600, () => {
                        if (this.pendingExtraAction) {
                            this.pendingExtraAction = false;
                            this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                            this.logMessage('Player gets another action!');
                            this.enablePlayerControls(true);
                        } else {
                            this.checkTurnContinuation();
                        }
                    });
                }
            } else {
                this.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
            }
        }
    }

    // --- AI STRATEGIC AGENT ---
    getValidBoardCombos(board) {
        const results = [];
        const n = board.length;
        if (n === 0) return results;
        
        // 1-card combos
        for (let i = 0; i < n; i++) results.push([i]);
        
        // 2-card combos
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                results.push([i, j]);
            }
        }
        
        // 3-card combos
        if (n >= 3) {
            results.push([0, 1, 2]);
        }
        
        return results;
    }

    scoreAISpell(spell, isReaction, incomingDamage) {
        let score = 0;
        const cycle = this.cycleElements[this.cycleIndex];
        
        let isEmp = false;
        if (spell.synergyType === 'constructive' && cycle === spell.element) isEmp = true;
        else if (spell.synergyType === 'destructive' && cycle !== spell.element && spell.combo.includes(cycle)) isEmp = true;
        else if (spell.synergyType === 'prestructive' && !spell.combo.includes(cycle)) isEmp = true;

        if (isReaction) {
            if (spell.shield > 0) {
                score += spell.shield * 10;
                if (spell.shield >= incomingDamage) score += 20; // Bonus for fully blocking
                if (isEmp) score += 5;
                score -= spell.combo.length; // Tie-breaker: use fewer cards
            } else {
                return -1; // Not a defensive spell
            }
        } else {
            score += spell.damage * 10;
            score += spell.shield * 8;
            score += spell.draw * 5;
            score += spell.drain * 6;
            
            if (isEmp) score += 15; // Strongly prefer empowered spells
            
            // Situational adjustments
            if (this.ai.life <= 4) {
                score += spell.shield * 10; // Desperate for shield
                score += spell.drain * 10; // Desperate to drain opponent's capability
            }
            if (this.player.life <= 4) {
                score += spell.damage * 15; // Go for the kill
            }
            
            score += spell.combo.length; 
        }
        
        return score;
    }

    checkTurnContinuation() {
        if (this.turn === 'player' && (!this.manaPlacedThisTurn || !this.spellCastThisTurn)) {
            this.phase = 'action';
            this.enablePlayerControls(true);
        } else if (this.turn === 'ai' && (!this.manaPlacedThisTurn || !this.spellCastThisTurn)) {
            this.runAITurn();
        } else {
            this.endTurn();
        }
    }

    runAITurn() {
        if (this.phase === 'gameover') return;

        this.logMessage("AI is evaluating options...");

        // Smart decision making logic:
        // 1. Play mana if board has less than 3 cards
        if (!this.manaPlacedThisTurn && this.ai.board.length < 3 && this.ai.hand.length > 0) {
            this.manaPlacedThisTurn = true;
            // Find a duplicate element or just play first
            const idxToPlay = 0; 
            const el = this.ai.hand.splice(idxToPlay, 1)[0];
            this.ai.board.push(el);

            this.playSound('draw');
            this.logMessage(`AI plays [${el.toUpperCase()}] mana to board.`);
            if (this.ai.status.manaPlayDamage > 0) {
                this.forceDiscardRandom('player', 1);
                this.logMessage(`AI's mana play deals 1 damage to Player!`);
            }
            if (this.player.status.oppManaPlayDamage > 0) {
                this.forceDiscardRandom('ai', 1);
                this.logMessage(`AI takes 1 damage from playing mana due to Player Surge!`);
            }
            
            this.updateAIHandDisplay();
            this.updateAIBoardDisplay();
            this.updateAILifeDisplay();

            this.time.delayedCall(1200, () => {
                // Check bonusManaPlays: AI gets a second mana play
                if (this.ai.status.bonusManaPlays > 0 && this.ai.hand.length > 0 && this.ai.board.length < 3) {
                    this.ai.status.bonusManaPlays = 0;
                    this.manaPlacedThisTurn = false;
                    this.logMessage(`AI plays a second mana!`);
                    const el2 = this.ai.hand.splice(0, 1)[0];
                    this.ai.board.push(el2);
                    this.logMessage(`AI plays [${el2.toUpperCase()}] mana to board.`);
                    this.updateAIHandDisplay();
                    this.updateAIBoardDisplay();
                    this.updateAILifeDisplay();
                }
                this.runAITurn();
            });
            return;
        }

        // 2. Try to form a spell combo from board
        if (!this.spellCastThisTurn && this.ai.board.length >= 2) {
            const combos = this.getValidBoardCombos(this.ai.board);
            let bestSpell = null;
            let bestComboIndices = null;
            let bestScore = -1;

            combos.forEach(indices => {
                const elements = indices.map(idx => this.ai.board[idx]);
                const spell = this.getSpellFromCombo(elements);
                if (spell) {
                    const score = this.scoreAISpell(spell, false, 0);
                    if (score > bestScore) {
                        bestScore = score;
                        bestSpell = spell;
                        bestComboIndices = indices;
                    }
                }
            });

            if (bestSpell) {
                this.spellCastThisTurn = true;
                // Consume
                bestComboIndices.sort((a,b) => b-a);
                bestComboIndices.forEach(idx => {
                    const consumed = this.ai.board.splice(idx, 1)[0];
                    this.sharedDiscard.push(consumed);
                });

                this.updateAIBoardDisplay();
                this.updateAILifeDisplay();
                this.updateDeckDiscardDisplay();

                this.logMessage(`AI casts: ${bestSpell.name}!`);

                const w = this.scale.width;
                this.triggerSpellVisual(bestSpell.element, w / 2 + 100, 200, w / 2 + 100, 500, () => {
                    this.initiateAttack('ai', 'player', bestSpell);
                });
                return;
            }
        }

        if (this.manaPlacedThisTurn || this.spellCastThisTurn) {
            this.logMessage("AI ends turn.");
            this.time.delayedCall(1200, () => {
                this.endTurn();
            });
            return;
        }

        // 3. Fallback: pass to draw
        this.logMessage("AI chooses Pass to Draw.");
        const extra = this.drawCard();
        if (extra) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (this.ai.status.autoPlayDraw > 0 && this.ai.board.length < 3) {
                this.ai.board.push(extra);
                this.logMessage(`AI's drawn mana is auto-played to board!`);
            } else {
                this.ai.hand.push(extra);
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (this.ai.status.loseManaOnDraw > 0 && this.ai.hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * this.ai.hand.length);
                const lost = this.ai.hand.splice(lostIdx, 1)[0];
                this.sharedDiscard.push(lost);
                this.logMessage(`AI lost a hand mana from drawing!`);
            }

            this.updateAIHandDisplay();
            this.updateAIBoardDisplay();
            this.updateAILifeDisplay();
        }

        this.time.delayedCall(1200, () => {
            this.endTurn();
        });
    }

    calculateAIReaction(incomingDamage) {
        if (this.ai.board.length === 0) return null;
        if (this.mode === 'test' && this.dummyMode === 'passive') return null;

        const combos = this.getValidBoardCombos(this.ai.board);
        let bestSpell = null;
        let bestComboIndices = null;
        let bestScore = -1;

        combos.forEach(indices => {
            const elements = indices.map(idx => this.ai.board[idx]);
            const spell = this.getSpellFromCombo(elements);
            if (spell) {
                const score = this.scoreAISpell(spell, true, incomingDamage);
                if (score > bestScore) {
                    bestScore = score;
                    bestSpell = spell;
                    bestComboIndices = indices;
                }
            }
        });

        if (bestSpell && bestScore > -1) {
            // Consume board mana
            bestComboIndices.sort((a,b) => b-a);
            bestComboIndices.forEach(idx => {
                const consumed = this.ai.board.splice(idx, 1)[0];
                this.sharedDiscard.push(consumed);
            });

            this.updateAIBoardDisplay();
            this.updateAILifeDisplay();
            this.updateDeckDiscardDisplay();
            return bestSpell;
        }

        return null;
    }

    runAIDiscardAutomation(amount) {
        const total = this.ai.hand.length + this.ai.board.length;
        if (total === 0 || total <= amount) {
            this.logMessage("AI is out of cards!");
            this.ai.hand = [];
            this.ai.board = [];
            this.updateAIHandDisplay();
            this.updateAIBoardDisplay();
            this.updateAILifeDisplay();
            this.checkDefeatCondition('ai');
            return;
        }

        this.logMessage(`AI is selecting ${amount} card(s) to discard...`);

        for (let i = 0; i < amount; i++) {
            // Prefer discarding from board mana first if excess, then hand
            if (this.ai.board.length > 1) {
                const burned = this.ai.board.pop();
                this.sharedDiscard.push(burned);
            } else {
                const burned = this.ai.hand.pop();
                this.sharedDiscard.push(burned);
            }
            this.playSound('fire');
        }

        this.updateAIHandDisplay();
        this.updateAIBoardDisplay();
        this.updateAILifeDisplay();
        this.updateDeckDiscardDisplay();

        this.phase = 'action';
        
        // Turn cleanup (or grant extra action)
        this.time.delayedCall(1200, () => {
            if (this.pendingExtraAction) {
                this.pendingExtraAction = false;
                this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                if (this.turn === 'player') {
                    this.logMessage('Player gets another action!');
                    this.enablePlayerControls(true);
                } else {
                    this.logMessage('AI gets another action!');
                    this.runAITurn();
                }
            } else {
                this.checkTurnContinuation();
            }
        });
    }

    // --- ALPHABETICAL SPELL COMBO PARSER ---
    getSpellFromCombo(combo) {
        if (!this.spellsCatalog) {
            this.spellsCatalog = {
                'air': { name: 'Breeze', element: 'air', combo: ['air'], damage: 0, shield: 0, draw: 0, drain: 1, synergyType: 'constructive', synergyText: 'Constructive: 2 drain', desc: 'Drain 1. Constructive: 2 drain' },
                'water': { name: 'Stream', element: 'water', combo: ['water'], damage: 0, shield: 0, draw: 1, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 2 draw', desc: 'Draw 1. Constructive: 2 draw' },
                'fire': { name: 'Spark', element: 'fire', combo: ['fire'], damage: 1, shield: 0, draw: 0, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 3 damage', desc: '1 DMG. Constructive: 3 damage' },
                'earth': { name: 'Shell', element: 'earth', combo: ['earth'], damage: 0, shield: 3, draw: 0, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 5 shield', desc: '+3 Shield. Constructive: 5 shield' },
                'air,air': { name: 'Gust', element: 'air', combo: ['air', 'air'], damage: 0, shield: 0, draw: 0, drain: 2, synergyType: 'constructive', synergyText: 'Constructive: 3 drain', desc: 'Drain 2. Constructive: 3 drain' },
                'water,water': { name: 'Rain', element: 'water', combo: ['water', 'water'], damage: 0, shield: 0, draw: 2, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 3 draw', desc: 'Draw 2. Constructive: 3 draw' },
                'fire,fire': { name: 'Blast', element: 'fire', combo: ['fire', 'fire'], damage: 3, shield: 0, draw: 0, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 5 damage', desc: '3 DMG. Constructive: 5 damage' },
                'earth,earth': { name: 'Carapace', element: 'earth', combo: ['earth', 'earth'], damage: 0, shield: 5, draw: 0, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 8 shield', desc: '+5 Shield. Constructive: 8 shield' },
                'air,fire': { name: 'Ignition', element: 'n/a', combo: ['air', 'fire'], damage: 1, shield: 0, draw: 0, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, 2 mana can be played', desc: '1 DMG, Drain 1. Prestructive: Next round, 2 mana can be played' },
                'fire,water': { name: 'Haze', element: 'n/a', combo: ['fire', 'water'], damage: 1, shield: 0, draw: 1, drain: 0, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, all players lose hand mana as they draw mana', desc: '1 DMG, Draw 1. Prestructive: Next round, all players lose hand mana as they draw mana' },
                'earth,fire': { name: 'Quake', element: 'n/a', combo: ['earth', 'fire'], damage: 1, shield: 3, draw: 0, drain: 0, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, applying Shield deals 1 damage', desc: '1 DMG, +3 Shield. Prestructive: Next round, applying Shield deals 1 damage' },
                'air,earth': { name: 'Dust', element: 'n/a', combo: ['air', 'earth'], damage: 0, shield: 3, draw: 0, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, damage has a 50% chance of missing', desc: '+3 Shield, Drain 1. Prestructive: Next round, damage has a 50% chance of missing' },
                'air,water': { name: 'Typhoon', element: 'n/a', combo: ['air', 'water'], damage: 0, shield: 0, draw: 1, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, drawn mana is immediately played', desc: 'Draw 1, Drain 1. Prestructive: Next round, drawn mana is immediately played' },
                'earth,water': { name: 'Enrich', element: 'n/a', combo: ['earth', 'water'], damage: 0, shield: 3, draw: 1, drain: 0, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, everyone draws 3 mana', desc: '+3 Shield, Draw 1. Prestructive: Next round, everyone draws 3 mana' },
                'air,air,fire': { name: 'Firestorm', element: 'air', combo: ['air', 'air', 'fire'], damage: 1, shield: 0, draw: 0, drain: 2, synergyType: 'constructive', synergyText: 'Constructive: Next played mana deals 1 damage to opponent', desc: '1 DMG, Drain 2. Constructive: Next played mana deals 1 damage to opponent' },
                'earth,earth,water': { name: 'Fortress', element: 'earth', combo: ['earth', 'earth', 'water'], damage: 0, shield: 5, draw: 1, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: Next turn, draw an extra mana if you still have shield', desc: '+5 Shield, Draw 1. Constructive: Next turn, draw an extra mana if you still have shield' },
                'air,fire,fire': { name: 'Wildfire', element: 'fire', combo: ['air', 'fire', 'fire'], damage: 3, shield: 0, draw: 0, drain: 1, synergyType: 'constructive', synergyText: 'Constructive: Next turn, play 2 spells instead of 1', desc: '3 DMG, Drain 1. Constructive: Next turn, play 2 spells instead of 1' },
                'earth,water,water': { name: 'Quagmire', element: 'water', combo: ['earth', 'water', 'water'], damage: 0, shield: 3, draw: 2, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: Next turn, you can redraw up to 2 mana', desc: '+3 Shield, Draw 2. Constructive: Next turn, you can redraw up to 2 mana' },
                'fire,water,water': { name: 'Billow', element: 'water', combo: ['fire', 'water', 'water'], damage: 1, shield: 0, draw: 2, drain: 0, synergyType: 'destructive', synergyText: 'Destructive: Cycle the top 3 deck cards', desc: '1 DMG, Draw 2. Destructive: Cycle the top 3 deck cards' },
                'fire,fire,water': { name: 'Vaporize', element: 'fire', combo: ['fire', 'fire', 'water'], damage: 3, shield: 0, draw: 1, drain: 0, synergyType: 'destructive', synergyText: 'Destructive: Destroy the top 3 deck cards', desc: '3 DMG, Draw 1. Destructive: Destroy the top 3 deck cards' },
                'earth,fire,fire': { name: 'Surge', element: 'fire', combo: ['earth', 'fire', 'fire'], damage: 3, shield: 3, draw: 0, drain: 0, synergyType: 'destructive', synergyText: 'Destructive: Next mana played by opponent deals 1 damage to them', desc: '3 DMG, +3 Shield. Destructive: Next mana played by opponent deals 1 damage to them' },
                'earth,earth,fire': { name: 'Crucible', element: 'earth', combo: ['earth', 'earth', 'fire'], damage: 1, shield: 5, draw: 0, drain: 0, synergyType: 'destructive', synergyText: 'Destructive: Next round, deal 1 retaliation damage to attacking opponents', desc: '1 DMG, +5 Shield. Destructive: Next round, deal 1 retaliation damage to attacking opponents' },
                'air,air,water': { name: 'Hurricane', element: 'air', combo: ['air', 'air', 'water'], damage: 0, shield: 0, draw: 1, drain: 2, synergyType: 'destructive', synergyText: 'Destructive: Next round, opponent can\'t draw mana', desc: 'Draw 1, Drain 2. Destructive: Next round, opponent can\'t draw mana' },
                'air,water,water': { name: 'Flood', element: 'water', combo: ['air', 'water', 'water'], damage: 0, shield: 0, draw: 2, drain: 1, synergyType: 'destructive', synergyText: 'Destructive: Next round, opponent draws 4 mana', desc: 'Draw 2, Drain 1. Destructive: Next round, opponent draws 4 mana' },
                'air,earth,earth': { name: 'Tower', element: 'earth', combo: ['air', 'earth', 'earth'], damage: 0, shield: 5, draw: 0, drain: 1, synergyType: 'destructive', synergyText: 'Destructive: Next round, opponent\'s spells have 50% chance of failing', desc: '+5 Shield, Drain 1. Destructive: Next round, opponent\'s spells have 50% chance of failing' },
                'air,air,earth': { name: 'Scour', element: 'air', combo: ['air', 'air', 'earth'], damage: 0, shield: 3, draw: 0, drain: 2, synergyType: 'destructive', synergyText: 'Destructive: Remove opponent\'s Shield', desc: '+3 Shield, Drain 2. Destructive: Remove opponent\'s Shield' },
                'air,air,air': { name: 'Tempest', element: 'air', combo: ['air', 'air', 'air'], damage: 0, shield: 0, draw: 0, drain: 3, synergyType: 'force_cycle', synergyText: 'Force Cycle to Air', desc: 'Drain 3. Force Cycle to Air' },
                'earth,earth,earth': { name: 'Pillar', element: 'earth', combo: ['earth', 'earth', 'earth'], damage: 0, shield: 8, draw: 0, drain: 0, synergyType: 'force_cycle', synergyText: 'Force Cycle to Earth', desc: '+8 Shield. Force Cycle to Earth' },
                'fire,fire,fire': { name: 'Blaze', element: 'fire', combo: ['fire', 'fire', 'fire'], damage: 5, shield: 0, draw: 0, drain: 0, synergyType: 'force_cycle', synergyText: 'Force Cycle to Fire', desc: '5 DMG. Force Cycle to Fire' },
                'water,water,water': { name: 'Deluge', element: 'water', combo: ['water', 'water', 'water'], damage: 0, shield: 0, draw: 3, drain: 0, synergyType: 'force_cycle', synergyText: 'Force Cycle to Water', desc: 'Draw 3. Force Cycle to Water' },
                'air,earth,water': { name: 'Mudslide', element: 'n/a', combo: ['air', 'earth', 'water'], damage: 0, shield: 3, draw: 1, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, everyone discards and replaces their hand', desc: '+3 Shield, Draw 1, Drain 1. Prestructive: Next round, everyone discards and replaces their hand' },
                'air,fire,water': { name: 'Tide', element: 'n/a', combo: ['air', 'fire', 'water'], damage: 1, shield: 0, draw: 1, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, everyone rotates hands clockwise', desc: '1 DMG, Draw 1, Drain 1. Prestructive: Next round, everyone rotates hands clockwise' },
                'earth,fire,water': { name: 'Aegis', element: 'n/a', combo: ['earth', 'fire', 'water'], damage: 1, shield: 3, draw: 1, drain: 0, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, no damage can be dealt', desc: '1 DMG, +3 Shield, Draw 1. Prestructive: Next round, no damage can be dealt' },
                'air,earth,fire': { name: 'Cataclysm', element: 'n/a', combo: ['air', 'earth', 'fire'], damage: 1, shield: 3, draw: 0, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, spells are randomly targeted (including self)', desc: '1 DMG, +3 Shield, Drain 1. Prestructive: Next round, spells are randomly targeted (including self)' }
            };
        }

        if (combo.length === 0 || combo.length > 3) return null;
        
        // Sort alphabetically to maintain order independence!
        const sorted = [...combo].sort();
        const key = sorted.join(',');

        return this.spellsCatalog[key] || null;
    }

    isWeakenedByCycle(spellEl, cycleEl) {
        // Water beats Fire beats Earth beats Air beats Water
        const weakness = {
            'fire': 'water',
            'earth': 'fire',
            'air': 'earth',
            'water': 'air'
        };
        return weakness[spellEl] === cycleEl;
    }

    // --- GAME OVER DISPLAY ---
    showGameOver(outcome) {
        const w = this.scale.width;
        const h = this.scale.height;

        this.playSound(outcome === 'VICTORY' ? 'shield' : 'hit');

        // Dark shield overlay
        const overG = this.add.graphics();
        overG.fillStyle(0x1a1410, 0.9);
        overG.fillRoundedRect(w / 2 - 250, h / 2 - 180, 500, 300, 15);
        overG.lineStyle(2, outcome === 'VICTORY' ? 0xa67032 : 0xdf1b2d, 0.7);
        overG.strokeRoundedRect(w / 2 - 250, h / 2 - 180, 500, 300, 15);

        const title = this.add.text(w / 2, h / 2 - 100, outcome, {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '52px',
            fontWeight: '800',
            color: outcome === 'VICTORY' ? '#a67032' : '#df1b2d',
            letterSpacing: 2
        }).setOrigin(0.5);

        const victoryMsg = this.mode === 'online'
            ? 'You defeated your opponent in the Cycle!'
            : 'You out-cycled the elemental master!';
        const defeatMsg = this.mode === 'online'
            ? 'Your opponent proved stronger in the Cycle...'
            : 'Your mana has dissolved back into the stars...';

        const scoreT = this.add.text(w / 2, h / 2 - 20, outcome === 'VICTORY' ? victoryMsg : defeatMsg, {
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            color: '#a0a0b0',
            align: 'center'
        }).setOrigin(0.5);

        if (this.mode === 'online') {
            // Single button: RETURN TO MENU
            const rBg = this.add.graphics();
            const rText = this.add.text(w / 2, h / 2 + 50, 'RETURN TO MENU', {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '18px',
                fontWeight: '700',
                color: '#ffffff',
                letterSpacing: 1
            }).setOrigin(0.5);

            const drawBtnNormal = () => {
                rBg.clear();
                rBg.fillStyle(0x261a12, 0.95);
                rBg.lineStyle(1.5, 0x4a4a4a, 0.7);
                rBg.fillRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
                rBg.strokeRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
            };

            const drawBtnHover = () => {
                rBg.clear();
                rBg.fillStyle(0x3d2b1f, 0.95);
                rBg.lineStyle(2, 0xbf8cff, 1);
                rBg.fillRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
                rBg.strokeRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
            };

            drawBtnNormal();

            const z = this.add.zone(w / 2, h / 2 + 50, 240, 50).setInteractive({ useHandCursor: true });
            z.on('pointerover', () => {
                drawBtnHover();
                rText.setColor('#bf8cff');
                this.playSound('click');
            });
            z.on('pointerout', () => {
                drawBtnNormal();
                rText.setColor('#ffffff');
            });
            z.on('pointerdown', () => {
                this.cleanupOnline();
                this.scene.start('Start');
            });
        } else {
            // Two buttons: REMATCH and MAIN MENU
            // --- 1. REMATCH Button (Left) ---
            const remBg = this.add.graphics();
            const remText = this.add.text(w / 2 - 120, h / 2 + 50, 'REMATCH', {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '18px',
                fontWeight: '700',
                color: '#ffffff',
                letterSpacing: 1
            }).setOrigin(0.5);

            const drawRemNormal = () => {
                remBg.clear();
                remBg.fillStyle(0x261a12, 0.95);
                remBg.lineStyle(1.5, 0x4a4a4a, 0.7);
                remBg.fillRoundedRect(w / 2 - 225, h / 2 + 25, 210, 50, 6);
                remBg.strokeRoundedRect(w / 2 - 225, h / 2 + 25, 210, 50, 6);
            };

            const drawRemHover = () => {
                remBg.clear();
                remBg.fillStyle(0x3d2b1f, 0.95);
                remBg.lineStyle(2, 0xbf8cff, 1);
                remBg.fillRoundedRect(w / 2 - 225, h / 2 + 25, 210, 50, 6);
                remBg.strokeRoundedRect(w / 2 - 225, h / 2 + 25, 210, 50, 6);
            };

            drawRemNormal();

            const zRem = this.add.zone(w / 2 - 120, h / 2 + 50, 210, 50).setInteractive({ useHandCursor: true });
            zRem.on('pointerover', () => {
                drawRemHover();
                remText.setColor('#bf8cff');
                this.playSound('click');
            });
            zRem.on('pointerout', () => {
                drawRemNormal();
                remText.setColor('#ffffff');
            });
            zRem.on('pointerdown', () => {
                this.scene.restart();
            });

            // --- 2. MAIN MENU Button (Right) ---
            const menuBg = this.add.graphics();
            const menuText = this.add.text(w / 2 + 120, h / 2 + 50, 'MAIN MENU', {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '18px',
                fontWeight: '700',
                color: '#ffffff',
                letterSpacing: 1
            }).setOrigin(0.5);

            const drawMenuNormal = () => {
                menuBg.clear();
                menuBg.fillStyle(0x261a12, 0.95);
                menuBg.lineStyle(1.5, 0x4a4a4a, 0.7);
                menuBg.fillRoundedRect(w / 2 + 15, h / 2 + 25, 210, 50, 6);
                menuBg.strokeRoundedRect(w / 2 + 15, h / 2 + 25, 210, 50, 6);
            };

            const drawMenuHover = () => {
                menuBg.clear();
                menuBg.fillStyle(0x3d2b1f, 0.95);
                menuBg.lineStyle(2, 0xffab40, 1); // elegant warm orange highlight for Main Menu
                menuBg.fillRoundedRect(w / 2 + 15, h / 2 + 25, 210, 50, 6);
                menuBg.strokeRoundedRect(w / 2 + 15, h / 2 + 25, 210, 50, 6);
            };

            drawMenuNormal();

            const zMenu = this.add.zone(w / 2 + 120, h / 2 + 50, 210, 50).setInteractive({ useHandCursor: true });
            zMenu.on('pointerover', () => {
                drawMenuHover();
                menuText.setColor('#ffab40');
                this.playSound('click');
            });
            zMenu.on('pointerout', () => {
                drawMenuNormal();
                menuText.setColor('#ffffff');
            });
            zMenu.on('pointerdown', () => {
                this.scene.start('Start');
            });
        }
    }

    // ============================================================
    // ONLINE MULTIPLAYER ENGINE
    // ============================================================

    /**
     * Set up an online game. Host initializes state and syncs to Firebase.
     * Guest waits for the initial state from Firebase.
     */
    setupOnlineGame() {
        this.logMessage(`Online mode: you are the ${this.myRole.toUpperCase()}.`);
        this.logMessage(`Lobby: ${this.lobbyCode}`);

        if (this.myRole === 'host') {
            // Host initializes the game state
            this.initSharedDeck();
            this.dealStartingHands();

            // Write initial state to Firebase so guest can load it
            this.syncToFirebase('init');

            // Host goes first
            this.startTurn('player');
        }

        // Both host and guest listen for state changes
        this.startFirebaseListener();
    }

    /**
     * Serialize the current game state into a plain object for Firebase.
     */
    serializeState() {
        const myKey = this.myRole;
        const oppKey = this.myRole === 'host' ? 'guest' : 'host';

        return {
            deck: this.sharedDeck.slice(),
            discard: this.sharedDiscard.slice(),
            cycleIndex: this.cycleIndex,
            firstCycleIndex: this.firstCycleIndex,
            turn: this.turn === 'player' ? myKey : oppKey,
            phase: this.phase,
            actionUsed: this.actionUsedThisTurn,
            [`${myKey}Hand`]: this.player.hand.slice(),
            [`${myKey}Board`]: this.player.board.slice(),
            [`${myKey}Shield`]: this.player.shield,
            [`${myKey}Life`]: this.player.life,
            [`${myKey}SteamDebuff`]: this.player.steamDebuff || false,
            [`${oppKey}Hand`]: this.ai.hand.slice(),
            [`${oppKey}Board`]: this.ai.board.slice(),
            [`${oppKey}Shield`]: this.ai.shield,
            [`${oppKey}Life`]: this.ai.life,
            [`${oppKey}SteamDebuff`]: this.ai.steamDebuff || false,
            reactionTargetSpell: this.reactionTargetSpell || null,
            reactionResponseSpell: this.reactionResponseSpell || null,
            reactionSource: this.reactionSource || null,
            reactionCaster: this.reactionCaster || null,
            discardTargetCount: this.discardTargetCount || 0,
            seq: Date.now()
        };
    }

    /**
     * Write current state to Firebase.
     */
    async syncToFirebase(actionType) {
        if (this.mode !== 'online' || !this.lobbyCode) return;

        try {
            const state = this.serializeState();
            const ref = firebase.database().ref(`lobbies/${this.lobbyCode}`);
            await ref.update({
                gameState: state,
                lastActionBy: this.myRole,
                status: this.phase === 'gameover' ? 'finished' : 'playing'
            });
        } catch (err) {
            console.error('[Whelmen Online] Sync error:', err);
            this.logMessage('⚠ Network sync error. Retrying...');
        }
    }

    /**
     * Start listening for Firebase state changes from the opponent.
     */
    startFirebaseListener() {
        const ref = firebase.database().ref(`lobbies/${this.lobbyCode}`);

        const handler = (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.gameState) return;

            const state = data.gameState;
            const lastBy = data.lastActionBy;

            // Ignore our own writes
            if (lastBy === this.myRole) return;

            // Handle disconnection
            if (data.status === 'abandoned' || data.status === 'disconnected') {
                this.logMessage('⚠ Opponent disconnected!');
                this.showDisconnectOverlay();
                return;
            }

            // Load the remote state
            this.loadFromFirebase(state);
        };

        ref.on('value', handler);
        this.firebaseUnsub = () => ref.off('value', handler);
    }

    /**
     * Load game state from Firebase (called when opponent acts).
     * Maps host/guest data to local player/ai based on our role.
     */
    loadFromFirebase(state) {
        const myKey = this.myRole;
        const oppKey = this.myRole === 'host' ? 'guest' : 'host';

        // Update deck and discard
        this.sharedDeck = state.deck ? state.deck.slice() : [];
        this.sharedDiscard = state.discard ? state.discard.slice() : [];

        // Update cycle
        this.cycleIndex = state.cycleIndex || 0;
        this.firstCycleIndex = state.firstCycleIndex || 1;

        // Map MY data to this.player
        this.player.hand = (state[`${myKey}Hand`] || []).slice();
        this.player.board = (state[`${myKey}Board`] || []).slice();
        this.player.shield = state[`${myKey}Shield`] || 0;
        this.player.life = this.player.hand.length + this.player.board.length;
        this.player.steamDebuff = state[`${myKey}SteamDebuff`] || false;

        // Map OPPONENT data to this.ai
        this.ai.hand = (state[`${oppKey}Hand`] || []).slice();
        this.ai.board = (state[`${oppKey}Board`] || []).slice();
        this.ai.shield = state[`${oppKey}Shield`] || 0;
        this.ai.life = this.ai.hand.length + this.ai.board.length;
        this.ai.steamDebuff = state[`${oppKey}SteamDebuff`] || false;

        // Update action state
        this.actionUsedThisTurn = state.actionUsed || false;
        this.phase = state.phase || 'action';

        // Determine whose turn it is locally
        const isMyTurn = state.turn === myKey;
        this.turn = isMyTurn ? 'player' : 'ai';

        // Refresh all UI
        this.refreshAllUI();

        // Handle game over
        if (state.phase === 'gameover') {
            this.phase = 'gameover';
            return;
        }

        // Handle Request/Response phases FIRST
        if (state.phase === 'reaction_request' && !isMyTurn) {
            // We are the guest and need to react
            this.reactionTargetSpell = state.reactionTargetSpell;
            this.reactionSource = state.reactionSource;
            this.reactionCaster = state.reactionCaster;
            
            this.phase = 'reaction_request_active';
            this.logMessage(`Reaction window triggers for you!`);
            this.selectedBoardMana = [];
            this.updateComboPreview();
            this.enablePlayerControls(true);
            return;
        }

        if (state.phase === 'reaction_response' && isMyTurn) {
            // We are the host and the guest responded
            this.phase = 'action'; // Reset phase internally
            const responseSpell = state.reactionResponseSpell || null;
            this.resolveDefendingReaction(responseSpell);
            return;
        }

        if (state.phase === 'discard_request' && !isMyTurn) {
            this.cardsToDiscardCount = state.discardTargetCount;
            this.phase = 'discard_request_active';
            this.promptDiscardSelection();
            return;
        }

        if (state.phase === 'discard_response' && isMyTurn) {
            this.phase = 'action';
            // Complete the attack process
            this.time.delayedCall(600, () => {
                if (this.pendingExtraAction) {
                    this.pendingExtraAction = false;
                    this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                    this.logMessage('You get another action!');
                    this.enablePlayerControls(true);
                } else {
                    this.checkTurnContinuation();
                }
            });
            return;
        }

        // Normal Turn Logic
        if (isMyTurn) {
            this.logMessage("--- YOUR TURN ---");
            this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
            this.selectedBoardMana = [];
            this.updateComboPreview();
            this.enablePlayerControls(true);
            this.logMessage('It is your turn. Choose an action.');
        } else {
            this.enablePlayerControls(false);
            this.logMessage('Waiting for opponent...');
        }
    }

    /**
     * Refresh all UI elements to match current state.
     */
    refreshAllUI() {
        this.updatePlayerHandDisplay();
        this.updatePlayerBoardDisplay();
        this.updatePlayerLifeDisplay();
        this.updateAIHandDisplay();
        this.updateAIBoardDisplay();
        this.updateAILifeDisplay();
        this.updateDeckDiscardDisplay();
        // Update cycle indicator rotation directly
        if (this.cycleContainer) {
            this.cycleContainer.rotation = -(this.cycleIndex - 1) * (Math.PI / 2);
            this.updateCycleDisplayColor(this.cycleElements[this.cycleIndex]);
        }
        this.updateComboPreview();

        // Update shield visuals
        this.updateShieldDisplay('player');
        this.updateShieldDisplay('ai');
    }

    /**
     * Show a disconnect overlay when opponent leaves.
     */
    showDisconnectOverlay() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.phase = 'gameover';
        this.enablePlayerControls(false);

        const bg = this.add.graphics();
        bg.fillStyle(0x1a1410, 0.9);
        bg.fillRoundedRect(w / 2 - 250, h / 2 - 100, 500, 200, 15);
        bg.lineStyle(2, 0xffab40, 0.7);
        bg.strokeRoundedRect(w / 2 - 250, h / 2 - 100, 500, 200, 15);

        this.add.text(w / 2, h / 2 - 40, 'OPPONENT DISCONNECTED', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '28px',
            fontWeight: '800',
            color: '#ffab40'
        }).setOrigin(0.5);

        const btnText = this.add.text(w / 2, h / 2 + 40, 'RETURN TO MENU', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: 'rgba(13,11,28,0.95)',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnText.on('pointerover', () => btnText.setColor('#bf8cff'));
        btnText.on('pointerout', () => btnText.setColor('#ffffff'));
        btnText.on('pointerdown', () => {
            this.cleanupOnline();
            this.scene.start('Start');
        });
    }

    /**
     * Clean up Firebase listeners and lobby on exit.
     */
    cleanupOnline() {
        if (this.firebaseUnsub) {
            this.firebaseUnsub();
            this.firebaseUnsub = null;
        }
        if (this.lobbyCode) {
            firebase.database().ref(`lobbies/${this.lobbyCode}/status`).set('finished').catch(() => {});
        }
    }

    update() {
        if (this.cycleContainer) {
            const rot = this.cycleContainer.rotation;
            if (this.cycleCenterText) {
                this.cycleCenterText.rotation = -rot;
            }
            if (this.cycleLabels) {
                this.cycleLabels.forEach(label => {
                    label.rotation = -rot;
                });
            }
        }
    }

    findSpellInMessage(msg) {
        if (!this.spellsCatalog) {
            this.getSpellFromCombo([]);
        }
        if (!this.spellsCatalog) return null;
        const lowerMsg = msg.toLowerCase();
        const sortedSpells = Object.values(this.spellsCatalog).sort((a, b) => b.name.length - a.name.length);
        for (const spell of sortedSpells) {
            if (lowerMsg.includes(spell.name.toLowerCase())) {
                return spell;
            }
        }
        return null;
    }

    showLogTooltip(spell, isAI) {
        this.updatePanelVisuals(isAI, spell);
    }

    hideLogTooltip() {
        if (this.incomingSpellPanel) this.incomingSpellPanel.setVisible(false);
        if (this.primedSpellPanel) this.primedSpellPanel.setVisible(false);
        this.updateComboPreview();
    }

    getLogTotalHeight() {
        if (!this.allLogTextLines || this.allLogTextLines.length === 0) return 0;
        const lastLine = this.allLogTextLines[this.allLogTextLines.length - 1];
        return lastLine.y + lastLine.height + 15;
    }

    scrollHistoryByScrollbarY(relativeY, handleHeight) {
        const viewportHeight = 360;
        const totalHeight = this.getLogTotalHeight();
        
        // Calculate clicked center and map it
        // The handle travel range is from 10 to 10 + 360 - handleHeight
        const minHandleY = 10;
        const maxHandleTravel = 360 - handleHeight;
        
        // Clamp handle target position
        let targetHandleY = relativeY - handleHeight / 2;
        if (targetHandleY < minHandleY) targetHandleY = minHandleY;
        if (targetHandleY > minHandleY + maxHandleTravel) targetHandleY = minHandleY + maxHandleTravel;
        
        // Map handle target position to container scroll Y
        const scrollRatio = (targetHandleY - minHandleY) / maxHandleTravel;
        const maxScroll = viewportHeight - totalHeight; // negative number
        
        this.logScrollContainer.y = scrollRatio * maxScroll;
        this.updateScrollbar();
    }

    scrollDuelHistoryTo(targetY) {
        if (!this.logScrollContainer || !this.allLogTextLines || this.allLogTextLines.length === 0) return;
        
        const viewportHeight = 360;
        const totalHeight = this.getLogTotalHeight();
        
        if (totalHeight <= viewportHeight) {
            this.logScrollContainer.y = 0;
            this.updateScrollbar();
            return;
        }
        
        const minY = viewportHeight - totalHeight;
        const maxY = 0;
        
        if (targetY < minY) targetY = minY;
        if (targetY > maxY) targetY = maxY;
        
        this.logScrollContainer.y = targetY;
        this.updateScrollbar();
    }

    scrollDuelHistory(deltaY) {
        if (!this.logScrollContainer || !this.allLogTextLines || this.allLogTextLines.length === 0) return;
        
        // Scroll by 1 line height (26px) per tick
        const scrollAmount = -Math.sign(deltaY) * 26;
        this.scrollDuelHistoryTo(this.logScrollContainer.y + scrollAmount);
    }

    updateScrollbar() {
        if (!this.logScrollbarGraphics) return;
        
        this.logScrollbarGraphics.clear();
        
        const viewportHeight = 360;
        const totalHeight = this.getLogTotalHeight();
        
        if (totalHeight <= viewportHeight) return;
        
        const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
        const maxScroll = viewportHeight - totalHeight;
        const scrollRatio = maxScroll === 0 ? 0 : (this.logScrollContainer.y / maxScroll);
        
        const maxHandleTravel = 360 - handleHeight;
        const handleY = 10 + scrollRatio * maxHandleTravel;
        
        // Draw track with a subtle, premium glassmorphic border/fill (height 360)
        this.logScrollbarGraphics.fillStyle(0xffffff, 0.04);
        this.logScrollbarGraphics.fillRoundedRect(328, 10, 6, 360, 3);
        
        // Draw glowing aesthetic scroll handle
        this.logScrollbarGraphics.fillStyle(0x7c3aed, 0.7); // vibrant purple
        this.logScrollbarGraphics.lineStyle(1, 0xa78bfa, 0.95); // glowing border
        this.logScrollbarGraphics.fillRoundedRect(328, handleY, 6, handleHeight, 3);
        this.logScrollbarGraphics.strokeRoundedRect(328, handleY, 6, handleHeight, 3);
    }

    buildSandboxDashboard() {
        const parent = document.getElementById('game-container');
        if (!parent) return;

        // 1. Create notification overlay
        const notif = document.createElement('div');
        notif.id = 'sandbox-notif';
        notif.className = 'floating-notif';
        notif.textContent = 'DUMMY RECOVERED!';
        parent.appendChild(notif);

        // 2. Create vertical sidebar toggle tab
        const tab = document.createElement('div');
        tab.id = 'sandbox-tab';
        tab.className = 'test-range-tab';
        tab.innerHTML = '⚙️';
        parent.appendChild(tab);

        // 3. Create sidebar panel
        const panel = document.createElement('div');
        panel.id = 'sandbox-panel';
        panel.className = 'test-range-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">⚙️ SANDBOX TOOLS</div>
                <button class="panel-close" id="panel-close-btn">&times;</button>
            </div>
            <div class="panel-content">
                <div class="panel-section">
                    <div class="panel-section-title">Environmental Cycle</div>
                    <div class="cycle-btn-group">
                        <button class="panel-btn active-weather" id="w-neutral" style="--color: var(--color-neutral); --glow: var(--glow-neutral-glow);"><span class="grey-dot"></span>Neut</button>
                        <button class="panel-btn" id="w-fire" style="--color: var(--color-fire); --glow: var(--color-fire-glow);"><img src="assets/icons/Fire.png" class="el-icon">Fire</button>
                        <button class="panel-btn" id="w-earth" style="--color: var(--color-earth); --glow: var(--color-earth-glow);"><img src="assets/icons/Earth.png" class="el-icon">Earth</button>
                        <button class="panel-btn" id="w-air" style="--color: var(--color-air); --glow: var(--color-air-glow);"><img src="assets/icons/Air.png" class="el-icon">Air</button>
                        <button class="panel-btn" id="w-water" style="--color: var(--color-water); --glow: var(--color-water-glow);"><img src="assets/icons/Water.png" class="el-icon">Water</button>
                    </div>
                </div>
                
                <div class="panel-section">
                    <div class="panel-section-title">Card Sandbox</div>
                    <div class="spawner-grid">
                        <div class="spawner-column">
                            <div class="spawner-col-title">Spawn In Hand</div>
                            <div class="element-grid">
                                <button class="panel-btn el-btn" id="spawn-h-fire" style="--color: var(--color-fire); --glow: var(--color-fire-glow);"><img src="assets/icons/Fire.png" class="el-icon"> Fire</button>
                                <button class="panel-btn el-btn" id="spawn-h-earth" style="--color: var(--color-earth); --glow: var(--color-earth-glow);"><img src="assets/icons/Earth.png" class="el-icon"> Earth</button>
                                <button class="panel-btn el-btn" id="spawn-h-air" style="--color: var(--color-air); --glow: var(--color-air-glow);"><img src="assets/icons/Air.png" class="el-icon"> Air</button>
                                <button class="panel-btn el-btn" id="spawn-h-water" style="--color: var(--color-water); --glow: var(--color-water-glow);"><img src="assets/icons/Water.png" class="el-icon"> Water</button>
                                <button class="panel-btn el-btn clear-btn" id="clear-hand">Clear Hand</button>
                            </div>
                        </div>
                        <div class="spawner-column">
                            <div class="spawner-col-title">Spawn On Board</div>
                            <div class="element-grid">
                                <button class="panel-btn el-btn" id="spawn-b-fire" style="--color: var(--color-fire); --glow: var(--color-fire-glow);"><img src="assets/icons/Fire.png" class="el-icon"> Fire</button>
                                <button class="panel-btn el-btn" id="spawn-b-earth" style="--color: var(--color-earth); --glow: var(--color-earth-glow);"><img src="assets/icons/Earth.png" class="el-icon"> Earth</button>
                                <button class="panel-btn el-btn" id="spawn-b-air" style="--color: var(--color-air); --glow: var(--color-air-glow);"><img src="assets/icons/Air.png" class="el-icon"> Air</button>
                                <button class="panel-btn el-btn" id="spawn-b-water" style="--color: var(--color-water); --glow: var(--color-water-glow);"><img src="assets/icons/Water.png" class="el-icon"> Water</button>
                                <button class="panel-btn el-btn clear-btn" id="clear-board">Clear Board</button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="panel-section">
                    <div class="panel-section-title">Test Dummy Opponent</div>
                    <div class="dummy-btn-group">
                        <button class="panel-btn toggle-btn btn-passive-ai" id="btn-dummy-passive">Passive Mode</button>
                        <button class="panel-btn toggle-btn" id="btn-dummy-active">Active AI</button>
                        <button class="panel-btn util-btn" id="btn-dummy-shield5">+5 Dummy Shield</button>
                        <button class="panel-btn util-btn" id="btn-dummy-shield10">+10 Dummy Shield</button>
                        <button class="panel-btn util-btn" id="btn-dummy-reset">Reset Dummy Health</button>
                    </div>
                </div>
                
                <div class="panel-section">
                    <div class="panel-section-title">Spell Sandbox Catalog</div>
                    <div class="spell-search-box">
                        <span class="spell-search-icon">🔍</span>
                        <input type="text" id="spell-search-input" class="spell-search-input" placeholder="Search spells by name or element...">
                    </div>
                    <div class="spell-list-scroll" id="spell-list-scroll"></div>
                </div>
            </div>
        `;
        parent.appendChild(panel);

        // --- Interaction Listeners ---
        const togglePanel = () => {
            panel.classList.toggle('active');
            this.playSound('click');
        };

        tab.addEventListener('click', togglePanel);
        document.getElementById('panel-close-btn').addEventListener('click', togglePanel);

        // 1. Weather Cycle Handlers
        const weatherIds = ['w-neutral', 'w-fire', 'w-earth', 'w-air', 'w-water'];
        const elementsList = ['neutral', 'fire', 'earth', 'air', 'water'];
        
        weatherIds.forEach((id, idx) => {
            const btn = document.getElementById(id);
            btn.addEventListener('click', () => {
                this.playSound('click');
                // Deactivate all cycle buttons
                weatherIds.forEach(wid => document.getElementById(wid).classList.remove('active-weather'));
                btn.classList.add('active-weather');

                // Force game cycle logic
                this.cycleIndex = idx;
                const el = elementsList[idx];
                this.logMessage(`[Sandbox] Forced Cycle to: [${el.toUpperCase()}]`);

                // Rotate visual dial
                this.tweens.add({
                    targets: this.cycleContainer,
                    rotation: -(idx - 1) * (Math.PI / 2),
                    duration: 500,
                    ease: 'Cubic.easeOut'
                });
                this.triggerCycleParticles(el);
                this.updateComboPreview();
            });
        });

        // 2. Card Spawn Handlers
        const spawnCard = (zone, el) => {
            this.playSound('draw');
            if (zone === 'hand') {
                this.player.hand.push(el);
                this.updatePlayerHandDisplay();
            } else {
                if (this.player.board.length < 5) {
                    this.player.board.push(el);
                    this.updatePlayerBoardDisplay();
                } else {
                    this.showSandboxNotification("Board is full!");
                }
            }
            this.updatePlayerLifeDisplay();
            this.updateComboPreview();
        };

        ['fire', 'earth', 'air', 'water'].forEach(el => {
            document.getElementById(`spawn-h-${el}`).addEventListener('click', () => spawnCard('hand', el));
            document.getElementById(`spawn-b-${el}`).addEventListener('click', () => spawnCard('board', el));
        });

        document.getElementById('clear-hand').addEventListener('click', () => {
            this.playSound('fire');
            this.player.hand = [];
            this.updatePlayerHandDisplay();
            this.updatePlayerLifeDisplay();
            this.updateComboPreview();
            this.logMessage("[Sandbox] Cleared Player hand.");
        });

        document.getElementById('clear-board').addEventListener('click', () => {
            this.playSound('fire');
            this.player.board = [];
            this.selectedBoardMana = [];
            this.updatePlayerBoardDisplay();
            this.updatePlayerLifeDisplay();
            this.updateComboPreview();
            this.logMessage("[Sandbox] Cleared Player board mana.");
        });

        // 3. Dummy Behavior Handlers
        const btnDummyPassive = document.getElementById('btn-dummy-passive');
        const btnDummyActive = document.getElementById('btn-dummy-active');

        btnDummyPassive.addEventListener('click', () => {
            this.playSound('click');
            this.dummyMode = 'passive';
            btnDummyPassive.classList.add('btn-passive-ai');
            btnDummyActive.classList.remove('btn-active-ai');
            this.logMessage("[Sandbox] Dummy set to PASSIVE Mode.");
        });

        btnDummyActive.addEventListener('click', () => {
            this.playSound('click');
            this.dummyMode = 'active';
            btnDummyActive.classList.add('btn-active-ai');
            btnDummyPassive.classList.remove('btn-passive-ai');
            this.logMessage("[Sandbox] Dummy set to ACTIVE AI Mode.");
        });

        document.getElementById('btn-dummy-shield5').addEventListener('click', () => {
            this.playSound('shield');
            this.ai.shield += 5;
            this.updateShieldDisplay('ai');
            this.logMessage(`[Sandbox] Granted Dummy +5 Shield. Total: ${this.ai.shield}`);
        });

        document.getElementById('btn-dummy-shield10').addEventListener('click', () => {
            this.playSound('shield');
            this.ai.shield += 10;
            this.updateShieldDisplay('ai');
            this.logMessage(`[Sandbox] Granted Dummy +10 Shield. Total: ${this.ai.shield}`);
        });

        document.getElementById('btn-dummy-reset').addEventListener('click', () => {
            this.playSound('shield');
            this.resetDummyState();
            this.showSandboxNotification("Dummy Health Reset!");
            this.logMessage("[Sandbox] Reset Dummy Health.");
        });

        // 4. Populating Spell Catalog Scroll
        if (!this.spellsCatalog) {
            this.getSpellFromCombo([]);
        }
        
        const scrollList = document.getElementById('spell-list-scroll');
        const searchInput = document.getElementById('spell-search-input');
        
        const renderSpellList = (filterText = '') => {
            scrollList.innerHTML = '';
            const lowerFilter = filterText.toLowerCase();
            
            Object.keys(this.spellsCatalog).forEach(comboKey => {
                const spell = this.spellsCatalog[comboKey];
                
                if (filterText && !spell.name.toLowerCase().includes(lowerFilter) && !spell.element.toLowerCase().includes(lowerFilter)) {
                    return;
                }
                
                const elementIcon = spell.element === 'fire' ? '<img src="assets/icons/Fire.png" class="el-icon">' :
                                    spell.element === 'earth' ? '<img src="assets/icons/Earth.png" class="el-icon">' :
                                    spell.element === 'water' ? '<img src="assets/icons/Water.png" class="el-icon">' :
                                    spell.element === 'air' ? '<img src="assets/icons/Air.png" class="el-icon">' : '<span class="grey-dot"></span>';
                
                const elSpanClass = `element-${spell.element}`;
                
                const spellItem = document.createElement('div');
                spellItem.className = 'spell-item';
                spellItem.innerHTML = `
                    <div class="spell-info">
                        <div class="spell-name-row">
                            <span class="spell-el-icon">${elementIcon}</span>
                            <span class="spell-name ${elSpanClass}">${spell.name}</span>
                        </div>
                        <div class="spell-desc-txt">${spell.desc}</div>
                    </div>
                    <button class="spell-cast-action" data-combo="${comboKey}">CAST</button>
                `;
                scrollList.appendChild(spellItem);

                // Add Cast Trigger
                spellItem.querySelector('.spell-cast-action').addEventListener('click', () => {
                    if (this.phase === 'discard') {
                        this.showSandboxNotification("Must discard first!");
                        return;
                    }
                    
                    this.playSound('click');
                    this.logMessage(`[Sandbox] Instant Casting: ${spell.name}!`);
                    const w = this.scale.width;
                    
                    // Visual spell fire from player center to AI center
                    this.triggerSpellVisual(spell.element, w / 2 - 100, 500, w / 2 - 100, 100, () => {
                        this.initiateAttack('player', 'ai', spell);
                    });
                });
            });
        };

        renderSpellList();

        searchInput.addEventListener('input', (e) => {
            renderSpellList(e.target.value);
        });

        // 5. Clean up events on Phaser scene shutdown
        this.events.on('shutdown', () => {
            document.body.classList.remove('in-game');
            // Release orientation lock when returning to menu
            try { screen.orientation.unlock(); } catch(e) {}
            const notifEl = document.getElementById('sandbox-notif');
            const tabEl = document.getElementById('sandbox-tab');
            const panelEl = document.getElementById('sandbox-panel');
            if (notifEl) notifEl.remove();
            if (tabEl) tabEl.remove();
            if (panelEl) panelEl.remove();
        });
    }

    showSandboxNotification(text) {
        const notif = document.getElementById('sandbox-notif');
        if (notif) {
            notif.textContent = text.toUpperCase();
            notif.classList.add('show');
            setTimeout(() => {
                notif.classList.remove('show');
            }, 3000);
        }
    }

    resetDummyState() {
        this.ai.hand = [];
        this.ai.board = [];
        this.ai.shield = 0;
        this.ai.steamDebuff = false;
        this.ai.maxHand = 8;
        
        this.ai.consecutiveDiscards = 0;
        
        // Restore random 4 hand cards and 3 board cards
        for (let i = 0; i < 4; i++) {
            this.ai.hand.push(this.drawCard() || 'fire');
        }
        for (let i = 0; i < 3; i++) {
            this.ai.board.push(this.drawCard() || 'earth');
        }
        
        this.updateAIHandDisplay();
        this.updateAIBoardDisplay();
        this.updateAILifeDisplay();
        this.updateShieldDisplay('ai');

        if (this.mode === 'test') {
            this.phase = 'action';
            this.cardsToDiscardCount = 0;
            this.selectedBoardMana = [];
            if (this.discardPromptText) this.discardPromptText.setVisible(false);
            this.updateComboPreview();
            this.enablePlayerControls(true);
        }
    }

    resetPlayerState() {
        this.player.hand = [];
        this.player.board = [];
        this.player.shield = 0;
        this.player.steamDebuff = false;
        this.player.maxHand = 8;
        this.selectedBoardMana = [];
        this.player.consecutiveDiscards = 0;
        
        // Restore random 4 hand cards and 3 board cards
        for (let i = 0; i < 4; i++) {
            this.player.hand.push(this.drawCard() || 'fire');
        }
        for (let i = 0; i < 3; i++) {
            this.player.board.push(this.drawCard() || 'earth');
        }
        
        this.updatePlayerHandDisplay();
        this.updatePlayerBoardDisplay();
        this.updatePlayerLifeDisplay();
        this.updateShieldDisplay('player');
        this.updateComboPreview();
        this.enablePlayerControls(true);

        if (this.mode === 'test') {
            this.phase = 'action';
            this.cardsToDiscardCount = 0;
            if (this.discardPromptText) this.discardPromptText.setVisible(false);
        }
    }
}

