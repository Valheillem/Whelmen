import { ELEMENT_COLORS, ELEMENT_HEX, isWeakenedByCycle } from '../data/ElementConstants.js';
import { getSpellFromCombo, findSpellInMessage, SPELLS } from '../data/SpellCatalog.js';
import { AudioSynthHelper } from '../audio/AudioSynthHelper.js';
import { SpellEffectsPlayer } from '../effects/SpellEffectsPlayer.js';
import { SynergySystem } from '../systems/SynergySystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { AIAgent } from '../systems/AIAgent.js';
import { DuelHistory } from '../ui/DuelHistory.js';
import { GameOverScreen } from '../ui/GameOverScreen.js';
import { SandboxDashboard } from '../ui/SandboxDashboard.js';
import { OnlineManager } from '../online/OnlineManager.js';

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
        this.spellEffects = new SpellEffectsPlayer(this);
        this.synergy = new SynergySystem(this);
        this.combat = new CombatSystem(this);
        this.aiAgent = new AIAgent(this);
        this.duelHistory = new DuelHistory(this);
        this.gameOverScreen = new GameOverScreen(this);
        this.sandboxDashboard = new SandboxDashboard(this);
        this.onlineManager = new OnlineManager(this);

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
        this.round = 1; // Round 1 starts
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
        this.duelHistory.drawActionLog();
        this.drawCycleIndicator();
        this.drawPlayerStats();
        this.drawAIStats();
        this.drawDeckDiscardPiles();
        this.drawUIControls();
        this.createTopRightUI();

        // ONLINE MODE: show waiting indicator and set up differently
        if (this.mode === 'online') {
            this.onlineManager.setupOnlineGame();
        } else {
            // AI MODE: initialize locally as before
            this.initSharedDeck();
            this.dealStartingHands();
            this.startTurn('player');
            if (this.mode === 'test') {
                this.sandboxDashboard.buildSandboxDashboard();
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
        this.duelHistory.logMessage("Initialized 88-card shared deck.");
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
                this.duelHistory.logMessage("Deck and Discard are empty!");
                return null;
            }
            this.duelHistory.logMessage("Deck dry! Reshuffling Discard Pile...");
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
            this.duelHistory.logMessage("Everyone draws 3 mana!");
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
            this.duelHistory.logMessage("Hands were discarded and replaced!");
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }

        if (char.status.rotateHands > 0) {
            let temp = [...char.hand];
            char.hand = [...opp.hand];
            opp.hand = temp;
            char.status.rotateHands = 0; opp.status.rotateHands = 0;
            this.duelHistory.logMessage("Hands were rotated!");
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }
        
        if (char.status.oppDraw4 > 0) {
            for(let i=0;i<4;i++) { let d = this.drawCard(); if(d) char.hand.push(d); }
            char.status.oppDraw4 = 0;
            this.duelHistory.logMessage(`${who.toUpperCase()} is flooded with 4 extra mana!`);
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }
        
        if (char.status.extraDrawIfShield > 0 && char.shield > 0) {
            let d = this.drawCard(); if(d) char.hand.push(d);
            this.duelHistory.logMessage(`${who.toUpperCase()} draws extra mana from Shield!`);
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
            this.duelHistory.logMessage(`${who.toUpperCase()} redraws ${redrawCount} mana!`);
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }
        
        this.phase = 'action';
        this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
        this.selectedBoardMana = [];
        this.updateComboPreview();

        const displayName = (this.mode === 'online' && who === 'player') ? 'YOUR' :
                            (this.mode === 'online' && who === 'ai') ? "OPPONENT'S" :
                            who.toUpperCase() + "'S";
        this.duelHistory.logMessage(`--- ${displayName} TURN ---`);

        // Draw phase
        
        let card = null;
        if (char.status.noDrawDebuff > 0) {
            this.duelHistory.logMessage(`${who.toUpperCase()} cannot draw this turn!`);
        } else {
            card = this.drawCard();
        }
    
        if (card) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (char.status.autoPlayDraw > 0 && char.board.length < 3) {
                char.board.push(card);
                this.animateCardMovement(card, 'deck', 'board', who);
                this.duelHistory.logMessage(`${who.toUpperCase()}'s drawn mana is auto-played to board!`);
            } else {
                char.hand.push(card);
                this.animateCardMovement(card, 'deck', 'hand', who);
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (char.status.loseManaOnDraw > 0 && char.hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * char.hand.length);
                const lost = char.hand.splice(lostIdx, 1)[0];
                this.sharedDiscard.push(lost);
                this.duelHistory.logMessage(`${who.toUpperCase()} lost a hand mana from drawing!`);
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
                this.duelHistory.logMessage('It is your turn. Choose an action.');
            }
        } else {
            this.enablePlayerControls(false);
            if (this.mode === 'ai') {
                this.time.delayedCall(1200, () => {
                    this.aiAgent.runAITurn();
                });
            } else if (this.mode === 'test') {
                if (this.dummyMode === 'passive') {
                    this.duelHistory.logMessage("Dummy is passive. Passing turn back to Player.");
                    this.time.delayedCall(800, () => {
                        this.endTurn();
                    });
                } else {
                    this.time.delayedCall(1200, () => {
                        this.aiAgent.runAITurn();
                    });
                }
            } else {
                // ONLINE: wait for opponent — Firebase listener handles it
                this.duelHistory.logMessage('Waiting for opponent...');
            }
        }
    }

    startRound() {
        // Decrease statuses at the start of a new round
        ['player', 'ai'].forEach(who => {
            const char = who === 'player' ? this.player : this.ai;
            for (let k in char.status) {
                if (char.status[k] > 0) char.status[k]--;
            }
        });
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

        // Check for round increment
        if (nextTurn === 'player') {
            this.round++;
            if (this.roundText) this.roundText.setText(`ROUND ${this.round}`);
            this.duelHistory.logMessage(`=== ROUND ${this.round} ===`);
            this.startRound();
        }

        this.startTurn(nextTurn);

        // ONLINE: sync state to Firebase AFTER transitioning to opponent's turn.
        // This ensures the opponent's newly drawn card and correct turn flag are synced.
        if (this.mode === 'online' && this.turn === 'ai') {
            this.onlineManager.syncToFirebase('endTurn');
        }
    }

    cleanupHandLimit(who) {
        const char = who === 'player' ? this.player : this.ai;
        if (char.hand.length > char.maxHand) {
            const discardCount = char.hand.length - char.maxHand;
            this.duelHistory.logMessage(`${who.toUpperCase()} discards ${discardCount} card(s) to match Hand Limit.`);
            for (let i = 0; i < discardCount; i++) {
                const discarded = char.hand.pop();
                this.sharedDiscard.push(discarded);
            }
            char.consecutiveDiscards++;
            if (char.consecutiveDiscards >= 2) {
                char.maxHand = Math.max(1, char.maxHand - 1);
                char.consecutiveDiscards = 0;
                this.duelHistory.logMessage(`OVERWHELMED! ${who.toUpperCase()}'s Max Hand Size decreases by 1!`);
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
        this.duelHistory.logMessage(`The Cycle rotates to: [${el.toUpperCase()}]`);

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
                    this.sandboxDashboard.showSandboxNotification("Dummy Defeated! Reviving...");
                    this.duelHistory.logMessage("--- DUMMY DEFEATED! Reviving Dummy... ---");
                    this.sandboxDashboard.resetDummyState();
                } else {
                    this.sandboxDashboard.showSandboxNotification("You Died! Reviving...");
                    this.duelHistory.logMessage("--- PLAYER DEFEATED! Reviving Player... ---");
                    this.sandboxDashboard.resetPlayerState();
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
            this.gameOverScreen.showGameOver(who === 'player' ? 'DEFEAT' : 'VICTORY');

            // ONLINE: sync game over state so opponent sees result
            if (this.mode === 'online') {
                this.onlineManager.syncToFirebase('gameover');
            }
            return true;
        }
        return false;
    }

    // --- RENDER VISUAL LAYOUT ---
    setupParticles() {
        this.spellEffects.setupParticles();
    }

    triggerSpellVisual(spell, startX, startY, endX, endY, onComplete) {
        this.spellEffects.playSpellCast(spell, startX, startY, endX, endY, onComplete);
    }

    drawCycleIndicator() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.cycleContainer = this.add.container(w / 2 - 20, h / 2 - 40);
        this.cycleLabels = [];

        // Sigil overlay
        this.bgSigil = this.add.image(0, 0, 'sigil').setScale(440 / 864);
        this.bgSigil.setAlpha(0.35); // Transparent to blend into background
        this.cycleContainer.add(this.bgSigil);
        
        // Subtle breathing animation for a premium element feel
        this.tweens.add({
            targets: this.bgSigil,
            alpha: 0.15,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 4 Elements around the circle
        const ringPositions = [
            { x: 0, y: -50, color: 0xdf1b2d, icon: 'icon_fire', label: 'FIRE' },
            { x: 50, y: 0, color: 0xa67032, icon: 'icon_earth', label: 'EARTH' },
            { x: 0, y: 50, color: 0xbf8cff, icon: 'icon_air', label: 'AIR' },
            { x: -50, y: 0, color: 0x1084e9, icon: 'icon_water', label: 'WATER' }
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
        const emitter = this.spellEffects.emitters[element];
        emitter.explode(40, this.scale.width / 2, this.scale.height / 2 - 40);
        this.updateCycleDisplayColor(element);
    }

    playElementalBurst(x, y, element) {
        this.spellEffects.playElementalBurst(x, y, element);
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
            this.deckT.setText(`DECK(${this.sharedDeck.length})`);
        } else {
            this.deckCardImg.setVisible(false);
            this.deckT.setText('DECK(EMPTY)');
        }

        // Update Discard representation
        this.discardOutlineG.clear();
        if (this.sharedDiscard.length > 0) {
            const topEl = this.sharedDiscard[this.sharedDiscard.length - 1];
            this.discardCardImg.setTexture(`card_${topEl}`);
            this.discardCardImg.setVisible(true);
            this.discardT.setText(`DISCARD(${this.sharedDiscard.length})`);
        } else {
            this.discardCardImg.setVisible(false);
            this.discardT.setText('DISCARD(EMPTY)');

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
            color: '#8a8a9e'
        });

        this.roundText = this.add.text(w / 2, 25, 'ROUND 1', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            color: '#ffffff',
            backgroundColor: 'rgba(13,11,28,0.85)',
            padding: { x: 12, y: 6 }
        }).setOrigin(0.5, 0).setDepth(2000);

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
                this.duelHistory.scrollDuelHistory(deltaY);
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
                    const totalHeight = this.duelHistory.getLogTotalHeight();
                    const viewportHeight = 360;
                    if (totalHeight > viewportHeight) {
                        this.isDraggingScrollbar = true;
                        const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
                        this.duelHistory.scrollHistoryByScrollbarY(relativeY, handleHeight);
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
                const totalHeight = this.duelHistory.getLogTotalHeight();
                const viewportHeight = 360;
                const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
                this.duelHistory.scrollHistoryByScrollbarY(relativeY, handleHeight);
            } else if (this.isDraggingHistory) {
                const deltaY = pointer.y - this.dragStartY;
                this.duelHistory.scrollDuelHistoryTo(this.dragStartScrollY + deltaY);
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
                this.duelHistory.showLogTooltip(spell, isAI);
            }
        });
        textLine.on('pointerout', () => {
            textLine.setColor(textLine.originalColor);
            this.duelHistory.hideLogTooltip();
        });

        this.logScrollContainer.add(textLine);
        this.allLogTextLines.push(textLine);

        // Auto-scroll to the bottom when a new message is added
        const totalHeight = this.duelHistory.getLogTotalHeight();
        const viewportHeight = 360;
        if (totalHeight > viewportHeight) {
            this.logScrollContainer.y = viewportHeight - totalHeight;
        } else {
            this.logScrollContainer.y = 0;
        }
        this.duelHistory.updateScrollbar();
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
                
            const incoming = this.playerIncomingHandCards || 0;
            if (index >= this.player.hand.length - incoming) {
                cardObj.setAlpha(0);
            }

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
                
            const incoming = this.aiIncomingHandCards || 0;
            if (index >= this.ai.hand.length - incoming) {
                cardObj.setAlpha(0);
            }

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
                
            const incoming = this.playerIncomingBoardCards || 0;
            // Simplified incoming logic for board display
            if (index >= uniqueElements.length - incoming) {
                cardObj.setAlpha(0);
            }

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
                
            const incoming = this.aiIncomingBoardCards || 0;
            if (index >= uniqueElements.length - incoming) {
                cardObj.setAlpha(0);
            }

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
        let isEmp = this.synergy.calculateSynergy(spell, cycle);
        
        const colors = ELEMENT_COLORS;
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
        for (const key in SPELLS) {
            if (SPELLS[key].name === spell.name) {
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
        const spell = getSpellFromCombo(elements);
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
        this.duelHistory.logMessage(`Player plays [${el.toUpperCase()}] mana to board.`);
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
                    this.duelHistory.logMessage(`Player's mana play deals 1 damage to AI!`);
                }
                if (this.ai.status.oppManaPlayDamage > 0) {
                    this.forceDiscardRandom('player', 1);
                    this.duelHistory.logMessage(`Player takes 1 damage from playing mana due to AI Surge!`);
                }

                // Check bonusManaPlays: allow a second mana play
                this.time.delayedCall(450, () => {
                    if (this.player.status.bonusManaPlays > 0) {
                        this.player.status.bonusManaPlays = 0;
                        this.manaPlacedThisTurn = false;
                        this.duelHistory.logMessage(`Player can play a second mana!`);
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

    forceDiscardRandom(who, count, source = 'hand') {
        const char = who === 'player' ? this.player : this.ai;
        const targetArray = source === 'board' ? char.board : char.hand;
        const actualCount = Math.min(count, targetArray.length);
        
        if (source === 'board') {
            this.duelHistory.logMessage(`${who.toUpperCase()} is forced to drain ${actualCount} board mana!`);
        } else {
            this.duelHistory.logMessage(`${who.toUpperCase()} is forced to discard ${actualCount} hand card(s)!`);
        }

        for (let i = 0; i < actualCount; i++) {
            const randIdx = Math.floor(Math.random() * targetArray.length);
            const discarded = targetArray.splice(randIdx, 1)[0];
            this.animateCardMovement(discarded, source, 'discard', who);
            this.sharedDiscard.push(discarded);
        }
        
        if (who === 'player') {
            if (source === 'hand') this.updatePlayerHandDisplay();
            else this.updatePlayerBoardDisplay();
            this.updatePlayerLifeDisplay();
        } else {
            if (source === 'hand') this.updateAIHandDisplay();
            else this.updateAIBoardDisplay();
            this.updateAILifeDisplay();
        }
        this.updateDeckDiscardDisplay();
        
        if (who === 'player' && source === 'board') {
            this.selectedBoardMana = [];
            this.updateComboPreview();
        }
    }

    handlePassDrawOption() {
        if (this.phase === 'reaction' || this.phase === 'reaction_request_active') {
            // Serve as "Pass Reaction" option!
            this.duelHistory.logMessage("Player passes Reaction Window.");
            if (this.phase === 'reaction_request_active') {
                this.phase = 'reaction_response';
                this.reactionResponseSpell = null;
                this.onlineManager.syncToFirebase('reaction_response');
                this.enablePlayerControls(false);
                this.duelHistory.logMessage('Reaction sent. Waiting for resolution...');
            } else {
                this.combat.resolveDefendingReaction(null);
            }
            return;
        }

        if (this.manaPlacedThisTurn || this.spellCastThisTurn) {
            this.duelHistory.logMessage("Player ends turn.");
            this.enablePlayerControls(false);
            this.time.delayedCall(450, () => {
                this.endTurn();
            });
            return;
        }

        this.duelHistory.logMessage("Player chooses Pass to Draw.");
        const extraCard = this.drawCard();
        if (extraCard) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (this.player.status.autoPlayDraw > 0 && this.player.board.length < 3) {
                this.player.board.push(extraCard);
                this.animateCardMovement(extraCard, 'deck', 'board', 'player');
                this.duelHistory.logMessage(`Player's drawn mana is auto-played to board!`);
            } else {
                this.player.hand.push(extraCard);
                this.animateCardMovement(extraCard, 'deck', 'hand', 'player');
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (this.player.status.loseManaOnDraw > 0 && this.player.hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * this.player.hand.length);
                const lost = this.player.hand.splice(lostIdx, 1)[0];
                this.sharedDiscard.push(lost);
                this.duelHistory.logMessage(`Player lost a hand mana from drawing!`);
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
        const spell = getSpellFromCombo(elements);

        if (!spell) {
            this.duelHistory.logMessage("Cannot cast: invalid combo selected.");
            return;
        }

        if (this.phase === 'reaction' || this.phase === 'reaction_request_active') {
            // Defender casting reaction
            this.selectedBoardMana.sort((a,b) => b-a);
            this.selectedBoardMana.forEach(idx => {
                const consumed = this.player.board.splice(idx, 1)[0];
                this.animateCardMovement(consumed, 'board', 'discard', 'player');
                this.sharedDiscard.push(consumed);
            });
            this.updatePlayerBoardDisplay();
            this.updateDeckDiscardDisplay();
            this.updatePlayerLifeDisplay();

            if (this.phase === 'reaction_request_active') {
                this.phase = 'reaction_response';
                this.reactionResponseSpell = spell;
                this.onlineManager.syncToFirebase('reaction_response');
                this.enablePlayerControls(false);
                this.duelHistory.logMessage('Reaction sent. Waiting for resolution...');
            } else {
                this.combat.resolveDefendingReaction(spell);
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
            this.animateCardMovement(consumed, 'board', 'discard', 'player');
            this.sharedDiscard.push(consumed);
        });

        this.updatePlayerBoardDisplay();
        this.updatePlayerLifeDisplay();
        this.updateDeckDiscardDisplay();

        this.selectedBoardMana = [];
        this.updateComboPreview();

        this.duelHistory.logMessage(`Player casts: ${spell.name}!`);

        // Visual spell fire from player center to AI center
        const w = this.scale.width;
        this.triggerSpellVisual(spell, w / 2 - 100, 500, w / 2 - 100, 100, () => {
            this.combat.initiateAttack('player', 'ai', spell);
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
                this.duelHistory.logMessage(`Chaos! ${attacker.toUpperCase()}'s spell targets themselves!`);
            }
        }
        
        // Status: Spell Fail Chance
        if (attChar.status.spellFailChance > 0) {
            if (Math.random() < 0.5) {
                this.duelHistory.logMessage(`${attacker.toUpperCase()}'s spell fizzled out!`);
                this.time.delayedCall(800, () => this.endTurn());
                return;
            }
        }

        // Synergy logic
        let isEmp = this.synergy.calculateSynergy(spell, cycle);

        let finalDmg = spell.damage;
        let finalShield = spell.shield;
        let finalDraw = spell.draw;
        let finalDrain = spell.drain;
        
        // Miss Chance Status
        if (attChar.status.missChance > 0 && finalDmg > 0) {
            if (Math.random() < 0.5) {
                finalDmg = 0;
                this.duelHistory.logMessage(`${attacker.toUpperCase()}'s attack missed!`);
            }
        }

        // Damage Immunity Status
        if (defChar.status.damageImmunity > 0) {
            finalDmg = 0;
            this.duelHistory.logMessage(`${defender.toUpperCase()} is immune to damage this round!`);
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
            if (spell.name === 'Billow') { this.duelHistory.logMessage('Top 3 cards cycled!'); for(let i=0;i<3;i++) { let d = this.sharedDeck.shift(); if(d) this.sharedDeck.push(d); } }
            if (spell.name === 'Vaporize') { this.duelHistory.logMessage('Top 3 cards destroyed!'); for(let i=0;i<3;i++) { let d = this.sharedDeck.shift(); if(d) this.sharedDiscard.push(d); } this.updateDeckDiscardDisplay(); }
            if (spell.name === 'Scour') { defChar.shield = 0; this.updateShieldDisplay(defender); this.duelHistory.logMessage(`${defender.toUpperCase()}'s shield scoured!`); }
        }

        // Force Cycle always triggers (not gated by isEmp)
        if (spell.synergyType === 'force_cycle') {
            const fcMap = { 'Tempest': 'air', 'Pillar': 'earth', 'Blaze': 'fire', 'Deluge': 'water' };
            const fcEl = fcMap[spell.name];
            if (fcEl) {
                this.cycleIndex = this.cycleElements.indexOf(fcEl);
                this.duelHistory.logMessage(`The Cycle is forced to ${fcEl.toUpperCase()}!`);
                this.cycleCenterText.setText(fcEl.toUpperCase());
                this.triggerCycleParticles(fcEl);
            }
        }

        // Apply self buffs immediately (like shields)
        if (finalShield > 0) {
            if (attChar.status.shieldDamageDebuff > 0) {
                this.forceDiscardRandom(attacker, 1);
                this.duelHistory.logMessage(`${attacker.toUpperCase()} takes 1 damage from unstable shield!`);
            }
            attChar.shield += finalShield;
            this.updateShieldDisplay(attacker);
            this.duelHistory.logMessage(`${attacker.toUpperCase()} gains ${finalShield} Shield.`);
        }

        // Draw logic
        if (finalDraw > 0) {
            for (let i = 0; i < finalDraw; i++) {
                const drawn = this.drawCard();
                if (drawn) {
                    if (attChar.status.autoPlayDraw > 0 && attChar.board.length < 3) {
                        attChar.board.push(drawn);
                        this.duelHistory.logMessage(`Auto-played drawn mana!`);
                    } else {
                        attChar.hand.push(drawn);
                    }
                    if (attChar.status.loseManaOnDraw > 0 && attChar.board.length > 0) {
                        this.sharedDiscard.push(attChar.board.pop());
                        this.duelHistory.logMessage(`${attacker.toUpperCase()} lost a board mana from drawing!`);
                    }
                }
            }
            this.updatePlayerHandDisplay(); this.updatePlayerBoardDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAIBoardDisplay(); this.updateAILifeDisplay();
        }
        
        // Drain logic is now deferred to after the reaction phase
        
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
        
        // Trigger reaction window if defender has active mana
        if (defChar.board.length > 0) {
            this.combat.startReactionPhase(attacker, defender, { ...spell, damage: finalDmg, bypassShield: false, drain: finalDrain });
        } else {
            // Direct hit
            if (finalDrain > 0) {
                this.forceDiscardRandom(defender, finalDrain, 'board');
            }
            
            if (finalDmg > 0) {
                if (defChar.status.retaliationDamage > 0) {
                    this.forceDiscardRandom(attacker, 1);
                    this.duelHistory.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
                }
                this.combat.applyDamage(defender, finalDmg, false);
            } else {
                // Done with spelling, auto-end turn after a slight delay
                this.time.delayedCall(800, () => {
                    if (this.pendingExtraAction) {
                        this.pendingExtraAction = false;
                        this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                        this.duelHistory.logMessage(`${this.turn.toUpperCase()} gets another action!`);
                        if (this.turn === 'player') {
                            this.phase = 'action';
                            this.enablePlayerControls(true);
                        } else {
                            this.aiAgent.runAITurn();
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

        this.duelHistory.logMessage(`Reaction window triggers for ${defender.toUpperCase()}!`);

        if (defender === 'player') {
            this.selectedBoardMana = [];
            this.updateComboPreview();
            this.enablePlayerControls(true);
        } else {
            if (this.mode === 'online') {
                this.duelHistory.logMessage('Waiting for opponent to react...');
                this.phase = 'reaction_request';
                this.onlineManager.syncToFirebase('reaction_request');
            } else {
                // AI Reaction automation
                this.time.delayedCall(1000, () => {
                    const reactionSpell = this.aiAgent.calculateAIReaction(incomingSpell.damage);
                    this.combat.resolveDefendingReaction(reactionSpell);
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
            this.duelHistory.logMessage(`${defender.toUpperCase()} casts reaction: ${reactionSpell.name}!`);

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
                this.duelHistory.logMessage(`${reactionSpell.name} is empowered by synergy!`);
            }

            // Apply reaction shield
            if (rShield > 0) {
                defChar.shield += rShield;
                this.updateShieldDisplay(defender);
                this.duelHistory.logMessage(`${defender.toUpperCase()} gains ${rShield} Reaction Shield.`);
            }

            // Counter damage check
            if (rDmg > 0) {
                this.duelHistory.logMessage(`Reaction deals ${rDmg} counter damage back!`);
                this.combat.applyDamage(attacker, rDmg);
            }
        } else {
            this.duelHistory.logMessage(`${defender.toUpperCase()} takes the direct hit.`);
        }

        // Retaliaton damage: fires when defender has retaliationDamage status
        if (defChar.status.retaliationDamage > 0) {
            this.forceDiscardRandom(attacker, 1);
            this.duelHistory.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
        }

        // Apply incoming damage minus final shield
        const finalDmg = this.reactionTargetSpell.damage;
        this.combat.applyDamage(defender, finalDmg, this.reactionTargetSpell.bypassShield || false);

        // Apply deferred drain
        if (this.reactionTargetSpell.drain > 0) {
            this.forceDiscardRandom(defender, this.reactionTargetSpell.drain, 'board');
        }
    }

    applyDamage(who, amount, bypassShield = false) {
        const char = who === 'player' ? this.player : this.ai;
        
        // Shield absorption (Lava Surge bypasses shields entirely)
        if (bypassShield) {
            this.duelHistory.logMessage(`Lava Surge bypasses ${who.toUpperCase()}'s shield!`);
        } else if (char.shield > 0) {
            if (char.shield >= amount) {
                char.shield -= amount;
                this.duelHistory.logMessage(`${who.toUpperCase()}'s shield absorbed all ${amount} DMG!`);
                amount = 0;
            } else {
                amount -= char.shield;
                this.duelHistory.logMessage(`${who.toUpperCase()}'s shield absorbed ${char.shield} DMG. ${amount} DMG passes through!`);
                char.shield = 0;
            }
            this.updateShieldDisplay(who);
        }

        // Clean giant fortress temporary shield
        if (who === 'player' && char.shield > 90) char.shield = 0;
        if (who === 'ai' && char.shield > 90) char.shield = 0;
        this.updateShieldDisplay(who);

        if (amount > 0) {
            this.duelHistory.logMessage(`${who.toUpperCase()} is hit for ${amount} DMG!`);
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
                    this.onlineManager.syncToFirebase('discard_request');
                    this.duelHistory.logMessage('Waiting for opponent to discard...');
                } else {
                    // AI automatically discards
                    this.aiAgent.runAIDiscardAutomation(amount);
                }
            }
        } else {
            // Attack completed without card losses
            this.time.delayedCall(800, () => {
                if (this.pendingExtraAction) {
                    this.pendingExtraAction = false;
                    this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                    this.duelHistory.logMessage(`${this.turn.toUpperCase()} gets another action!`);
                    if (this.turn === 'player') {
                        this.phase = 'action';
                        this.enablePlayerControls(true);
                    } else {
                        this.aiAgent.runAITurn();
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
            this.duelHistory.logMessage("Player is out of cards!");
            this.player.hand = [];
            this.player.board = [];
            this.updatePlayerHandDisplay();
            this.updatePlayerBoardDisplay();
            this.updatePlayerLifeDisplay();
            this.checkDefeatCondition('player');
            return;
        }

        this.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.cardsToDiscardCount} CARD(S)FROM HAND OR BOARD MANA`);
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

            this.animateCardMovement(discarded, zone, 'discard', 'player');
            this.sharedDiscard.push(discarded);
            this.updateDeckDiscardDisplay();
            this.updatePlayerLifeDisplay();

            this.cardsToDiscardCount--;
            this.playSound('fire');

            if (this.cardsToDiscardCount <= 0) {
                this.discardPromptText.setVisible(false);
                this.duelHistory.logMessage("Player finished discarding cards.");
                
                if (this.phase === 'discard_request_active') {
                    this.phase = 'discard_response';
                    this.onlineManager.syncToFirebase('discard_response');
                    this.enablePlayerControls(false);
                    this.duelHistory.logMessage('Waiting for turn resolution...');
                } else {
                    this.phase = 'action';
                    // End turn and rotate (or grant extra action)
                    this.time.delayedCall(600, () => {
                        if (this.pendingExtraAction) {
                            this.pendingExtraAction = false;
                            this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                            this.duelHistory.logMessage('Player gets another action!');
                            this.enablePlayerControls(true);
                        } else {
                            this.checkTurnContinuation();
                        }
                    });
                }
            } else {
                this.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.cardsToDiscardCount} CARD(S)FROM HAND OR BOARD MANA`);
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


    checkTurnContinuation() {
        if (this.turn === 'player' && (!this.manaPlacedThisTurn || !this.spellCastThisTurn)) {
            this.phase = 'action';
            this.enablePlayerControls(true);
        } else if (this.turn === 'ai' && (!this.manaPlacedThisTurn || !this.spellCastThisTurn)) {
            this.aiAgent.runAITurn();
        } else {
            this.endTurn();
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
        this.duelHistory.logMessage(`Online mode: you are the ${this.myRole.toUpperCase()}.`);
        this.duelHistory.logMessage(`Lobby: ${this.lobbyCode}`);

        if (this.myRole === 'host') {
            // Host initializes the game state
            this.initSharedDeck();
            this.dealStartingHands();

            // Write initial state to Firebase so guest can load it
            this.onlineManager.syncToFirebase('init');

            // Host goes first
            this.startTurn('player');
        }

        // Both host and guest listen for state changes
        this.onlineManager.startFirebaseListener();
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
            actionUsed: this.actionUsedThisTurn || false,
            manaPlacedThisTurn: this.manaPlacedThisTurn || false,
            spellCastThisTurn: this.spellCastThisTurn || false,
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
            const state = this.onlineManager.serializeState();
            const ref = firebase.database().ref(`lobbies/${this.lobbyCode}`);
            await ref.update({
                gameState: state,
                lastActionBy: this.myRole,
                status: this.phase === 'gameover' ? 'finished' : 'playing'
            });
        } catch (err) {
            console.error('[Whelmen Online] Sync error:', err);
            this.duelHistory.logMessage('⚠ Network sync error. Retrying...');
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
                this.duelHistory.logMessage('⚠ Opponent disconnected!');
                this.gameOverScreen.showDisconnectOverlay();
                return;
            }

            // Load the remote state
            this.onlineManager.loadFromFirebase(state);
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
        this.manaPlacedThisTurn = state.manaPlacedThisTurn || false;
        this.spellCastThisTurn = state.spellCastThisTurn || false;
        this.phase = state.phase || 'action';

        // Determine whose turn it is locally
        const isMyTurn = state.turn === myKey;
        this.turn = isMyTurn ? 'player' : 'ai';

        // Refresh all UI
        this.onlineManager.refreshAllUI();

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
            this.duelHistory.logMessage(`Reaction window triggers for you!`);
            this.selectedBoardMana = [];
            this.updateComboPreview();
            this.enablePlayerControls(true);
            return;
        }

        if (state.phase === 'reaction_response' && isMyTurn) {
            // We are the host and the guest responded
            this.phase = 'action'; // Reset phase internally
            const responseSpell = state.reactionResponseSpell || null;
            this.combat.resolveDefendingReaction(responseSpell);
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
                    this.duelHistory.logMessage('You get another action!');
                    this.enablePlayerControls(true);
                } else {
                    this.checkTurnContinuation();
                }
            });
            return;
        }

        // Normal Turn Logic
        if (isMyTurn) {
            this.duelHistory.logMessage("--- YOUR TURN ---");
            this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
            this.selectedBoardMana = [];
            this.updateComboPreview();
            this.enablePlayerControls(true);
            this.duelHistory.logMessage('It is your turn. Choose an action.');
        } else {
            this.enablePlayerControls(false);
            this.duelHistory.logMessage('Waiting for opponent...');
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
            this.onlineManager.cleanupOnline();
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


        return findSpellInMessage(msg);


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
        const totalHeight = this.duelHistory.getLogTotalHeight();
        
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
        this.duelHistory.updateScrollbar();
    }

    scrollDuelHistoryTo(targetY) {
        if (!this.logScrollContainer || !this.allLogTextLines || this.allLogTextLines.length === 0) return;
        
        const viewportHeight = 360;
        const totalHeight = this.duelHistory.getLogTotalHeight();
        
        if (totalHeight <= viewportHeight) {
            this.logScrollContainer.y = 0;
            this.duelHistory.updateScrollbar();
            return;
        }
        
        const minY = viewportHeight - totalHeight;
        const maxY = 0;
        
        if (targetY < minY) targetY = minY;
        if (targetY > maxY) targetY = maxY;
        
        this.logScrollContainer.y = targetY;
        this.duelHistory.updateScrollbar();
    }

    scrollDuelHistory(deltaY) {
        if (!this.logScrollContainer || !this.allLogTextLines || this.allLogTextLines.length === 0) return;
        
        // Scroll by 1 line height (26px) per tick
        const scrollAmount = -Math.sign(deltaY) * 26;
        this.duelHistory.scrollDuelHistoryTo(this.logScrollContainer.y + scrollAmount);
    }

    updateScrollbar() {
        if (!this.logScrollbarGraphics) return;
        
        this.logScrollbarGraphics.clear();
        
        const viewportHeight = 360;
        const totalHeight = this.duelHistory.getLogTotalHeight();
        
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

    animateCardMovement(element, fromStr, toStr, who = 'player', onComplete = null) {
        if (!element) {
            if (onComplete) onComplete();
            return;
        }
        
        if (toStr === 'hand') {
            if (who === 'player') this.playerIncomingHandCards = (this.playerIncomingHandCards || 0) + 1;
            else this.aiIncomingHandCards = (this.aiIncomingHandCards || 0) + 1;
        } else if (toStr === 'board') {
            if (who === 'player') this.playerIncomingBoardCards = (this.playerIncomingBoardCards || 0) + 1;
            else this.aiIncomingBoardCards = (this.aiIncomingBoardCards || 0) + 1;
        }
        
        const w = this.scale.width;
        const h = this.scale.height;
        
        const getZoneCoords = (zone, player) => {
            if (zone === 'deck') return { x: w / 2 - 180, y: h / 2 + 35 };
            if (zone === 'discard') return { x: w / 2 + 140, y: h / 2 + 35 };
            if (zone === 'hand') {
                const char = player === 'player' ? this.player : this.ai;
                const count = Math.max(0, char.hand.length - 1);
                return player === 'player' ? { x: 60 + count * 90, y: h - 115 } : { x: 60 + count * 60, y: 110 };
            }
            if (zone === 'board') {
                const char = player === 'player' ? this.player : this.ai;
                const count = Math.max(0, char.board.length - 1);
                return player === 'player' ? { x: w / 2 - 90 + count * 90, y: h / 2 + 120 } : { x: w / 2 - 90 + count * 90, y: h / 2 - 200 };
            }
            return { x: w / 2, y: h / 2 };
        };

        const start = getZoneCoords(fromStr, who);
        const end = getZoneCoords(toStr, who);

        const card = this.add.image(start.x, start.y, `card_${element}`)
            .setScale(0.8)
            .setDepth(3000);

        this.tweens.add({
            targets: card,
            x: end.x,
            y: end.y,
            duration: 400,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (toStr === 'hand') {
                    if (who === 'player') this.playerIncomingHandCards = Math.max(0, this.playerIncomingHandCards - 1);
                    else this.aiIncomingHandCards = Math.max(0, this.aiIncomingHandCards - 1);
                    if (who === 'player') this.updatePlayerHandDisplay();
                    else this.updateAIHandDisplay();
                } else if (toStr === 'board') {
                    if (who === 'player') this.playerIncomingBoardCards = Math.max(0, this.playerIncomingBoardCards - 1);
                    else this.aiIncomingBoardCards = Math.max(0, this.aiIncomingBoardCards - 1);
                    if (who === 'player') this.updatePlayerBoardDisplay();
                    else this.updateAIBoardDisplay();
                }

                if (onComplete) onComplete();
                card.destroy();
            }
        });
    }
}
