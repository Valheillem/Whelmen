import { getPlayerId, createLobby, joinLobby, listenToLobby } from '../firebase.js';

export class Lobby extends Phaser.Scene {
    constructor() {
        super('Lobby');
    }

    init(data) {
        // data.action = 'create' | 'join'
        // data.joinCode = string (if joining from URL param)
        this.action = data?.action || 'create';
        this.joinCode = data?.joinCode || null;
        this.playerId = getPlayerId();
        this.lobbyCode = null;
        this.unsubscribe = null;
    }

    preload() {
        this.load.image('lobby-bg', './assets/WHELMEN_background.png');
    }

    create() {
        // Ensure rotate overlay is disabled in the lobby
        document.body.classList.remove('in-game');
        // Hide the main menu overlay
        document.getElementById('main-menu-overlay').classList.add('hidden');

        const w = this.scale.width;
        const h = this.scale.height;

        // Background
        this.add.rectangle(0, 0, w, h, 0x1a1410).setOrigin(0);

        // Background Image (Stretch to fit)
        const bgImg = this.add.image(w / 2, h / 2, 'lobby-bg');
        bgImg.setAlpha(1);
        bgImg.setDisplaySize(w, h);

        // Title
        this.add.text(w / 2, 80, 'ONLINE DUEL', {
            fontFamily: '"Cinzel", serif',
            fontSize: '48px',
            fontStyle: 'bold',
            color: '#d4af37'
        }).setOrigin(0.5).setStroke('#2a1e12', 4).setShadow(2, 4, 'rgba(0,0,0,0.8)', 0, true, true);

        // Back button
        this.createButton(w / 2, h - 60, '← BACK', () => {
            this.cleanup();
            this.scene.start('Start');
        });

        if (this.joinCode) {
            // Auto-join from URL parameter
            this.showJoinView();
            this.doJoin(this.joinCode);
        } else if (this.action === 'create') {
            this.showCreateOrJoinChoice();
        } else {
            this.showJoinView();
        }
    }

    // ---- CHOICE SCREEN ----
    showCreateOrJoinChoice() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.choiceContainer = this.add.container(0, 0);

        // Create Lobby Button
        this.createPanelButton(w / 2, h / 2 - 70, 280, 120, 'CREATE LOBBY', 'Start a new duel and\ninvite a friend', 0x00e676, () => {
            if (this.choiceContainer) this.choiceContainer.destroy(true);
            this.showCreateView();
        });

