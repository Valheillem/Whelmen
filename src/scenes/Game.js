import { ELEMENT_COLORS, ELEMENT_HEX, isWeakenedByCycle } from '../data/ElementConstants.js';
import { getSpellFromCombo, findSpellInMessage, SPELLS } from '../data/SpellCatalog.js';
import { AudioSynthHelper } from '../audio/AudioSynthHelper.js';
import { SpellEffectsPlayer } from '../effects/SpellEffectsPlayer.js';
import { SynergySystem } from '../systems/SynergySystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { AIAgent } from '../systems/AIAgent.js';
import { ContestAIAgent } from '../systems/ContestAIAgent.js';
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
        this.lobbyPlayers = data?.players || null;
        this.firebaseUnsub = null;
        this.isOnlineInitialized = false;
        
        // Setup Player IDs
        if (this.mode === 'online' && this.lobbyPlayers) {
            this.playerIds = Object.values(this.lobbyPlayers).map(p => p.role).sort();
        } else if (this.mode === 'ai_contest') {
            this.playerIds = ['player', 'ai1', 'ai2', 'ai3'];
        } else {
            this.playerIds = ['player', 'ai'];
        }
        
        if (this.mode === 'test') {
            this.dummyMode = 'passive'; // 'passive' or 'active'
        }
    }

    getLocalPlayerId() {
        return this.mode === 'online' ? this.myRole : 'player';
    }

    toRoman(num) {
        if (num <= 0) return '';
        const lookup = {M:1000,CM:900,D:500,CD:400,C:100,XC:90,L:50,XL:40,X:10,IX:9,V:5,IV:4,I:1};
        let roman = '';
        for (let i in lookup) {
            while (num >= lookup[i]) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman;
    }

    preload() {
        this.load.image('icon_fire', 'assets/icons/Fire.png');
        this.load.image('icon_earth', 'assets/icons/Earth.png');
        this.load.image('icon_water', 'assets/icons/Water.png');
        this.load.image('icon_air', 'assets/icons/Air.png');
        this.load.image('game-bg', './assets/WHELMEN_background_horizontal.png');
        this.load.image('sigil', './assets/WHELMEN_sigil.png');

        // Preload Spell Effects Spritesheets (cleared — new assets will be added individually)
        this.spriteMeta = [
            { key: 'fire_arrow', w: 600, h: 320, f: 8 },
            { key: 'explosion_3', w: 496, h: 496, f: 8 },
            { key: 'earth_shield', w: 720, h: 720, f: 8 },
            { key: 'water1', w: 320, h: 180, f: 48 },
            { key: 'slash_sprite_cartoon_effects_2', w: 496, h: 496, f: 5 },
            { key: 'fire_spell', w: 640, h: 360, f: 8 },
            { key: 'earth_fissure', w: 800, h: 480, f: 8 },
            { key: 'wind_spell', w: 640, h: 360, f: 12 },
            { key: 'water6', w: 450, h: 300, f: 12 },
            { key: 'flame4', w: 339, h: 404, f: 53 },
            { key: 'magic2', w: 496, h: 496, f: 6 },
            { key: 'slash_7', w: 496, h: 496, f: 10 },
            { key: 'water_shield', w: 720, h: 720, f: 8 },
            { key: 'typhoon', w: 800, h: 800, f: 12 },
            { key: 'ground_hit', w: 1200, h: 800, f: 8 },
            { key: 'leaf_shield', w: 720, h: 720, f: 16 }
        ];
        
        this.spriteMeta.forEach(meta => {
            this.load.spritesheet(meta.key, `assets/spritesheets/${meta.key}.png`, { frameWidth: meta.w, frameHeight: meta.h });
        });
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

        // Register Spell Animations
        if (this.spriteMeta) {
            this.spriteMeta.forEach(meta => {
                if (!this.anims.exists(`anim_${meta.key}`)) {
                    // Only projectiles that travel across the screen should loop infinitely
                    const isLooping = meta.key.includes('ball') || meta.key.includes('arrow') || meta.key.includes('spell') || meta.key.includes('shield') || meta.key === 'typhoon';
                    this.anims.create({
                        key: `anim_${meta.key}`,
                        frames: this.anims.generateFrameNumbers(meta.key, { start: 0, end: meta.f - 1 }),
                        frameRate: 15,
                        repeat: isLooping ? -1 : 0,
                        hideOnComplete: !isLooping
                    });
                }
            });
        }

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
        this.contestAiAgent = new ContestAIAgent(this);
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
        this.turn = this.playerIds[0]; // First player starts
        this.round = 1; // Round 1 starts
        this.phase = 'action'; // Starting action phase
        this.manaPlacedThisTurn = false; this.spellCastThisTurn = false; // Player can do 1 action per turn

        this.players = {};
        for (let pid of this.playerIds) {
            this.players[pid] = {
                hand: [],
                board: [],
                shield: 0,
                life: 8,
                maxHand: 8,
                consecutiveDiscards: 0,
                shieldG: null,
                shieldT: null,
                steamDebuff: false,
                status: { bonusManaPlays: 0, loseManaOnDraw: 0, shieldDamageDebuff: 0, missChance: 0, autoPlayDraw: 0, everyoneDraw3: 0, discardReplaceHand: 0, rotateHands: 0, damageImmunity: 0, randomTargeting: 0, manaPlayDamage: 0, extraDrawIfShield: 0, bonusSpellPlays: 0, redrawMana: 0, oppManaPlayDamage: 0, retaliationDamage: 0, noDrawDebuff: 0, oppDraw4: 0, spellFailChance: 0, shieldFailChance: 0, oppSpellReflect: 0, drainFailChance: 0, rotateShields: 0 }
            };
        }
        
        // For backwards compatibility in other modules until refactored:
        Object.defineProperty(this, 'player', { configurable: true, get: () => this.players[this.getLocalPlayerId()] });
        Object.defineProperty(this, 'ai', { configurable: true, get: () => { const local = this.getLocalPlayerId(); const oppId = this.playerIds.find(p => p !== local) || this.playerIds[1]; return this.players[oppId]; }});

        // Spells Selected by player for casting
        this.selectedBoardMana = [];
        this.pendingExtraAction = false;

        // Particles
        this.setupParticles();

        // Drawing fields FIRST (UI must exist before game logic references it)
        this.duelHistory.drawActionLog();

        
        this.drawCycleIndicator();
        this.drawAllStats();
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
            this.playerIds.forEach(pid => {
                this.players[pid].hand.push(this.drawCard(true));
            });
        }
        this.playerIds.forEach(pid => {
            this.updatePlayerHandDisplay(pid);
            this.updatePlayerLifeDisplay(pid);
        });
    }

    // --- STATE MACHINE TURNS ---
    startTurn(who) {
        this.turn = who;
        let char = this.players[who];
        
        this.updateTurnHighlights();

        // C17 fix: decrement THIS player's status counters at the start of their own turn.
        // Previously this happened in startRound() for ALL players at once, which was unfair
        // (the first player's statuses lasted longer than the last player's).
        for (let k in char.status) {
            if (char.status[k] > 0) char.status[k]--;
        }

        // Apply start of turn effects AFTER decrementing
        if (char.status.everyoneDraw3 > 0) {
            for(let i=0;i<3;i++) { 
                this.playerIds.forEach(pid => {
                    let d = this.drawCard(); 
                    if(d) this.players[pid].hand.push(d);
                });
            }
            this.duelHistory.logMessage("Everyone draws 3 mana!");
            this.playerIds.forEach(pid => this.players[pid].status.everyoneDraw3 = 0);
            this.playerIds.forEach(pid => {
                this.updatePlayerHandDisplay(pid); 
                this.updatePlayerLifeDisplay(pid);
            });
        }
        
        if (char.status.discardReplaceHand > 0) {
            this.playerIds.forEach(pid => {
                let pChar = this.players[pid];
                let count = pChar.hand.length;
                while(pChar.hand.length > 0) this.sharedDiscard.push(pChar.hand.pop());
                for(let i=0;i<count;i++) { let d = this.drawCard(); if(d) pChar.hand.push(d); }
                pChar.status.discardReplaceHand = 0;
                this.updatePlayerHandDisplay(pid); 
                this.updatePlayerLifeDisplay(pid);
            });
            this.duelHistory.logMessage("Hands were discarded and replaced!");
        }

        if (char.status.rotateHands > 0) {
            // Rotate hands clockwise
            const firstHand = [...this.players[this.playerIds[0]].hand];
            for (let i = 0; i < this.playerIds.length - 1; i++) {
                this.players[this.playerIds[i]].hand = [...this.players[this.playerIds[i+1]].hand];
            }
            this.players[this.playerIds[this.playerIds.length - 1]].hand = firstHand;
            
            this.playerIds.forEach(pid => {
                this.players[pid].status.rotateHands = 0;
                this.updatePlayerHandDisplay(pid);
                this.updatePlayerLifeDisplay(pid);
            });
            this.duelHistory.logMessage("Hands were rotated!");
        }
        
        if (char.status.oppDraw4 > 0) {
            for(let i=0;i<4;i++) { let d = this.drawCard(); if(d) char.hand.push(d); }
            char.status.oppDraw4 = 0;
            this.duelHistory.logMessage(`${who.toUpperCase()} is flooded with 4 extra mana!`);
            this.updatePlayerHandDisplay(who); this.updatePlayerLifeDisplay(who);
        }
        
        if (char.status.extraDrawIfShield > 0 && char.shield > 0) {
            let d = this.drawCard(); if(d) char.hand.push(d);
            this.duelHistory.logMessage(`${who.toUpperCase()} draws extra mana from Shield!`);
            this.updatePlayerHandDisplay(who); this.updatePlayerLifeDisplay(who);
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
            this.updatePlayerHandDisplay(who); this.updatePlayerLifeDisplay(who);
        }
        
        this.phase = 'action';
        this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
        this.selectedBoardMana = [];
        this.updateComboPreview();

        const isLocal = who === this.getLocalPlayerId();
        const displayName = (this.mode === 'online' && isLocal) ? 'YOUR' : who.toUpperCase() + "'S";
        // Turn announcement removed per request

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

            if (who === this.getLocalPlayerId()) {
                this.updatePlayerHandDisplay(this.getLocalPlayerId());
                this.updatePlayerBoardDisplay(this.getLocalPlayerId());
                this.updatePlayerLifeDisplay(this.getLocalPlayerId());
            } else {
                this.updatePlayerHandDisplay((this.playerIds.find(p => p !== (this.getLocalPlayerId())) || this.playerIds[1]));
                this.updatePlayerBoardDisplay((this.playerIds.find(p => p !== (this.getLocalPlayerId())) || this.playerIds[1]));
                this.updatePlayerLifeDisplay((this.playerIds.find(p => p !== (this.getLocalPlayerId())) || this.playerIds[1]));
            }
        }

        // Toggle action controls
        if (who === this.getLocalPlayerId()) {
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
            } else if (this.mode === 'ai_contest') {
                this.time.delayedCall(1200, () => {
                    this.contestAiAgent.runAITurn(this.turn);
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
        const alivePlayers = this.playerIds.filter(pid => this.players[pid].hand.length > 0 || this.players[pid].board.length > 0);

        // Aegis: Rotate Shields (round-level event — stays here)
        if (alivePlayers.some(pid => this.players[pid].status.rotateShields > 0)) {
            // Rotate clockwise
            const firstShield = this.players[alivePlayers[0]].shield;
            for (let i = 0; i < alivePlayers.length - 1; i++) {
                this.players[alivePlayers[i]].shield = this.players[alivePlayers[i+1]].shield;
            }
            this.players[alivePlayers[alivePlayers.length - 1]].shield = firstShield;
            
            alivePlayers.forEach(pid => this.players[pid].status.rotateShields = 0);
            this.duelHistory.logMessage("Aegis rotates the Shields clockwise!");
        }
        // C17 fix: per-player status decrements moved to startTurn() so each player's
        // status expires relative to their own turn, not the global round boundary.
    }

    endTurn() {
        // Rotate Cycle
        this.rotateCycle();

        // Enforce hand limit cleanup (can still loop over playerIds since it just caps arrays)
        this.playerIds.forEach(pid => {
            this.cleanupHandLimit(pid);
        });

        // Check defeat
        this.playerIds.forEach(pid => {
            if (this.checkDefeatCondition(pid)) {
                // Logged inside checkDefeatCondition
            }
        });
        
        const alivePlayers = this.playerIds.filter(pid => this.players[pid].hand.length > 0 || this.players[pid].board.length > 0);
        
        if (alivePlayers.length <= 1) {
            this.phase = 'gameover';
            this.enablePlayerControls(false);
            if (alivePlayers.length === 1) {
                const winner = alivePlayers[0];
                this.gameOverScreen.showGameOver(winner === (this.getLocalPlayerId()) ? 'VICTORY' : 'DEFEAT');
            } else {
                this.gameOverScreen.showGameOver('DEFEAT'); // Draw/All dead
            }
            if (this.mode === 'online') {
                this.onlineManager.syncToFirebase('gameover');
            }
            return;
        }

        // Toggle turn (skipping dead players)
        let currentIndex = this.playerIds.indexOf(this.turn);
        let nextIndex = currentIndex + 1;

        while (true) {
            if (nextIndex >= this.playerIds.length) {
                nextIndex = 0;
                this.time.delayedCall(400, () => {
                this.round++;
                if (this.roundText) this.roundText.setText(`ROUND ${this.round}`);
                if (this.cycleRoundText) this.cycleRoundText.setText(this.toRoman(this.round));
                this.duelHistory.logMessage(`=== ROUND ${this.round} ===`);
                this.startRound();
            });
            }
            const nextTurn = this.playerIds[nextIndex];
            const char = this.players[nextTurn];
            if ((char.hand.length + char.board.length) > 0) {
                break; // Found the next alive player
            }
            nextIndex++;
        }

        const nextTurn = this.playerIds[nextIndex];
        this.startTurn(nextTurn);

        // ONLINE: sync state to Firebase AFTER transitioning to opponent's turn.
        // This ensures the opponent's newly drawn card and correct turn flag are synced.
        // C2 fix: in online mode, this.turn holds 'host'/'guest' role keys, never 'ai'
        if (this.mode === 'online' && this.turn !== this.myRole) {
            this.onlineManager.syncToFirebase('endTurn');
        }
    }

    cleanupHandLimit(pid) {
        const char = this.players[pid];
        if (char.hand.length > char.maxHand) {
            const discardCount = char.hand.length - char.maxHand;
            this.duelHistory.logMessage(`${pid.toUpperCase()} discards ${discardCount} card(s) to match Hand Limit.`);
            for (let i = 0; i < discardCount; i++) {
                const discarded = char.hand.pop();
                this.sharedDiscard.push(discarded);
            }
            if (this.turn === pid) {
                char.consecutiveDiscards++;
                if (char.consecutiveDiscards >= 2) {
                    char.maxHand = Math.max(1, char.maxHand - 1);
                    char.consecutiveDiscards = 0;
                    this.duelHistory.logMessage(`OVERWHELMED! ${pid.toUpperCase()}'s Max Hand Size decreases by 1!`);
                    this.playSound('damage');
                }
            }
            this.updatePlayerHandDisplay(pid);
            this.updatePlayerLifeDisplay(pid);
            this.updateDeckDiscardDisplay();
        } else {
            if (this.turn === pid) {
                char.consecutiveDiscards = 0;
            }
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
        const char = this.players[who];
        if (char.isEliminated) return true;

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

            // C3 fix: Don't immediately call showGameOver here — that was premature in FFA
            // (ai_contest) where multiple players can still be alive. Just log elimination
            // and return true; endTurn() already handles the final win check via
            // `this.playerIds.length <= 1` after filtering out dead players.
            char.isEliminated = true;
            const localId = this.getLocalPlayerId();
            if (who === localId) {
                this.duelHistory.logMessage(`--- YOU HAVE BEEN ELIMINATED ---`);
            } else {
                this.duelHistory.logMessage(`--- ${who.toUpperCase()} HAS BEEN ELIMINATED ---`);
            }
            return true;
        }
        return false;
    }

    // --- RENDER VISUAL LAYOUT ---
    setupParticles() {
        this.spellEffects.setupParticles();
    }

    triggerSpellCastAnimation(spell, startX, startY, onComplete) {
        this.spellEffects.playCastAnimation(spell, startX, startY, onComplete);
    }

    fireSpellProjectiles(attackerId, defenderId, attackerSpell, defenderSpell, drainTargets, onComplete) {
        const w = this.scale.width;
        const h = this.scale.height;

        let completed = 0;
        let expected = 0;

        const checkDone = () => {
            completed++;
            if (completed >= expected && onComplete) onComplete();
        };

        const getPos = (id) => {
            if (id === this.getLocalPlayerId()) return { x: w / 2, y: h - 50, avatarX: w / 2, avatarY: h - 150 };
            const targetPos = this.getPlayerPositionIndex(id);
            if (targetPos === 1) return { x: 50, y: h / 2, avatarX: 100, avatarY: h / 2 };
            if (targetPos === 2) return { x: w / 2, y: 50, avatarX: w / 2, avatarY: 150 };
            if (targetPos === 3) return { x: w - 50, y: h / 2, avatarX: w - 100, avatarY: h / 2 };
            return { x: w / 2, y: h / 2, avatarX: w / 2, avatarY: h / 2 }; 
        };

        const attPos = getPos(attackerId);
        const defPos = getPos(defenderId);

        if (attackerSpell) {
            let tx = defPos.avatarX;
            let ty = defPos.avatarY;
            if (drainTargets && drainTargets.length > 0) {
                expected += drainTargets.length;
                drainTargets.forEach(elementStr => {
                    let targetX = defPos.x;
                    let targetY = defPos.y;
                    
                    const defChar = this.players[defenderId];
                    if (defChar) {
                        const uniqueElements = [...new Set(defChar.board)];
                        const elIndex = uniqueElements.indexOf(elementStr);
                        if (elIndex !== -1) {
                            const centerX = w / 2 - 20;
                            const centerY = h / 2 - 40;
                            const spaceX = 75;
                            const pos = this.getPlayerPositionIndex(defenderId);
                            
                            if (pos === 0) {
                                targetX = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                                targetY = centerY + 180;
                            } else if (pos === 1) {
                                targetX = centerX - 250;
                                targetY = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                            } else if (pos === 2) {
                                targetX = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                                targetY = centerY - 180;
                            } else if (pos === 3) {
                                targetX = centerX + 250;
                                targetY = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                            }
                        }
                    }
                    this.spellEffects.playProjectileAndImpact(attackerSpell, attPos.x, attPos.y, targetX, targetY, checkDone);
                });
            } else {
                expected++;
                let sx = attPos.x;
                let sy = attPos.y;
                if (attackerSpell.damage === 0 && attackerSpell.drain === 0 && attackerSpell.name !== 'Scour' && attackerSpell.name !== 'Hurricane') {
                    tx = attPos.avatarX;
                    ty = attPos.avatarY;
                    sx = tx;
                    sy = ty;
                }
                this.spellEffects.playProjectileAndImpact(attackerSpell, sx, sy, tx, ty, checkDone);
            }
        }

        if (defenderSpell) {
            expected++;
            let tx = attPos.avatarX;
            let ty = attPos.avatarY;
            let sx = defPos.x;
            let sy = defPos.y;
            if (defenderSpell.damage === 0 && defenderSpell.drain === 0 && defenderSpell.name !== 'Scour' && defenderSpell.name !== 'Hurricane') {
                tx = defPos.avatarX;
                ty = defPos.avatarY;
                sx = tx;
                sy = ty;
            }
            this.spellEffects.playProjectileAndImpact(defenderSpell, sx, sy, tx, ty, checkDone);
        }

        if (expected === 0 && onComplete) onComplete();
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
            { x: 0, y: -60, color: 0xdf1b2d, icon: 'icon_fire', label: 'FIRE' },
            { x: 60, y: 0, color: 0xa67032, icon: 'icon_earth', label: 'EARTH' },
            { x: 0, y: 60, color: 0xbf8cff, icon: 'icon_air', label: 'AIR' },
            { x: -60, y: 0, color: 0x1084e9, icon: 'icon_water', label: 'WATER' }
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

        // Center round indicator (roman numeral)
        this.cycleRoundText = this.add.text(w / 2 - 20, h / 2 - 40, this.toRoman(this.round), {
            fontFamily: '"Cinzel", serif',
            fontSize: '48px',
            fontWeight: '800',
            color: '#1a1a1a',
            stroke: '#d4af37',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(20);
        // (Not added to cycleContainer so it doesn't spin)

        this.updateCycleDisplayColor(this.cycleElements[this.cycleIndex]);
    }

    updateCycleDisplayColor(element) {
        if (!this.bgSigil) return;

        const color = element === 'fire' ? 0xdf1b2d :
                      element === 'water' ? 0x257ee4 :
                      element === 'earth' ? 0x4db15b :
                      element === 'air' ? 0x9247d5 : 0x4a4a4a; // neutral fallback
        this.bgSigil.setTintFill(color);
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


    getPlayerPositionIndex(pid) {
        const localId = this.getLocalPlayerId();
        if (pid === localId) return 0;
        
        let localIdx = this.playerIds.indexOf(localId);
        if (localIdx === -1) localIdx = 0; // Fallback
        let pidIdx = this.playerIds.indexOf(pid);
        
        // Return 0 for bottom, 1 for left, 2 for top, 3 for right
        let diff = (pidIdx - localIdx + this.playerIds.length) % this.playerIds.length;
        if (this.playerIds.length === 2 && diff === 1) return 2; // In 1v1, opponent is top
        return diff;
    }

    drawAllStats() {
        const w = this.scale.width;
        const h = this.scale.height;
        this.playerGroups = {};

        this.playerIds.forEach(pid => {
            const char = this.players[pid];
            const pos = this.getPlayerPositionIndex(pid);
            
            let containerX = 0, containerY = 0;
            if (pos === 0) { containerX = w / 2 - 20; containerY = h - 200; } // Bottom
            else if (pos === 1) { containerX = 40; containerY = h / 2 - 50; } // Left
            else if (pos === 2) { containerX = w / 2 - 20; containerY = 30; } // Top (mirrors bottom)
            else if (pos === 3) { containerX = w - 120; containerY = h / 2 - 50; } // Right

            const zone = this.add.container(containerX, containerY);
            
            char.shieldG = this.add.graphics();
            zone.add(char.shieldG);

            char.shieldT = this.add.text(0, 0, '', {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '16px',
                fontWeight: '700',
                color: '#a67032'
            });
            zone.add(char.shieldT);

            // Name highlight
            char.nameHighlightG = this.add.graphics();
            zone.add(char.nameHighlightG);
            
            const isLocal = pos === 0;
            const displayName = isLocal ? '' : `PLAYER ${pid}`;
            let nx = 0, ny = 0;
            if (pos === 0) { nx = 0; ny = 0; }
            else if (pos === 1) { nx = -20; ny = -150; }
            else if (pos === 2) { nx = -230; ny = 10; }
            else if (pos === 3) { nx = 30; ny = -150; }

            char.nameT = this.add.text(nx, ny, displayName, {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '18px',
                fontWeight: '800',
                color: '#ffffff'
            });
            
            zone.add(char.nameT);

            this.playerGroups[pid] = { zone: zone, handGroup: null, boardGroup: null };
        });
    }

    updateTurnHighlights() {
        if (!this.turnIndicatorG) {
            this.turnIndicatorG = this.add.graphics();
            this.turnIndicatorG.setDepth(15);
        }
        this.turnIndicatorG.clear();

        this.playerIds.forEach(pid => {
            const char = this.players[pid];
            const pos = this.getPlayerPositionIndex(pid);
            char.nameHighlightG.clear();
            
            if (this.turn === pid) {
                // Don't draw the highlight box for the local player, as they don't have a visible name text
                if (pos !== 0) {
                    char.nameHighlightG.fillStyle(0xd4af37, 0.4);
                    char.nameHighlightG.fillRoundedRect(char.nameT.x - 10, char.nameT.y - 10, char.nameT.width + 20, char.nameT.height + 20, 6);
                }

                // Draw cardinal direction indicator pointing to the active player
                const cx = this.scale.width / 2 - 20;
                const cy = this.scale.height / 2 - 40;
                let angle = 0;
                if (pos === 0) angle = Math.PI / 2; // Bottom (South)
                else if (pos === 1) angle = Math.PI; // Left (West)
                else if (pos === 2) angle = -Math.PI / 2; // Top (North)
                else if (pos === 3) angle = 0; // Right (East)

                this.turnIndicatorG.fillStyle(0xd4af37, 0.9);
                const radius = 95; // Just outside the element ring
                const tx = cx + Math.cos(angle) * radius;
                const ty = cy + Math.sin(angle) * radius;
                
                const back = radius - 18;
                const bx = cx + Math.cos(angle) * back;
                const by = cy + Math.sin(angle) * back;
                const perpX = Math.cos(angle + Math.PI/2) * 12;
                const perpY = Math.sin(angle + Math.PI/2) * 12;
                
                this.turnIndicatorG.fillTriangle(tx, ty, bx + perpX, by + perpY, bx - perpX, by - perpY);
            }
        });
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
                this.cleanupOnline(); // C1 fix: was stopFirebaseListener() which doesn't exist
            }
            this.scene.start('Start');
        });
    }



    updatePlayerLifeDisplay(pid) {
        if (!pid) return;
        const char = this.players[pid];
        char.life = char.hand.length + char.board.length;
    }

    updateShieldDisplay(pid) {
        if (!pid) return;
        const char = this.players[pid];
        if (!char.shieldG) return;
        char.shieldG.clear();
        if (char.shield > 0) {
            char.shieldG.fillStyle(0xa67032, 0.15);
            char.shieldG.lineStyle(2, 0xa67032, 0.7);
            
            const pos = this.getPlayerPositionIndex(pid);
            let sx = 0, sy = 0;
            if (pos === 0) { sx = -70; sy = 170; }
            else if (pos === 1) { sx = 120; sy = -150; }
            else if (pos === 2) { sx = -240; sy = 35; }
            else if (pos === 3) { sx = -120; sy = -150; }

            char.shieldG.fillRoundedRect(sx, sy, 140, 24, 6);
            char.shieldG.strokeRoundedRect(sx, sy, 140, 24, 6);
            char.shieldT.setPosition(sx + 10, sy + 4);
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
        
        this.primedSpellPanel = this.add.container(w - 550, h - 180).setVisible(false);
        
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
        this.incomingSpellPanel = this.add.container(w - 550, h - 330).setVisible(false);
        
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
        const btnHowToPlayTop = this.add.text(w - 150, 25, 'HOW TO PLAY', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '16px',
            fontWeight: '600',
            color: '#ffffff',
            backgroundColor: 'rgba(13,11,28,0.85)',
            padding: { left: 8, right: 8, top: 4, bottom: 4 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
        btnHowToPlayTop.on('pointerover', () => { btnHowToPlayTop.setColor('#000000'); btnHowToPlayTop.setBackgroundColor('#ffffff'); });
        btnHowToPlayTop.on('pointerout', () => { btnHowToPlayTop.setColor('#ffffff'); btnHowToPlayTop.setBackgroundColor('rgba(13,11,28,0.85)'); });
        btnHowToPlayTop.on('pointerdown', () => this.handleHowToPlayOption());
        btnHowToPlayTop.setEnabled = function(enabled) {
            if (enabled) {
                this.setAlpha(1);
                this.setInteractive();
            } else {
                this.setAlpha(0.5);
                this.disableInteractive();
            }
        };
        this.btnHowToPlay = btnHowToPlayTop;

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
            this.btnCastSpell.setEnabled(this.selectedBoardMana.length > 0 && this.selectedBoardMana.length <= 3);
            this.btnPassDraw.setText('PASS REACTION');
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
                    const viewportHeight = 180;
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
                const viewportHeight = 180;
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
        const viewportHeight = 180;
        if (totalHeight > viewportHeight) {
            this.logScrollContainer.y = viewportHeight - totalHeight;
        } else {
            this.logScrollContainer.y = 0;
        }
        this.duelHistory.updateScrollbar();
    }

    // --- CARD HAND RENDERING ---
    updatePlayerHandDisplay(pid) {
        if (!pid) return;
        const char = this.players[pid];
        const pos = this.getPlayerPositionIndex(pid);
        const pGroup = this.playerGroups[pid];
        
        if (pGroup.handGroup) {
            pGroup.handGroup.destroy(true);
        }

        pGroup.handGroup = this.add.group();
        const startX = 60;
        const spaceX = pos === 0 ? 55 : 40;

        const count = char.hand.length;
        const totalW = Math.max(0, (count - 1) * spaceX);
        const middle = (count - 1) / 2;
        const curveAmount = 4;
        const rotAmount = 3;

        char.hand.forEach((el, index) => {
            const t = index - middle;
            const curveY = Math.abs(t) * Math.abs(t) * curveAmount;
            const rotDeg = t * rotAmount;

            let x = 0, y = 0, angle = 0;
            if (pos === 0) {
                const startX = 0;
                x = startX - totalW / 2 + index * spaceX;
                y = 90 + curveY;
                angle = rotDeg;
            } else if (pos === 2) {
                x = -totalW / 2 + index * spaceX;
                y = 20 - curveY;
                angle = 180 - rotDeg;
            } else if (pos === 1) {
                y = -totalW / 2 + index * spaceX;
                x = 30 - curveY;
                angle = 90 + rotDeg;
            } else if (pos === 3) {
                y = -totalW / 2 + index * spaceX;
                x = 50 + curveY;
                angle = -90 - rotDeg;
            }

            const isLocal = pid === (this.getLocalPlayerId());
            const tex = isLocal ? `card_${el}` : 'card_back';
            const scaleAmt = isLocal ? 0.8 : 0.55;

            const cardObj = this.add.image(x, y, tex).setScale(scaleAmt).setAngle(angle);

            if (isLocal) {
                cardObj.setInteractive({ useHandCursor: true, draggable: true });
                const incoming = this.playerIncomingHandCards || 0;
                if (index >= char.hand.length - incoming) {
                    cardObj.setAlpha(0);
                }

                cardObj.on('pointerdown', () => {
                    if (this.phase === 'discard' || this.phase === 'discard_request_active') {
                        this.discardCardFromZone('hand', index, pid);
                    }
                });

                cardObj.on('dragstart', (pointer, dragX, dragY) => {
                    if (this.phase === 'action' && !this.manaPlacedThisTurn && this.turn === pid) {
                        cardObj.setData('isDragging', true);
                        cardObj.setData('origX', cardObj.x);
                        cardObj.setData('origY', cardObj.y);
                        cardObj.setData('origAngle', cardObj.angle);
                        cardObj.setData('origDepth', cardObj.depth);
                        cardObj.setDepth(100);
                        cardObj.setAngle(0);
                    }
                });

                cardObj.on('drag', (pointer, dragX, dragY) => {
                    if (cardObj.getData('isDragging')) {
                        cardObj.x = dragX;
                        cardObj.y = dragY;
                    }
                });

                cardObj.on('dragend', (pointer, dragX, dragY) => {
                    if (cardObj.getData('isDragging')) {
                        cardObj.setData('isDragging', false);
                        const w = this.scale.width;
                        const h = this.scale.height;
                        const sigilX = w / 2 - 20;
                        const sigilY = h / 2 - 40;
                        
                        // Use pointer.x and pointer.y (world coordinates) instead of cardObj.x/y (local container coordinates)
                        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, sigilX, sigilY);
                        
                        if (dist < 180) {
                            this.playHandCardToBoard(index);
                        } else {
                            cardObj.setDepth(cardObj.getData('origDepth'));
                            this.tweens.add({
                                targets: cardObj,
                                x: cardObj.getData('origX'),
                                y: cardObj.getData('origY'),
                                angle: cardObj.getData('origAngle'),
                                scaleX: 0.8,
                                scaleY: 0.8,
                                duration: 250,
                                ease: 'Back.easeOut'
                            });
                        }
                    }
                });

                cardObj.on('pointerover', () => {
                    if (cardObj.getData('isDragging')) return;
                    this.playSound('click');
                    this.tweens.add({
                        targets: cardObj,
                        y: y - 30,
                        scaleX: 0.88,
                        scaleY: 0.88,
                        duration: 100,
                        ease: 'Quad.easeOut'
                    });
                });

                cardObj.on('pointerout', () => {
                    if (cardObj.getData('isDragging')) return;
                    this.tweens.add({
                        targets: cardObj,
                        y: y,
                        scaleX: 0.8,
                        scaleY: 0.8,
                        duration: 100,
                        ease: 'Quad.easeOut'
                    });
                });
            }

            pGroup.zone.add(cardObj);
            pGroup.handGroup.add(cardObj);
        });
    }


    // --- BOARD MANA DISPLAY ---
    updatePlayerBoardDisplay(pid) {
        if (!pid) return;
        const char = this.players[pid];
        const pos = this.getPlayerPositionIndex(pid);
        const pGroup = this.playerGroups[pid];
        
        if (pGroup.boardGroup) {
            pGroup.boardGroup.destroy(true);
        }

        pGroup.boardGroup = this.add.group();

        const w = this.scale.width;
        const h = this.scale.height;
        const centerX = w / 2 - 20;
        const centerY = h / 2 - 40;

        const uniqueElements = [...new Set(char.board)];
        const spaceX = 75;

        uniqueElements.forEach((el, elIndex) => {
            const count = char.board.filter(b => b === el).length;
            const indicesForEl = [];
            char.board.forEach((bEl, i) => { if (bEl === el) indicesForEl.push(i); });

            let x = 0, y = 0, angle = 0;
            if (pos === 0) {
                x = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                y = centerY + 180;
                angle = 0;
            } else if (pos === 1) {
                x = centerX - 250;
                y = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                angle = 90;
            } else if (pos === 2) {
                x = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                y = centerY - 180;
                angle = 180;
            } else if (pos === 3) {
                x = centerX + 250;
                y = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                angle = -90;
            }

            const cardObj = this.add.image(x, y, `card_${el}`).setScale(0.8).setAngle(angle);

            let badgeBg, badgeTxt;
            if (count > 1) {
                let bx = x + 25, by = y - 35;
                if (pos === 1) { bx = x + 35; by = y + 25; }
                else if (pos === 2) { bx = x - 25; by = y + 35; }
                else if (pos === 3) { bx = x - 35; by = y - 25; }

                badgeBg = this.add.circle(bx, by, 12, 0xff0000).setDepth(10);
                badgeTxt = this.add.text(bx, by, count.toString(), {
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#ffffff'
                }).setOrigin(0.5).setDepth(11);
            }

            const isLocal = pid === (this.getLocalPlayerId());
            if (isLocal) {
                cardObj.setInteractive({ useHandCursor: true });
                const selectedCount = indicesForEl.filter(i => this.selectedBoardMana.includes(i)).length;
                if (selectedCount > 0) {
                    cardObj.setTint(selectedCount === count ? 0x88ff88 : 0xffff88);
                    if (pos === 0) cardObj.y -= 15;
                    else if (pos === 1) cardObj.x -= 15;
                    else if (pos === 2) cardObj.y += 15;
                    else if (pos === 3) cardObj.x += 15;
                    
                    if (badgeBg) {
                        if (pos === 0) { badgeBg.y -= 15; badgeTxt.y -= 15; }
                        else if (pos === 1) { badgeBg.x -= 15; badgeTxt.x -= 15; }
                        else if (pos === 2) { badgeBg.y += 15; badgeTxt.y += 15; }
                        else if (pos === 3) { badgeBg.x += 15; badgeTxt.x += 15; }
                    }
                }

                cardObj.on('pointerdown', () => {
                    if (this.phase === 'discard' || this.phase === 'discard_request_active') {
                        this.discardCardFromZone('board', indicesForEl[0], pid);
                    } else if ((this.phase === 'action' && this.turn === pid) || this.phase === 'reaction' || this.phase === 'reaction_request_active') {
                        if (selectedCount < count) {
                            const toSelect = indicesForEl.find(i => !this.selectedBoardMana.includes(i));
                            this.selectedBoardMana.push(toSelect);
                        } else {
                            indicesForEl.forEach(i => {
                                const idx = this.selectedBoardMana.indexOf(i);
                                if (idx > -1) this.selectedBoardMana.splice(idx, 1);
                            });
                        }
                        this.updatePlayerBoardDisplay(pid);
                        this.updateComboPreview();
                        this.enablePlayerControls(true);
                    }
                });
            }

            // DO NOT ADD TO pGroup.zone because we are using global center coordinates!
            pGroup.boardGroup.add(cardObj);
            if (badgeBg) pGroup.boardGroup.add(badgeBg);
            if (badgeTxt) pGroup.boardGroup.add(badgeTxt);
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

        // Display incoming spell if we're reacting
        if ((this.phase === 'reaction' || this.phase === 'reaction_request_active') && this.reactionTargetSpell) {
            this.incomingSpellPanel.setVisible(true);
            this.updatePanelVisuals(true, this.reactionTargetSpell);
        } else {
            if (this.incomingSpellPanel) this.incomingSpellPanel.setVisible(false);
        }

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
        const localId = this.getLocalPlayerId();
        const pGroup = this.playerGroups[localId];
        const posIndex = this.getPlayerPositionIndex(localId);
        
        // Exact matching for curve math from hand display
        const count = this.player.hand.length; 
        const handSpaceX = posIndex === 0 ? 55 : 40;
        const totalW = Math.max(0, (count - 1) * handSpaceX);
        const middle = (count - 1) / 2;
        const offset = index - middle;
        const curveOffset = Math.abs(offset) * Math.abs(offset) * 6;
        
        let relX = 0, relY = 0;
        if (posIndex === 0) {
            relX = 0 - totalW / 2 + index * handSpaceX;
            relY = -20 + curveOffset;
        } else if (posIndex === 2) {
            relX = 150 - totalW / 2 + index * handSpaceX;
            relY = 20 - curveOffset;
        } else if (posIndex === 1) {
            relY = 150 - totalW / 2 + index * handSpaceX;
            relX = -curveOffset;
        } else if (posIndex === 3) {
            relY = 150 - totalW / 2 + index * handSpaceX;
            relX = 80 + curveOffset;
        }
        
        const startX = pGroup.zone.x + relX;
        const startY = pGroup.zone.y + relY;

        // Apply state changes to calculate target layout
        this.player.hand.splice(index, 1);
        this.player.board.push(el);

        const w = this.scale.width;
        const h = this.scale.height;
        const uniqueElements = [...new Set(this.player.board)];
        const elIndex = uniqueElements.indexOf(el);
        const centerX = w / 2 - 20;
        const centerY = h / 2 - 40;
        const pos = this.getPlayerPositionIndex(localId);
        
        const spaceX = 75;

        let targetX = 0, targetY = 0;
        if (pos === 0) {
            targetX = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
            targetY = centerY + 160;
        } else if (pos === 1) {
            targetX = centerX + 180;
            targetY = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
        } else if (pos === 2) {
            targetX = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
            targetY = centerY - 160;
        } else if (pos === 3) {
            targetX = centerX - 180;
            targetY = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
        }

        // Create the phantom card sprite
        const phantom = this.add.image(startX, startY, `card_${el}`)
            .setScale(0.8)
            .setDepth(100);

        // Hide the original card in hand immediately (if it hasn't been destroyed by render yet)
        if (pGroup.handGroup) {
            const handCards = pGroup.handGroup.getChildren();
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
                this.updatePlayerHandDisplay(this.getLocalPlayerId());
                this.updatePlayerBoardDisplay(this.getLocalPlayerId());
                this.updatePlayerLifeDisplay(this.getLocalPlayerId());
                
                this.playElementalBurst(targetX, targetY, el);

                // Status hooks for mana play
                if (this.player.status.manaPlayDamage > 0) {
                    this.forceDiscardRandom('ai', 3);
                    this.duelHistory.logMessage(`Player's mana play deals 3 damage to AI!`);
                }
                // C7 Surge fix: check if opponent's oppManaPlayDamage is active (opponent played Surge)
                const localId2 = this.getLocalPlayerId();
                const oppId2 = this.playerIds.find(p => p !== localId2) || this.playerIds[1];
                if (this.players[oppId2] && this.players[oppId2].status.oppManaPlayDamage > 0) {
                    this.players[oppId2].status.oppManaPlayDamage = 0;
                    this.forceDiscardRandom(localId2, 3);
                    this.duelHistory.logMessage(`Surge punishes Player's mana play for 3 damage!`);
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
        const char = this.players[who];
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
        
        if (who === this.getLocalPlayerId()) {
            if (source === 'hand') this.updatePlayerHandDisplay(this.getLocalPlayerId());
            else this.updatePlayerBoardDisplay(this.getLocalPlayerId());
            this.updatePlayerLifeDisplay(this.getLocalPlayerId());
        } else {
            if (source === 'hand') this.updatePlayerHandDisplay((this.playerIds.find(p => p !== (this.getLocalPlayerId())) || this.playerIds[1]));
            else this.updatePlayerBoardDisplay((this.playerIds.find(p => p !== (this.getLocalPlayerId())) || this.playerIds[1]));
            this.updatePlayerLifeDisplay((this.playerIds.find(p => p !== (this.getLocalPlayerId())) || this.playerIds[1]));
        }
        this.updateDeckDiscardDisplay();
        
        if (who === this.getLocalPlayerId() && source === 'board') {
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

            this.updatePlayerHandDisplay(this.getLocalPlayerId());
            this.updatePlayerBoardDisplay(this.getLocalPlayerId());
            this.updatePlayerLifeDisplay(this.getLocalPlayerId());
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
            this.updatePlayerBoardDisplay(this.getLocalPlayerId());
            this.updateDeckDiscardDisplay();
            this.updatePlayerLifeDisplay(this.getLocalPlayerId());

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

        this.updatePlayerBoardDisplay(this.getLocalPlayerId());
        this.updatePlayerLifeDisplay(this.getLocalPlayerId());
        this.updateDeckDiscardDisplay();

        this.selectedBoardMana = [];
        this.updateComboPreview();

        this.duelHistory.logMessage(`Player casts: ${spell.name}!`);

        // Target Selection
        const localPlayer = this.getLocalPlayerId();
        const opponents = this.playerIds.filter(p => p !== localPlayer);
        
        // Calculate synergy to determine if targeting is needed
        const cycle = this.cycleElements[this.cycleIndex];
        let isEmp = this.synergy.calculateSynergy(spell, cycle);
        let finalDmg = spell.damage;
        let finalDrain = spell.drain;
        
        if (isEmp) {
            const overrides = this.synergy.getEmpoweredOverrides(spell.name);
            if (overrides.damage) finalDmg = overrides.damage;
            if (overrides.drain) finalDrain = overrides.drain;
        }
        
        const requiresTarget = finalDmg > 0 || finalDrain > 0;

        if (!requiresTarget) {
            // Self-cast path: shield/draw only spells target the caster, no opponent involved
            this.duelHistory.logMessage(`${localPlayer.toUpperCase()} casts: ${spell.name}!`);
            const w = this.scale.width;
            const h = this.scale.height;
            this.spellEffects.playSelfCastEffect(spell, w / 2, h - 50, () => {
                this.combat.resolveSelfCast(localPlayer, spell);
            });
        } else {
            // Offensive spell: needs an opponent target
            const finishCast = (targetId) => {
                this.duelHistory.logMessage(`${localPlayer.toUpperCase()} casts: ${spell.name} targeting ${targetId.toUpperCase()}!`);
                
                // Simple visual from local to target
                const w = this.scale.width;
                const h = this.scale.height;
                const targetPos = this.getPlayerPositionIndex(targetId);
                let tx = w/2, ty = h/2;
                if (targetPos === 1) { tx = 50; ty = h/2; }
                else if (targetPos === 2) { tx = w/2; ty = 50; }
                else if (targetPos === 3) { tx = w-50; ty = h/2; }

                // Override for Breeze to target opponent's board card
                if (spell.name === 'Breeze') {
                    const oppGroup = this.playerGroups[targetId];
                    if (oppGroup && oppGroup.boardGroup && oppGroup.boardGroup.getChildren().length > 0) {
                        const children = oppGroup.boardGroup.getChildren();
                        const randomCard = children[Math.floor(Math.random() * children.length)];
                        tx = randomCard.x;
                        ty = randomCard.y;
                    }
                }
                
                this.triggerSpellCastAnimation(spell, w / 2, h - 50, () => {
                    this.combat.initiateAttack(localPlayer, targetId, spell);
                });
            };

            if (opponents.length === 1) {
                finishCast(opponents[0]);
            } else {
                // Need to select an opponent
                this.duelHistory.logMessage(`Select target for ${spell.name}...`);
                this.enableTapTargeting(opponents, finishCast);
            }
        }
    }


    enableTapTargeting(opponents, onSelect) {
        const w = this.scale.width;
        const h = this.scale.height;
        
        this.targetSelectionGroup = this.add.group();
        
        // Dim the background slightly to focus attention
        const bg = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0.5).setInteractive();
        this.targetSelectionGroup.add(bg);
        
        const title = this.add.text(w/2, h/2, 'TAP AN OPPONENT TO TARGET', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '28px',
            fontWeight: '800',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
        this.targetSelectionGroup.add(title);
        
        opponents.forEach(oppId => {
            const pos = this.getPlayerPositionIndex(oppId);
            let zx = 0, zy = 0, zw = 0, zh = 0;
            if (pos === 1) { zx = 100; zy = h/2; zw = 200; zh = 400; }
            else if (pos === 2) { zx = w/2; zy = 100; zw = 400; zh = 200; }
            else if (pos === 3) { zx = w - 100; zy = h/2; zw = 200; zh = 400; }
            
            const tapZone = this.add.rectangle(zx, zy, zw, zh, 0x55aaff, 0.0);
            tapZone.setInteractive({ useHandCursor: true });
            
            // Glowing border effect
            const border = this.add.graphics();
            border.lineStyle(4, 0x55aaff, 0.8);
            border.strokeRoundedRect(zx - zw/2, zy - zh/2, zw, zh, 15);
            
            this.tweens.add({
                targets: border,
                alpha: 0.2,
                duration: 800,
                yoyo: true,
                repeat: -1
            });
            
            tapZone.on('pointerover', () => {
                tapZone.fillAlpha = 0.2;
            });
            tapZone.on('pointerout', () => {
                tapZone.fillAlpha = 0.0;
            });
            
            tapZone.on('pointerdown', () => {
                this.targetSelectionGroup.destroy(true);
                onSelect(oppId);
            });
            
            this.targetSelectionGroup.add(tapZone);
            this.targetSelectionGroup.add(border);
        });
    }

    // --- COMBAT RESOLUTION & REACTION WINDOW ---
    resolveSelfCast(caster, spell) {
        const attChar = this.players[caster];
        const cycle = this.cycleElements[this.cycleIndex];

        // Status: Spell Fail Chance
        if (attChar.status.spellFailChance > 0) {
            if (Math.random() < 0.5) {
                this.duelHistory.logMessage(`${caster.toUpperCase()}'s spell fizzled out!`);
                this.time.delayedCall(800, () => {
                    if (this.pendingExtraAction) {
                        this.pendingExtraAction = false;
                        this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                        this.duelHistory.logMessage(`${this.turn.toUpperCase()} gets another action!`);
                        if (this.turn === this.getLocalPlayerId()) { this.phase = 'action'; this.enablePlayerControls(true); }
                        else if (this.mode === 'ai_contest') { this.contestAiAgent.runAITurn(this.turn); }
                        else { this.aiAgent.runAITurn(); }
                    } else {
                        this.checkTurnContinuation();
                    }
                });
                return;
            }
        }

        // Synergy logic
        let isEmp = this.synergy.calculateSynergy(spell, cycle);

        let finalShield = spell.shield;
        let finalDraw = spell.draw;

        if (isEmp) {
            const overrides = this.synergy.getEmpoweredOverrides(spell.name);
            if (overrides.shield) finalShield = overrides.shield;
            if (overrides.draw) finalDraw = overrides.draw;
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

        // Apply shield to caster
        if (finalShield > 0) {
            if (attChar.status.shieldFailChance > 0 && Math.random() < 0.5) {
                this.duelHistory.logMessage(`${caster.toUpperCase()}'s Shield application failed due to Quake!`);
            } else {
                if (attChar.status.shieldDamageDebuff > 0) {
                    this.forceDiscardRandom(caster, 1);
                    this.duelHistory.logMessage(`${caster.toUpperCase()} takes 1 damage from unstable shield!`);
                }
                attChar.shield += finalShield;
                this.updateShieldDisplay(caster);
                this.duelHistory.logMessage(`${caster.toUpperCase()} gains ${finalShield} Shield.`);
            }
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
                        this.duelHistory.logMessage(`${caster.toUpperCase()} lost a board mana from drawing!`);
                    }
                }
            }
            this.playerIds.forEach(pid => { this.updatePlayerHandDisplay(pid); this.updatePlayerBoardDisplay(pid); this.updatePlayerLifeDisplay(pid); });
        }

        // Deferred status effects (self-cast spells that have them)
        if (isEmp) {
            // Self-cast empowered spells only apply self/global statuses, never defender-targeted ones.
            if (spell.name === 'Enrich') { this.playerIds.forEach(p => this.players[p].status.everyoneDraw3 = 1); }
            if (spell.name === 'Fortress') attChar.status.extraDrawIfShield = 1;
            if (spell.name === 'Quagmire') attChar.status.redrawMana = 1;
        }

        // Done — resolve post action
        this.time.delayedCall(800, () => {
            if (this.pendingExtraAction) {
                this.pendingExtraAction = false;
                this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                this.duelHistory.logMessage(`${this.turn.toUpperCase()} gets another action!`);
                if (this.turn === this.getLocalPlayerId()) {
                    this.phase = 'action';
                    this.enablePlayerControls(true);
                } else if (this.mode === 'ai_contest') {
                    this.contestAiAgent.runAITurn(this.turn);
                } else {
                    this.aiAgent.runAITurn();
                }
            } else {
                this.checkTurnContinuation();
            }
        });
    }

    initiateAttack(attacker, defender, spell) {
        let defChar = this.players[defender];
        let attChar = this.players[attacker];
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
            // C6 fix: apply shieldFailChance check (Quake effect) matching CombatSystem.initiateAttack
            if (attChar.status.shieldFailChance > 0 && Math.random() < 0.5) {
                this.duelHistory.logMessage(`${attacker.toUpperCase()}'s Shield application failed due to Quake!`);
            } else {
                if (attChar.status.shieldDamageDebuff > 0) {
                    this.forceDiscardRandom(attacker, 1);
                    this.duelHistory.logMessage(`${attacker.toUpperCase()} takes 1 damage from unstable shield!`);
                }
                attChar.shield += finalShield;
                this.updateShieldDisplay(attacker);
                this.duelHistory.logMessage(`${attacker.toUpperCase()} gains ${finalShield} Shield.`);
            }
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
            this.playerIds.forEach(pid => { this.updatePlayerHandDisplay(pid); this.updatePlayerBoardDisplay(pid); this.updatePlayerLifeDisplay(pid); });
        }
        
        // Drain logic is now deferred to after the reaction phase
        
        // DEFERRED STATUS EFFECTS: Applied AFTER shield/draw/drain so they
        // don't fire during the same spell that set them (Bug 4 fix)
        // Statuses checked during action/draw phase use value 2 to survive
        // the startTurn decrement (they decrement to 1, still > 0 when checked)
        if (isEmp) {
            if (spell.name === 'Ignition') attChar.status.bonusManaPlays = 2;
            if (spell.name === 'Haze') { this.playerIds.forEach(p => this.players[p].status.loseManaOnDraw = 2); }
            if (spell.name === 'Quake') attChar.status.shieldDamageDebuff = 2;
            if (spell.name === 'Dust') { this.playerIds.forEach(p => this.players[p].status.missChance = 2); }
            if (spell.name === 'Typhoon') attChar.status.autoPlayDraw = 2;
            if (spell.name === 'Enrich') { this.playerIds.forEach(p => this.players[p].status.everyoneDraw3 = 1); }
            if (spell.name === 'Firestorm') attChar.status.manaPlayDamage = 2;
            if (spell.name === 'Fortress') attChar.status.extraDrawIfShield = 1;
            if (spell.name === 'Quagmire') attChar.status.redrawMana = 1;
            if (spell.name === 'Surge') defChar.status.oppManaPlayDamage = 2;
            if (spell.name === 'Crucible') attChar.status.retaliationDamage = 1;
            if (spell.name === 'Hurricane') defChar.status.noDrawDebuff = 2;
            if (spell.name === 'Flood') defChar.status.oppDraw4 = 1;
            if (spell.name === 'Tower') defChar.status.spellFailChance = 2;
            if (spell.name === 'Mudslide') { this.playerIds.forEach(p => this.players[p].status.discardReplaceHand = 1); }
            if (spell.name === 'Tide') { this.playerIds.forEach(p => this.players[p].status.rotateHands = 1); }
            if (spell.name === 'Aegis') { this.playerIds.forEach(p => this.players[p].status.damageImmunity = 2); }
            if (spell.name === 'Cataclysm') { this.playerIds.forEach(p => this.players[p].status.randomTargeting = 2); }
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
                        if (this.turn === this.getLocalPlayerId()) {
                            this.phase = 'action';
                            this.enablePlayerControls(true);
                        } else if (this.mode === 'ai_contest') {
                            this.contestAiAgent.runAITurn(this.turn);
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

        if (defender === this.getLocalPlayerId()) {
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
                    let reactionSpell;
                    if (this.mode === 'ai_contest') {
                        reactionSpell = this.contestAiAgent.calculateAIReaction(defender, incomingSpell.damage);
                    } else {
                        reactionSpell = this.aiAgent.calculateAIReaction(incomingSpell.damage);
                    }
                    this.combat.resolveDefendingReaction(reactionSpell);
                });
            }
        }
    }

    resolveDefendingReaction(reactionSpell) {

        const defender = this.reactionCaster;
        const attacker = this.reactionSource;
        const defChar = this.players[defender];
        const attChar = this.players[attacker];

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
                // C6 fix: apply shieldFailChance check on reaction shields (matching CombatSystem.resolveDefendingReaction)
                if (defChar.status.shieldFailChance > 0 && Math.random() < 0.5) {
                    this.duelHistory.logMessage(`${defender.toUpperCase()}'s Reaction Shield failed due to Quake!`);
                } else {
                    defChar.shield += rShield;
                    this.updateShieldDisplay(defender);
                    this.duelHistory.logMessage(`${defender.toUpperCase()} gains ${rShield} Reaction Shield.`);
                }
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
        const char = this.players[who];
        
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

        // C15: temporaryShield flag — reserved for future spells that grant a one-shot shield.
        // No current spell sets this flag; the old `shield > 90` guard it replaced was dead code
        // (max shield from any spell is 8). To use: set `char.temporaryShield = true` when
        // granting the shield so it is cleared here after absorbing its first hit.
        if (char.temporaryShield) {
            char.shield = 0;
            char.temporaryShield = false;
        }
        this.updateShieldDisplay(who);


        if (amount > 0) {
            this.duelHistory.logMessage(`${who.toUpperCase()} is hit for ${amount} DMG!`);
            this.playSound('hit');

            // Set state to discard
            this.phase = 'discard';
            this.enablePlayerControls(false);

            if (who === this.getLocalPlayerId()) {
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
                    if (this.mode === 'ai_contest') {
                        this.contestAiAgent.runAIDiscardAutomation(who, amount);
                    } else {
                        this.aiAgent.runAIDiscardAutomation(amount);
                    }
                }
            }
        } else {
            // Attack completed without card losses
            this.time.delayedCall(800, () => {
                if (this.pendingExtraAction) {
                    this.pendingExtraAction = false;
                    this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
                    this.duelHistory.logMessage(`${this.turn.toUpperCase()} gets another action!`);
                    if (this.turn === this.getLocalPlayerId()) {
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
            this.updatePlayerHandDisplay(this.getLocalPlayerId());
            this.updatePlayerBoardDisplay(this.getLocalPlayerId());
            this.updatePlayerLifeDisplay(this.getLocalPlayerId());
            this.checkDefeatCondition('player');
            this.time.delayedCall(1200, () => {
                this.checkTurnContinuation();
            });
            return;
        }

        this.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.cardsToDiscardCount} CARD(S)FROM HAND OR BOARD MANA`);
        this.discardPromptText.setVisible(true);
    }

    discardCardFromZone(zone, index, who) {
        const localId = this.getLocalPlayerId();
        if (who === localId && (this.phase === 'discard' || this.phase === 'discard_request_active') && this.cardsToDiscardCount > 0) {
            const char = this.player;
            let discarded;
            if (zone === 'hand') {
                discarded = char.hand.splice(index, 1)[0];
                this.updatePlayerHandDisplay(this.getLocalPlayerId());
            } else {
                discarded = char.board.splice(index, 1)[0];
                this.updatePlayerBoardDisplay(this.getLocalPlayerId());
            }

            this.animateCardMovement(discarded, zone, 'discard', 'player');
            this.sharedDiscard.push(discarded);
            this.updateDeckDiscardDisplay();
            this.updatePlayerLifeDisplay(this.getLocalPlayerId());

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
        if (this.turn === this.getLocalPlayerId() && (!this.manaPlacedThisTurn || !this.spellCastThisTurn)) {
            this.phase = 'action';
            this.enablePlayerControls(true);
        } else if (this.turn.startsWith('ai') && (!this.manaPlacedThisTurn || !this.spellCastThisTurn)) {
            if (this.mode === 'ai_contest') {
                this.contestAiAgent.runAITurn(this.turn);
            } else {
                this.aiAgent.runAITurn();
            }
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
            this.startTurn(this.myRole);
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
            turn: this.turn === this.getLocalPlayerId() ? myKey : oppKey,
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
        // Turn announcement removed per request
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
        this.playerIds.forEach(pid => {
            this.updatePlayerHandDisplay(pid);
            this.updatePlayerBoardDisplay(pid);
            this.updatePlayerLifeDisplay(pid);
            this.updateShieldDisplay(pid);
        });
        
        this.updateDeckDiscardDisplay();
        // Update cycle indicator rotation directly
        if (this.cycleContainer) {
            this.cycleContainer.rotation = -(this.cycleIndex - 1) * (Math.PI / 2);
            this.updateCycleDisplayColor(this.cycleElements[this.cycleIndex]);
        }
        this.updateComboPreview();
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
        const viewportHeight = 180;
        const totalHeight = this.duelHistory.getLogTotalHeight();
        
        // Calculate clicked center and map it
        // The handle travel range is from 10 to 10 + 360 - handleHeight
        const minHandleY = 10;
        const maxHandleTravel = 180 - handleHeight;
        
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
        
        const viewportHeight = 180;
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
        
        const viewportHeight = 180;
        const totalHeight = this.duelHistory.getLogTotalHeight();
        
        if (totalHeight <= viewportHeight) return;
        
        const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
        const maxScroll = viewportHeight - totalHeight;
        const scrollRatio = maxScroll === 0 ? 0 : (this.logScrollContainer.y / maxScroll);
        
        const maxHandleTravel = 180 - handleHeight;
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
            if (who === this.getLocalPlayerId()) {
                this.playerIncomingHandCards = (this.playerIncomingHandCards || 0) + 1;
            } else {
                this.aiIncomingHandCards = (this.aiIncomingHandCards || 0) + 1;
            }
        } else if (toStr === 'board') {
            if (who === this.getLocalPlayerId()) {
                this.playerIncomingBoardCards = (this.playerIncomingBoardCards || 0) + 1;
            } else {
                this.aiIncomingBoardCards = (this.aiIncomingBoardCards || 0) + 1;
            }
        }
        
        const w = this.scale.width;
        const h = this.scale.height;
        
        const getZoneCoords = (zone, player) => {
            if (zone === 'deck') return { x: w / 2 - 180, y: h / 2 + 35 };
            if (zone === 'discard') return { x: w / 2 + 140, y: h / 2 + 35 };
            
            // Map who parameter ('player' / 'ai') to a pid
            let pid = player;
            if (player === this.getLocalPlayerId()) {
                pid = this.getLocalPlayerId();
            } else if (player === 'ai') {
                pid = this.playerIds.find(p => p !== (this.getLocalPlayerId())) || this.playerIds[1];
            }
            // If they passed a direct pid (like guest1) it stays as is
            
            const char = this.players[pid];
            const pGroup = this.playerGroups[pid];
            if (!char || !pGroup || !pGroup.zone) return { x: w / 2, y: h / 2 };
            
            const pos = this.getPlayerPositionIndex(pid);
            const zx = pGroup.zone.x;
            const zy = pGroup.zone.y;
            
            if (zone === 'hand') {
                const count = Math.max(0, char.hand.length - 1);
                let x = 0, y = 0;
                const spaceX = pos === 0 ? 90 : 60;
                const totalW = count * spaceX;
                if (pos === 0) {
                    x = zx - totalW / 2 + count * spaceX;
                    y = zy + 90;
                } else if (pos === 2) {
                    x = zx + 150 - totalW / 2 + count * spaceX;
                    y = zy + 20;
                } else if (pos === 1) {
                    y = zy + 150 - totalW / 2 + count * spaceX;
                    x = zx + 0;
                } else if (pos === 3) {
                    y = zy + 150 - totalW / 2 + count * spaceX;
                    x = zx + 80;
                }
                return { x, y };
            }
            if (zone === 'board') {
                const centerX = w / 2 - 20;
                const centerY = h / 2 - 40;
                const uniqueElements = [...new Set(char.board)];
                let elIndex = uniqueElements.indexOf(element);
                if (elIndex === -1) elIndex = 0;
                const spaceX = 75;

                let x = 0, y = 0;
                if (pos === 0) {
                    x = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                    y = centerY + 70;
                } else if (pos === 1) {
                    x = centerX - 110;
                    y = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                } else if (pos === 2) {
                    x = centerX - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                    y = centerY - 110;
                } else if (pos === 3) {
                    x = centerX + 80;
                    y = centerY - ((uniqueElements.length - 1) * spaceX) / 2 + elIndex * spaceX;
                }
                return { x, y };
            }
            return { x: w / 2, y: h / 2 };
        };

        const start = getZoneCoords(fromStr, who);
        const end = getZoneCoords(toStr, who);
        
        const isLocal = who === this.getLocalPlayerId();
        let tex = `card_${element}`;
        if (!isLocal && toStr === 'hand' && fromStr === 'deck') {
            tex = 'card_back';
        }

        const card = this.add.image(start.x, start.y, tex)
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
                    if (who === this.getLocalPlayerId()) {
                        this.playerIncomingHandCards = Math.max(0, this.playerIncomingHandCards - 1);
                    } else {
                        this.aiIncomingHandCards = Math.max(0, this.aiIncomingHandCards - 1);
                    }
                    this.updatePlayerHandDisplay(who);
                } else if (toStr === 'board') {
                    if (who === this.getLocalPlayerId()) {
                        this.playerIncomingBoardCards = Math.max(0, this.playerIncomingBoardCards - 1);
                    } else {
                        this.aiIncomingBoardCards = Math.max(0, this.aiIncomingBoardCards - 1);
                    }
                    this.updatePlayerBoardDisplay(who);
                }

                if (onComplete) onComplete();
                card.destroy();
            }
        });
    }

    /**
     * C14 — Scene lifecycle cleanup.
     * Called by Phaser automatically when this scene stops (scene.start, scene.stop, etc.).
     * Prevents Firebase listeners, pending tweens, and particle emitters from leaking
     * into the next scene or a fresh game session.
     */
    shutdown() {
        // Stop Firebase listener so it doesn't fire into a dead scene
        if (this.onlineManager) {
            this.onlineManager.cleanupOnline();
        }

        // Stop all running tweens (prevents callbacks firing into destroyed objects)
        this.tweens.killAll();

        // Stop and destroy all particle emitters created for spell effects
        if (this.spellEffects && this.spellEffects.emitters) {
            Object.values(this.spellEffects.emitters).forEach(emitter => {
                if (emitter && emitter.stop) emitter.stop();
                if (emitter && emitter.destroy) emitter.destroy();
            });
        }

        // Clean up any active target-selection group
        if (this.targetSelectionGroup) {
            this.targetSelectionGroup.destroy(true);
            this.targetSelectionGroup = null;
        }

        // Restore menu overlay visibility for the Start scene
        const menuOverlay = document.getElementById('main-menu-overlay');
        if (menuOverlay) menuOverlay.classList.remove('hidden');

        // Restore game-body class
        document.body.classList.remove('in-game');
    }
}
