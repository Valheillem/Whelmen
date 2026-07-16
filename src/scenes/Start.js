export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // Create dynamic textures to avoid dependency on loaded images
        // Create a small star particle
        let starCanvas = document.createElement('canvas');
        starCanvas.width = 4;
        starCanvas.height = 4;
        let ctx = starCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 4, 4);
        this.textures.addCanvas('star', starCanvas);

        // Create a glow circle texture for background nebulas
        let nebulaCanvas = document.createElement('canvas');
        nebulaCanvas.width = 128;
        nebulaCanvas.height = 128;
        let nCtx = nebulaCanvas.getContext('2d');
        let grad = nCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(78, 62, 160, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        nCtx.fillStyle = grad;
        nCtx.fillRect(0, 0, 128, 128);
        this.textures.addCanvas('nebula', nebulaCanvas);
    }

    init() {
        // No orientation lock on the menu — let the user hold their phone however they want
    }

    create() {
        // Ensure rotate overlay is disabled on the main menu
        document.body.classList.remove('in-game');

        // Show the HTML main menu overlay (sits on top of the Phaser canvas)
        const menuOverlay = document.getElementById('main-menu-overlay');
        menuOverlay.classList.remove('hidden');

        // Setup CSS Overlay DOM bindings (share, tutorial, spellbook modals)
        this.setupDOMOverlays();

        // Check for lobby invite in URL (?lobby=CODE)
        const urlParams = new URLSearchParams(window.location.search);
        const lobbyCode = urlParams.get('lobby');
        if (lobbyCode) {
            menuOverlay.classList.add('hidden');
            this.scene.start('Lobby', { action: 'join', joinCode: lobbyCode.toUpperCase() });
            return;
        }

        // Bind HTML menu buttons
        const hideMenuAndStart = (sceneName, data) => {
            menuOverlay.classList.add('hidden');
            this.scene.start(sceneName, data);
        };

        const viewMainButtons = document.getElementById('view-main-buttons');
        const viewAiChoice = document.getElementById('view-ai-choice');

        document.getElementById('btn-play-ai').onclick = () => {
            viewMainButtons.style.display = 'none';
            viewAiChoice.style.display = 'flex';
        };

        document.getElementById('btn-ai-choice-back').onclick = () => {
            viewAiChoice.style.display = 'none';
            viewMainButtons.style.display = 'flex';
        };

        document.getElementById('btn-ai-duel').onclick = () => hideMenuAndStart('Game', { mode: 'ai' });
        document.getElementById('btn-ai-contest').onclick = () => hideMenuAndStart('Game', { mode: 'ai_contest' });
        document.getElementById('btn-play-online').onclick = () => hideMenuAndStart('Lobby', { action: 'create' });
        document.getElementById('btn-test-range').onclick = () => hideMenuAndStart('Game', { mode: 'test' });

        document.getElementById('btn-spellbook').onclick = () => {
            document.getElementById('spellbook-overlay').classList.add('active');
        };
        document.getElementById('btn-how-to-play').onclick = () => {
            document.getElementById('tutorial-overlay').classList.add('active');
        };
        document.getElementById('btn-share-game').onclick = () => {
            document.getElementById('share-overlay').classList.add('active');
        };
    }

    createMenuButton(x, y, label, onClick) {
        const btnBg = this.add.graphics().setPosition(x, y);
        const btnText = this.add.text(x, y, label, {
            fontFamily: '"Cinzel", serif',
            fontSize: '22px',
            fontWeight: '700',
            color: '#f4ebd8',
            letterSpacing: 2
        }).setOrigin(0.5);

        const btnWidth = 280;
        const btnHeight = 50;

        const drawNormal = () => {
            btnBg.clear();
            btnBg.lineStyle(2, 0x4a4a4a, 1); // Iron border
            btnBg.fillStyle(0x261a12, 0.9); // Dark wood fill
            btnBg.fillRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
            btnBg.strokeRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
            
            // Add iron rivets in corners
            btnBg.fillStyle(0x1a1a1a, 1);
            btnBg.fillCircle(-btnWidth / 2 + 8, -btnHeight / 2 + 8, 3);
            btnBg.fillCircle(btnWidth / 2 - 8, -btnHeight / 2 + 8, 3);
            btnBg.fillCircle(-btnWidth / 2 + 8, btnHeight / 2 - 8, 3);
            btnBg.fillCircle(btnWidth / 2 - 8, btnHeight / 2 - 8, 3);
        };

        const drawHover = () => {
            btnBg.clear();
            btnBg.lineStyle(2, 0xd4af37, 1); // Gold border
            btnBg.fillStyle(0x3d2b1f, 0.95); // Lighter wood fill
            btnBg.fillRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
            btnBg.strokeRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
            
            btnBg.fillStyle(0x4a4a4a, 1);
            btnBg.fillCircle(-btnWidth / 2 + 8, -btnHeight / 2 + 8, 3);
            btnBg.fillCircle(btnWidth / 2 - 8, -btnHeight / 2 + 8, 3);
            btnBg.fillCircle(-btnWidth / 2 + 8, btnHeight / 2 - 8, 3);
            btnBg.fillCircle(btnWidth / 2 - 8, btnHeight / 2 - 8, 3);
        };

        const drawFlash = () => {
            btnBg.clear();
            btnBg.lineStyle(2, 0xffffff, 1);
            btnBg.fillStyle(0xd4af37, 0.5);
            btnBg.fillRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
            btnBg.strokeRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight);
        };

        // Draw initial state
        drawNormal();

        // Make interactive
        const zone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            drawHover();
            btnText.setColor('#d4af37');
            
            // Floating micro-scale effect
            this.tweens.add({
                targets: [btnText, btnBg],
                scaleX: 1.04,
                scaleY: 1.04,
                duration: 150,
                ease: 'Power1'
            });
        });

        zone.on('pointerout', () => {
            drawNormal();
            btnText.setColor('#f4ebd8');
            
            this.tweens.add({
                targets: [btnText, btnBg],
                scaleX: 1,
                scaleY: 1,
                duration: 150,
                ease: 'Power1'
            });
        });

        zone.on('pointerdown', () => {
            drawFlash();
            
            this.time.delayedCall(100, () => {
                onClick();
            });
        });
    }

    setupDOMOverlays() {
        const shareOverlay = document.getElementById('share-overlay');
        const tutorialOverlay = document.getElementById('tutorial-overlay');
        const spellbookOverlay = document.getElementById('spellbook-overlay');
        const closeShare = document.getElementById('close-share');
        const closeTutorial = document.getElementById('close-tutorial');
        const closeSpellbook = document.getElementById('close-spellbook');
        const shareLinkInput = document.getElementById('share-link');
        const copyShareBtn = document.getElementById('copy-share-btn');
        const updateQrBtn = document.getElementById('update-qr-btn');
        const qrCodeDiv = document.getElementById('qrcode');
        const shareStatus = document.getElementById('share-status');

        // --- QR Code Generator Helper ---
        const generateQR = (url) => {
            qrCodeDiv.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}&color=040212" alt="Whelmen QR Code" style="display:block; max-width:220px; border-radius:8px;" />`;
        };

        // --- Build a shareable URL from a given hostname ---
        const buildShareUrl = (hostname) => {
            const loc = window.location;
            return `${loc.protocol}//${hostname}:${loc.port}${loc.pathname}`;
        };

        // --- Check if current URL is already using a LAN IP ---
        const currentHost = window.location.hostname;
        const isLocalhost = (currentHost === 'localhost' || currentHost === '127.0.0.1' || currentHost === '::1');

        if (!isLocalhost) {
            // Already browsing via LAN IP — perfect, use it directly
            const shareUrl = window.location.href;
            shareLinkInput.value = shareUrl;
            generateQR(shareUrl);
            shareStatus.textContent = '✅ Scan this QR code with a phone to play instantly!';
            shareStatus.style.color = '#a67032';
        } else {
            // On localhost — try to auto-detect LAN IP via WebRTC
            shareStatus.textContent = '🔍 Detecting your LAN IP address...';
            shareStatus.style.color = '#bf8cff';

            this.detectLanIP().then((lanIP) => {
                if (lanIP) {
                    const shareUrl = buildShareUrl(lanIP);
                    shareLinkInput.value = shareUrl;
                    generateQR(shareUrl);
                    shareStatus.textContent = `✅ LAN IP detected! Scan to play on your phone.`;
                    shareStatus.style.color = '#a67032';
                } else {
                    // WebRTC blocked — fall back to manual entry
                    shareLinkInput.value = '';
                    shareLinkInput.placeholder = 'http://192.168.x.x:' + window.location.port + '/';
                    shareStatus.innerHTML = `⚠️ Could not auto-detect LAN IP.<br>Run <strong>ipconfig</strong> in PowerShell, find your IPv4 address, and type it above.`;
                    shareStatus.style.color = '#ffab40';
                    qrCodeDiv.innerHTML = `<p style="color:#555; font-size:0.85rem; padding:30px 0;">Enter your LAN IP above and click "Update QR"</p>`;
                }
            });
        }

        // --- Update QR button: regenerate from whatever is in the input ---
        updateQrBtn.onclick = () => {
            let url = shareLinkInput.value.trim();
            if (!url) return;

            // Auto-prepend http:// if they just typed an IP
            if (/^\d+\.\d+\.\d+\.\d+/.test(url) && !url.startsWith('http')) {
                url = `http://${url}:${window.location.port}${window.location.pathname}`;
                shareLinkInput.value = url;
            }

            generateQR(url);
            shareStatus.textContent = '✅ QR code updated! Scan to play on your phone.';
            shareStatus.style.color = '#a67032';

            // Flash the button green briefly
            updateQrBtn.style.background = 'rgba(0, 230, 118, 0.2)';
            updateQrBtn.style.color = '#a67032';
            setTimeout(() => {
                updateQrBtn.style.background = 'rgba(255, 255, 255, 0.08)';
                updateQrBtn.style.color = '#ffffff';
            }, 1500);
        };

        // Also allow pressing Enter in the input to trigger update
        shareLinkInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') updateQrBtn.click();
        });

        // --- Copy button ---
        copyShareBtn.onclick = () => {
            const url = shareLinkInput.value.trim();
            if (!url) return;
            navigator.clipboard.writeText(url).then(() => {
                copyShareBtn.innerText = 'Copied!';
                copyShareBtn.style.background = 'rgba(0, 230, 118, 0.2)';
                copyShareBtn.style.color = '#a67032';
                setTimeout(() => {
                    copyShareBtn.innerText = 'Copy';
                    copyShareBtn.style.background = 'rgba(255, 255, 255, 0.08)';
                    copyShareBtn.style.color = '#ffffff';
                }, 2000);
            });
        };

        // --- Modal close functions ---
        closeShare.onclick = () => { shareOverlay.classList.remove('active'); this.input.enabled = true; };
        closeTutorial.onclick = () => { tutorialOverlay.classList.remove('active'); this.input.enabled = true; };
        closeSpellbook.onclick = () => { spellbookOverlay.classList.remove('active'); this.input.enabled = true; };

        shareOverlay.onclick = (e) => {
            if (e.target === shareOverlay) { shareOverlay.classList.remove('active'); this.input.enabled = true; }
        };
        tutorialOverlay.onclick = (e) => {
            if (e.target === tutorialOverlay) { tutorialOverlay.classList.remove('active'); this.input.enabled = true; }
        };
        spellbookOverlay.onclick = (e) => {
            if (e.target === spellbookOverlay) { spellbookOverlay.classList.remove('active'); this.input.enabled = true; }
        };
    }

    /**
     * Attempts to discover the local LAN IP address using WebRTC.
     * Returns a promise that resolves to the IP string or null if detection fails.
     */
    detectLanIP() {
        return new Promise((resolve) => {
            try {
                const pc = new RTCPeerConnection({ iceServers: [] });
                const noop = () => {};
                let resolved = false;

                // Timeout after 3 seconds if no candidate arrives
                const timeout = setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        pc.close();
                        resolve(null);
                    }
                }, 3000);

                pc.onicecandidate = (event) => {
                    if (resolved) return;
                    if (!event || !event.candidate || !event.candidate.candidate) return;

                    const candidateStr = event.candidate.candidate;
                    // Look for an IPv4 address in the candidate string
                    const ipMatch = candidateStr.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
                    if (ipMatch) {
                        const ip = ipMatch[1];
                        // Filter out localhost and link-local
                        if (ip !== '0.0.0.0' && ip !== '127.0.0.1' && !ip.startsWith('169.254')) {
                            resolved = true;
                            clearTimeout(timeout);
                            pc.close();
                            resolve(ip);
                        }
                    }
                };

                // Create a dummy data channel and offer to trigger ICE candidate gathering
                pc.createDataChannel('');
                pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(noop);
            } catch (e) {
                resolve(null);
            }
        });
    }

    update(time, delta) {
        // Rotate background rings slowly for a dynamic space-wheel aesthetic
        if (this.rings) {
            this.rings.forEach(ring => {
                ring.graphic.rotation += ring.speed;
            });
        }
    }
}
