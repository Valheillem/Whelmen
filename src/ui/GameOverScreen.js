export class GameOverScreen {
    constructor(scene) {
        this.scene = scene;
    }


    showGameOver(outcome) {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        this.scene.playSound(outcome === 'VICTORY' ? 'shield' : 'hit');

        // Dark shield overlay
        const overG = this.scene.add.graphics();
        overG.fillStyle(0x1a1410, 0.9);
        overG.fillRoundedRect(w / 2 - 250, h / 2 - 180, 500, 300, 15);
        overG.lineStyle(2, outcome === 'VICTORY' ? 0xa67032 : 0xdf1b2d, 0.7);
        overG.strokeRoundedRect(w / 2 - 250, h / 2 - 180, 500, 300, 15);

        const title = this.scene.add.text(w / 2, h / 2 - 100, outcome, {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '52px',
            fontWeight: '800',
            color: outcome === 'VICTORY' ? '#a67032' : '#df1b2d',
            letterSpacing: 2
        }).setOrigin(0.5);

        const victoryMsg = this.scene.mode === 'online'
            ? 'You defeated your opponent in the Cycle!'
            : 'You out-cycled the elemental master!';
        const defeatMsg = this.scene.mode === 'online'
            ? 'Your opponent proved stronger in the Cycle...'
            : 'Your mana has dissolved back into the stars...';

        const scoreT = this.scene.add.text(w / 2, h / 2 - 20, outcome === 'VICTORY' ? victoryMsg : defeatMsg, {
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            color: '#a0a0b0',
            align: 'center'
        }).setOrigin(0.5);

        if (this.scene.mode === 'online') {
            // Single button: RETURN TO MENU
            const rBg = this.scene.add.graphics();
            const rText = this.scene.add.text(w / 2, h / 2 + 50, 'RETURN TO MENU', {
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

            const z = this.scene.add.zone(w / 2, h / 2 + 50, 240, 50).setInteractive({ useHandCursor: true });
            z.on('pointerover', () => {
                drawBtnHover();
                rText.setColor('#bf8cff');
                this.scene.playSound('click');
            });
            z.on('pointerout', () => {
                drawBtnNormal();
                rText.setColor('#ffffff');
            });
            z.on('pointerdown', () => {
                this.scene.cleanupOnline();
                this.scene.scene.start('Start');
            });
        } else {
            // Two buttons: REMATCH and MAIN MENU
            // --- 1. REMATCH Button (Left) ---
            const remBg = this.scene.add.graphics();
            const remText = this.scene.add.text(w / 2 - 120, h / 2 + 50, 'REMATCH', {
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

            const zRem = this.scene.add.zone(w / 2 - 120, h / 2 + 50, 210, 50).setInteractive({ useHandCursor: true });
            zRem.on('pointerover', () => {
                drawRemHover();
                remText.setColor('#bf8cff');
                this.scene.playSound('click');
            });
            zRem.on('pointerout', () => {
                drawRemNormal();
                remText.setColor('#ffffff');
            });
            zRem.on('pointerdown', () => {
                this.scene.scene.restart();
            });

            // --- 2. MAIN MENU Button (Right) ---
            const menuBg = this.scene.add.graphics();
            const menuText = this.scene.add.text(w / 2 + 120, h / 2 + 50, 'MAIN MENU', {
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

            const zMenu = this.scene.add.zone(w / 2 + 120, h / 2 + 50, 210, 50).setInteractive({ useHandCursor: true });
            zMenu.on('pointerover', () => {
                drawMenuHover();
                menuText.setColor('#ffab40');
                this.scene.playSound('click');
            });
            zMenu.on('pointerout', () => {
                drawMenuNormal();
                menuText.setColor('#ffffff');
            });
            zMenu.on('pointerdown', () => {
                this.scene.scene.start('Start');
            });
        }
    }\n


    showDisconnectOverlay() {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;

        this.scene.phase = 'gameover';
        this.scene.enablePlayerControls(false);

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x1a1410, 0.9);
        bg.fillRoundedRect(w / 2 - 250, h / 2 - 100, 500, 200, 15);
        bg.lineStyle(2, 0xffab40, 0.7);
        bg.strokeRoundedRect(w / 2 - 250, h / 2 - 100, 500, 200, 15);

        this.scene.add.text(w / 2, h / 2 - 40, 'OPPONENT DISCONNECTED', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '28px',
            fontWeight: '800',
            color: '#ffab40'
        }).setOrigin(0.5);

        const btnText = this.scene.add.text(w / 2, h / 2 + 40, 'RETURN TO MENU', {
            fontFamily: '"Outfit", sans-serif',
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: 'rgba(13,11,28,0.95)',
            padding: { x: 24, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnText.on('pointerover', () => btnText.setColor('#bf8cff'));
        btnText.on('pointerout', () => btnText.setColor('#ffffff'));
        btnText.on('pointerdown', () => {
            this.scene.cleanupOnline();
            this.scene.scene.start('Start');
        });
    }\n

}
