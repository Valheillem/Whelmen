export class SandboxDashboard {
    constructor(scene) {
        this.scene = scene;
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
                        <button class="panel-btn active-weather" id="w-neutral" style="--color: var(--color-neutral); --glow: var(--glow-neutral-glow);"><span class="grey-dot"></span>Neut</button>
                        <button class="panel-btn" id="w-fire" style="--color: var(--color-fire); --glow: var(--color-fire-glow);"><img src="assets/icons/Fire.png" class="el-icon">Fire</button>
                        <button class="panel-btn" id="w-earth" style="--color: var(--color-earth); --glow: var(--color-earth-glow);"><img src="assets/icons/Earth.png" class="el-icon">Earth</button>
                        <button class="panel-btn" id="w-air" style="--color: var(--color-air); --glow: var(--color-air-glow);"><img src="assets/icons/Air.png" class="el-icon">Air</button>
                        <button class="panel-btn" id="w-water" style="--color: var(--color-water); --glow: var(--color-water-glow);"><img src="assets/icons/Water.png" class="el-icon">Water</button>
                    </div>
                </div>
                
                <div class="panel-section">
                    <div class="panel-section-title">Card Sandbox</div>
                    <div class="spawner-grid">
                        <div class="spawner-column">
                            <div class="spawner-col-title">Spawn In Hand</div>
                            <div class="element-grid">
                                <button class="panel-btn el-btn" id="spawn-h-fire" style="--color: var(--color-fire); --glow: var(--color-fire-glow);"><img src="assets/icons/Fire.png" class="el-icon"> Fire</button>
                                <button class="panel-btn el-btn" id="spawn-h-earth" style="--color: var(--color-earth); --glow: var(--color-earth-glow);"><img src="assets/icons/Earth.png" class="el-icon"> Earth</button>
                                <button class="panel-btn el-btn" id="spawn-h-air" style="--color: var(--color-air); --glow: var(--color-air-glow);"><img src="assets/icons/Air.png" class="el-icon"> Air</button>
                                <button class="panel-btn el-btn" id="spawn-h-water" style="--color: var(--color-water); --glow: var(--color-water-glow);"><img src="assets/icons/Water.png" class="el-icon"> Water</button>
                                <button class="panel-btn el-btn clear-btn" id="clear-hand">Clear Hand</button>
                            </div>
                        </div>
                        <div class="spawner-column">
                            <div class="spawner-col-title">Spawn On Board</div>
                            <div class="element-grid">
                                <button class="panel-btn el-btn" id="spawn-b-fire" style="--color: var(--color-fire); --glow: var(--color-fire-glow);"><img src="assets/icons/Fire.png" class="el-icon"> Fire</button>
                                <button class="panel-btn el-btn" id="spawn-b-earth" style="--color: var(--color-earth); --glow: var(--color-earth-glow);"><img src="assets/icons/Earth.png" class="el-icon"> Earth</button>
                                <button class="panel-btn el-btn" id="spawn-b-air" style="--color: var(--color-air); --glow: var(--color-air-glow);"><img src="assets/icons/Air.png" class="el-icon"> Air</button>
                                <button class="panel-btn el-btn" id="spawn-b-water" style="--color: var(--color-water); --glow: var(--color-water-glow);"><img src="assets/icons/Water.png" class="el-icon"> Water</button>
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
            this.scene.playSound('click');
        };

        tab.addEventListener('click', togglePanel);
        document.getElementById('panel-close-btn').addEventListener('click', togglePanel);

        // 1. Weather Cycle Handlers
        const weatherIds = ['w-neutral', 'w-fire', 'w-earth', 'w-air', 'w-water'];
        const elementsList = ['neutral', 'fire', 'earth', 'air', 'water'];
        
        weatherIds.forEach((id, idx) => {
            const btn = document.getElementById(id);
            btn.addEventListener('click', () => {
                this.scene.playSound('click');
                // Deactivate all cycle buttons
                weatherIds.forEach(wid => document.getElementById(wid).classList.remove('active-weather'));
                btn.classList.add('active-weather');

                // Force game cycle logic
                this.scene.cycleIndex = idx;
                const el = elementsList[idx];
                this.scene.logMessage(`[Sandbox] Forced Cycle to: [${el.toUpperCase()}]`);

                // Rotate visual dial
                this.scene.tweens.add({
                    targets: this.scene.cycleContainer,
                    rotation: -(idx - 1) * (Math.PI / 2),
                    duration: 500,
                    ease: 'Cubic.easeOut'
                });
                this.scene.triggerCycleParticles(el);
                this.scene.updateComboPreview();
            });
        });

        // 2. Card Spawn Handlers
        const spawnCard = (zone, el) => {
            this.scene.playSound('draw');
            if (zone === 'hand') {
                this.scene.player.hand.push(el);
                this.scene.updatePlayerHandDisplay();
            } else {
                if (this.scene.player.board.length < 5) {
                    this.scene.player.board.push(el);
                    this.scene.updatePlayerBoardDisplay();
                } else {
                    this.showSandboxNotification("Board is full!");
                }
            }
            this.scene.updatePlayerLifeDisplay();
            this.scene.updateComboPreview();
        };

        ['fire', 'earth', 'air', 'water'].forEach(el => {
            document.getElementById(`spawn-h-${el}`).addEventListener('click', () => spawnCard('hand', el));
            document.getElementById(`spawn-b-${el}`).addEventListener('click', () => spawnCard('board', el));
        });

        document.getElementById('clear-hand').addEventListener('click', () => {
            this.scene.playSound('fire');
            this.scene.player.hand = [];
            this.scene.updatePlayerHandDisplay();
            this.scene.updatePlayerLifeDisplay();
            this.scene.updateComboPreview();
            this.scene.logMessage("[Sandbox] Cleared Player hand.");
        });

        document.getElementById('clear-board').addEventListener('click', () => {
            this.scene.playSound('fire');
            this.scene.player.board = [];
            this.scene.selectedBoardMana = [];
            this.scene.updatePlayerBoardDisplay();
            this.scene.updatePlayerLifeDisplay();
            this.scene.updateComboPreview();
            this.scene.logMessage("[Sandbox] Cleared Player board mana.");
        });

        // 3. Dummy Behavior Handlers
        const btnDummyPassive = document.getElementById('btn-dummy-passive');
        const btnDummyActive = document.getElementById('btn-dummy-active');

        btnDummyPassive.addEventListener('click', () => {
            this.scene.playSound('click');
            this.scene.dummyMode = 'passive';
            btnDummyPassive.classList.add('btn-passive-ai');
            btnDummyActive.classList.remove('btn-active-ai');
            this.scene.logMessage("[Sandbox] Dummy set to PASSIVE Mode.");
        });

        btnDummyActive.addEventListener('click', () => {
            this.scene.playSound('click');
            this.scene.dummyMode = 'active';
            btnDummyActive.classList.add('btn-active-ai');
            btnDummyPassive.classList.remove('btn-passive-ai');
            this.scene.logMessage("[Sandbox] Dummy set to ACTIVE AI Mode.");
        });

        document.getElementById('btn-dummy-shield5').addEventListener('click', () => {
            this.scene.playSound('shield');
            this.scene.ai.shield += 5;
            this.scene.updateShieldDisplay('ai');
            this.scene.logMessage(`[Sandbox] Granted Dummy +5 Shield. Total: ${this.scene.ai.shield}`);
        });

        document.getElementById('btn-dummy-shield10').addEventListener('click', () => {
            this.scene.playSound('shield');
            this.scene.ai.shield += 10;
            this.scene.updateShieldDisplay('ai');
            this.scene.logMessage(`[Sandbox] Granted Dummy +10 Shield. Total: ${this.scene.ai.shield}`);
        });

        document.getElementById('btn-dummy-reset').addEventListener('click', () => {
            this.scene.playSound('shield');
            this.resetDummyState();
            this.showSandboxNotification("Dummy Health Reset!");
            this.scene.logMessage("[Sandbox] Reset Dummy Health.");
        });

        // 4. Populating Spell Catalog Scroll
        if (!this.scene.spellsCatalog) {
            this.scene.getSpellFromCombo([]);
        }
        
        const scrollList = document.getElementById('spell-list-scroll');
        const searchInput = document.getElementById('spell-search-input');
        
        const renderSpellList = (filterText = '') => {
            scrollList.innerHTML = '';
            const lowerFilter = filterText.toLowerCase();
            
            Object.keys(this.scene.spellsCatalog).forEach(comboKey => {
                const spell = this.scene.spellsCatalog[comboKey];
                
                if (filterText && !spell.name.toLowerCase().includes(lowerFilter) && !spell.element.toLowerCase().includes(lowerFilter)) {
                    return;
                }
                
                const elementIcon = spell.element === 'fire' ? '<img src="assets/icons/Fire.png" class="el-icon">' :
                                    spell.element === 'earth' ? '<img src="assets/icons/Earth.png" class="el-icon">' :
                                    spell.element === 'water' ? '<img src="assets/icons/Water.png" class="el-icon">' :
                                    spell.element === 'air' ? '<img src="assets/icons/Air.png" class="el-icon">' : '<span class="grey-dot"></span>';
                
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
                    if (this.scene.phase === 'discard') {
                        this.showSandboxNotification("Must discard first!");
                        return;
                    }
                    
                    this.scene.playSound('click');
                    this.scene.logMessage(`[Sandbox] Instant Casting: ${spell.name}!`);
                    const w = this.scene.scale.width;
                    
                    // Visual spell fire from player center to AI center
                    this.scene.triggerSpellVisual(spell, w / 2 - 100, 500, w / 2 - 100, 100, () => {
                        this.scene.combat.initiateAttack('player', 'ai', spell);
                    });
                });
            });
        };

        renderSpellList();

        searchInput.addEventListener('input', (e) => {
            renderSpellList(e.target.value);
        });

        // 5. Clean up events on Phaser scene shutdown
        this.scene.events.on('shutdown', () => {
            document.body.classList.remove('in-game');
            // Release orientation lock when returning to menu
            try { screen.orientation.unlock(); } catch(e) {}
            const notifEl = document.getElementById('sandbox-notif');
            const tabEl = document.getElementById('sandbox-tab');
            const panelEl = document.getElementById('sandbox-panel');
            if (notifEl) notifEl.remove();
            if (tabEl) tabEl.remove();
            if (panelEl) panelEl.remove();
        });
    }\n



    showSandboxNotification(text) {
        const notif = document.getElementById('sandbox-notif');
        if (notif) {
            notif.textContent = text.toUpperCase();
            notif.classList.add('show');
            setTimeout(() => {
                notif.classList.remove('show');
            }, 3000);
        }
    }\n



    resetDummyState() {
        this.scene.ai.hand = [];
        this.scene.ai.board = [];
        this.scene.ai.shield = 0;
        this.scene.ai.steamDebuff = false;
        this.scene.ai.maxHand = 8;
        
        this.scene.ai.consecutiveDiscards = 0;
        
        // Restore random 4 hand cards and 3 board cards
        for (let i = 0; i < 4; i++) {
            this.scene.ai.hand.push(this.scene.drawCard() || 'fire');
        }
        for (let i = 0; i < 3; i++) {
            this.scene.ai.board.push(this.scene.drawCard() || 'earth');
        }
        
        this.scene.updateAIHandDisplay();
        this.scene.updateAIBoardDisplay();
        this.scene.updateAILifeDisplay();
        this.scene.updateShieldDisplay('ai');

        if (this.scene.mode === 'test') {
            this.scene.phase = 'action';
            this.scene.cardsToDiscardCount = 0;
            this.scene.selectedBoardMana = [];
            if (this.scene.discardPromptText) this.scene.discardPromptText.setVisible(false);
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
        }
    }\n



    resetPlayerState() {
        this.scene.player.hand = [];
        this.scene.player.board = [];
        this.scene.player.shield = 0;
        this.scene.player.steamDebuff = false;
        this.scene.player.maxHand = 8;
        this.scene.selectedBoardMana = [];
        this.scene.player.consecutiveDiscards = 0;
        
        // Restore random 4 hand cards and 3 board cards
        for (let i = 0; i < 4; i++) {
            this.scene.player.hand.push(this.scene.drawCard() || 'fire');
        }
        for (let i = 0; i < 3; i++) {
            this.scene.player.board.push(this.scene.drawCard() || 'earth');
        }
        
        this.scene.updatePlayerHandDisplay();
        this.scene.updatePlayerBoardDisplay();
        this.scene.updatePlayerLifeDisplay();
        this.scene.updateShieldDisplay('player');
        this.scene.updateComboPreview();
        this.scene.enablePlayerControls(true);

        if (this.scene.mode === 'test') {
            this.scene.phase = 'action';
            this.scene.cardsToDiscardCount = 0;
            if (this.scene.discardPromptText) this.scene.discardPromptText.setVisible(false);
        }
    }\n

}
