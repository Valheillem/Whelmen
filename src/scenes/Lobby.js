import { getPlayerId, createLobby, joinLobby, listenToLobby } from '../firebase.js';

export class Lobby extends Phaser.Scene {
    constructor() {
        super('Lobby');
    }

    init(data) {
        // Attempt to lock portrait orientation on mobile
        try { screen.orientation.lock('portrait').catch(() => {}); } catch(e) {}

        // data.action = 'create' | 'join'
        // data.joinCode = string (if joining from URL param)
        this.action = data?.action || 'create';
        this.joinCode = data?.joinCode || null;
        this.playerId = getPlayerId();
        this.lobbyCode = null;
        this.unsubscribe = null;
    }

    create() {
        // Ensure rotate overlay is disabled in the lobby
        document.body.classList.remove('in-game');

        // Set portrait resolution for the lobby
        // Must happen here (not init) because Phaser recreates the camera between init→create
        this.scale.resize(720, 1280);
        this.sys.game.renderer.resize(720, 1280);
        this.cameras.main.setViewport(0, 0, 720, 1280);
        this.scale.refresh();

        const w = this.scale.width;
        const h = this.scale.height;

        // Background
        this.add.rectangle(0, 0, w, h, 0x040212).setOrigin(0);
        this.add.grid(w / 2, h / 2, w, h, 80, 80, 0x4e3ea0, 0.03, 0xffffff, 0.01);

        // Title
        this.add.text(w / 2, 50, 'ONLINE DUEL', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '42px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setStroke('#4e3ea0', 10);

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
        const text = this.add.text(x, y, label, {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '16px',
            fontStyle: 'bold',
            color: '#ffffff',
            letterSpacing: 1,
            backgroundColor: 'rgba(13,11,28,0.9)',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        text.on('pointerover', () => text.setColor('#00e5ff'));
        text.on('pointerout', () => text.setColor('#ffffff'));
        text.on('pointerdown', onClick);

        return text;
    }

    createPanelButton(x, y, w, h, title, subtitle, glowColor, onClick) {
        const g = this.add.graphics();
        g.fillStyle(0x0d0b1c, 0.9);
        g.lineStyle(2, glowColor, 0.5);
        g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
        g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);

        const titleT = this.add.text(x, y - 15, title, {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '20px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        const subT = this.add.text(x, y + 25, subtitle, {
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            color: '#a0a0b0',
            align: 'center'
        }).setOrigin(0.5);

        const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            g.clear();
            g.fillStyle(0x161233, 0.95);
            g.lineStyle(2, glowColor, 1);
            g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
            g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
            titleT.setColor('#' + glowColor.toString(16).padStart(6, '0'));
        });

        zone.on('pointerout', () => {
            g.clear();
            g.fillStyle(0x0d0b1c, 0.9);
            g.lineStyle(2, glowColor, 0.5);
            g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 12);
            g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 12);
            titleT.setColor('#ffffff');
        });

        zone.on('pointerdown', onClick);

        if (this.choiceContainer) {
            this.choiceContainer.add(g);
            this.choiceContainer.add(titleT);
            this.choiceContainer.add(subT);
            this.choiceContainer.add(zone);
        }
    }
}
