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

        this.cycleContainer = this.add.container(w / 2 + 50, h / 2 - 40);
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

        this.playerZone = this.add.container(0, h - 195);



        // Draw Player Shield indicator
        this.player.shieldG = this.add.graphics();
        this.playerZone.add(this.player.shieldG);

        this.player.shieldT = this.add.text(600, 133, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '16px',
            fontWeight: '700',
            color: '#00e676'
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
    }

    drawMagicSigils() {
        const h = this.scale.height;
        this.drawMagicSigil(240, h - 280, 0x00e5ff); // Player board sigil (cyan)
        this.drawMagicSigil(240, 260, 0xff3c00); // AI board sigil (red)
    }

    drawMagicSigil(x, y, colorHex) {
        const sigil = this.add.graphics();
        
        // Concentric outer rings
        sigil.lineStyle(1.5, colorHex, 0.25);
        sigil.strokeCircle(x, y, 75);
        
        sigil.lineStyle(1, colorHex, 0.15);
        sigil.strokeCircle(x, y, 69);
        
        // Concentric inner ring
        sigil.lineStyle(2, colorHex, 0.4);
        sigil.strokeCircle(x, y, 45);
        
        // Concentric innermost core circle
        sigil.strokeCircle(x, y, 12);
        
        // Heptagram or Heptagon details (8-pointed geometric star)
        sigil.lineStyle(1.5, colorHex, 0.35);
        const points = [];
        const numPoints = 8;
        for (let i = 0; i < numPoints; i++) {
            const angle = (i * Math.PI * 2) / numPoints;
            const radius = i % 2 === 0 ? 45 : 18;
            points.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius
            });
        }
        
        sigil.beginPath();
        sigil.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            sigil.lineTo(points[i].x, points[i].y);
        }
        sigil.closePath();
        sigil.stroke();
        
        // Add tiny elemental cardinal spikes
        sigil.lineStyle(1.5, colorHex, 0.5);
        for (let i = 0; i < 4; i++) {
            const angle = (i * Math.PI) / 2;
            sigil.beginPath();
            sigil.moveTo(x + Math.cos(angle) * 45, y + Math.sin(angle) * 45);
            sigil.lineTo(x + Math.cos(angle) * 78, y + Math.sin(angle) * 78);
            sigil.stroke();
        }
        
        // Subtle breathing animation for a premium element feel
        this.tweens.add({
            targets: sigil,
            alpha: 0.35,
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
            char.shieldG.fillStyle(0x00e676, 0.15);
            char.shieldG.lineStyle(2, 0x00e676, 0.7);
            if (who === 'player') {
                char.shieldG.fillRoundedRect(590, 129, 140, 24, 6);
                char.shieldG.strokeRoundedRect(590, 129, 140, 24, 6);
                char.shieldT.setPosition(600, 133);
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

        // Create actual image representations for Deck and Discard
        this.deckCardImg = this.add.image(w / 2 - 170, h / 2 - 40, 'card_back')
            .setScale(0.75)
            .setVisible(true);

        this.discardCardImg = this.add.image(w / 2 + 270, h / 2 - 40, 'card_back')
            .setScale(0.75)
            .setVisible(false);

        // Graphics to draw empty slot outline when discard is empty
        this.discardOutlineG = this.add.graphics();

        // Text labels positioned under the card images
        this.deckT = this.add.text(w / 2 - 170, h / 2 + 35, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#a0a0b0',
            align: 'center'
        }).setOrigin(0.5, 0);

        this.discardT = this.add.text(w / 2 + 270, h / 2 + 35, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '14px',
            fontWeight: '700',
            color: '#a0a0b0',
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
            this.discardOutlineG.lineStyle(1.5, 0x4e3ea0, 0.4);
            this.discardOutlineG.strokeRoundedRect(
                w / 2 + 270 - cardW / 2, 
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

        // Primed Spell Preview Panel next to buttons
        const panelW = 240;
        const panelH = 120;
        
        this.primedSpellPanel = this.add.container(w - 600, h - 208).setVisible(false);
        
        this.primedSpellBg = this.add.graphics();
        this.primedSpellPanel.add(this.primedSpellBg);
        
        this.primedSpellTitle = this.add.text(14, 12, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '13.5px',
            fontWeight: '800',
            color: '#ffffff'
        });
        this.primedSpellPanel.add(this.primedSpellTitle);
        
        this.primedSpellCombo = this.add.text(14, 32, '', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '10px',
            fontWeight: '700',
            color: '#a0a0b0',
            letterSpacing: 0.5
        });
        this.primedSpellPanel.add(this.primedSpellCombo);
        
        this.primedSpellDesc = this.add.text(14, 49, '', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '11px',
            fontWeight: '500',
            color: '#cbd5e1',
            wordWrap: { width: panelW - 28 }
        });
        this.primedSpellPanel.add(this.primedSpellDesc);

        this.primedSpellAdvantage = this.add.text(14, 88, '', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '10.5px',
            fontWeight: '800',
            color: '#00e676',
            letterSpacing: 0.5
        });
        this.primedSpellPanel.add(this.primedSpellAdvantage);

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
        const y = h - 280;

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

        // Dynamic symmetric centering around player board center x = 240
        const centerX = 240;
        const spaceX = 100;
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
                borderHighlight.lineStyle(1.5, 0x00e5ff, 0.45);
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
                    cardObj.setTint(0xff3c00);
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
                    fire: 0xff3c00,
                    earth: 0x00e676,
                    water: 0x00b0ff,
                    air: 0x00e5ff
                };
                const elementColorHex = elementColors[el] || 0xffffff;

                const countBadgeG = this.add.graphics();
                countBadgeG.fillStyle(0x0d0b1c, 0.95);
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
                    selBadgeG.fillStyle(0x040212, 0.95);
                    selBadgeG.lineStyle(2, 0x00e5ff, 0.95);
                    selBadgeG.fillCircle(badgeX, badgeY, 11);
                    selBadgeG.strokeCircle(badgeX, badgeY, 11);
                }
                this.playerBoardGroup.add(selBadgeG);
                
                const selTextVal = isAllSelected ? `✓` : `${stack.selectedCount}`;
                const selText = this.add.text(badgeX, badgeY, selTextVal, {
                    fontFamily: '"Outfit", sans-serif',
                    fontSize: '11px',
                    fontWeight: '800',
                    color: isAllSelected ? '#040212' : '#00e5ff'
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
        const y = 260;

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

        // Dynamic symmetric centering around AI board center x = 240
        const centerX = 240;
        const spaceX = 100;
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
                    fire: 0xff3c00,
                    earth: 0x00e676,
                    water: 0x00b0ff,
                    air: 0x00e5ff
                };
                const elementColorHex = elementColors[el] || 0xffffff;

                const countBadgeG = this.add.graphics();
                countBadgeG.fillStyle(0x0d0b1c, 0.95);
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

    updateComboPreview() {
        if (!this.primedSpellPanel) return;

        if (this.selectedBoardMana.length === 0) {
            this.primedSpellPanel.setVisible(false);
            return;
        }

        const elements = this.selectedBoardMana.map(idx => this.player.board[idx]);
        const spell = this.getSpellFromCombo(elements);
        const panelW = 240;
        const panelH = 120;
        
        this.primedSpellBg.clear();
        this.primedSpellPanel.setVisible(true);

        if (spell) {
            // Check weather Cycle advantage
            const cycle = this.cycleElements[this.cycleIndex];
            let isEmp = spell.element === cycle;
            if (spell.name === 'Firestorm' && cycle === 'air') isEmp = true;
            const isWeak = this.isWeakenedByCycle(spell.element, cycle);
            
            const colors = { fire: 0xff3c00, earth: 0x00e676, water: 0x00b0ff, air: 0x00e5ff };
            const colorHex = colors[spell.element] || 0x4e3ea0;

            const elementIcon = spell.element === 'fire' ? '🔥' :
                                spell.element === 'earth' ? '🌿' :
                                spell.element === 'water' ? '💧' : '🌪️';
            
            // 1. Set Title
            this.primedSpellTitle.setText(`${elementIcon} ${spell.name.toUpperCase()}`);
            this.primedSpellTitle.setColor(
                spell.element === 'fire' ? '#ff3c00' :
                spell.element === 'earth' ? '#00e676' :
                spell.element === 'water' ? '#00b0ff' : '#00e5ff'
            );

            // 2. Set Combo Recipe
            let comboStr = '';
            for (const key in this.spellsCatalog) {
                if (this.spellsCatalog[key].name === spell.name) {
                    comboStr = key.split(',').map(el => el.toUpperCase()).join(' + ');
                    break;
                }
            }
            this.primedSpellCombo.setText(`PRIMED COMBO: ${comboStr}`);

            // 3. Set Description
            this.primedSpellDesc.setText(spell.desc);

            // 4. Set Cycle Advantage Banner
            if (isEmp) {
                this.primedSpellAdvantage.setText('⚡ EMPOWERED (+3 STATS)');
                this.primedSpellAdvantage.setColor('#00e676');
                this.primedSpellAdvantage.setVisible(true);
            } else if (isWeak) {
                this.primedSpellAdvantage.setText('⚠ WEAKENED (-2 STATS)');
                this.primedSpellAdvantage.setColor('#ff3c00');
                this.primedSpellAdvantage.setVisible(true);
            } else {
                this.primedSpellAdvantage.setText('⚪ ENVIRONMENT NEUTRAL');
                this.primedSpellAdvantage.setColor('#a0a0b0');
                this.primedSpellAdvantage.setVisible(true);
            }

            // Draw glowing background card
            this.primedSpellBg.fillStyle(0x090518, 0.95);
            this.primedSpellBg.lineStyle(2, colorHex, 0.9);
            this.primedSpellBg.fillRoundedRect(0, 0, panelW, panelH, 10);
            this.primedSpellBg.strokeRoundedRect(0, 0, panelW, panelH, 10);

        } else {
            // Invalid combination
            this.primedSpellTitle.setText('INVALID COMBO');
            this.primedSpellTitle.setColor('#ff3c00');
            this.primedSpellCombo.setText('FORMULA UNKNOWN');
            this.primedSpellDesc.setText('Select valid elemental cards on your board to prime a spell.');
            this.primedSpellAdvantage.setVisible(false);

            // Draw warning background
            this.primedSpellBg.fillStyle(0x090518, 0.95);
            this.primedSpellBg.lineStyle(2, 0xff3c00, 0.6);
            this.primedSpellBg.fillRoundedRect(0, 0, panelW, panelH, 10);
            this.primedSpellBg.strokeRoundedRect(0, 0, panelW, panelH, 10);
        }
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
        if (this.mode === 'test' && this.dummyMode === 'passive') return null;

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
                rBg.fillStyle(0x0d0b1c, 0.95);
                rBg.lineStyle(1.5, 0x4e3ea0, 0.7);
                rBg.fillRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
                rBg.strokeRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
            };

            const drawBtnHover = () => {
                rBg.clear();
                rBg.fillStyle(0x161233, 0.95);
                rBg.lineStyle(2, 0x00e5ff, 1);
                rBg.fillRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
                rBg.strokeRoundedRect(w / 2 - 120, h / 2 + 25, 240, 50, 6);
            };

            drawBtnNormal();

            const z = this.add.zone(w / 2, h / 2 + 50, 240, 50).setInteractive({ useHandCursor: true });
            z.on('pointerover', () => {
                drawBtnHover();
                rText.setColor('#00e5ff');
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
                remBg.fillStyle(0x0d0b1c, 0.95);
                remBg.lineStyle(1.5, 0x4e3ea0, 0.7);
                remBg.fillRoundedRect(w / 2 - 225, h / 2 + 25, 210, 50, 6);
                remBg.strokeRoundedRect(w / 2 - 225, h / 2 + 25, 210, 50, 6);
            };

            const drawRemHover = () => {
                remBg.clear();
                remBg.fillStyle(0x161233, 0.95);
                remBg.lineStyle(2, 0x00e5ff, 1);
                remBg.fillRoundedRect(w / 2 - 225, h / 2 + 25, 210, 50, 6);
                remBg.strokeRoundedRect(w / 2 - 225, h / 2 + 25, 210, 50, 6);
            };

            drawRemNormal();

            const zRem = this.add.zone(w / 2 - 120, h / 2 + 50, 210, 50).setInteractive({ useHandCursor: true });
            zRem.on('pointerover', () => {
                drawRemHover();
                remText.setColor('#00e5ff');
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
                menuBg.fillStyle(0x0d0b1c, 0.95);
                menuBg.lineStyle(1.5, 0x4e3ea0, 0.7);
                menuBg.fillRoundedRect(w / 2 + 15, h / 2 + 25, 210, 50, 6);
                menuBg.strokeRoundedRect(w / 2 + 15, h / 2 + 25, 210, 50, 6);
            };

            const drawMenuHover = () => {
                menuBg.clear();
                menuBg.fillStyle(0x161233, 0.95);
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
                        <button class="panel-btn active-weather" id="w-neutral" style="--color: var(--color-neutral); --glow: var(--glow-neutral-glow);"><span class="emoji">⚪</span>Neut</button>
                        <button class="panel-btn" id="w-fire" style="--color: var(--color-fire); --glow: var(--color-fire-glow);"><span class="emoji">🔥</span>Fire</button>
                        <button class="panel-btn" id="w-earth" style="--color: var(--color-earth); --glow: var(--color-earth-glow);"><span class="emoji">🌿</span>Earth</button>
                        <button class="panel-btn" id="w-air" style="--color: var(--color-air); --glow: var(--color-air-glow);"><span class="emoji">🌪️</span>Air</button>
                        <button class="panel-btn" id="w-water" style="--color: var(--color-water); --glow: var(--color-water-glow);"><span class="emoji">💧</span>Water</button>
                    </div>
                </div>
                
                <div class="panel-section">
                    <div class="panel-section-title">Card Sandbox</div>
                    <div class="spawner-grid">
                        <div class="spawner-column">
                            <div class="spawner-col-title">Spawn In Hand</div>
                            <div class="element-grid">
                                <button class="panel-btn el-btn" id="spawn-h-fire" style="--color: var(--color-fire); --glow: var(--color-fire-glow);">🔥 Fire</button>
                                <button class="panel-btn el-btn" id="spawn-h-earth" style="--color: var(--color-earth); --glow: var(--color-earth-glow);">🌿 Earth</button>
                                <button class="panel-btn el-btn" id="spawn-h-air" style="--color: var(--color-air); --glow: var(--color-air-glow);">🌪️ Air</button>
                                <button class="panel-btn el-btn" id="spawn-h-water" style="--color: var(--color-water); --glow: var(--color-water-glow);">💧 Water</button>
                                <button class="panel-btn el-btn clear-btn" id="clear-hand">Clear Hand</button>
                            </div>
                        </div>
                        <div class="spawner-column">
                            <div class="spawner-col-title">Spawn On Board</div>
                            <div class="element-grid">
                                <button class="panel-btn el-btn" id="spawn-b-fire" style="--color: var(--color-fire); --glow: var(--color-fire-glow);">🔥 Fire</button>
                                <button class="panel-btn el-btn" id="spawn-b-earth" style="--color: var(--color-earth); --glow: var(--color-earth-glow);">🌿 Earth</button>
                                <button class="panel-btn el-btn" id="spawn-b-air" style="--color: var(--color-air); --glow: var(--color-air-glow);">🌪️ Air</button>
                                <button class="panel-btn el-btn" id="spawn-b-water" style="--color: var(--color-water); --glow: var(--color-water-glow);">💧 Water</button>
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
                    rotation: (idx) * (Math.PI / 2),
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
                
                const elementIcon = spell.element === 'fire' ? '🔥' :
                                    spell.element === 'earth' ? '🌿' :
                                    spell.element === 'water' ? '💧' : '🌪️';
                
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
        
        // Restore random 8 hand cards and 3 board cards
        for (let i = 0; i < 8; i++) {
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
        
        // Restore random 8 hand cards and 3 board cards
        for (let i = 0; i < 8; i++) {
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
