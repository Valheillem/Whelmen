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

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // 1. Add Background Dark Space
        this.add.rectangle(0, 0, width, height, 0x040212).setOrigin(0);

        // 2. Add Soft Glowing Nebulas
        this.add.image(width * 0.25, height * 0.3, 'nebula').setScale(4);
        this.add.image(width * 0.75, height * 0.7, 'nebula').setScale(3);

        // 3. Add Star Particle Emitter for dynamic star drift
        const starEmitter = this.add.particles(0, 0, 'star', {
            x: { min: 0, max: width },
            y: { min: 0, max: height },
            speedY: { min: 5, max: 20 },
            speedX: { min: -5, max: 5 },
            scale: { min: 0.2, max: 0.8 },
            alpha: { min: 0.1, max: 0.7 },
            lifespan: 10000,
            frequency: 150
        });

        // 4. Create Pulsing Elemental Rings in the center
        this.rings = [];
        const ringColors = [0xff3c00, 0x00e676, 0x00e5ff, 0x00b0ff]; // Fire, Earth, Air, Water
        ringColors.forEach((color, i) => {
            let ring = this.add.graphics();
            ring.lineStyle(2, color, 0.2 + i * 0.05);
            ring.strokeCircle(width / 2, height / 2 - 130, 180 + i * 25);
            this.rings.push({
                graphic: ring,
                speed: 0.002 * (i % 2 === 0 ? 1 : -1),
                radius: 180 + i * 25,
                color: color
            });
        });

        // 5. Add Main Title - "WHELMEN"
        const titleText = this.add.text(width / 2, height / 2 - 190, 'WHELMEN', {
            fontFamily: '"Outfit", "Inter", sans-serif',
            fontSize: '84px',
            fontWeight: '800',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        titleText.setStroke('#4e3ea0', 16);
        titleText.setShadow(0, 0, 'rgba(78, 62, 160, 0.8)', 30, true, true);

        const subTitleText = this.add.text(width / 2, height / 2 - 110, 'THE ELEMENTAL DUELING GAME', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '18px',
            fontWeight: '600',
            color: '#a0a0b0',
            letterSpacing: 4
        }).setOrigin(0.5);

        // Animate title float
        this.tweens.add({
            targets: [titleText, subTitleText],
            y: '-=15',
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 6. Setup CSS Overlay DOM bindings
        this.setupDOMOverlays();

        // 7. Check for lobby invite in URL (?lobby=CODE)
        const urlParams = new URLSearchParams(window.location.search);
        const lobbyCode = urlParams.get('lobby');
        if (lobbyCode) {
            // Auto-redirect to Lobby scene to join this lobby
            this.scene.start('Lobby', { action: 'join', joinCode: lobbyCode.toUpperCase() });
            return;
        }

        // 8. Add Menu Buttons
        this.createMenuButton(width / 2, height / 2 - 50, 'PLAY VS AI', () => {
            this.scene.start('Game', { mode: 'ai' });
        });

        this.createMenuButton(width / 2, height / 2 + 10, 'PLAY ONLINE', () => {
            this.scene.start('Lobby', { action: 'create' });
        });

        this.createMenuButton(width / 2, height / 2 + 70, 'TEST RANGE', () => {
            this.scene.start('Game', { mode: 'test' });
        });

        this.createMenuButton(width / 2, height / 2 + 130, 'HOW TO PLAY', () => {
            document.getElementById('tutorial-overlay').classList.add('active');
        });

        this.createMenuButton(width / 2, height / 2 + 190, 'SHARE GAME', () => {
            document.getElementById('share-overlay').classList.add('active');
        });
    }

    createMenuButton(x, y, label, onClick) {
        const btnBg = this.add.graphics().setPosition(x, y);
        const btnText = this.add.text(x, y, label, {
            fontFamily: '"Outfit", "Inter", sans-serif',
            fontSize: '20px',
            fontWeight: '700',
            color: '#ffffff',
            letterSpacing: 2
        }).setOrigin(0.5);

        const btnWidth = 280;
        const btnHeight = 50;

        const drawNormal = () => {
            btnBg.clear();
            btnBg.lineStyle(1.5, 0x4e3ea0, 0.6);
            btnBg.fillStyle(0x0d0b1c, 0.85);
            btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 8);
            btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 8);
        };

        const drawHover = () => {
            btnBg.clear();
            btnBg.lineStyle(2, 0x00e5ff, 1);
            btnBg.fillStyle(0x161233, 0.95);
            btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 8);
            btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 8);
        };

        const drawFlash = () => {
            btnBg.clear();
            btnBg.lineStyle(2, 0xffffff, 1);
            btnBg.fillStyle(0xffffff, 0.15);
            btnBg.fillRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 8);
            btnBg.strokeRoundedRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 8);
        };

        // Draw initial state
        drawNormal();

        // Make interactive
        const zone = this.add.zone(x, y, btnWidth, btnHeight).setInteractive({ useHandCursor: true });

        zone.on('pointerover', () => {
            drawHover();
            btnText.setColor('#00e5ff');
            
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
            btnText.setColor('#ffffff');
            
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
        const closeShare = document.getElementById('close-share');
        const closeTutorial = document.getElementById('close-tutorial');
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
            shareStatus.style.color = '#00e676';
        } else {
            // On localhost — try to auto-detect LAN IP via WebRTC
            shareStatus.textContent = '🔍 Detecting your LAN IP address...';
            shareStatus.style.color = '#00e5ff';

            this.detectLanIP().then((lanIP) => {
                if (lanIP) {
                    const shareUrl = buildShareUrl(lanIP);
                    shareLinkInput.value = shareUrl;
                    generateQR(shareUrl);
                    shareStatus.textContent = `✅ LAN IP detected! Scan to play on your phone.`;
                    shareStatus.style.color = '#00e676';
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
            shareStatus.style.color = '#00e676';

            // Flash the button green briefly
            updateQrBtn.style.background = 'rgba(0, 230, 118, 0.2)';
            updateQrBtn.style.color = '#00e676';
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
                copyShareBtn.style.color = '#00e676';
                setTimeout(() => {
                    copyShareBtn.innerText = 'Copy';
                    copyShareBtn.style.background = 'rgba(255, 255, 255, 0.08)';
                    copyShareBtn.style.color = '#ffffff';
                }, 2000);
            });
        };

        // --- Modal close functions ---
        closeShare.onclick = () => shareOverlay.classList.remove('active');
        closeTutorial.onclick = () => tutorialOverlay.classList.remove('active');

        shareOverlay.onclick = (e) => {
            if (e.target === shareOverlay) shareOverlay.classList.remove('active');
        };
        tutorialOverlay.onclick = (e) => {
            if (e.target === tutorialOverlay) tutorialOverlay.classList.remove('active');
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
