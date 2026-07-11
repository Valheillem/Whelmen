import { getPlayerId, createLobby, joinLobby, listenToLobby } from '../firebase.js';

export class Lobby extends Phaser.Scene {
    constructor() {
        super('Lobby');
    }

    init(data) {
        this.action = data?.action || 'create';
        this.joinCode = data?.joinCode || null;
        this.playerId = getPlayerId();
        this.lobbyCode = null;
        this.unsubscribe = null;
        this.pulseInterval = null;
    }

    create() {
        document.body.classList.remove('in-game');
        document.getElementById('main-menu-overlay').classList.remove('hidden');
        document.getElementById('view-main-buttons').style.display = 'none';

        // Bind DOM buttons
        document.getElementById('btn-lobby-choice-back').onclick = () => this.goBack();
        document.getElementById('btn-lobby-create-back').onclick = () => this.goBack();
        document.getElementById('btn-lobby-join-back').onclick = () => this.goBack();
        
        document.getElementById('btn-lobby-create').onclick = () => this.showCreateView();
        document.getElementById('btn-lobby-join').onclick = () => this.showJoinView();
        document.getElementById('btn-lobby-join-submit').onclick = () => {
            const input = document.getElementById('input-lobby-code');
            const code = input ? input.value.trim().toUpperCase() : '';
            if (code) this.doJoin(code);
        };

        if (this.joinCode) {
            this.showJoinView();
            this.doJoin(this.joinCode);
        } else if (this.action === 'create') {
            this.showCreateOrJoinChoice();
        } else {
            this.showJoinView();
        }
    }

    hideAllViews() {
        document.getElementById('view-main-buttons').style.display = 'none';
        document.getElementById('view-lobby-choice').style.display = 'none';
        document.getElementById('view-lobby-create').style.display = 'none';
        document.getElementById('view-lobby-join').style.display = 'none';
    }

    showCreateOrJoinChoice() {
        this.hideAllViews();
        document.getElementById('view-lobby-choice').style.display = 'flex';
    }

    async showCreateView() {
        this.hideAllViews();
        document.getElementById('view-lobby-create').style.display = 'flex';
        
        const statusEl = document.getElementById('lobby-create-status');
        const codeEl = document.getElementById('lobby-create-code');
        const qrEl = document.getElementById('lobby-create-qr');
        const urlEl = document.getElementById('lobby-create-url');
        
        statusEl.innerText = 'Creating lobby...';
        statusEl.style.color = '#00e5ff';
        codeEl.style.display = 'none';
        qrEl.style.display = 'none';
        urlEl.style.display = 'none';

        try {
            this.lobbyCode = await createLobby(this.playerId);

            statusEl.innerText = 'Waiting for opponent to join...';
            statusEl.style.color = '#00e676';

            codeEl.innerText = this.lobbyCode;
            codeEl.style.display = 'block';

            if (this.pulseInterval) clearInterval(this.pulseInterval);
            let alpha = 1;
            let dir = -0.05;
            this.pulseInterval = setInterval(() => {
                alpha += dir;
                if (alpha <= 0.5) dir = 0.05;
                if (alpha >= 1) dir = -0.05;
                codeEl.style.opacity = alpha;
            }, 50);

            const shareUrl = window.location.origin + window.location.pathname + '?lobby=' + this.lobbyCode;
            qrEl.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}&color=040212" alt="QR Code" style="width: 150px; height: 150px; display: block;" />`;
            qrEl.style.display = 'flex';
            
            urlEl.innerText = shareUrl;
            urlEl.style.display = 'block';

            this.unsubscribe = listenToLobby(this.lobbyCode, (lobbyData) => {
                if (lobbyData && lobbyData.guestId && lobbyData.status === 'ready') {
                    this.startGame('host');
                }
            });
        } catch (err) {
            statusEl.innerText = 'Error: ' + err.message;
            statusEl.style.color = '#df1b2d';
        }
    }

    showJoinView() {
        this.hideAllViews();
        document.getElementById('view-lobby-join').style.display = 'flex';
        const input = document.getElementById('input-lobby-code');
        input.value = this.joinCode || '';
        input.focus();
    }

    async doJoin(code) {
        const statusEl = document.getElementById('lobby-join-status');
        statusEl.innerText = 'Joining lobby...';
        statusEl.style.color = '#00e5ff';

        try {
            this.lobbyCode = code;
            await joinLobby(code, this.playerId);

            statusEl.innerText = 'Joined! Starting game...';
            statusEl.style.color = '#00e676';

            this.time.delayedCall(800, () => {
                this.startGame('guest');
            });
        } catch (err) {
            statusEl.innerText = 'Error: ' + err.message;
            statusEl.style.color = '#df1b2d';
        }
    }

    startGame(role) {
        this.cleanup();
        this.scene.start('Game', {
            mode: 'online',
            lobbyCode: this.lobbyCode,
            myRole: role,
            playerId: this.playerId
        });
    }

    goBack() {
        this.cleanup();
        this.hideAllViews();
        document.getElementById('view-main-buttons').style.display = 'flex';
        this.scene.start('Start');
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
            this.pulseInterval = null;
            const codeEl = document.getElementById('lobby-create-code');
            if (codeEl) codeEl.style.opacity = 1;
        }

        // Clean up URL params
        if (window.history.replaceState) {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
        }
    }
}
