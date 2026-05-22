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
        // Mode: 'ai' (default, single-player) or 'online' (multiplayer via Firebase)
        this.mode = data?.mode || 'ai';
        this.lobbyCode = data?.lobbyCode || null;
        this.myRole = data?.myRole || 'host'; // 'host' or 'guest'
        this.playerId = data?.playerId || null;
        this.firebaseUnsub = null;
        this.isOnlineInitialized = false;
    }

    preload() {
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
            grad.addColorStop(0, '#2e0a0a');
            grad.addColorStop(0.5, '#4a1200');
            grad.addColorStop(1, '#0f0300');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, cardWidth, cardHeight);
            ctx.strokeStyle = '#ff3c00'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);
            ctx.fillStyle = '#ff8a50'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('FIRE', 12, 22);
            ctx.fillStyle = '#ff3c00'; ctx.font = '42px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🔥', cardWidth/2, cardHeight/2 + 10);
        });

        // Earth Card
        this.createCardCanvas('card_earth', cardWidth, cardHeight, (ctx) => {
            let grad = ctx.createLinearGradient(0, 0, 0, cardHeight);
            grad.addColorStop(0, '#0a2412');
            grad.addColorStop(0.5, '#12381c');
            grad.addColorStop(1, '#020d05');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, cardWidth, cardHeight);
            ctx.strokeStyle = '#00e676'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);
            ctx.fillStyle = '#b9f6ca'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('EARTH', 12, 22);
            ctx.fillStyle = '#00e676'; ctx.font = '42px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🌿', cardWidth/2, cardHeight/2 + 10);
        });

        // Water Card
        this.createCardCanvas('card_water', cardWidth, cardHeight, (ctx) => {
            let grad = ctx.createLinearGradient(0, 0, 0, cardHeight);
            grad.addColorStop(0, '#061c30');
            grad.addColorStop(0.5, '#0d2d4c');
            grad.addColorStop(1, '#020b14');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, cardWidth, cardHeight);
            ctx.strokeStyle = '#00b0ff'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);
            ctx.fillStyle = '#80d8ff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('WATER', 12, 22);
            ctx.fillStyle = '#00b0ff'; ctx.font = '42px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('💧', cardWidth/2, cardHeight/2 + 10);
        });

        // Air Card
        this.createCardCanvas('card_air', cardWidth, cardHeight, (ctx) => {
            let grad = ctx.createLinearGradient(0, 0, 0, cardHeight);
            grad.addColorStop(0, '#05222c');
            grad.addColorStop(0.5, '#0a3644');
            grad.addColorStop(1, '#010c10');
            ctx.fillStyle = grad; ctx.fillRect(0, 0, cardWidth, cardHeight);
            ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 3; ctx.strokeRect(4, 4, cardWidth - 8, cardHeight - 8);
            ctx.fillStyle = '#84ffff'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('AIR', 12, 22);
            ctx.fillStyle = '#00e5ff'; ctx.font = '42px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('🌪️', cardWidth/2, cardHeight/2 + 10);
        });
    }

    createCardCanvas(key, w, h, drawFn) {
        let canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        let ctx = canvas.getContext('2d');
        drawFn(ctx);
        this.textures.addCanvas(key, canvas);
    }

    create() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.synth = new AudioSynthHelper();

        // Background space
        this.add.rectangle(0, 0, w, h, 0x040212).setOrigin(0);

        // Grid overlay
        this.grid = this.add.grid(w/2, h/2, w, h, 80, 80, 0x4e3ea0, 0.03, 0xffffff, 0.01);

        // Core Game variables
        this.sharedDeck = [];
        this.sharedDiscard = [];
        this.cycleElements = ['neutral', 'fire', 'earth', 'air', 'water'];
        this.cycleIndex = 0; // Neutral start
        this.turn = 'player'; // Player starts
        this.phase = 'action'; // Starting action phase
        this.actionUsedThisTurn = false; // Player can do 1 action per turn

        this.player = {
            hand: [],
            board: [],
            shield: 0,
            life: 8,
            maxHand: 8,
            shieldG: null,
            shieldT: null,
            steamDebuff: false
        };

        this.ai = {
            hand: [],
            board: [],
            shield: 0,
            life: 8,
            maxHand: 8,
            shieldG: null,
            shieldT: null,
            steamDebuff: false
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

    drawCard() {
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
        this.playSound('draw');
        const card = this.sharedDeck.pop();
        this.updateDeckDiscardDisplay();
        return card;
    }

    dealStartingHands() {
        for (let i = 0; i < 8; i++) {
            this.player.hand.push(this.drawCard());
            this.ai.hand.push(this.drawCard());
        }
        this.updatePlayerHandDisplay();
        this.updateAIHandDisplay();
        this.updatePlayerLifeDisplay();
        this.updateAILifeDisplay();
    }

    // --- STATE MACHINE TURNS ---
    startTurn(who) {
        this.turn = who;
        this.phase = 'action';
        this.actionUsedThisTurn = false;
        this.selectedBoardMana = [];
        this.updateComboPreview();

        const displayName = (this.mode === 'online' && who === 'player') ? 'YOUR' :
                            (this.mode === 'online' && who === 'ai') ? "OPPONENT'S" :
                            who.toUpperCase() + "'S";
        this.logMessage(`--- ${displayName} TURN ---`);

        // Draw phase
        const card = this.drawCard();
        if (card) {
            if (who === 'player') {
                this.player.hand.push(card);
                this.updatePlayerHandDisplay();
                this.updatePlayerLifeDisplay();
            } else {
                this.ai.hand.push(card);
                this.updateAIHandDisplay();
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
            if (who === 'player') {
                this.updatePlayerHandDisplay();
                this.updatePlayerLifeDisplay();
            } else {
                this.updateAIHandDisplay();
                this.updateAILifeDisplay();
            }
            this.updateDeckDiscardDisplay();
        }
    }

    rotateCycle() {
        this.cycleIndex = (this.cycleIndex + 1) % this.cycleElements.length;
        // Make cycle Neutral to start, and loop fire/earth/air/water from there
        if (this.cycleIndex === 0) {
            this.cycleIndex = 1; // Direct loop bypass neutral if you want, let's keep neutral once
        }
        
        const el = this.cycleElements[this.cycleIndex];
        this.logMessage(`The Cycle rotates to: [${el.toUpperCase()}]`);

        // Rotate graphic dial
        this.tweens.add({
            targets: this.cycleContainer,
            rotation: (this.cycleIndex) * (Math.PI / 2),
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
        const colors = { fire: 0xff3c00, earth: 0x00e676, water: 0x00b0ff, air: 0x00e5ff };

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
        this.playSound(element === 'earth' ? 'shield' : element);
        
        let visual = this.add.circle(startX, startY, 20, 
            element === 'fire' ? 0xff3c00 : 
            element === 'earth' ? 0x00e676 : 
            element === 'water' ? 0x00b0ff : 0x00e5ff
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

        this.cycleContainer = this.add.container(w / 2, h / 2 - 40);
        this.cycleLabels = [];

        // Core cycle dial drawing
        const bgDial = this.add.graphics();
        bgDial.fillStyle(0x0f0b24, 0.9);
        bgDial.lineStyle(2, 0x4e3ea0, 0.4);
        bgDial.fillCircle(0, 0, 95);
        bgDial.strokeCircle(0, 0, 95);
        this.cycleContainer.add(bgDial);

        // 4 Elements around the circle
        const ringPositions = [
            { x: 0, y: -65, color: 0xff3c00, icon: '🔥', label: 'FIRE' },
            { x: 65, y: 0, color: 0x00e676, icon: '🌿', label: 'EARTH' },
            { x: 0, y: 65, color: 0x00e5ff, icon: '🌪️', label: 'AIR' },
            { x: -65, y: 0, color: 0x00b0ff, icon: '💧', label: 'WATER' }
        ];

        ringPositions.forEach((pos) => {
            const glow = this.add.graphics();
            glow.lineStyle(1.5, pos.color, 0.3);
            glow.strokeCircle(pos.x, pos.y, 22);
            this.cycleContainer.add(glow);

            const label = this.add.text(pos.x, pos.y, pos.icon, {
                fontSize: '24px'
            }).setOrigin(0.5);
            this.cycleContainer.add(label);
            this.cycleLabels.push(label);
        });

        // Center wheel indicator
        this.cycleCenterText = this.add.text(0, 0, 'CYCLE', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '15px',
            fontWeight: '800',
            color: '#a0a0b0'
        }).setOrigin(0.5);
        this.cycleContainer.add(this.cycleCenterText);
    }

    triggerCycleParticles(element) {
        if (element === 'neutral') return;
        const emitter = this.emitters[element];
        emitter.explode(40, this.scale.width / 2, this.scale.height / 2 - 40);
        this.cycleCenterText.setText(element.toUpperCase());
        this.cycleCenterText.setColor(
            element === 'fire' ? '#ff3c00' :
            element === 'earth' ? '#00e676' :
            element === 'water' ? '#00b0ff' : '#00e5ff'
        );
    }

    drawPlayerStats() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.playerZone = this.add.container(0, h - 220);

        // Life card count glow (moved below hand cards)
        this.playerLifeText = this.add.text(45, 160, 'HEALTH: 8 (CARDS)', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            color: '#ffffff'
        });
        this.playerZone.add(this.playerLifeText);

        // Draw Player Shield indicator
        this.player.shieldG = this.add.graphics();
        this.playerZone.add(this.player.shieldG);

        this.player.shieldT = this.add.text(600, 158, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            color: '#00e676'
        });
        this.playerZone.add(this.player.shieldT);

        // Title Player Board Mana (added to playerZone for consistent relative placement)
        const boardTitle = this.add.text(45, -80, 'BOARD MANA (READY COMBOS):', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            color: '#a0a0b0',
            letterSpacing: 1
        });
        this.playerZone.add(boardTitle);
    }

    createTopRightUI() {
        const w = this.scale.width;
        
        // Resign Button
        const btnResign = this.add.text(w - 40, 25, 'RESIGN', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#ff3c00',
            backgroundColor: 'rgba(13,11,28,0.85)',
            padding: { x: 14, y: 8 }
        }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(2000);
        
        btnResign.on('pointerover', () => {
            btnResign.setColor('#ffffff');
            btnResign.setBackgroundColor('#ff3c00');
        });
        btnResign.on('pointerout', () => {
            btnResign.setColor('#ff3c00');
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

        // Life card count glow
        this.aiLifeText = this.add.text(45, 12, 'AI HEALTH: 8 (CARDS)', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            color: '#ffffff'
        });
        this.aiZone.add(this.aiLifeText);

        // Draw AI Shield indicator
        this.ai.shieldG = this.add.graphics();
        this.aiZone.add(this.ai.shieldG);

        this.ai.shieldT = this.add.text(600, 10, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            color: '#00e676'
        });
        this.aiZone.add(this.ai.shieldT);

        // Title AI Board Mana
        this.add.text(45, 160, 'AI BOARD MANA:', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            color: '#a0a0b0',
            letterSpacing: 1
        });
    }

    updatePlayerLifeDisplay() {
        const total = this.player.hand.length + this.player.board.length;
        this.player.life = total;
        this.playerLifeText.setText(`PLAYER HEALTH: ${total} (Hand: ${this.player.hand.length} | Board: ${this.player.board.length})`);
    }

    updateAILifeDisplay() {
        const total = this.ai.hand.length + this.ai.board.length;
        this.ai.life = total;
        this.aiLifeText.setText(`AI HEALTH: ${total} (Hand: ${this.ai.hand.length} | Board: ${this.ai.board.length})`);
    }

    updateShieldDisplay(who) {
        const char = who === 'player' ? this.player : this.ai;
        char.shieldG.clear();
        if (char.shield > 0) {
            char.shieldG.fillStyle(0x00e676, 0.15);
            char.shieldG.lineStyle(2, 0x00e676, 0.7);
            if (who === 'player') {
                char.shieldG.fillRoundedRect(590, 154, 140, 24, 6);
                char.shieldG.strokeRoundedRect(590, 154, 140, 24, 6);
                char.shieldT.setPosition(600, 158);
            } else {
                char.shieldG.fillRoundedRect(590, 6, 140, 24, 6);
                char.shieldG.strokeRoundedRect(590, 6, 140, 24, 6);
                char.shieldT.setPosition(600, 10);
            }
            char.shieldT.setText(`🛡️ SHIELD: ${char.shield}`);
        } else {
            char.shieldT.setText('');
        }
    }

    drawDeckDiscardPiles() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.deckG = this.add.graphics();
        this.deckT = this.add.text(w / 2 - 220, h / 2 - 40, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.discardG = this.add.graphics();
        this.discardT = this.add.text(w / 2 + 220, h / 2 - 40, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.updateDeckDiscardDisplay();
    }

    updateDeckDiscardDisplay() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Draw Deck stack
        this.deckG.clear();
        this.deckG.fillStyle(0x1a103c, 0.9);
        this.deckG.lineStyle(2, 0xd4af37, 0.6);
        this.deckG.fillRoundedRect(w / 2 - 265, h / 2 - 95, 90, 110, 8);
        this.deckG.strokeRoundedRect(w / 2 - 265, h / 2 - 95, 90, 110, 8);

        // Deck depth layers
        if (this.sharedDeck.length > 5) {
            this.deckG.strokeRoundedRect(w / 2 - 269, h / 2 - 91, 90, 110, 8);
            this.deckG.strokeRoundedRect(w / 2 - 273, h / 2 - 87, 90, 110, 8);
        }

        this.deckT.setText(`DECK\n(${this.sharedDeck.length})`);

        // Draw Discard stack
        this.discardG.clear();
        if (this.sharedDiscard.length > 0) {
            const topEl = this.sharedDiscard[this.sharedDiscard.length - 1];
            let topColor = 0xff3c00;
            if (topEl === 'earth') topColor = 0x00e676;
            if (topEl === 'water') topColor = 0x00b0ff;
            if (topEl === 'air') topColor = 0x00e5ff;

            this.discardG.fillStyle(0x0a0714, 0.95);
            this.discardG.lineStyle(2, topColor, 0.8);
            this.discardG.fillRoundedRect(w / 2 + 175, h / 2 - 95, 90, 110, 8);
            this.discardG.strokeRoundedRect(w / 2 + 175, h / 2 - 95, 90, 110, 8);

            this.discardT.setText(`DISCARD\n(${this.sharedDiscard.length})\n[${topEl.toUpperCase()}]`);
            this.discardT.setColor('#ffffff');
        } else {
            this.discardG.lineStyle(1.5, 0x4e3ea0, 0.3);
            this.discardG.strokeRoundedRect(w / 2 + 175, h / 2 - 95, 90, 110, 8);
            this.discardT.setText('EMPTY\nDISCARD');
            this.discardT.setColor('#4e3ea0');
        }
    }

    drawUIControls() {
        const w = this.scale.width;
        const h = this.scale.height;

        // Combo Selection Preview Label
        this.comboPreviewText = this.add.text(w / 2, h - 285, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '19px',
            fontWeight: '700',
            color: '#00e5ff',
            align: 'center'
        }).setOrigin(0.5);

        // Action Menu Container
        this.btnSpellBook = this.createActionButton(w - 180, h - 230, 'SPELL BOOK', () => this.handleSpellBookOption());
        this.btnCastSpell = this.createActionButton(w - 180, h - 170, 'CAST SPELL', () => this.handleCastSpellOption());
        this.btnPassDraw = this.createActionButton(w - 180, h - 110, 'PASS & DRAW', () => this.handlePassDrawOption());

        // Select Discard prompt overlay container
        this.discardPromptText = this.add.text(w / 2, h / 2 + 100, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '22px',
            fontWeight: '800',
            color: '#ff3c00',
            backgroundColor: '#040212',
            padding: { x: 20, y: 10 },
            align: 'center'
        }).setOrigin(0.5).setVisible(false);

        // Defend Reaction Alert/Countdown timer
        this.reactionTimerBg = this.add.graphics();
        this.reactionTimerText = this.add.text(w / 2, h / 2 - 130, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '28px',
            fontWeight: '800',
            color: '#00e5ff',
            align: 'center'
        }).setOrigin(0.5).setVisible(false);
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
            g.lineStyle(1.5, lineColor, 1);
            g.fillStyle(fill, 0.85);
            g.fillRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 6);
            g.strokeRoundedRect(x - btnW/2, y - btnH/2, btnW, btnH, 6);
            text.setColor(textColor);
        };

        drawState(0x4e3ea0, 0x0d0b1c, '#888899'); // Default disabled state style

        const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true });

        let enabled = false;

        zone.on('pointerover', () => {
            if (!enabled) return;
            drawState(0x00e5ff, 0x161233, '#00e5ff');
            this.playSound('click');
        });

        zone.on('pointerout', () => {
            if (!enabled) return;
            drawState(0x4e3ea0, 0x0d0b1c, '#ffffff');
        });

        zone.on('pointerdown', () => {
            if (!enabled) return;
            drawState(0xffffff, 0x4e3ea0, '#ffffff');
            this.time.delayedCall(100, () => {
                onClick();
                // Redraw normal state
                if (enabled) drawState(0x4e3ea0, 0x0d0b1c, '#ffffff');
            });
        });

        return {
            setEnabled: (state) => {
                enabled = state;
                if (state) {
                    drawState(0x4e3ea0, 0x0d0b1c, '#ffffff');
                    zone.setInteractive();
                } else {
                    drawState(0x221a44, 0x05040a, '#555566');
                    zone.disableInteractive();
                }
            }
        };
    }

    enablePlayerControls(state) {
        if (this.phase === 'discard' || this.phase === 'discard_request_active') {
            this.btnSpellBook.setEnabled(true);
            this.btnCastSpell.setEnabled(false);
            this.btnPassDraw.setEnabled(false);
            return;
        }

        if (this.phase === 'reaction' || this.phase === 'reaction_request_active') {
            this.btnSpellBook.setEnabled(true);
            // Can cast shield reaction spell if combo selected
            this.btnCastSpell.setEnabled(this.selectedBoardMana.length > 0 && this.selectedBoardMana.length <= 3);
            this.btnPassDraw.setEnabled(true); // Serve as "Pass Reaction" option!
            return;
        }

        if (!state) {
            this.btnSpellBook.setEnabled(true);
            this.btnCastSpell.setEnabled(false);
            this.btnPassDraw.setEnabled(false);
        } else {
            this.btnSpellBook.setEnabled(true);
            this.btnPassDraw.setEnabled(!this.actionUsedThisTurn);
            this.btnCastSpell.setEnabled(!this.actionUsedThisTurn && this.selectedBoardMana.length > 0 && this.selectedBoardMana.length <= 3);
        }
    }

    drawActionLog() {
        const w = this.scale.width;
        this.add.text(w - 370, 25, 'DUEL HISTORY:', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            color: '#a0a0b0',
            letterSpacing: 1
        });

        this.allLogTextLines = [];
        this.logContainer = this.add.container(w - 370, 50);

        // Drawer backing
        const logBg = this.add.graphics();
        logBg.fillStyle(0x070512, 0.8);
        logBg.lineStyle(1, 0x4e3ea0, 0.25);
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

        // Dynamic Interactive Tooltip for Spell Hovering
        this.logTooltip = this.add.container(0, 0).setVisible(false).setDepth(10000);
        this.logTooltipBg = this.add.graphics();
        this.logTooltip.add(this.logTooltipBg);

        this.logTooltipTitle = this.add.text(12, 10, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '13px',
            fontWeight: '700',
            color: '#ffffff'
        });
        this.logTooltip.add(this.logTooltipTitle);

        this.logTooltipCombo = this.add.text(12, 28, '', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '10px',
            fontWeight: '600',
            color: '#a0a0b0'
        });
        this.logTooltip.add(this.logTooltipCombo);

        this.logTooltipDesc = this.add.text(12, 43, '', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            color: '#cbd5e1',
            wordWrap: { width: 216 }
        });
        this.logTooltip.add(this.logTooltipDesc);
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
        const color = msg.includes('VICTORY') ? '#00e676' :
                      msg.includes('DEFEAT') ? '#ff3c00' :
                      msg.includes('Reaction') ? '#00e5ff' :
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
                this.showLogTooltip(spell, pointer.x, pointer.y);
            }
        });
        textLine.on('pointerout', () => {
            textLine.setColor(textLine.originalColor);
            this.hideLogTooltip();
        });
        textLine.on('pointermove', (pointer) => {
            this.updateLogTooltipPosition(pointer.x, pointer.y);
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
                } else if (this.phase === 'action' && !this.actionUsedThisTurn && this.turn === 'player') {
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
        const h = this.scale.height;
        const startX = 60;
        const spaceX = 90;
        const y = h - 215;

        // Render card slots
        this.player.board.forEach((el, index) => {
            const x = startX + index * spaceX;

            const isSelected = this.selectedBoardMana.includes(index);

            const cardObj = this.add.image(x, y, `card_${el}`)
                .setScale(isSelected ? 0.72 : 0.65)
                .setInteractive({ useHandCursor: true });

            // Glowing border overlay if selected for spell combos
            if (isSelected) {
                cardObj.setTint(0x00ffff);
            }

            this.playerBoardGroup.add(cardObj);

            cardObj.on('pointerdown', () => {
                if (this.phase === 'discard' || this.phase === 'discard_request_active') {
                    this.discardCardFromZone('board', index, 'player');
                    return;
                }

                // If in action or reaction, select card for casting combos!
                if (this.turn === 'player' || this.phase === 'reaction' || this.phase === 'reaction_request_active') {
                    const selIdx = this.selectedBoardMana.indexOf(index);
                    if (selIdx > -1) {
                        this.selectedBoardMana.splice(selIdx, 1);
                    } else {
                        if (this.selectedBoardMana.length < 3) {
                            this.selectedBoardMana.push(index);
                        } else {
                            this.playSound('click');
                        }
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
                    cardObj.setTint(0xff3c00);
                } else if (!isSelected) {
                    cardObj.setScale(0.7);
                }
            });

            cardObj.on('pointerout', () => {
                if (this.phase === 'discard') {
                    cardObj.clearTint();
                } else if (!isSelected) {
                    cardObj.setScale(0.65);
                }
            });
        });
    }

    updateAIBoardDisplay() {
        if (this.aiBoardGroup) {
            this.aiBoardGroup.destroy(true);
        }

        this.aiBoardGroup = this.add.group();
        const startX = 60;
        const spaceX = 90;
        const y = 230;

        this.ai.board.forEach((el, index) => {
            const x = startX + index * spaceX;
            const cardObj = this.add.image(x, y, `card_${el}`)
                .setScale(0.65);
            this.aiBoardGroup.add(cardObj);
        });
    }

    updateComboPreview() {
        if (!this.comboPreviewText) return;

        const who = this.phase === 'reaction' ? 'Defensive Reaction' : 'Offensive Spell';
        if (this.selectedBoardMana.length === 0) {
            this.comboPreviewText.setText('');
            return;
        }

        const elements = this.selectedBoardMana.map(idx => this.player.board[idx]);
        const spell = this.getSpellFromCombo(elements);
        
        if (spell) {
            // Check weather Cycle advantage
            const cycle = this.cycleElements[this.cycleIndex];
            let isEmp = spell.element === cycle;
            if (spell.name === 'Firestorm' && cycle === 'air') isEmp = true;
            const isWeak = this.isWeakenedByCycle(spell.element, cycle);
            
            let powerDetail = '';
            if (isEmp) powerDetail = ' (EMPOWERED! +3)';
            if (isWeak) powerDetail = ' (WEAKENED! -2)';

            this.comboPreviewText.setText(`${who}: ${spell.name} (${spell.desc})${powerDetail}`);
            this.comboPreviewText.updateText(); // Force Phaser to recalculate dimensions instantly
            
            const fillStyle = this.getComboColorStyle(elements);
            this.comboPreviewText.setFill(fillStyle);
        } else {
            this.comboPreviewText.setText('Invalid elemental combination selected.');
            this.comboPreviewText.setFill('#ff3838'); // Glowing error red
        }
    }

    getComboColorStyle(elements) {
        if (!elements || elements.length === 0) return '#00e5ff';

        const colorMap = {
            fire: '#ff3838',   // Red
            water: '#38bdf8',  // Blue
            earth: '#34d399',  // Green
            air: '#facc15'     // Yellow
        };

        // Count occurrences of each element
        const counts = { fire: 0, water: 0, earth: 0, air: 0 };
        elements.forEach(el => {
            if (counts[el] !== undefined) {
                counts[el]++;
            }
        });

        // Find max count
        let maxCount = 0;
        for (const el in counts) {
            if (counts[el] > maxCount) {
                maxCount = counts[el];
            }
        }

        // Find elements with max count
        const candidates = [];
        for (const el in counts) {
            if (counts[el] === maxCount) {
                candidates.push(el);
            }
        }

        // If single majority element, return its mapped color
        if (candidates.length === 1) {
            return colorMap[candidates[0]];
        }

        // Otherwise, it's a tie/composite of two or three elements.
        // Collect unique elements present, maintaining order of occurrence
        const uniqueElements = [];
        elements.forEach(el => {
            if (colorMap[el] && !uniqueElements.includes(el)) {
                uniqueElements.push(el);
            }
        });

        const colors = uniqueElements.map(el => colorMap[el]);

        if (colors.length === 0) {
            return '#00e5ff'; // Fallback cyan
        }
        if (colors.length === 1) {
            return colors[0];
        }

        // Create canvas linear gradient across the text length
        const textWidth = Math.max(100, this.comboPreviewText.width);
        const gradient = this.comboPreviewText.context.createLinearGradient(0, 0, textWidth, 0);
        colors.forEach((col, idx) => {
            const stop = idx / (colors.length - 1);
            gradient.addColorStop(stop, col);
        });

        return gradient;
    }

    // --- STRATEGIC PLAY ACTIONS ---
    playHandCardToBoard(index) {
        if (this.actionUsedThisTurn) return;

        const el = this.player.hand.splice(index, 1)[0];
        this.player.board.push(el);

        this.actionUsedThisTurn = true;
        this.playSound('draw');
        this.logMessage(`Player plays [${el.toUpperCase()}] mana to board.`);

        this.updatePlayerHandDisplay();
        this.updatePlayerBoardDisplay();
        this.updatePlayerLifeDisplay();

        this.enablePlayerControls(false);

        // Auto end turn after 400ms to keep play loop crisp and fast!
        this.time.delayedCall(450, () => {
            this.endTurn();
        });
    }

    handleSpellBookOption() {
        const tutorialModal = document.getElementById('tutorial-overlay');
        if (tutorialModal) {
            tutorialModal.classList.add('active');
            
            // Set up close actions
            const closeBtn = document.getElementById('close-tutorial');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    tutorialModal.classList.remove('active');
                };
            }
            
            tutorialModal.onclick = (e) => {
                if (e.target === tutorialModal) {
                    tutorialModal.classList.remove('active');
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

        if (this.actionUsedThisTurn) return;
        this.actionUsedThisTurn = true;

        this.logMessage("Player chooses Pass to Draw.");
        const extraCard = this.drawCard();
        if (extraCard) {
            this.player.hand.push(extraCard);
            this.updatePlayerHandDisplay();
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
        this.actionUsedThisTurn = true;
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
        const defChar = defender === 'player' ? this.player : this.ai;

        // Apply Weather cycle modifiers
        const cycle = this.cycleElements[this.cycleIndex];
        const attChar = attacker === 'player' ? this.player : this.ai;
        let isEmp = spell.element === cycle;
        const isWeak = this.isWeakenedByCycle(spell.element, cycle);

        // Firestorm special: also empowered when cycle is Air
        if (spell.name === 'Firestorm' && cycle === 'air') isEmp = true;

        let finalDmg = spell.damage;
        let finalShield = spell.shield;

        if (isEmp) {
            if (finalDmg > 0) finalDmg += 3;
            if (finalShield > 0) finalShield += 3;
        }
        if (isWeak) {
            if (finalDmg > 0) finalDmg = Math.max(1, finalDmg - 2);
            if (finalShield > 0) finalShield = Math.max(1, finalShield - 2);
        }

        // Steam Blast debuff: attacker's outgoing damage reduced
        if (attChar.steamDebuff && finalDmg > 0) {
            finalDmg = Math.max(1, finalDmg - 2);
            attChar.steamDebuff = false;
            this.logMessage(`${attacker.toUpperCase()}'s spell weakened by lingering steam! (-2 DMG)`);
        }

        // Apply self buffs immediately (like shields)
        if (finalShield > 0) {
            attChar.shield += finalShield;
            this.updateShieldDisplay(attacker);
            this.logMessage(`${attacker.toUpperCase()} gains ${finalShield} Shield.`);
        }

        // Custom effects: card draw immediately
        if (spell.name === 'Breeze' || spell.name === 'Splash Cure' || spell.name === 'Spring of Life' || spell.name === 'Mudslide' || spell.name === 'Gaia\'s Blessing') {
            const drawCount = spell.name === 'Spring of Life' || spell.name === 'Gaia\'s Blessing' ? 2 : 1;
            for (let i=0; i<drawCount; i++) {
                const drawn = this.drawCard();
                if (drawn) {
                    attChar.hand.push(drawn);
                }
            }
            if (attacker === 'player') {
                this.updatePlayerHandDisplay();
                this.updatePlayerLifeDisplay();
            } else {
                this.updateAIHandDisplay();
                this.updateAILifeDisplay();
            }
        }

        if (spell.name === 'Deluge') {
            for (let i=0; i<3; i++) {
                const pD = this.drawCard(); if (pD) this.player.hand.push(pD);
                const aD = this.drawCard(); if (aD) this.ai.hand.push(aD);
            }
            this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIHandDisplay(); this.updateAILifeDisplay();
        }

        if (spell.name === 'Tornado') {
            this.forceDiscardRandom(defender, 3);
        }
        if (spell.name === 'Gust') {
            this.forceDiscardRandom(defender, 1);
        }

        // Special spell immunities
        if (spell.name === 'Fortress') {
            attChar.shield = 99; // Giant temporary absorb shield
            this.updateShieldDisplay(attacker);
        }

        // Special: destroy opponent's board mana
        if (spell.name === 'Dust Devil' || spell.name === 'Tsunami' || spell.name === 'Tectonic Drift') {
            const count = (spell.name === 'Tsunami' || spell.name === 'Tectonic Drift') ? 2 : 1;
            for (let i=0; i<count; i++) {
                if (defChar.board.length > 0) {
                    const burned = defChar.board.pop();
                    this.sharedDiscard.push(burned);
                }
            }
            this.updatePlayerBoardDisplay(); this.updatePlayerLifeDisplay();
            this.updateAIBoardDisplay(); this.updateAILifeDisplay();
            this.updateDeckDiscardDisplay();
        }

        // Wildfire: Force cycle to Fire
        if (spell.name === 'Wildfire') {
            this.cycleIndex = 1;
            this.logMessage('The Cycle is forced to FIRE by Wildfire!');
            this.cycleCenterText.setText('FIRE');
            this.cycleCenterText.setColor('#ff3c00');
            this.triggerCycleParticles('fire');
            this.tweens.add({
                targets: this.cycleContainer,
                rotation: (1) * (Math.PI / 2),
                duration: 500,
                ease: 'Cubic.easeOut'
            });
        }

        // Aether Storm: Draw 2 cards + advance cycle twice
        if (spell.name === 'Aether Storm') {
            for (let i = 0; i < 2; i++) {
                const drawn = this.drawCard();
                if (drawn) attChar.hand.push(drawn);
            }
            if (attacker === 'player') {
                this.updatePlayerHandDisplay(); this.updatePlayerLifeDisplay();
            } else {
                this.updateAIHandDisplay(); this.updateAILifeDisplay();
            }
            for (let i = 0; i < 2; i++) {
                this.cycleIndex = (this.cycleIndex + 1) % this.cycleElements.length;
                if (this.cycleIndex === 0) this.cycleIndex = 1;
            }
            const advEl = this.cycleElements[this.cycleIndex];
            this.logMessage(`Aether Storm advances the Cycle twice to ${advEl.toUpperCase()}!`);
            this.cycleCenterText.setText(advEl.toUpperCase());
            this.cycleCenterText.setColor(
                advEl === 'fire' ? '#ff3c00' : advEl === 'earth' ? '#00e676' :
                advEl === 'water' ? '#00b0ff' : '#00e5ff'
            );
            this.triggerCycleParticles(advEl);
            this.tweens.add({
                targets: this.cycleContainer,
                rotation: (this.cycleIndex) * (Math.PI / 2),
                duration: 500,
                ease: 'Cubic.easeOut'
            });
        }

        // Sandstorm: Opponent discards 2 cards
        if (spell.name === 'Sandstorm') {
            this.forceDiscardRandom(defender, 2);
        }

        // Hurricane: Return all enemy board mana to hand
        if (spell.name === 'Hurricane') {
            while (defChar.board.length > 0) {
                defChar.hand.push(defChar.board.pop());
            }
            this.logMessage(`${defender.toUpperCase()}'s board mana is swept back to hand!`);
            if (defender === 'player') {
                this.updatePlayerHandDisplay(); this.updatePlayerBoardDisplay(); this.updatePlayerLifeDisplay();
            } else {
                this.updateAIHandDisplay(); this.updateAIBoardDisplay(); this.updateAILifeDisplay();
            }
        }

        // Quagmire: Reduce opponent hand limit by 1 (minimum 4)
        if (spell.name === 'Quagmire') {
            defChar.maxHand = Math.max(4, defChar.maxHand - 1);
            this.logMessage(`${defender.toUpperCase()}'s hand limit reduced to ${defChar.maxHand}!`);
        }

        // Steam Blast: Debuff opponent's next spell damage
        if (spell.name === 'Steam Blast') {
            defChar.steamDebuff = true;
            this.logMessage(`${defender.toUpperCase()}'s next spell will be weakened by steam!`);
        }

        // Zephyr Ignite: Grant extra action after this spell resolves
        if (spell.name === 'Zephyr Ignite') {
            this.pendingExtraAction = true;
        }

        // Trigger reaction window if there's incoming damage and defender has active mana
        if (finalDmg > 0 && defChar.board.length > 0) {
            this.startReactionPhase(attacker, defender, { ...spell, damage: finalDmg, bypassShield: spell.name === 'Lava Surge' });
        } else {
            // Direct hit
            if (finalDmg > 0) {
                this.applyDamage(defender, finalDmg, spell.name === 'Lava Surge');
            } else {
                // Done with spelling, auto-end turn after a slight delay
                this.time.delayedCall(800, () => {
                    if (this.pendingExtraAction) {
                        this.pendingExtraAction = false;
                        this.actionUsedThisTurn = false;
                        this.logMessage(`${this.turn.toUpperCase()} gets another action!`);
                        if (this.turn === 'player') {
                            this.phase = 'action';
                            this.enablePlayerControls(true);
                        } else {
                            this.runAITurn();
                        }
                    } else {
                        this.endTurn();
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
        const defChar = defender === 'player' ? this.player : this.ai;

        if (reactionSpell) {
            this.logMessage(`${defender.toUpperCase()} casts reaction: ${reactionSpell.name}!`);

            // Apply cycle adjustments to reaction
            const cycle = this.cycleElements[this.cycleIndex];
            const isEmp = reactionSpell.element === cycle;
            const isWeak = this.isWeakenedByCycle(reactionSpell.element, cycle);

            let rDmg = reactionSpell.damage;
            let rShield = reactionSpell.shield;

            if (isEmp) {
                if (rDmg > 0) rDmg += 3;
                if (rShield > 0) rShield += 3;
            }
            if (isWeak) {
                if (rDmg > 0) rDmg = Math.max(1, rDmg - 2);
                if (rShield > 0) rShield = Math.max(1, rShield - 2);
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
                this.applyDamage(this.reactionSource, rDmg);
            }
        } else {
            this.logMessage(`${defender.toUpperCase()} takes the direct hit.`);
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
                    this.actionUsedThisTurn = false;
                    this.logMessage(`${this.turn.toUpperCase()} gets another action!`);
                    if (this.turn === 'player') {
                        this.phase = 'action';
                        this.enablePlayerControls(true);
                    } else {
                        this.runAITurn();
                    }
                } else {
                    this.endTurn();
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
                            this.actionUsedThisTurn = false;
                            this.logMessage('Player gets another action!');
                            this.enablePlayerControls(true);
                        } else {
                            this.endTurn();
                        }
                    });
                }
            } else {
                this.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
            }
        }
    }

    // --- AI STRATEGIC AGENT ---
    runAITurn() {
        if (this.phase === 'gameover') return;

        this.logMessage("AI is evaluating options...");

        // Smart decision making logic:
        // 1. Play mana if board has less than 3 cards
        if (this.ai.board.length < 3 && this.ai.hand.length > 0) {
            // Find a duplicate element or just play first
            const idxToPlay = 0; 
            const el = this.ai.hand.splice(idxToPlay, 1)[0];
            this.ai.board.push(el);

            this.playSound('draw');
            this.logMessage(`AI plays [${el.toUpperCase()}] mana to board.`);
            
            this.updateAIHandDisplay();
            this.updateAIBoardDisplay();
            this.updateAILifeDisplay();

            this.time.delayedCall(1200, () => {
                this.endTurn();
            });
            return;
        }

        // 2. Try to form a spell combo from board
        if (this.ai.board.length >= 2) {
            // Select up to 3 cards from board
            let comboIndices = [];
            
            // Check weather alignment if possible
            const activeCycle = this.cycleElements[this.cycleIndex];
            const matchingIndex = this.ai.board.indexOf(activeCycle);

            if (matchingIndex > -1) {
                comboIndices.push(matchingIndex);
            }

            // Fill combo to 2 or 3 cards
            this.ai.board.forEach((el, idx) => {
                if (comboIndices.length < 3 && !comboIndices.includes(idx)) {
                    comboIndices.push(idx);
                }
            });

            // Perform cast
            const elements = comboIndices.map(idx => this.ai.board[idx]);
            const spell = this.getSpellFromCombo(elements);

            if (spell) {
                // Consume
                comboIndices.sort((a,b) => b-a);
                comboIndices.forEach(idx => {
                    const consumed = this.ai.board.splice(idx, 1)[0];
                    this.sharedDiscard.push(consumed);
                });

                this.updateAIBoardDisplay();
                this.updateAILifeDisplay();
                this.updateDeckDiscardDisplay();

                this.logMessage(`AI casts: ${spell.name}!`);

                const w = this.scale.width;
                this.triggerSpellVisual(spell.element, w / 2 + 100, 200, w / 2 + 100, 500, () => {
                    this.initiateAttack('ai', 'player', spell);
                });
                return;
            }
        }

        // 3. Fallback: pass to draw
        this.logMessage("AI chooses Pass to Draw.");
        const extra = this.drawCard();
        if (extra) {
            this.ai.hand.push(extra);
            this.updateAIHandDisplay();
            this.updateAILifeDisplay();
        }

        this.time.delayedCall(1200, () => {
            this.endTurn();
        });
    }

    calculateAIReaction(incomingDamage) {
        if (this.ai.board.length === 0) return null;

        // Smart Reaction selection:
        // Try to find Earth (Pebble Shield) or Earth+Earth (Stone Wall) or Earth+Water (Mudslide)
        let earthIndex = this.ai.board.indexOf('earth');
        let waterIndex = this.ai.board.indexOf('water');

        let combo = [];
        if (earthIndex > -1) {
            combo.push(earthIndex);
            // Can make Mudslide?
            if (waterIndex > -1 && incomingDamage > 3) {
                combo.push(waterIndex);
            }
        }

        if (combo.length > 0) {
            const elements = combo.map(idx => this.ai.board[idx]);
            const spell = this.getSpellFromCombo(elements);

            // Consume board mana
            combo.sort((a,b) => b-a);
            combo.forEach(idx => {
                const consumed = this.ai.board.splice(idx, 1)[0];
                this.sharedDiscard.push(consumed);
            });

            this.updateAIBoardDisplay();
            this.updateAILifeDisplay();
            this.updateDeckDiscardDisplay();
            return spell;
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
                this.actionUsedThisTurn = false;
                if (this.turn === 'player') {
                    this.logMessage('Player gets another action!');
                    this.enablePlayerControls(true);
                } else {
                    this.logMessage('AI gets another action!');
                    this.runAITurn();
                }
            } else {
                this.endTurn();
            }
        });
    }

    // --- ALPHABETICAL SPELL COMBO PARSER ---
    getSpellFromCombo(combo) {
        if (!this.spellsCatalog) {
            this.spellsCatalog = {
                // Tier 1 (1 Card)
                'earth': { name: 'Pebble Shield', element: 'earth', damage: 0, shield: 2, desc: '+2 Shield' },
                'fire': { name: 'Ember Poke', element: 'fire', damage: 2, shield: 0, desc: '2 DMG' },
                'water': { name: 'Splash Cure', element: 'water', damage: 0, shield: 0, desc: 'Draw 1 card' },
                'air': { name: 'Breeze', element: 'air', damage: 0, shield: 0, desc: 'Draw 1 card' },

                // Tier 2 (2 Cards)
                'fire,fire': { name: 'Combustion', element: 'fire', damage: 5, shield: 0, desc: '5 DMG' },
                'earth,earth': { name: 'Stone Wall', element: 'earth', damage: 0, shield: 5, desc: '+5 Shield' },
                'water,water': { name: 'Spring of Life', element: 'water', damage: 0, shield: 0, desc: 'Draw 2 cards' },
                'air,air': { name: 'Gust', element: 'air', damage: 0, shield: 0, desc: 'Opponent discards 1 card' },
                'air,fire': { name: 'Firestorm', element: 'fire', damage: 4, shield: 0, desc: '4 DMG (7 if Cycle is Fire/Air)' },
                'earth,water': { name: 'Mudslide', element: 'earth', damage: 0, shield: 3, desc: '+3 Shield, draw 1 card' },
                'fire,water': { name: 'Steam Blast', element: 'water', damage: 3, shield: 0, desc: '3 DMG + weaken enemy' },
                'air,earth': { name: 'Dust Devil', element: 'air', damage: 2, shield: 0, desc: '2 DMG, destroy 1 enemy board mana' },

                // Tier 3 (3 Cards)
                'fire,fire,fire': { name: 'Cataclysm', element: 'fire', damage: 10, shield: 0, desc: '10 DMG (15 if Cycle is Fire)' },
                'water,water,water': { name: 'Deluge', element: 'water', damage: 0, shield: 0, desc: 'Both players draw 3 cards' },
                'earth,earth,earth': { name: 'Fortress', element: 'earth', damage: 0, shield: 10, desc: '+10 Shield, immune to next attack' },
                'air,air,air': { name: 'Tornado', element: 'air', damage: 0, shield: 0, desc: 'Opponent discards 3 cards' },
                'air,fire,fire': { name: 'Wildfire', element: 'fire', damage: 8, shield: 0, desc: '8 DMG + force Cycle to Fire' },
                'earth,earth,water': { name: 'Gaia\'s Blessing', element: 'earth', damage: 0, shield: 6, desc: '+6 Shield, draw 2 cards' },
                'fire,water,water': { name: 'Tsunami', element: 'water', damage: 6, shield: 0, desc: '6 DMG, destroy 2 enemy board mana' },
                'air,fire,water': { name: 'Aether Storm', element: 'air', damage: 5, shield: 0, desc: '5 DMG, draw 2 cards, advance Cycle twice' },
                'air,air,fire': { name: 'Zephyr Ignite', element: 'air', damage: 6, shield: 0, desc: '6 DMG, can take another action' },
                'air,air,earth': { name: 'Sandstorm', element: 'air', damage: 4, shield: 0, desc: '4 DMG, opponent discards 2 cards' },
                'air,air,water': { name: 'Hurricane', element: 'air', damage: 5, shield: 0, desc: '5 DMG, return all enemy board mana to hand' },
                'earth,earth,air': { name: 'Tectonic Drift', element: 'earth', damage: 5, shield: 0, desc: '5 DMG, destroy 2 enemy board mana' },
                'earth,water,water': { name: 'Quagmire', element: 'water', damage: 3, shield: 0, desc: '3 DMG, reduce opponent hand limit' },
                'earth,fire,fire': { name: 'Lava Surge', element: 'fire', damage: 7, shield: 0, desc: '7 DMG, bypasses all shields!' },
                'earth,fire,water': { name: 'Elemental Fusion', element: 'earth', damage: 6, shield: 4, desc: 'Deal 6 DMG + gain 4 Shield' }
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
        overG.fillStyle(0x040212, 0.9);
        overG.fillRoundedRect(w / 2 - 250, h / 2 - 180, 500, 300, 15);
        overG.lineStyle(2, outcome === 'VICTORY' ? 0x00e676 : 0xff3c00, 0.7);
        overG.strokeRoundedRect(w / 2 - 250, h / 2 - 180, 500, 300, 15);

        const title = this.add.text(w / 2, h / 2 - 100, outcome, {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '52px',
            fontWeight: '800',
            color: outcome === 'VICTORY' ? '#00e676' : '#ff3c00',
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

        const btnLabel = this.mode === 'online' ? 'RETURN TO MENU' : 'REMATCH';
        const rBg = this.add.graphics();
        const rText = this.add.text(w / 2, h / 2 + 50, btnLabel, {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '18px',
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: 1
        }).setOrigin(0.5);

        rBg.fillStyle(0x0d0b1c, 0.95);
        rBg.lineStyle(1.5, 0x4e3ea0, 0.7);
        rBg.fillRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
        rBg.strokeRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);

        const z = this.add.zone(w/2, h/2 + 50, 240, 50).setInteractive({ useHandCursor: true });
        z.on('pointerover', () => {
            rBg.clear();
            rBg.fillStyle(0x161233, 0.95);
            rBg.lineStyle(2, 0x00e5ff, 1);
            rBg.fillRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
            rBg.strokeRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
            rText.setColor('#00e5ff');
            this.playSound('click');
        });

        z.on('pointerout', () => {
            rBg.clear();
            rBg.fillStyle(0x0d0b1c, 0.95);
            rBg.lineStyle(1.5, 0x4e3ea0, 0.7);
            rBg.fillRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
            rBg.strokeRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
            rText.setColor('#ffffff');
        });

        z.on('pointerdown', () => {
            if (this.mode === 'online') {
                this.cleanupOnline();
                this.scene.start('Start');
            } else {
                this.scene.restart();
            }
        });
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
                    this.actionUsedThisTurn = false;
                    this.logMessage('You get another action!');
                    this.enablePlayerControls(true);
                } else {
                    this.endTurn();
                }
            });
            return;
        }

        // Normal Turn Logic
        if (isMyTurn) {
            this.logMessage("--- YOUR TURN ---");
            this.actionUsedThisTurn = false;
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
            this.cycleContainer.rotation = this.cycleIndex * (Math.PI / 2);
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
        bg.fillStyle(0x040212, 0.9);
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

        btnText.on('pointerover', () => btnText.setColor('#00e5ff'));
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

    showLogTooltip(spell, x, y) {
        if (!this.logTooltip) return;
        const colors = { fire: 0xff3c00, earth: 0x00e676, water: 0x00b0ff, air: 0x00e5ff };
        const colorHex = colors[spell.element] || 0x4e3ea0;

        const elementIcon = spell.element === 'fire' ? '🔥' :
                            spell.element === 'earth' ? '🌿' :
                            spell.element === 'water' ? '💧' : '🌪️';
        this.logTooltipTitle.setText(`${elementIcon} ${spell.name.toUpperCase()}`);
        this.logTooltipTitle.setColor(
            spell.element === 'fire' ? '#ff3c00' :
            spell.element === 'earth' ? '#00e676' :
            spell.element === 'water' ? '#00b0ff' : '#00e5ff'
        );

        let comboStr = '';
        for (const key in this.spellsCatalog) {
            if (this.spellsCatalog[key].name === spell.name) {
                comboStr = key.split(',').map(el => el.toUpperCase()).join(' + ');
                break;
            }
        }
        this.logTooltipCombo.setText(`COMBO: ${comboStr}`);
        this.logTooltipDesc.setText(spell.desc);

        const width = 240;
        const height = 48 + this.logTooltipDesc.height + 12;

        this.logTooltipBg.clear();
        this.logTooltipBg.fillStyle(0x090518, 0.95);
        this.logTooltipBg.lineStyle(2, colorHex, 0.85);
        this.logTooltipBg.fillRoundedRect(0, 0, width, height, 8);
        this.logTooltipBg.strokeRoundedRect(0, 0, width, height, 8);

        this.logTooltip.setPosition(x - width - 15, y - height / 2);
        this.logTooltip.setVisible(true);
    }

    hideLogTooltip() {
        if (this.logTooltip) {
            this.logTooltip.setVisible(false);
        }
    }

    updateLogTooltipPosition(x, y) {
        if (this.logTooltip && this.logTooltip.visible) {
            const width = 240;
            const height = 48 + this.logTooltipDesc.height + 12;
            this.logTooltip.setPosition(x - width - 15, y - height / 2);
        }
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
}
