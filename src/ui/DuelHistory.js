export class DuelHistory {
    constructor(scene) {
        this.scene = scene;
        this.titleText = null;
    }

    setVisible(visible) {
        if (this.titleText) this.titleText.setVisible(visible);
        if (this.scene.logContainer) this.scene.logContainer.setVisible(visible);
    }



    drawActionLog() {
        const w = this.scene.scale.width;
        const h = this.scene.scale.height;
        this.titleText = this.scene.add.text(20, h - 425, 'DUEL HISTORY:', {
            fontFamily: '"Inter", sans-serif',
            fontSize: '13px',
            fontWeight: '600',
            color: '#ffffff',
            letterSpacing: 1
        });

        this.scene.allLogTextLines = [];
        this.scene.logContainer = this.scene.add.container(20, h - 400);

        // Drawer backing
        const logBg = this.scene.add.graphics();
        logBg.fillStyle(0x1a1410, 0.8);
        logBg.lineStyle(1, 0x4a4a4a, 0.25);
        logBg.fillRoundedRect(0, 0, 340, 380, 8);
        logBg.strokeRoundedRect(0, 0, 340, 380, 8);
        this.scene.logContainer.add(logBg);

        // Scrolling container for log lines
        this.scene.logScrollContainer = this.scene.add.container(0, 0);
        this.scene.logContainer.add(this.scene.logScrollContainer);

        // Mask to restrict visible area to the inside of the history box
        // Viewport bounds: X = 20 + 8, Y = h - 400 + 10, Width = 324, Height = 360
        const maskShape = this.scene.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(28, h - 390, 324, 360, 8);
        const mask = maskShape.createGeometryMask();
        this.scene.logScrollContainer.setMask(mask);

        // Scrollbar track and handle graphics
        this.scene.logScrollbarGraphics = this.scene.add.graphics();
        this.scene.logContainer.add(this.scene.logScrollbarGraphics);

        // Setup global pointer listeners for drag-scrolling and scrollbar dragging
        this.scene.isDraggingHistory = false;
        this.scene.isDraggingScrollbar = false;
        this.scene.dragStartY = 0;
        this.scene.dragStartScrollY = 0;

        // Mouse wheel scrolling bounds checking
        this.scene.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            const w = this.scene.scale.width;
            const relativeX = pointer.x - (w - 370);
            const relativeY = pointer.y - 50;
            // Check if pointer is inside the history box
            if (relativeX >= 0 && relativeX <= 340 && relativeY >= 0 && relativeY <= 380) {
                this.scrollDuelHistory(deltaY);
            }
        });

        this.scene.input.on('pointerdown', (pointer) => {
            const w = this.scene.scale.width;
            const relativeX = pointer.x - (w - 370);
            const relativeY = pointer.y - 50;

            // Check if pointer is inside the history box
            if (relativeX >= 0 && relativeX <= 340 && relativeY >= 0 && relativeY <= 380) {
                // If it is inside the scrollbar area (X: 320 to 338, Y: 10 to 370)
                if (relativeX >= 320 && relativeX <= 338 && relativeY >= 10 && relativeY <= 370) {
                    const totalHeight = this.getLogTotalHeight();
                    const viewportHeight = 360;
                    if (totalHeight > viewportHeight) {
                        this.scene.isDraggingScrollbar = true;
                        const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
                        this.scrollHistoryByScrollbarY(relativeY, handleHeight);
                    }
                } else {
                    // Otherwise, it is a drag-scroll on the text area
                    this.scene.isDraggingHistory = true;
                    this.scene.dragStartY = pointer.y;
                    this.scene.dragStartScrollY = this.scene.logScrollContainer.y;
                }
            }
        });

        this.scene.input.on('pointermove', (pointer) => {
            if (this.scene.isDraggingScrollbar) {
                const relativeY = pointer.y - 50;
                const totalHeight = this.getLogTotalHeight();
                const viewportHeight = 360;
                const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
                this.scrollHistoryByScrollbarY(relativeY, handleHeight);
            } else if (this.scene.isDraggingHistory) {
                const deltaY = pointer.y - this.scene.dragStartY;
                this.scrollDuelHistoryTo(this.scene.dragStartScrollY + deltaY);
            }
        });

        this.scene.input.on('pointerup', () => {
            this.scene.isDraggingHistory = false;
            this.scene.isDraggingScrollbar = false;
        });
    }



    logMessage(msg) {
        console.log(`[Whelmen] ${msg}`);

        // Safety: if log UI not ready yet, just console log
        if (!this.scene.allLogTextLines || !this.scene.logScrollContainer) return;

        // Keep a maximum of 150 messages in history to prevent any massive memory build-up over long play sessions
        if (this.scene.allLogTextLines.length >= 150) {
            const old = this.scene.allLogTextLines.shift();
            const shiftY = old.height + 6;
            old.destroy();
            this.scene.allLogTextLines.forEach(line => {
                line.y -= shiftY;
            });
        }

        // Add new
        const color = msg.includes('VICTORY') ? '#a67032' :
                      msg.includes('DEFEAT') ? '#df1b2d' :
                      msg.includes('Reaction') ? '#bf8cff' :
                      msg.includes('---') ? '#d4af37' : '#cbd5e1';

        let targetY = 15;
        if (this.scene.allLogTextLines.length > 0) {
            const lastLine = this.scene.allLogTextLines[this.scene.allLogTextLines.length - 1];
            targetY = lastLine.y + lastLine.height + 6;
        }

        const textLine = this.scene.add.text(12, targetY, msg, {
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            color: color,
            wordWrap: { width: 305 }
        });

        // Make interactive for hovering spell details
        textLine.setInteractive();
        textLine.originalColor = color;
        textLine.on('pointerover', (pointer) => {
            const spell = this.scene.findSpellInMessage(msg);
            if (spell) {
                textLine.setColor('#ffffff');
                const isAI = msg.toLowerCase().includes('ai') || msg.toLowerCase().includes('opponent');
                this.showLogTooltip(spell, isAI);
            }
        });
        textLine.on('pointerout', () => {
            textLine.setColor(textLine.originalColor);
            this.hideLogTooltip();
        });

        this.scene.logScrollContainer.add(textLine);
        this.scene.allLogTextLines.push(textLine);

        // Auto-scroll to the bottom when a new message is added
        const totalHeight = this.getLogTotalHeight();
        const viewportHeight = 360;
        if (totalHeight > viewportHeight) {
            this.scene.logScrollContainer.y = viewportHeight - totalHeight;
        } else {
            this.scene.logScrollContainer.y = 0;
        }
        this.updateScrollbar();
    }



    showLogTooltip(spell, isAI) {
        this.scene.updatePanelVisuals(isAI, spell);
    }



    hideLogTooltip() {
        if (this.scene.incomingSpellPanel) this.scene.incomingSpellPanel.setVisible(false);
        if (this.scene.primedSpellPanel) this.scene.primedSpellPanel.setVisible(false);
        this.scene.updateComboPreview();
    }



    getLogTotalHeight() {
        if (!this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return 0;
        const lastLine = this.scene.allLogTextLines[this.scene.allLogTextLines.length - 1];
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
        
        this.scene.logScrollContainer.y = scrollRatio * maxScroll;
        this.updateScrollbar();
    }



    scrollDuelHistoryTo(targetY) {
        if (!this.scene.logScrollContainer || !this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return;
        
        const viewportHeight = 360;
        const totalHeight = this.getLogTotalHeight();
        
        if (totalHeight <= viewportHeight) {
            this.scene.logScrollContainer.y = 0;
            this.updateScrollbar();
            return;
        }
        
        const minY = viewportHeight - totalHeight;
        const maxY = 0;
        
        if (targetY < minY) targetY = minY;
        if (targetY > maxY) targetY = maxY;
        
        this.scene.logScrollContainer.y = targetY;
        this.updateScrollbar();
    }



    scrollDuelHistory(deltaY) {
        if (!this.scene.logScrollContainer || !this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return;
        
        // Scroll by 1 line height (26px) per tick
        const scrollAmount = -Math.sign(deltaY) * 26;
        this.scrollDuelHistoryTo(this.scene.logScrollContainer.y + scrollAmount);
    }



    updateScrollbar() {
        if (!this.scene.logScrollbarGraphics) return;
        
        this.scene.logScrollbarGraphics.clear();
        
        const viewportHeight = 360;
        const totalHeight = this.getLogTotalHeight();
        
        if (totalHeight <= viewportHeight) return;
        
        const handleHeight = Math.max(30, (viewportHeight / totalHeight) * viewportHeight);
        const maxScroll = viewportHeight - totalHeight;
        const scrollRatio = maxScroll === 0 ? 0 : (this.scene.logScrollContainer.y / maxScroll);
        
        const maxHandleTravel = 360 - handleHeight;
        const handleY = 10 + scrollRatio * maxHandleTravel;
        
        // Draw track with a subtle, premium glassmorphic border/fill (height 360)
        this.scene.logScrollbarGraphics.fillStyle(0xffffff, 0.04);
        this.scene.logScrollbarGraphics.fillRoundedRect(328, 10, 6, 360, 3);
        
        // Draw glowing aesthetic scroll handle
        this.scene.logScrollbarGraphics.fillStyle(0x7c3aed, 0.7); // vibrant purple
        this.scene.logScrollbarGraphics.lineStyle(1, 0xa78bfa, 0.95); // glowing border
        this.scene.logScrollbarGraphics.fillRoundedRect(328, handleY, 6, handleHeight, 3);
        this.scene.logScrollbarGraphics.strokeRoundedRect(328, handleY, 6, handleHeight, 3);
    }

}