        // Join Lobby Button
        this.createPanelButton(w / 2, h / 2 + 70, 280, 120, 'JOIN LOBBY', 'Enter a code to join\nan existing duel', 0x00b0ff, () => {
            if (this.choiceContainer) this.choiceContainer.destroy(true);
            this.showJoinView();
        });
    }

    // ---- CREATE LOBBY VIEW ----
    async showCreateView() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.createContainer = this.add.container(0, 0);

        const statusText = this.add.text(w / 2, h / 2 - 140, 'Creating lobby...', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '20px',
            color: '#00e5ff'
        }).setOrigin(0.5);
        this.createContainer.add(statusText);

        try {
            this.lobbyCode = await createLobby(this.playerId);

            statusText.setText('Waiting for opponent to join...');
            statusText.setColor('#00e676');

            // Show lobby code
            const codeText = this.add.text(w / 2, h / 2 - 90, this.lobbyCode, {
                fontFamily: '"Outfit", sans-serif',
                fontSize: '56px',
                fontStyle: 'bold',
                color: '#ffffff',
                letterSpacing: 4
            }).setOrigin(0.5);
            this.createContainer.add(codeText);

            // Pulsing animation on code
            this.tweens.add({
                targets: codeText,
                alpha: 0.5,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            // QR Code
            const shareUrl = window.location.origin + window.location.pathname + '?lobby=' + this.lobbyCode;

            this.qrImg = this.add.dom(w / 2, h / 2 + 40).createFromHTML(
                `<div style="display: flex; justify-content: center; align-items: center; width: 130px; height: 130px; background: white; padding: 6px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(shareUrl)}&color=040212"
                          alt="QR Code" style="width: 130px; height: 130px; display: block;" />
                 </div>`
            );
            this.createContainer.add(this.qrImg);

            // URL display
            const urlText = this.add.text(w / 2, h / 2 + 155, shareUrl, {
                fontFamily: '"Inter", sans-serif',
                fontSize: '12px',
                color: '#888899',
                wordWrap: { width: 500 }
            }).setOrigin(0.5);
            this.createContainer.add(urlText);

            // Copy URL button
            const copyBtn = this.createButton(w / 2, h / 2 + 205, 'COPY INVITE LINK', () => {
                navigator.clipboard.writeText(shareUrl).catch(() => {});
            });
            this.createContainer.add(copyBtn);

            // Instruction
            const instText = this.add.text(w / 2, h / 2 + 255, 'Share the code or QR with your opponent', {
                fontFamily: '"Inter", sans-serif',
                fontSize: '14px',
                color: '#a0a0b0'
            }).setOrigin(0.5);
            this.createContainer.add(instText);

            // Listen for guest to join
            this.unsubscribe = listenToLobby(this.lobbyCode, (lobbyData) => {
                if (lobbyData && lobbyData.guestId && lobbyData.status === 'ready') {
                    this.startGame('host');
                }
            });

        } catch (err) {
            statusText.setText('Error: ' + err.message);
            statusText.setColor('#ff3c00');
        }
    }

    // ---- JOIN LOBBY VIEW ----
    showJoinView() {
        const w = this.scale.width;
        const h = this.scale.height;

        this.joinContainer = this.add.container(0, 0);

        this.joinStatusText = this.add.text(w / 2, h / 2 - 100, 'Enter the lobby code:', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '20px',
            color: '#a0a0b0'
        }).setOrigin(0.5);
        this.joinContainer.add(this.joinStatusText);

        // Input field via DOM
        this.joinInput = this.add.dom(w / 2, h / 2 - 40).createFromHTML(
            `<input type="text" id="lobby-code-input"
                    placeholder="e.g. BLAZE-STORM-42"
                    style="width:320px; padding:14px 20px; font-size:20px; font-family:'Outfit',sans-serif;
                           text-align:center; text-transform:uppercase; letter-spacing:3px;
                           background:rgba(13,11,28,0.95); color:#ffffff; border:2px solid rgba(78,62,160,0.6);
                           border-radius:8px; outline:none;"
                    onfocus="this.style.borderColor='#00e5ff'"
                    onblur="this.style.borderColor='rgba(78,62,160,0.6)'" />`
        );
        this.joinContainer.add(this.joinInput);

        // Join button
        const joinBtn = this.createButton(w / 2, h / 2 + 40, 'JOIN DUEL', () => {
            const input = document.getElementById('lobby-code-input');
            const code = input ? input.value.trim().toUpperCase() : '';
            if (code) {
                this.doJoin(code);
            }
        });
        this.joinContainer.add(joinBtn);

        // If we have a joinCode from URL, auto-fill and auto-join
        if (this.joinCode) {
            this.time.delayedCall(300, () => {
                const input = document.getElementById('lobby-code-input');
                if (input) input.value = this.joinCode;
                this.doJoin(this.joinCode);
            });
        }
    }

    async doJoin(code) {
        if (this.joinStatusText) {
            this.joinStatusText.setText('Joining lobby...');
            this.joinStatusText.setColor('#00e5ff');
        }

        try {
            this.lobbyCode = code;
            await joinLobby(code, this.playerId);

            if (this.joinStatusText) {
                this.joinStatusText.setText('Joined! Starting game...');
                this.joinStatusText.setColor('#00e676');
            }

            this.time.delayedCall(800, () => {
                this.startGame('guest');
            });

        } catch (err) {
            if (this.joinStatusText) {
                this.joinStatusText.setText('Error: ' + err.message);
                this.joinStatusText.setColor('#ff3c00');
            }
        }
    }

    // ---- TRANSITION TO GAME ----
    startGame(role) {
        this.cleanup();
        this.scene.start('Game', {
            mode: 'online',
            lobbyCode: this.lobbyCode,
            myRole: role,
            playerId: this.playerId
        });
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        
        // Destroy DOM elements so they don't linger across scenes
        if (this.joinInput) {
            this.joinInput.destroy();
            this.joinInput = null;
        }
        if (this.qrImg) {
            this.qrImg.destroy();
            this.qrImg = null;
        }

        // Clean up URL params
        if (window.history.replaceState) {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        }
    }

    // ---- UI HELPERS ----
    createButton(x, y, label, onClick) {
        const btnBg = this.add.graphics().setPosition(x, y);
        const btnText = this.add.text(x, y, label, {
            fontFamily: '"Cinzel", serif',
            fontSize: '20px',
            fontWeight: '700',
            color: '#f4ebd8',
            letterSpacing: 2
        }).setOrigin(0.5);

        const btnWidth = 240;
        const btnHeight = 46;

        const drawNormal = () => {
            btnBg.clear();
            btnBg.lineStyle(2, 0x4a4a4a, 1);
            btnBg.fillStyle(0x261a12, 0.9);
            btnBg.fillRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
            btnBg.strokeRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
            btnBg.fillStyle(0x1a1a1a, 1);
            btnBg.fillCircle(-btnWidth / 2 + 8, -btnHeight / 2 + 8, 3);
            btnBg.fillCircle(btnWidth / 2 - 8, -btnHeight / 2 + 8, 3);
            btnBg.fillCircle(-btnWidth / 2 + 8, btnHeight / 2 - 8, 3);
            btnBg.fillCircle(btnWidth / 2 - 8, btnHeight / 2 - 8, 3);
        };

        const drawHover = () => {
            btnBg.clear();
            btnBg.lineStyle(2, 0xd4af37, 1);
            btnBg.fillStyle(0x3d2b1f, 0.95);
            btnBg.fillRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
            btnBg.strokeRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
            btnBg.fillStyle(0x4a4a4a, 1);
            btnBg.fillCircle(-btnWidth / 2 + 8, -btnHeight / 2 + 8, 3);
            btnBg.fillCircle(btnWidth / 2 - 8, -btnHeight / 2 + 8, 3);
            btnBg.fillCircle(-btnWidth / 2 + 8, btnHeight / 2 - 8, 3);
            btnBg.fillCircle(btnWidth / 2 - 8, btnHeight / 2 - 8, 3);
        };

        drawNormal();
        const zone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });
        zone.on('pointerover', () => { drawHover(); btnText.setColor('#d4af37'); });
        zone.on('pointerout', () => { drawNormal(); btnText.setColor('#f4ebd8'); });
        zone.on('pointerdown', onClick);

        return this.add.container(0, 0, [btnBg, btnText, zone]);
    }

    createPanelButton(x, y, w, h, title, subtitle, glowColor, onClick) {
        const btnBg = this.add.graphics().setPosition(x, y);

        const titleT = this.add.text(x, y - 15, title, {
            fontFamily: '"Cinzel", serif',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#f4ebd8'
        }).setOrigin(0.5);

        const subT = this.add.text(x, y + 25, subtitle, {
            fontFamily: '"Inter", sans-serif',
            fontSize: '14px',
            color: '#d4af37',
            align: 'center'
        }).setOrigin(0.5);

        const drawNormal = () => {
            btnBg.clear();
            btnBg.lineStyle(2, 0x4a4a4a, 1);
            btnBg.fillStyle(0x261a12, 0.9);
            btnBg.fillRect(-w / 2, -h / 2, w, h);
            btnBg.strokeRect(-w / 2, -h / 2, w, h);
            btnBg.fillStyle(0x1a1a1a, 1);
            btnBg.fillCircle(-w / 2 + 8, -h / 2 + 8, 3);
            btnBg.fillCircle(w / 2 - 8, -h / 2 + 8, 3);
            btnBg.fillCircle(-w / 2 + 8, h / 2 - 8, 3);
            btnBg.fillCircle(w / 2 - 8, h / 2 - 8, 3);
        };

        const drawHover = () => {
            btnBg.clear();
            btnBg.lineStyle(2, 0xd4af37, 1);
            btnBg.fillStyle(0x3d2b1f, 0.95);
            btnBg.fillRect(-w / 2, -h / 2, w, h);
            btnBg.strokeRect(-w / 2, -h / 2, w, h);
            btnBg.fillStyle(0x4a4a4a, 1);
            btnBg.fillCircle(-w / 2 + 8, -h / 2 + 8, 3);
            btnBg.fillCircle(w / 2 - 8, -h / 2 + 8, 3);
            btnBg.fillCircle(-w / 2 + 8, h / 2 - 8, 3);
            btnBg.fillCircle(w / 2 - 8, h / 2 - 8, 3);
        };

        drawNormal();
        const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            drawHover();
            titleT.setColor('#d4af37');
        });

        zone.on('pointerout', () => {
            drawNormal();
            titleT.setColor('#f4ebd8');
        });

        zone.on('pointerdown', onClick);

        if (this.choiceContainer) {
            this.choiceContainer.add([btnBg, titleT, subT, zone]);
        }
    }
}
