export class CombatSystem {
    constructor(scene) {
        this.scene = scene;
    }

    consumeBoardMana(who, indices) {
        const state = who === 'player' ? this.scene.player : this.scene.ai;
        const sorted = [...indices].sort((a, b) => b - a);
        for (const i of sorted) {
            this.scene.sharedDiscard.push(state.board.splice(i, 1)[0]);
        }
    }

    resolvePostAction() {
        if (this.scene.pendingExtraAction) {
            this.scene.pendingExtraAction = false;
            this.scene.manaPlacedThisTurn = false; 
            this.scene.spellCastThisTurn = false;
            this.scene.logMessage(`${this.scene.turn.toUpperCase()} gets another action!`);
            if (this.scene.turn === 'player') {
                this.scene.phase = 'action';
                this.scene.enablePlayerControls(true);
            } else {
                this.scene.runAITurn();
            }
        } else {
            this.scene.checkTurnContinuation();
        }
    }

    drawCardWithStatusEffects(who) {
        const char = who === 'player' ? this.scene.player : this.scene.ai;
        const drawn = this.scene.drawCard();
        if (drawn) {
            if (char.status.autoPlayDraw > 0 && char.board.length < 3) {
                char.board.push(drawn);
                this.scene.logMessage(`Auto-played drawn mana!`);
            } else {
                char.hand.push(drawn);
            }
            if (char.status.loseManaOnDraw > 0 && char.board.length > 0) {
                this.scene.sharedDiscard.push(char.board.pop());
                this.scene.logMessage(`${who.toUpperCase()} lost a board mana from drawing!`);
            }
        }
    }

initiateAttack('player', 'ai', spell);
        });
    }

    // --- COMBAT RESOLUTION & REACTION WINDOW ---
    initiateAttack(attacker, defender, spell) {
        let defChar = defender === 'player' ? this.scene.player : this.scene.ai;
        let attChar = attacker === 'player' ? this.scene.player : this.scene.ai;
        const cycle = this.scene.cycleElements[this.scene.cycleIndex];

        // Status: Random Targeting
        if (attChar.status.randomTargeting > 0) {
            if (Math.random() < 0.5) {
                defender = attacker;
                defChar = attChar;
                this.scene.logMessage(`Chaos! ${attacker.toUpperCase()}'s spell targets themselves!`);
            }
        }
        
        // Status: Spell Fail Chance
        if (attChar.status.spellFailChance > 0) {
            if (Math.random() < 0.5) {
                this.scene.logMessage(`${attacker.toUpperCase()}'s spell fizzled out!`);
                this.scene.time.delayedCall(800, () => this.scene.endTurn());
                return;
            }
        }

        let isEmp = this.scene.synergy.calculateSynergy(spell, cycle);

        let finalDmg = spell.damage;
        let finalShield = spell.shield;
        let finalDraw = spell.draw;
        let finalDrain = spell.drain;
        
        // Miss Chance Status
        if (attChar.status.missChance > 0 && finalDmg > 0) {
            if (Math.random() < 0.5) {
                finalDmg = 0;
                this.scene.logMessage(`${attacker.toUpperCase()}'s attack missed!`);
            }
        }

        // Damage Immunity Status
        if (defChar.status.damageImmunity > 0) {
            finalDmg = 0;
            this.scene.logMessage(`${defender.toUpperCase()} is immune to damage this round!`);
        }

        if (isEmp) {
            const overrides = this.scene.synergy.getEmpoweredOverrides(spell.name);
            if (overrides.damage) finalDmg = overrides.damage;
            if (overrides.shield) finalShield = overrides.shield;
            if (overrides.draw) finalDraw = overrides.draw;
            if (overrides.drain) finalDrain = overrides.drain;
            
            // Immediate synergy effects (not deferred status)
            if (spell.name === 'Wildfire') this.scene.pendingExtraAction = true;
            if (spell.name === 'Billow') { this.scene.logMessage('Top 3 cards cycled!'); for(let i=0;i<3;i++) { let d = this.scene.sharedDeck.shift(); if(d) this.scene.sharedDeck.push(d); } }
            if (spell.name === 'Vaporize') { this.scene.logMessage('Top 3 cards destroyed!'); for(let i=0;i<3;i++) { let d = this.scene.sharedDeck.shift(); if(d) this.scene.sharedDiscard.push(d); } this.scene.updateDeckDiscardDisplay(); }
            if (spell.name === 'Scour') { defChar.shield = 0; this.scene.updateShieldDisplay(defender); this.scene.logMessage(`${defender.toUpperCase()}'s shield scoured!`); }
        }

        // Force Cycle always triggers (not gated by isEmp)
        if (spell.synergyType === 'force_cycle') {
            const fcMap = { 'Tempest': 'air', 'Pillar': 'earth', 'Blaze': 'fire', 'Deluge': 'water' };
            const fcEl = fcMap[spell.name];
            if (fcEl) {
                this.scene.cycleIndex = this.scene.cycleElements.indexOf(fcEl);
                this.scene.logMessage(`The Cycle is forced to ${fcEl.toUpperCase()}!`);
                this.scene.cycleCenterText.setText(fcEl.toUpperCase());
                this.scene.triggerCycleParticles(fcEl);
            }
        }

        // Apply self buffs immediately (like shields)
        if (finalShield > 0) {
            if (attChar.status.shieldDamageDebuff > 0) {
                this.scene.forceDiscardRandom(attacker, 1);
                this.scene.logMessage(`${attacker.toUpperCase()} takes 1 damage from unstable shield!`);
            }
            attChar.shield += finalShield;
            this.scene.updateShieldDisplay(attacker);
            this.scene.logMessage(`${attacker.toUpperCase()} gains ${finalShield} Shield.`);
        }

        // Draw logic
        if (finalDraw > 0) {
            for (let i = 0; i < finalDraw; i++) {
                const drawn = this.scene.drawCard();
                if (drawn) {
                    if (attChar.status.autoPlayDraw > 0 && attChar.board.length < 3) {
                        attChar.board.push(drawn);
                        this.scene.logMessage(`Auto-played drawn mana!`);
                    } else {
                        attChar.hand.push(drawn);
                    }
                    if (attChar.status.loseManaOnDraw > 0 && attChar.board.length > 0) {
                        this.scene.sharedDiscard.push(attChar.board.pop());
                        this.scene.logMessage(`${attacker.toUpperCase()} lost a board mana from drawing!`);
                    }
                }
            }
            this.scene.updatePlayerHandDisplay(); this.scene.updatePlayerBoardDisplay(); this.scene.updatePlayerLifeDisplay();
            this.scene.updateAIHandDisplay(); this.scene.updateAIBoardDisplay(); this.scene.updateAILifeDisplay();
        }
        
        // Drain logic
        if (finalDrain > 0) {
            this.scene.forceDiscardRandom(defender, finalDrain);
        }

        if (isEmp) {
            this.scene.synergy.applyDeferredStatusEffects(spell.name, attChar, defChar);
        }
        // Trigger reaction window if there's incoming damage and defender has active mana
        if (finalDmg > 0 && defChar.board.length > 0) {
            this.scene.startReactionPhase(attacker, defender, { ...spell, damage: finalDmg, bypassShield: false });
        } else {
            // Direct hit
            if (finalDmg > 0) {
                if (defChar.status.retaliationDamage > 0) {
                    this.scene.forceDiscardRandom(attacker, 1);
                    this.scene.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
                }
                this.scene.applyDamage(defender, finalDmg, false);
            } else {
                // Done with spelling, auto-end turn after a slight delay
                this.scene.time.delayedCall(800, () => this.resolvePostAction());
            }
        }
    }

    startReactionPhase(attacker, defender, incomingSpell) {
        this.scene.phase = 'reaction';
        this.scene.reactionTargetSpell = incomingSpell;
        this.scene.reactionSource = attacker;
        this.scene.reactionCaster = defender;

        this.scene.logMessage(`Reaction window triggers for ${defender.toUpperCase()}!`);

        if (defender === 'player') {
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
        } else {
            if (this.scene.mode === 'online') {
                this.scene.logMessage('Waiting for opponent to react...');
                this.scene.phase = 'reaction_request';
                this.scene.syncToFirebase('reaction_request');
            } else {
                // AI Reaction automation
                this.scene.time.delayedCall(1000, () => {
                    const reactionSpell = this.scene.calculateAIReaction(incomingSpell.damage);
                    this.scene.resolveDefendingReaction(reactionSpell);
                });
            }
        }
    }

    resolveDefendingReaction(reactionSpell) {

        const defender = this.scene.reactionCaster;
        const attacker = this.scene.reactionSource;
        const defChar = defender === 'player' ? this.scene.player : this.scene.ai;
        const attChar = attacker === 'player' ? this.scene.player : this.scene.ai;

        if (reactionSpell) {
            this.scene.logMessage(`${defender.toUpperCase()} casts reaction: ${reactionSpell.name}!`);

            // Apply synergy using the new three-way system
            const cycle = this.scene.cycleElements[this.scene.cycleIndex];
            let isEmp = false;
            if (reactionSpell.synergyType === 'constructive' && cycle === reactionSpell.element) isEmp = true;
            else if (reactionSpell.synergyType === 'destructive' && cycle !== reactionSpell.element && reactionSpell.combo.includes(cycle)) isEmp = true;
            else if (reactionSpell.synergyType === 'prestructive' && reactionSpell.combo && !reactionSpell.combo.includes(cycle)) isEmp = true;

            let rDmg = reactionSpell.damage;
            let rShield = reactionSpell.shield;

            if (isEmp) {
                // Apply empowered value overrides for reaction spells
                if (reactionSpell.name === 'Shell') rShield = 5;
                if (reactionSpell.name === 'Spark') rDmg = 3;
                if (reactionSpell.name === 'Carapace') rShield = 8;
                if (reactionSpell.name === 'Blast') rDmg = 5;
                this.scene.logMessage(`${reactionSpell.name} is empowered by synergy!`);
            }

            // Apply reaction shield
            if (rShield > 0) {
                defChar.shield += rShield;
                this.scene.updateShieldDisplay(defender);
                this.scene.logMessage(`${defender.toUpperCase()} gains ${rShield} Reaction Shield.`);
            }

            // Counter damage check
            if (rDmg > 0) {
                this.scene.logMessage(`Reaction deals ${rDmg} counter damage back!`);
                this.scene.applyDamage(attacker, rDmg);
            }
        } else {
            this.scene.logMessage(`${defender.toUpperCase()} takes the direct hit.`);
        }

        // Retaliaton damage: fires when defender has retaliationDamage status
        if (defChar.status.retaliationDamage > 0) {
            this.scene.forceDiscardRandom(attacker, 1);
            this.scene.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
        }

        // Apply incoming damage minus final shield
        const finalDmg = this.scene.reactionTargetSpell.damage;
        this.scene.applyDamage(defender, finalDmg, this.scene.reactionTargetSpell.bypassShield || false);
    }

    applyDamage(who, amount, bypassShield = false) {
        const char = who === 'player' ? this.scene.player : this.scene.ai;
        
        // Shield absorption (Lava Surge bypasses shields entirely)
        if (bypassShield) {
            this.scene.logMessage(`Lava Surge bypasses ${who.toUpperCase()}'s shield!`);
        } else if (char.shield > 0) {
            if (char.shield >= amount) {
                char.shield -= amount;
                this.scene.logMessage(`${who.toUpperCase()}'s shield absorbed all ${amount} DMG!`);
                amount = 0;
            } else {
                amount -= char.shield;
                this.scene.logMessage(`${who.toUpperCase()}'s shield absorbed ${char.shield} DMG. ${amount} DMG passes through!`);
                char.shield = 0;
            }
            this.scene.updateShieldDisplay(who);
        }

        // Clean giant fortress temporary shield
        if (who === 'player' && char.shield > 90) char.shield = 0;
        if (who === 'ai' && char.shield > 90) char.shield = 0;
        this.scene.updateShieldDisplay(who);

        if (amount > 0) {
            this.scene.logMessage(`${who.toUpperCase()} is hit for ${amount} DMG!`);
            this.scene.playSound('hit');

            // Set state to discard
            this.scene.phase = 'discard';
            this.scene.enablePlayerControls(false);

            if (who === 'player') {
                this.scene.cardsToDiscardCount = amount;
                this.scene.promptDiscardSelection();
            } else {
                if (this.scene.mode === 'online') {
                    this.scene.phase = 'discard_request';
                    this.scene.discardTargetCount = amount;
                    this.scene.syncToFirebase('discard_request');
                    this.scene.logMessage('Waiting for opponent to discard...');
                } else {
                    // AI automatically discards
                    this.scene.runAIDiscardAutomation(amount);
                }
            }
        } else {
            // Attack completed without card losses
            this.scene.time.delayedCall(800, () => {
                if (this.scene.pendingExtraAction) {
                    this.scene.pendingExtraAction = false;
                    this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                    this.scene.logMessage(`${this.scene.turn.toUpperCase()} gets another action!`);
                    if (this.scene.turn === 'player') {
                        this.scene.phase = 'action';
                        this.scene.enablePlayerControls(true);
                    } else {
                        this.scene.runAITurn();
                    }
                } else {
                    this.scene.checkTurnContinuation();
                }
            });
        }
    }

    // --- PLAYER MANUAL DISCARD HANDLING ---
    promptDiscardSelection() {
        // Double check if player has enough cards left to discard
        const total = this.scene.player.hand.length + this.scene.player.board.length;
        if (total === 0 || total <= this.scene.cardsToDiscardCount) {
            this.scene.logMessage("Player is out of cards!");
            this.scene.player.hand = [];
            this.scene.player.board = [];
            this.scene.updatePlayerHandDisplay();
            this.scene.updatePlayerBoardDisplay();
            this.scene.updatePlayerLifeDisplay();
            this.scene.checkDefeatCondition('player');
            return;
        }

        this.scene.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.scene.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
        this.scene.discardPromptText.setVisible(true);
    }

    discardCardFromZone(zone, index, who) {
        if (who === 'player' && (this.scene.phase === 'discard' || this.scene.phase === 'discard_request_active') && this.scene.cardsToDiscardCount > 0) {
            const char = this.scene.player;
            let discarded;
            if (zone === 'hand') {
                discarded = char.hand.splice(index, 1)[0];
                this.scene.updatePlayerHandDisplay();
            } else {
                discarded = char.board.splice(index, 1)[0];
                this.scene.updatePlayerBoardDisplay();
            }

            this.scene.sharedDiscard.push(discarded);
            this.scene.updateDeckDiscardDisplay();
            this.scene.updatePlayerLifeDisplay();

            this.scene.cardsToDiscardCount--;
            this.scene.playSound('fire');

            if (this.scene.cardsToDiscardCount <= 0) {
                this.scene.discardPromptText.setVisible(false);
                this.scene.logMessage("Player finished discarding cards.");
                
                if (this.scene.phase === 'discard_request_active') {
                    this.scene.phase = 'discard_response';
                    this.scene.syncToFirebase('discard_response');
                    this.scene.enablePlayerControls(false);
                    this.scene.logMessage('Waiting for turn resolution...');
                } else {
                    this.scene.phase = 'action';
                    // End turn and rotate (or grant extra action)
                    this.scene.time.delayedCall(600, () => {
                        if (this.scene.pendingExtraAction) {
                            this.scene.pendingExtraAction = false;
                            this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                            this.scene.logMessage('Player gets another action!');
                            this.scene.enablePlayerControls(true);
                        } else {
                            this.scene.checkTurnContinuation();
                        }
                    });
                }
            } else {
                this.scene.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.scene.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
            }
        }
    }

    // --- AI STRATEGIC AGENT ---
    getValidBoardCombos(board) {
        const results = [];
        const n = board.length;
        if (n === 0) return results;
        
        // 1-card combos
        for (let i = 0; i < n; i++) results.push([i]);
        
        // 2-card combos
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                results.push([i, j]);
            }
        }
        
        // 3-card combos
        if (n >= 3) {
            results.push([0, 1, 2]);
        }
        
        return results;
    }

    scoreAISpell(spell, isReaction, incomingDamage) {
        let score = 0;
        const cycle = this.scene.cycleElements[this.scene.cycleIndex];
        
        let isEmp = false;
        if (spell.synergyType === 'constructive' && cycle === spell.element) isEmp = true;
        else if (spell.synergyType === 'destructive' && cycle !== spell.element && spell.combo.includes(cycle)) isEmp = true;
        else if (spell.synergyType === 'prestructive' && !spell.combo.includes(cycle)) isEmp = true;

        if (isReaction) {
            if (spell.shield > 0) {
                score += spell.shield * 10;
                if (spell.shield >= incomingDamage) score += 20; // Bonus for fully blocking
                if (isEmp) score += 5;
                score -= spell.combo.length; // Tie-breaker: use fewer cards
            } else {
                return -1; // Not a defensive spell
            }
        } else {
            score += spell.damage * 10;
            score += spell.shield * 8;
            score += spell.draw * 5;
            score += spell.drain * 6;
            
            if (isEmp) score += 15; // Strongly prefer empowered spells
            
            // Situational adjustments
            if (this.scene.ai.life <= 4) {
                score += spell.shield * 10; // Desperate for shield
                score += spell.drain * 10; // Desperate to drain opponent's capability
            }
            if (this.scene.player.life <= 4) {
                score += spell.damage * 15; // Go for the kill
            }
            
            score += spell.combo.length; 
        }
        
        return score;
    }

    checkTurnContinuation() {
        if (this.scene.turn === 'player' && (!this.scene.manaPlacedThisTurn || !this.scene.spellCastThisTurn)) {
            this.scene.phase = 'action';
            this.scene.enablePlayerControls(true);
        } else if (this.scene.turn === 'ai' && (!this.scene.manaPlacedThisTurn || !this.scene.spellCastThisTurn)) {
            this.scene.runAITurn();
        } else {
            this.scene.endTurn();
        }
    }

    runAITurn() {
        if (this.scene.phase === 'gameover') return;

        this.scene.logMessage("AI is evaluating options...");

        // Smart decision making logic:
        // 1. Play mana if board has less than 3 cards
        if (!this.scene.manaPlacedThisTurn && this.scene.ai.board.length < 3 && this.scene.ai.hand.length > 0) {
            this.scene.manaPlacedThisTurn = true;
            // Find a duplicate element or just play first
            const idxToPlay = 0; 
            const el = this.scene.ai.hand.splice(idxToPlay, 1)[0];
            this.scene.ai.board.push(el);

            this.scene.playSound('draw');
            this.scene.logMessage(`AI plays [${el.toUpperCase()}] mana to board.`);
            if (this.scene.ai.status.manaPlayDamage > 0) {
                this.scene.forceDiscardRandom('player', 1);
                this.scene.logMessage(`AI's mana play deals 1 damage to Player!`);
            }
            if (this.scene.player.status.oppManaPlayDamage > 0) {
                this.scene.forceDiscardRandom('ai', 1);
                this.scene.logMessage(`AI takes 1 damage from playing mana due to Player Surge!`);
            }
            
            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();

            this.scene.time.delayedCall(1200, () => {
                // Check bonusManaPlays: AI gets a second mana play
                if (this.scene.ai.status.bonusManaPlays > 0 && this.scene.ai.hand.length > 0 && this.scene.ai.board.length < 3) {
                    this.scene.ai.status.bonusManaPlays = 0;
                    this.scene.manaPlacedThisTurn = false;
                    this.scene.logMessage(`AI plays a second mana!`);
                    const el2 = this.scene.ai.hand.splice(0, 1)[0];
                    this.scene.ai.board.push(el2);
                    this.scene.logMessage(`AI plays [${el2.toUpperCase()}] mana to board.`);
                    this.scene.updateAIHandDisplay();
                    this.scene.updateAIBoardDisplay();
                    this.scene.updateAILifeDisplay();
                }
                this.scene.runAITurn();
            });
            return;
        }

        // 2. Try to form a spell combo from board
        if (!this.scene.spellCastThisTurn && this.scene.ai.board.length >= 2) {
            const combos = this.scene.getValidBoardCombos(this.scene.ai.board);
            let bestSpell = null;
            let bestComboIndices = null;
            let bestScore = -1;

            combos.forEach(indices => {
                const elements = indices.map(idx => this.scene.ai.board[idx]);
                const spell = this.scene.getSpellFromCombo(elements);
                if (spell) {
                    const score = this.scene.scoreAISpell(spell, false, 0);
                    if (score > bestScore) {
                        bestScore = score;
                        bestSpell = spell;
                        bestComboIndices = indices;
                    }
                }
            });

            if (bestSpell) {
                this.scene.spellCastThisTurn = true;
                // Consume
                bestComboIndices.sort((a,b) => b-a);
                bestComboIndices.forEach(idx => {
                    const consumed = this.scene.ai.board.splice(idx, 1)[0];
                    this.scene.sharedDiscard.push(consumed);
                });

                this.scene.updateAIBoardDisplay();
                this.scene.updateAILifeDisplay();
                this.scene.updateDeckDiscardDisplay();

                this.scene.logMessage(`AI casts: ${bestSpell.name}!`);

                const w = this.scene.scale.width;
                this.scene.triggerSpellVisual(bestSpell, w / 2 + 100, 200, w / 2 + 100, 500, () => {
                    this.scene.initiateAttack('ai', 'player', bestSpell);
                });
                return;
            }
        }

        if (this.scene.manaPlacedThisTurn || this.scene.spellCastThisTurn) {
            this.scene.logMessage("AI ends turn.");
            this.scene.time.delayedCall(1200, () => {
                this.scene.endTurn();
            });
            return;
        }

        // 3. Fallback: pass to draw
        this.scene.logMessage("AI chooses Pass to Draw.");
        const extra = this.scene.drawCard();
        if (extra) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (this.scene.ai.status.autoPlayDraw > 0 && this.scene.ai.board.length < 3) {
                this.scene.ai.board.push(extra);
                this.scene.logMessage(`AI's drawn mana is auto-played to board!`);
            } else {
                this.scene.ai.hand.push(extra);
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (this.scene.ai.status.loseManaOnDraw > 0 && this.scene.ai.hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * this.scene.ai.hand.length);
                const lost = this.scene.ai.hand.splice(lostIdx, 1)[0];
                this.scene.sharedDiscard.push(lost);
                this.scene.logMessage(`AI lost a hand mana from drawing!`);
            }

            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
        }

        this.scene.time.delayedCall(1200, () => {
            this.scene.endTurn();
        });
    }

    calculateAIReaction(incomingDamage) {
        if (this.scene.ai.board.length === 0) return null;
        if (this.scene.mode === 'test' && this.scene.dummyMode === 'passive') return null;

        const combos = this.scene.getValidBoardCombos(this.scene.ai.board);
        let bestSpell = null;
        let bestComboIndices = null;
        let bestScore = -1;

        combos.forEach(indices => {
            const elements = indices.map(idx => this.scene.ai.board[idx]);
            const spell = this.scene.getSpellFromCombo(elements);
            if (spell) {
                const score = this.scene.scoreAISpell(spell, true, incomingDamage);
                if (score > bestScore) {
                    bestScore = score;
                    bestSpell = spell;
                    bestComboIndices = indices;
                }
            }
        });

        if (bestSpell && bestScore > -1) {
            // Consume board mana
            bestComboIndices.sort((a,b) => b-a);
            bestComboIndices.forEach(idx => {
                const consumed = this.scene.ai.board.splice(idx, 1)[0];
                this.scene.sharedDiscard.push(consumed);
            });

            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
            this.scene.updateDeckDiscardDisplay();
            return bestSpell;
        }

        return null;
    }

    runAIDiscardAutomation(amount) {
        const total = this.scene.ai.hand.length + this.scene.ai.board.length;
        if (total === 0 || total <= amount) {
            this.scene.logMessage("AI is out of cards!");
            this.scene.ai.hand = [];
            this.scene.ai.board = [];
            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
            this.scene.checkDefeatCondition('ai');
            return;
        }

        this.scene.logMessage(`AI is selecting ${amount} card(s) to discard...`);

        for (let i = 0; i < amount; i++) {
            // Prefer discarding from board mana first if excess, then hand
            if (this.scene.ai.board.length > 1) {
                const burned = this.scene.ai.board.pop();
                this.scene.sharedDiscard.push(burned);
            } else {
                const burned = this.scene.ai.hand.pop();
                this.scene.sharedDiscard.push(burned);
            }
            this.scene.playSound('fire');
        }

        this.scene.updateAIHandDisplay();
        this.scene.updateAIBoardDisplay();
        this.scene.updateAILifeDisplay();
        this.scene.updateDeckDiscardDisplay();

        this.scene.phase = 'action';
        
        // Turn cleanup (or grant extra action)
        this.scene.time.delayedCall(1200, () => {
            if (this.scene.pendingExtraAction) {
                this.scene.pendingExtraAction = false;
                this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                if (this.scene.turn === 'player') {
                    this.scene.logMessage('Player gets another action!');
                    this.scene.enablePlayerControls(true);
                } else {
                    this.scene.logMessage('AI gets another action!');
                    this.scene.runAITurn();
                }
            } else {
                this.scene.checkTurnContinuation();
            }
        });
    }

    // --- ALPHABETICAL SPELL COMBO PARSER ---
    getSpellFromCombo(combo) {

        return getSpellFromCombo(combo);

    }

    isWeakenedByCycle(spellEl, cycleEl) {


        return isWeakenedByCycle(spellEl, cycleEl);


    }

    // --- GAME OVER DISPLAY ---
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
    }

    // ============================================================
    // ONLINE MULTIPLAYER ENGINE
    // ============================================================

    /**
     * Set up an online game. Host initializes state and syncs to Firebase.
     * Guest waits for the initial state from Firebase.
     */
    setupOnlineGame() {
        this.scene.logMessage(`Online mode: you are the ${this.scene.myRole.toUpperCase()}.`);
        this.scene.logMessage(`Lobby: ${this.scene.lobbyCode}`);

        if (this.scene.myRole === 'host') {
            // Host initializes the game state
            this.scene.initSharedDeck();
            this.scene.dealStartingHands();

            // Write initial state to Firebase so guest can load it
            this.scene.syncToFirebase('init');

            // Host goes first
            this.scene.startTurn('player');
        }

        // Both host and guest listen for state changes
        this.scene.startFirebaseListener();
    }

    /**
     * Serialize the current game state into a plain object for Firebase.
     */
    serializeState() {
        const myKey = this.scene.myRole;
        const oppKey = this.scene.myRole === 'host' ? 'guest' : 'host';

        return {
            deck: this.scene.sharedDeck.slice(),
            discard: this.scene.sharedDiscard.slice(),
            cycleIndex: this.scene.cycleIndex,
            firstCycleIndex: this.scene.firstCycleIndex,
            turn: this.scene.turn === 'player' ? myKey : oppKey,
            phase: this.scene.phase,
            actionUsed: this.scene.actionUsedThisTurn,
            [`${myKey}Hand`]: this.scene.player.hand.slice(),
            [`${myKey}Board`]: this.scene.player.board.slice(),
            [`${myKey}Shield`]: this.scene.player.shield,
            [`${myKey}Life`]: this.scene.player.life,
            [`${myKey}SteamDebuff`]: this.scene.player.steamDebuff || false,
            [`${oppKey}Hand`]: this.scene.ai.hand.slice(),
            [`${oppKey}Board`]: this.scene.ai.board.slice(),
            [`${oppKey}Shield`]: this.scene.ai.shield,
            [`${oppKey}Life`]: this.scene.ai.life,
            [`${oppKey}SteamDebuff`]: this.scene.ai.steamDebuff || false,
            reactionTargetSpell: this.scene.reactionTargetSpell || null,
            reactionResponseSpell: this.scene.reactionResponseSpell || null,
            reactionSource: this.scene.reactionSource || null,
            reactionCaster: this.scene.reactionCaster || null,
            discardTargetCount: this.scene.discardTargetCount || 0,
            seq: Date.now()
        };
    }

    /**
     * Write current state to Firebase.
     */
    async syncToFirebase(actionType) {
        if (this.scene.mode !== 'online' || !this.scene.lobbyCode) return;

        try {
            const state = this.scene.serializeState();
            const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);
            await ref.update({
                gameState: state,
                lastActionBy: this.scene.myRole,
                status: this.scene.phase === 'gameover' ? 'finished' : 'playing'
            });
        } catch (err) {
            console.error('[Whelmen Online] Sync error:', err);
            this.scene.logMessage('⚠ Network sync error. Retrying...');
        }
    }

    /**
     * Start listening for Firebase state changes from the opponent.
     */
    startFirebaseListener() {
        const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);

        const handler = (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.gameState) return;

            const state = data.gameState;
            const lastBy = data.lastActionBy;

            // Ignore our own writes
            if (lastBy === this.scene.myRole) return;

            // Handle disconnection
            if (data.status === 'abandoned' || data.status === 'disconnected') {
                this.scene.logMessage('⚠ Opponent disconnected!');
                this.scene.showDisconnectOverlay();
                return;
            }

            // Load the remote state
            this.scene.loadFromFirebase(state);
        };

        ref.on('value', handler);
        this.scene.firebaseUnsub = () => ref.off('value', handler);
    }

    /**
     * Load game state from Firebase (called when opponent acts).
     * Maps host/guest data to local player/ai based on our role.
     */
    loadFromFirebase(state) {
        const myKey = this.scene.myRole;
        const oppKey = this.scene.myRole === 'host' ? 'guest' : 'host';

        // Update deck and discard
        this.scene.sharedDeck = state.deck ? state.deck.slice() : [];
        this.scene.sharedDiscard = state.discard ? state.discard.slice() : [];

        // Update cycle
        this.scene.cycleIndex = state.cycleIndex || 0;
        this.scene.firstCycleIndex = state.firstCycleIndex || 1;

        // Map MY data to this.scene.player
        this.scene.player.hand = (state[`${myKey}Hand`] || []).slice();
        this.scene.player.board = (state[`${myKey}Board`] || []).slice();
        this.scene.player.shield = state[`${myKey}Shield`] || 0;
        this.scene.player.life = this.scene.player.hand.length + this.scene.player.board.length;
        this.scene.player.steamDebuff = state[`${myKey}SteamDebuff`] || false;

        // Map OPPONENT data to this.scene.ai
        this.scene.ai.hand = (state[`${oppKey}Hand`] || []).slice();
        this.scene.ai.board = (state[`${oppKey}Board`] || []).slice();
        this.scene.ai.shield = state[`${oppKey}Shield`] || 0;
        this.scene.ai.life = this.scene.ai.hand.length + this.scene.ai.board.length;
        this.scene.ai.steamDebuff = state[`${oppKey}SteamDebuff`] || false;

        // Update action state
        this.scene.actionUsedThisTurn = state.actionUsed || false;
        this.scene.phase = state.phase || 'action';

        // Determine whose turn it is locally
        const isMyTurn = state.turn === myKey;
        this.scene.turn = isMyTurn ? 'player' : 'ai';

        // Refresh all UI
        this.scene.refreshAllUI();

        // Handle game over
        if (state.phase === 'gameover') {
            this.scene.phase = 'gameover';
            return;
        }

        // Handle Request/Response phases FIRST
        if (state.phase === 'reaction_request' && !isMyTurn) {
            // We are the guest and need to react
            this.scene.reactionTargetSpell = state.reactionTargetSpell;
            this.scene.reactionSource = state.reactionSource;
            this.scene.reactionCaster = state.reactionCaster;
            
            this.scene.phase = 'reaction_request_active';
            this.scene.logMessage(`Reaction window triggers for you!`);
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            return;
        }

        if (state.phase === 'reaction_response' && isMyTurn) {
            // We are the host and the guest responded
            this.scene.phase = 'action'; // Reset phase internally
            const responseSpell = state.reactionResponseSpell || null;
            this.scene.resolveDefendingReaction(responseSpell);
            return;
        }

        if (state.phase === 'discard_request' && !isMyTurn) {
            this.scene.cardsToDiscardCount = state.discardTargetCount;
            this.scene.phase = 'discard_request_active';
            this.scene.promptDiscardSelection();
            return;
        }

        if (state.phase === 'discard_response' && isMyTurn) {
            this.scene.phase = 'action';
            // Complete the attack process
            this.scene.time.delayedCall(600, () => {
                if (this.scene.pendingExtraAction) {
                    this.scene.pendingExtraAction = false;
                    this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                    this.scene.logMessage('You get another action!');
                    this.scene.enablePlayerControls(true);
                } else {
                    this.scene.checkTurnContinuation();
                }
            });
            return;
        }

        // Normal Turn Logic
        if (isMyTurn) {
            this.scene.logMessage("--- YOUR TURN ---");
            this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            this.scene.logMessage('It is your turn. Choose an action.');
        } else {
            this.scene.enablePlayerControls(false);
            this.scene.logMessage('Waiting for opponent...');
        }
    }

    /**
     * Refresh all UI elements to match current state.
     */
    refreshAllUI() {
        this.scene.updatePlayerHandDisplay();
        this.scene.updatePlayerBoardDisplay();
        this.scene.updatePlayerLifeDisplay();
        this.scene.updateAIHandDisplay();
        this.scene.updateAIBoardDisplay();
        this.scene.updateAILifeDisplay();
        this.scene.updateDeckDiscardDisplay();
        // Update cycle indicator rotation directly
        if (this.scene.cycleContainer) {
            this.scene.cycleContainer.rotation = -(this.scene.cycleIndex - 1) * (Math.PI / 2);
            this.scene.updateCycleDisplayColor(this.scene.cycleElements[this.scene.cycleIndex]);
        }
        this.scene.updateComboPreview();

        // Update shield visuals
        this.scene.updateShieldDisplay('player');
        this.scene.updateShieldDisplay('ai');
    }

    /**
     * Show a disconnect overlay when opponent leaves.
     */
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
    }

    /**
     * Clean up Firebase listeners and lobby on exit.
     */
    cleanupOnline() {
        if (this.scene.firebaseUnsub) {
            this.scene.firebaseUnsub();
            this.scene.firebaseUnsub = null;
        }
        if (this.scene.lobbyCode) {
            firebase.database().ref(`lobbies/${this.scene.lobbyCode}/status`).set('finished').catch(() => {});
        }
    }

    update() {
        if (this.scene.cycleContainer) {
            const rot = this.scene.cycleContainer.rotation;
            if (this.scene.cycleCenterText) {
                this.scene.cycleCenterText.rotation = -rot;
            }
            if (this.scene.cycleLabels) {
                this.scene.cycleLabels.forEach(label => {
                    label.rotation = -rot;
                });
            }
        }
    }

    findSpellInMessage(msg) {


        return findSpellInMessage(msg);


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
        const totalHeight = this.scene.getLogTotalHeight();
        
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
        this.scene.updateScrollbar();
    }

    scrollDuelHistoryTo(targetY) {
        if (!this.scene.logScrollContainer || !this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return;
        
        const viewportHeight = 360;
        const totalHeight = this.scene.getLogTotalHeight();
        
        if (totalHeight <= viewportHeight) {
            this.scene.logScrollContainer.y = 0;
            this.scene.updateScrollbar();
            return;
        }
        
        const minY = viewportHeight - totalHeight;
        const maxY = 0;
        
        if (targetY < minY) targetY = minY;
        if (targetY > maxY) targetY = maxY;
        
        this.scene.logScrollContainer.y = targetY;
        this.scene.updateScrollbar();
    }

    scrollDuelHistory(deltaY) {
        if (!this.scene.logScrollContainer || !this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return;
        
        // Scroll by 1 line height (26px) per tick
        const scrollAmount = -Math.sign(deltaY) * 26;
        this.scene.scrollDuelHistoryTo(this.scene.logScrollContainer.y + scrollAmount);
    }

    updateScrollbar() {
        if (!this.scene.logScrollbarGraphics) return;
        
        this.scene.logScrollbarGraphics.clear();
        
        const viewportHeight = 360;
        const totalHeight = this.scene.getLogTotalHeight();
        
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
                    this.scene.showSandboxNotification("Board is full!");
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
            this.scene.resetDummyState();
            this.scene.showSandboxNotification("Dummy Health Reset!");
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
                        this.scene.showSandboxNotification("Must discard first!");
                        return;
                    }
                    
                    this.scene.playSound('click');
                    this.scene.logMessage(`[Sandbox] Instant Casting: ${spell.name}!`);
                    const w = this.scene.scale.width;
                    
                    // Visual spell fire from player center to AI center
                    this.scene.triggerSpellVisual(spell, w / 2 - 100, 500, w / 2 - 100, 100, () => {
                        this.scene.initiateAttack('player', 'ai', spell);
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
    }

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
    }
}


startReactionPhase(attacker, defender, { ...spell, damage: finalDmg, bypassShield: false });
        } else {
            // Direct hit
            if (finalDmg > 0) {
                if (defChar.status.retaliationDamage > 0) {
                    this.scene.forceDiscardRandom(attacker, 1);
                    this.scene.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
                }
                this.scene.applyDamage(defender, finalDmg, false);
            } else {
                // Done with spelling, auto-end turn after a slight delay
                this.scene.time.delayedCall(800, () => this.resolvePostAction());
            }
        }
    }

    startReactionPhase(attacker, defender, incomingSpell) {
        this.scene.phase = 'reaction';
        this.scene.reactionTargetSpell = incomingSpell;
        this.scene.reactionSource = attacker;
        this.scene.reactionCaster = defender;

        this.scene.logMessage(`Reaction window triggers for ${defender.toUpperCase()}!`);

        if (defender === 'player') {
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
        } else {
            if (this.scene.mode === 'online') {
                this.scene.logMessage('Waiting for opponent to react...');
                this.scene.phase = 'reaction_request';
                this.scene.syncToFirebase('reaction_request');
            } else {
                // AI Reaction automation
                this.scene.time.delayedCall(1000, () => {
                    const reactionSpell = this.scene.calculateAIReaction(incomingSpell.damage);
                    this.scene.resolveDefendingReaction(reactionSpell);
                });
            }
        }
    }

    resolveDefendingReaction(reactionSpell) {

        const defender = this.scene.reactionCaster;
        const attacker = this.scene.reactionSource;
        const defChar = defender === 'player' ? this.scene.player : this.scene.ai;
        const attChar = attacker === 'player' ? this.scene.player : this.scene.ai;

        if (reactionSpell) {
            this.scene.logMessage(`${defender.toUpperCase()} casts reaction: ${reactionSpell.name}!`);

            // Apply synergy using the new three-way system
            const cycle = this.scene.cycleElements[this.scene.cycleIndex];
            let isEmp = false;
            if (reactionSpell.synergyType === 'constructive' && cycle === reactionSpell.element) isEmp = true;
            else if (reactionSpell.synergyType === 'destructive' && cycle !== reactionSpell.element && reactionSpell.combo.includes(cycle)) isEmp = true;
            else if (reactionSpell.synergyType === 'prestructive' && reactionSpell.combo && !reactionSpell.combo.includes(cycle)) isEmp = true;

            let rDmg = reactionSpell.damage;
            let rShield = reactionSpell.shield;

            if (isEmp) {
                // Apply empowered value overrides for reaction spells
                if (reactionSpell.name === 'Shell') rShield = 5;
                if (reactionSpell.name === 'Spark') rDmg = 3;
                if (reactionSpell.name === 'Carapace') rShield = 8;
                if (reactionSpell.name === 'Blast') rDmg = 5;
                this.scene.logMessage(`${reactionSpell.name} is empowered by synergy!`);
            }

            // Apply reaction shield
            if (rShield > 0) {
                defChar.shield += rShield;
                this.scene.updateShieldDisplay(defender);
                this.scene.logMessage(`${defender.toUpperCase()} gains ${rShield} Reaction Shield.`);
            }

            // Counter damage check
            if (rDmg > 0) {
                this.scene.logMessage(`Reaction deals ${rDmg} counter damage back!`);
                this.scene.applyDamage(attacker, rDmg);
            }
        } else {
            this.scene.logMessage(`${defender.toUpperCase()} takes the direct hit.`);
        }

        // Retaliaton damage: fires when defender has retaliationDamage status
        if (defChar.status.retaliationDamage > 0) {
            this.scene.forceDiscardRandom(attacker, 1);
            this.scene.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
        }

        // Apply incoming damage minus final shield
        const finalDmg = this.scene.reactionTargetSpell.damage;
        this.scene.applyDamage(defender, finalDmg, this.scene.reactionTargetSpell.bypassShield || false);
    }

    applyDamage(who, amount, bypassShield = false) {
        const char = who === 'player' ? this.scene.player : this.scene.ai;
        
        // Shield absorption (Lava Surge bypasses shields entirely)
        if (bypassShield) {
            this.scene.logMessage(`Lava Surge bypasses ${who.toUpperCase()}'s shield!`);
        } else if (char.shield > 0) {
            if (char.shield >= amount) {
                char.shield -= amount;
                this.scene.logMessage(`${who.toUpperCase()}'s shield absorbed all ${amount} DMG!`);
                amount = 0;
            } else {
                amount -= char.shield;
                this.scene.logMessage(`${who.toUpperCase()}'s shield absorbed ${char.shield} DMG. ${amount} DMG passes through!`);
                char.shield = 0;
            }
            this.scene.updateShieldDisplay(who);
        }

        // Clean giant fortress temporary shield
        if (who === 'player' && char.shield > 90) char.shield = 0;
        if (who === 'ai' && char.shield > 90) char.shield = 0;
        this.scene.updateShieldDisplay(who);

        if (amount > 0) {
            this.scene.logMessage(`${who.toUpperCase()} is hit for ${amount} DMG!`);
            this.scene.playSound('hit');

            // Set state to discard
            this.scene.phase = 'discard';
            this.scene.enablePlayerControls(false);

            if (who === 'player') {
                this.scene.cardsToDiscardCount = amount;
                this.scene.promptDiscardSelection();
            } else {
                if (this.scene.mode === 'online') {
                    this.scene.phase = 'discard_request';
                    this.scene.discardTargetCount = amount;
                    this.scene.syncToFirebase('discard_request');
                    this.scene.logMessage('Waiting for opponent to discard...');
                } else {
                    // AI automatically discards
                    this.scene.runAIDiscardAutomation(amount);
                }
            }
        } else {
            // Attack completed without card losses
            this.scene.time.delayedCall(800, () => {
                if (this.scene.pendingExtraAction) {
                    this.scene.pendingExtraAction = false;
                    this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                    this.scene.logMessage(`${this.scene.turn.toUpperCase()} gets another action!`);
                    if (this.scene.turn === 'player') {
                        this.scene.phase = 'action';
                        this.scene.enablePlayerControls(true);
                    } else {
                        this.scene.runAITurn();
                    }
                } else {
                    this.scene.checkTurnContinuation();
                }
            });
        }
    }

    // --- PLAYER MANUAL DISCARD HANDLING ---
    promptDiscardSelection() {
        // Double check if player has enough cards left to discard
        const total = this.scene.player.hand.length + this.scene.player.board.length;
        if (total === 0 || total <= this.scene.cardsToDiscardCount) {
            this.scene.logMessage("Player is out of cards!");
            this.scene.player.hand = [];
            this.scene.player.board = [];
            this.scene.updatePlayerHandDisplay();
            this.scene.updatePlayerBoardDisplay();
            this.scene.updatePlayerLifeDisplay();
            this.scene.checkDefeatCondition('player');
            return;
        }

        this.scene.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.scene.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
        this.scene.discardPromptText.setVisible(true);
    }

    discardCardFromZone(zone, index, who) {
        if (who === 'player' && (this.scene.phase === 'discard' || this.scene.phase === 'discard_request_active') && this.scene.cardsToDiscardCount > 0) {
            const char = this.scene.player;
            let discarded;
            if (zone === 'hand') {
                discarded = char.hand.splice(index, 1)[0];
                this.scene.updatePlayerHandDisplay();
            } else {
                discarded = char.board.splice(index, 1)[0];
                this.scene.updatePlayerBoardDisplay();
            }

            this.scene.sharedDiscard.push(discarded);
            this.scene.updateDeckDiscardDisplay();
            this.scene.updatePlayerLifeDisplay();

            this.scene.cardsToDiscardCount--;
            this.scene.playSound('fire');

            if (this.scene.cardsToDiscardCount <= 0) {
                this.scene.discardPromptText.setVisible(false);
                this.scene.logMessage("Player finished discarding cards.");
                
                if (this.scene.phase === 'discard_request_active') {
                    this.scene.phase = 'discard_response';
                    this.scene.syncToFirebase('discard_response');
                    this.scene.enablePlayerControls(false);
                    this.scene.logMessage('Waiting for turn resolution...');
                } else {
                    this.scene.phase = 'action';
                    // End turn and rotate (or grant extra action)
                    this.scene.time.delayedCall(600, () => {
                        if (this.scene.pendingExtraAction) {
                            this.scene.pendingExtraAction = false;
                            this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                            this.scene.logMessage('Player gets another action!');
                            this.scene.enablePlayerControls(true);
                        } else {
                            this.scene.checkTurnContinuation();
                        }
                    });
                }
            } else {
                this.scene.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.scene.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
            }
        }
    }

    // --- AI STRATEGIC AGENT ---
    getValidBoardCombos(board) {
        const results = [];
        const n = board.length;
        if (n === 0) return results;
        
        // 1-card combos
        for (let i = 0; i < n; i++) results.push([i]);
        
        // 2-card combos
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                results.push([i, j]);
            }
        }
        
        // 3-card combos
        if (n >= 3) {
            results.push([0, 1, 2]);
        }
        
        return results;
    }

    scoreAISpell(spell, isReaction, incomingDamage) {
        let score = 0;
        const cycle = this.scene.cycleElements[this.scene.cycleIndex];
        
        let isEmp = false;
        if (spell.synergyType === 'constructive' && cycle === spell.element) isEmp = true;
        else if (spell.synergyType === 'destructive' && cycle !== spell.element && spell.combo.includes(cycle)) isEmp = true;
        else if (spell.synergyType === 'prestructive' && !spell.combo.includes(cycle)) isEmp = true;

        if (isReaction) {
            if (spell.shield > 0) {
                score += spell.shield * 10;
                if (spell.shield >= incomingDamage) score += 20; // Bonus for fully blocking
                if (isEmp) score += 5;
                score -= spell.combo.length; // Tie-breaker: use fewer cards
            } else {
                return -1; // Not a defensive spell
            }
        } else {
            score += spell.damage * 10;
            score += spell.shield * 8;
            score += spell.draw * 5;
            score += spell.drain * 6;
            
            if (isEmp) score += 15; // Strongly prefer empowered spells
            
            // Situational adjustments
            if (this.scene.ai.life <= 4) {
                score += spell.shield * 10; // Desperate for shield
                score += spell.drain * 10; // Desperate to drain opponent's capability
            }
            if (this.scene.player.life <= 4) {
                score += spell.damage * 15; // Go for the kill
            }
            
            score += spell.combo.length; 
        }
        
        return score;
    }

    checkTurnContinuation() {
        if (this.scene.turn === 'player' && (!this.scene.manaPlacedThisTurn || !this.scene.spellCastThisTurn)) {
            this.scene.phase = 'action';
            this.scene.enablePlayerControls(true);
        } else if (this.scene.turn === 'ai' && (!this.scene.manaPlacedThisTurn || !this.scene.spellCastThisTurn)) {
            this.scene.runAITurn();
        } else {
            this.scene.endTurn();
        }
    }

    runAITurn() {
        if (this.scene.phase === 'gameover') return;

        this.scene.logMessage("AI is evaluating options...");

        // Smart decision making logic:
        // 1. Play mana if board has less than 3 cards
        if (!this.scene.manaPlacedThisTurn && this.scene.ai.board.length < 3 && this.scene.ai.hand.length > 0) {
            this.scene.manaPlacedThisTurn = true;
            // Find a duplicate element or just play first
            const idxToPlay = 0; 
            const el = this.scene.ai.hand.splice(idxToPlay, 1)[0];
            this.scene.ai.board.push(el);

            this.scene.playSound('draw');
            this.scene.logMessage(`AI plays [${el.toUpperCase()}] mana to board.`);
            if (this.scene.ai.status.manaPlayDamage > 0) {
                this.scene.forceDiscardRandom('player', 1);
                this.scene.logMessage(`AI's mana play deals 1 damage to Player!`);
            }
            if (this.scene.player.status.oppManaPlayDamage > 0) {
                this.scene.forceDiscardRandom('ai', 1);
                this.scene.logMessage(`AI takes 1 damage from playing mana due to Player Surge!`);
            }
            
            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();

            this.scene.time.delayedCall(1200, () => {
                // Check bonusManaPlays: AI gets a second mana play
                if (this.scene.ai.status.bonusManaPlays > 0 && this.scene.ai.hand.length > 0 && this.scene.ai.board.length < 3) {
                    this.scene.ai.status.bonusManaPlays = 0;
                    this.scene.manaPlacedThisTurn = false;
                    this.scene.logMessage(`AI plays a second mana!`);
                    const el2 = this.scene.ai.hand.splice(0, 1)[0];
                    this.scene.ai.board.push(el2);
                    this.scene.logMessage(`AI plays [${el2.toUpperCase()}] mana to board.`);
                    this.scene.updateAIHandDisplay();
                    this.scene.updateAIBoardDisplay();
                    this.scene.updateAILifeDisplay();
                }
                this.scene.runAITurn();
            });
            return;
        }

        // 2. Try to form a spell combo from board
        if (!this.scene.spellCastThisTurn && this.scene.ai.board.length >= 2) {
            const combos = this.scene.getValidBoardCombos(this.scene.ai.board);
            let bestSpell = null;
            let bestComboIndices = null;
            let bestScore = -1;

            combos.forEach(indices => {
                const elements = indices.map(idx => this.scene.ai.board[idx]);
                const spell = this.scene.getSpellFromCombo(elements);
                if (spell) {
                    const score = this.scene.scoreAISpell(spell, false, 0);
                    if (score > bestScore) {
                        bestScore = score;
                        bestSpell = spell;
                        bestComboIndices = indices;
                    }
                }
            });

            if (bestSpell) {
                this.scene.spellCastThisTurn = true;
                // Consume
                bestComboIndices.sort((a,b) => b-a);
                bestComboIndices.forEach(idx => {
                    const consumed = this.scene.ai.board.splice(idx, 1)[0];
                    this.scene.sharedDiscard.push(consumed);
                });

                this.scene.updateAIBoardDisplay();
                this.scene.updateAILifeDisplay();
                this.scene.updateDeckDiscardDisplay();

                this.scene.logMessage(`AI casts: ${bestSpell.name}!`);

                const w = this.scene.scale.width;
                this.scene.triggerSpellVisual(bestSpell, w / 2 + 100, 200, w / 2 + 100, 500, () => {
                    this.scene.initiateAttack('ai', 'player', bestSpell);
                });
                return;
            }
        }

        if (this.scene.manaPlacedThisTurn || this.scene.spellCastThisTurn) {
            this.scene.logMessage("AI ends turn.");
            this.scene.time.delayedCall(1200, () => {
                this.scene.endTurn();
            });
            return;
        }

        // 3. Fallback: pass to draw
        this.scene.logMessage("AI chooses Pass to Draw.");
        const extra = this.scene.drawCard();
        if (extra) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (this.scene.ai.status.autoPlayDraw > 0 && this.scene.ai.board.length < 3) {
                this.scene.ai.board.push(extra);
                this.scene.logMessage(`AI's drawn mana is auto-played to board!`);
            } else {
                this.scene.ai.hand.push(extra);
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (this.scene.ai.status.loseManaOnDraw > 0 && this.scene.ai.hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * this.scene.ai.hand.length);
                const lost = this.scene.ai.hand.splice(lostIdx, 1)[0];
                this.scene.sharedDiscard.push(lost);
                this.scene.logMessage(`AI lost a hand mana from drawing!`);
            }

            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
        }

        this.scene.time.delayedCall(1200, () => {
            this.scene.endTurn();
        });
    }

    calculateAIReaction(incomingDamage) {
        if (this.scene.ai.board.length === 0) return null;
        if (this.scene.mode === 'test' && this.scene.dummyMode === 'passive') return null;

        const combos = this.scene.getValidBoardCombos(this.scene.ai.board);
        let bestSpell = null;
        let bestComboIndices = null;
        let bestScore = -1;

        combos.forEach(indices => {
            const elements = indices.map(idx => this.scene.ai.board[idx]);
            const spell = this.scene.getSpellFromCombo(elements);
            if (spell) {
                const score = this.scene.scoreAISpell(spell, true, incomingDamage);
                if (score > bestScore) {
                    bestScore = score;
                    bestSpell = spell;
                    bestComboIndices = indices;
                }
            }
        });

        if (bestSpell && bestScore > -1) {
            // Consume board mana
            bestComboIndices.sort((a,b) => b-a);
            bestComboIndices.forEach(idx => {
                const consumed = this.scene.ai.board.splice(idx, 1)[0];
                this.scene.sharedDiscard.push(consumed);
            });

            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
            this.scene.updateDeckDiscardDisplay();
            return bestSpell;
        }

        return null;
    }

    runAIDiscardAutomation(amount) {
        const total = this.scene.ai.hand.length + this.scene.ai.board.length;
        if (total === 0 || total <= amount) {
            this.scene.logMessage("AI is out of cards!");
            this.scene.ai.hand = [];
            this.scene.ai.board = [];
            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
            this.scene.checkDefeatCondition('ai');
            return;
        }

        this.scene.logMessage(`AI is selecting ${amount} card(s) to discard...`);

        for (let i = 0; i < amount; i++) {
            // Prefer discarding from board mana first if excess, then hand
            if (this.scene.ai.board.length > 1) {
                const burned = this.scene.ai.board.pop();
                this.scene.sharedDiscard.push(burned);
            } else {
                const burned = this.scene.ai.hand.pop();
                this.scene.sharedDiscard.push(burned);
            }
            this.scene.playSound('fire');
        }

        this.scene.updateAIHandDisplay();
        this.scene.updateAIBoardDisplay();
        this.scene.updateAILifeDisplay();
        this.scene.updateDeckDiscardDisplay();

        this.scene.phase = 'action';
        
        // Turn cleanup (or grant extra action)
        this.scene.time.delayedCall(1200, () => {
            if (this.scene.pendingExtraAction) {
                this.scene.pendingExtraAction = false;
                this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                if (this.scene.turn === 'player') {
                    this.scene.logMessage('Player gets another action!');
                    this.scene.enablePlayerControls(true);
                } else {
                    this.scene.logMessage('AI gets another action!');
                    this.scene.runAITurn();
                }
            } else {
                this.scene.checkTurnContinuation();
            }
        });
    }

    // --- ALPHABETICAL SPELL COMBO PARSER ---
    getSpellFromCombo(combo) {

        return getSpellFromCombo(combo);

    }

    isWeakenedByCycle(spellEl, cycleEl) {


        return isWeakenedByCycle(spellEl, cycleEl);


    }

    // --- GAME OVER DISPLAY ---
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
    }

    // ============================================================
    // ONLINE MULTIPLAYER ENGINE
    // ============================================================

    /**
     * Set up an online game. Host initializes state and syncs to Firebase.
     * Guest waits for the initial state from Firebase.
     */
    setupOnlineGame() {
        this.scene.logMessage(`Online mode: you are the ${this.scene.myRole.toUpperCase()}.`);
        this.scene.logMessage(`Lobby: ${this.scene.lobbyCode}`);

        if (this.scene.myRole === 'host') {
            // Host initializes the game state
            this.scene.initSharedDeck();
            this.scene.dealStartingHands();

            // Write initial state to Firebase so guest can load it
            this.scene.syncToFirebase('init');

            // Host goes first
            this.scene.startTurn('player');
        }

        // Both host and guest listen for state changes
        this.scene.startFirebaseListener();
    }

    /**
     * Serialize the current game state into a plain object for Firebase.
     */
    serializeState() {
        const myKey = this.scene.myRole;
        const oppKey = this.scene.myRole === 'host' ? 'guest' : 'host';

        return {
            deck: this.scene.sharedDeck.slice(),
            discard: this.scene.sharedDiscard.slice(),
            cycleIndex: this.scene.cycleIndex,
            firstCycleIndex: this.scene.firstCycleIndex,
            turn: this.scene.turn === 'player' ? myKey : oppKey,
            phase: this.scene.phase,
            actionUsed: this.scene.actionUsedThisTurn,
            [`${myKey}Hand`]: this.scene.player.hand.slice(),
            [`${myKey}Board`]: this.scene.player.board.slice(),
            [`${myKey}Shield`]: this.scene.player.shield,
            [`${myKey}Life`]: this.scene.player.life,
            [`${myKey}SteamDebuff`]: this.scene.player.steamDebuff || false,
            [`${oppKey}Hand`]: this.scene.ai.hand.slice(),
            [`${oppKey}Board`]: this.scene.ai.board.slice(),
            [`${oppKey}Shield`]: this.scene.ai.shield,
            [`${oppKey}Life`]: this.scene.ai.life,
            [`${oppKey}SteamDebuff`]: this.scene.ai.steamDebuff || false,
            reactionTargetSpell: this.scene.reactionTargetSpell || null,
            reactionResponseSpell: this.scene.reactionResponseSpell || null,
            reactionSource: this.scene.reactionSource || null,
            reactionCaster: this.scene.reactionCaster || null,
            discardTargetCount: this.scene.discardTargetCount || 0,
            seq: Date.now()
        };
    }

    /**
     * Write current state to Firebase.
     */
    async syncToFirebase(actionType) {
        if (this.scene.mode !== 'online' || !this.scene.lobbyCode) return;

        try {
            const state = this.scene.serializeState();
            const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);
            await ref.update({
                gameState: state,
                lastActionBy: this.scene.myRole,
                status: this.scene.phase === 'gameover' ? 'finished' : 'playing'
            });
        } catch (err) {
            console.error('[Whelmen Online] Sync error:', err);
            this.scene.logMessage('⚠ Network sync error. Retrying...');
        }
    }

    /**
     * Start listening for Firebase state changes from the opponent.
     */
    startFirebaseListener() {
        const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);

        const handler = (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.gameState) return;

            const state = data.gameState;
            const lastBy = data.lastActionBy;

            // Ignore our own writes
            if (lastBy === this.scene.myRole) return;

            // Handle disconnection
            if (data.status === 'abandoned' || data.status === 'disconnected') {
                this.scene.logMessage('⚠ Opponent disconnected!');
                this.scene.showDisconnectOverlay();
                return;
            }

            // Load the remote state
            this.scene.loadFromFirebase(state);
        };

        ref.on('value', handler);
        this.scene.firebaseUnsub = () => ref.off('value', handler);
    }

    /**
     * Load game state from Firebase (called when opponent acts).
     * Maps host/guest data to local player/ai based on our role.
     */
    loadFromFirebase(state) {
        const myKey = this.scene.myRole;
        const oppKey = this.scene.myRole === 'host' ? 'guest' : 'host';

        // Update deck and discard
        this.scene.sharedDeck = state.deck ? state.deck.slice() : [];
        this.scene.sharedDiscard = state.discard ? state.discard.slice() : [];

        // Update cycle
        this.scene.cycleIndex = state.cycleIndex || 0;
        this.scene.firstCycleIndex = state.firstCycleIndex || 1;

        // Map MY data to this.scene.player
        this.scene.player.hand = (state[`${myKey}Hand`] || []).slice();
        this.scene.player.board = (state[`${myKey}Board`] || []).slice();
        this.scene.player.shield = state[`${myKey}Shield`] || 0;
        this.scene.player.life = this.scene.player.hand.length + this.scene.player.board.length;
        this.scene.player.steamDebuff = state[`${myKey}SteamDebuff`] || false;

        // Map OPPONENT data to this.scene.ai
        this.scene.ai.hand = (state[`${oppKey}Hand`] || []).slice();
        this.scene.ai.board = (state[`${oppKey}Board`] || []).slice();
        this.scene.ai.shield = state[`${oppKey}Shield`] || 0;
        this.scene.ai.life = this.scene.ai.hand.length + this.scene.ai.board.length;
        this.scene.ai.steamDebuff = state[`${oppKey}SteamDebuff`] || false;

        // Update action state
        this.scene.actionUsedThisTurn = state.actionUsed || false;
        this.scene.phase = state.phase || 'action';

        // Determine whose turn it is locally
        const isMyTurn = state.turn === myKey;
        this.scene.turn = isMyTurn ? 'player' : 'ai';

        // Refresh all UI
        this.scene.refreshAllUI();

        // Handle game over
        if (state.phase === 'gameover') {
            this.scene.phase = 'gameover';
            return;
        }

        // Handle Request/Response phases FIRST
        if (state.phase === 'reaction_request' && !isMyTurn) {
            // We are the guest and need to react
            this.scene.reactionTargetSpell = state.reactionTargetSpell;
            this.scene.reactionSource = state.reactionSource;
            this.scene.reactionCaster = state.reactionCaster;
            
            this.scene.phase = 'reaction_request_active';
            this.scene.logMessage(`Reaction window triggers for you!`);
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            return;
        }

        if (state.phase === 'reaction_response' && isMyTurn) {
            // We are the host and the guest responded
            this.scene.phase = 'action'; // Reset phase internally
            const responseSpell = state.reactionResponseSpell || null;
            this.scene.resolveDefendingReaction(responseSpell);
            return;
        }

        if (state.phase === 'discard_request' && !isMyTurn) {
            this.scene.cardsToDiscardCount = state.discardTargetCount;
            this.scene.phase = 'discard_request_active';
            this.scene.promptDiscardSelection();
            return;
        }

        if (state.phase === 'discard_response' && isMyTurn) {
            this.scene.phase = 'action';
            // Complete the attack process
            this.scene.time.delayedCall(600, () => {
                if (this.scene.pendingExtraAction) {
                    this.scene.pendingExtraAction = false;
                    this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                    this.scene.logMessage('You get another action!');
                    this.scene.enablePlayerControls(true);
                } else {
                    this.scene.checkTurnContinuation();
                }
            });
            return;
        }

        // Normal Turn Logic
        if (isMyTurn) {
            this.scene.logMessage("--- YOUR TURN ---");
            this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            this.scene.logMessage('It is your turn. Choose an action.');
        } else {
            this.scene.enablePlayerControls(false);
            this.scene.logMessage('Waiting for opponent...');
        }
    }

    /**
     * Refresh all UI elements to match current state.
     */
    refreshAllUI() {
        this.scene.updatePlayerHandDisplay();
        this.scene.updatePlayerBoardDisplay();
        this.scene.updatePlayerLifeDisplay();
        this.scene.updateAIHandDisplay();
        this.scene.updateAIBoardDisplay();
        this.scene.updateAILifeDisplay();
        this.scene.updateDeckDiscardDisplay();
        // Update cycle indicator rotation directly
        if (this.scene.cycleContainer) {
            this.scene.cycleContainer.rotation = -(this.scene.cycleIndex - 1) * (Math.PI / 2);
            this.scene.updateCycleDisplayColor(this.scene.cycleElements[this.scene.cycleIndex]);
        }
        this.scene.updateComboPreview();

        // Update shield visuals
        this.scene.updateShieldDisplay('player');
        this.scene.updateShieldDisplay('ai');
    }

    /**
     * Show a disconnect overlay when opponent leaves.
     */
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
    }

    /**
     * Clean up Firebase listeners and lobby on exit.
     */
    cleanupOnline() {
        if (this.scene.firebaseUnsub) {
            this.scene.firebaseUnsub();
            this.scene.firebaseUnsub = null;
        }
        if (this.scene.lobbyCode) {
            firebase.database().ref(`lobbies/${this.scene.lobbyCode}/status`).set('finished').catch(() => {});
        }
    }

    update() {
        if (this.scene.cycleContainer) {
            const rot = this.scene.cycleContainer.rotation;
            if (this.scene.cycleCenterText) {
                this.scene.cycleCenterText.rotation = -rot;
            }
            if (this.scene.cycleLabels) {
                this.scene.cycleLabels.forEach(label => {
                    label.rotation = -rot;
                });
            }
        }
    }

    findSpellInMessage(msg) {


        return findSpellInMessage(msg);


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
        const totalHeight = this.scene.getLogTotalHeight();
        
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
        this.scene.updateScrollbar();
    }

    scrollDuelHistoryTo(targetY) {
        if (!this.scene.logScrollContainer || !this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return;
        
        const viewportHeight = 360;
        const totalHeight = this.scene.getLogTotalHeight();
        
        if (totalHeight <= viewportHeight) {
            this.scene.logScrollContainer.y = 0;
            this.scene.updateScrollbar();
            return;
        }
        
        const minY = viewportHeight - totalHeight;
        const maxY = 0;
        
        if (targetY < minY) targetY = minY;
        if (targetY > maxY) targetY = maxY;
        
        this.scene.logScrollContainer.y = targetY;
        this.scene.updateScrollbar();
    }

    scrollDuelHistory(deltaY) {
        if (!this.scene.logScrollContainer || !this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return;
        
        // Scroll by 1 line height (26px) per tick
        const scrollAmount = -Math.sign(deltaY) * 26;
        this.scene.scrollDuelHistoryTo(this.scene.logScrollContainer.y + scrollAmount);
    }

    updateScrollbar() {
        if (!this.scene.logScrollbarGraphics) return;
        
        this.scene.logScrollbarGraphics.clear();
        
        const viewportHeight = 360;
        const totalHeight = this.scene.getLogTotalHeight();
        
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
                    this.scene.showSandboxNotification("Board is full!");
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
            this.scene.resetDummyState();
            this.scene.showSandboxNotification("Dummy Health Reset!");
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
                        this.scene.showSandboxNotification("Must discard first!");
                        return;
                    }
                    
                    this.scene.playSound('click');
                    this.scene.logMessage(`[Sandbox] Instant Casting: ${spell.name}!`);
                    const w = this.scene.scale.width;
                    
                    // Visual spell fire from player center to AI center
                    this.scene.triggerSpellVisual(spell, w / 2 - 100, 500, w / 2 - 100, 100, () => {
                        this.scene.initiateAttack('player', 'ai', spell);
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
    }

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
    }
}


resolveDefendingReaction(null);
            }
            return;
        }

        if (this.scene.manaPlacedThisTurn || this.scene.spellCastThisTurn) {
            this.scene.logMessage("Player ends turn.");
            this.scene.enablePlayerControls(false);
            this.scene.time.delayedCall(450, () => {
                this.scene.endTurn();
            });
            return;
        }

        this.scene.logMessage("Player chooses Pass to Draw.");
        const extraCard = this.scene.drawCard();
        if (extraCard) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (this.scene.player.status.autoPlayDraw > 0 && this.scene.player.board.length < 3) {
                this.scene.player.board.push(extraCard);
                this.scene.logMessage(`Player's drawn mana is auto-played to board!`);
            } else {
                this.scene.player.hand.push(extraCard);
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (this.scene.player.status.loseManaOnDraw > 0 && this.scene.player.hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * this.scene.player.hand.length);
                const lost = this.scene.player.hand.splice(lostIdx, 1)[0];
                this.scene.sharedDiscard.push(lost);
                this.scene.logMessage(`Player lost a hand mana from drawing!`);
            }

            this.scene.updatePlayerHandDisplay();
            this.scene.updatePlayerBoardDisplay();
            this.scene.updatePlayerLifeDisplay();
        }

        this.scene.enablePlayerControls(false);
        this.scene.time.delayedCall(450, () => {
            this.scene.endTurn();
        });
    }

    handleCastSpellOption() {
        if (this.scene.selectedBoardMana.length === 0) return;
        const elements = this.scene.selectedBoardMana.map(idx => this.scene.player.board[idx]);
        const spell = this.scene.getSpellFromCombo(elements);

        if (!spell) {
            this.scene.logMessage("Cannot cast: invalid combo selected.");
            return;
        }

        if (this.scene.phase === 'reaction' || this.scene.phase === 'reaction_request_active') {
            // Defender casting reaction
            this.scene.selectedBoardMana.sort((a,b) => b-a);
            this.scene.selectedBoardMana.forEach(idx => {
                const consumed = this.scene.player.board.splice(idx, 1)[0];
                this.scene.sharedDiscard.push(consumed);
            });
            this.scene.updatePlayerBoardDisplay();
            this.scene.updateDeckDiscardDisplay();
            this.scene.updatePlayerLifeDisplay();

            if (this.scene.phase === 'reaction_request_active') {
                this.scene.phase = 'reaction_response';
                this.scene.reactionResponseSpell = spell;
                this.scene.syncToFirebase('reaction_response');
                this.scene.enablePlayerControls(false);
                this.scene.logMessage('Reaction sent. Waiting for resolution...');
            } else {
                this.scene.resolveDefendingReaction(spell);
            }
            return;
        }

        // Normal turn attack spell casting
        if (this.scene.spellCastThisTurn) return;
        this.scene.spellCastThisTurn = true;
        this.scene.enablePlayerControls(false);

        // Consume cards
        // Sort indices descending to avoid splice shifting bugs
        this.scene.selectedBoardMana.sort((a, b) => b - a);
        this.scene.selectedBoardMana.forEach(idx => {
            const consumed = this.scene.player.board.splice(idx, 1)[0];
            this.scene.sharedDiscard.push(consumed);
        });

        this.scene.updatePlayerBoardDisplay();
        this.scene.updatePlayerLifeDisplay();
        this.scene.updateDeckDiscardDisplay();

        this.scene.selectedBoardMana = [];
        this.scene.updateComboPreview();

        this.scene.logMessage(`Player casts: ${spell.name}!`);

        // Visual spell fire from player center to AI center
        const w = this.scene.scale.width;
        this.scene.triggerSpellVisual(spell, w / 2 - 100, 500, w / 2 - 100, 100, () => {
            this.scene.initiateAttack('player', 'ai', spell);
        });
    }

    // --- COMBAT RESOLUTION & REACTION WINDOW ---
    initiateAttack(attacker, defender, spell) {
        let defChar = defender === 'player' ? this.scene.player : this.scene.ai;
        let attChar = attacker === 'player' ? this.scene.player : this.scene.ai;
        const cycle = this.scene.cycleElements[this.scene.cycleIndex];

        // Status: Random Targeting
        if (attChar.status.randomTargeting > 0) {
            if (Math.random() < 0.5) {
                defender = attacker;
                defChar = attChar;
                this.scene.logMessage(`Chaos! ${attacker.toUpperCase()}'s spell targets themselves!`);
            }
        }
        
        // Status: Spell Fail Chance
        if (attChar.status.spellFailChance > 0) {
            if (Math.random() < 0.5) {
                this.scene.logMessage(`${attacker.toUpperCase()}'s spell fizzled out!`);
                this.scene.time.delayedCall(800, () => this.scene.endTurn());
                return;
            }
        }

        let isEmp = this.scene.synergy.calculateSynergy(spell, cycle);

        let finalDmg = spell.damage;
        let finalShield = spell.shield;
        let finalDraw = spell.draw;
        let finalDrain = spell.drain;
        
        // Miss Chance Status
        if (attChar.status.missChance > 0 && finalDmg > 0) {
            if (Math.random() < 0.5) {
                finalDmg = 0;
                this.scene.logMessage(`${attacker.toUpperCase()}'s attack missed!`);
            }
        }

        // Damage Immunity Status
        if (defChar.status.damageImmunity > 0) {
            finalDmg = 0;
            this.scene.logMessage(`${defender.toUpperCase()} is immune to damage this round!`);
        }

        if (isEmp) {
            const overrides = this.scene.synergy.getEmpoweredOverrides(spell.name);
            if (overrides.damage) finalDmg = overrides.damage;
            if (overrides.shield) finalShield = overrides.shield;
            if (overrides.draw) finalDraw = overrides.draw;
            if (overrides.drain) finalDrain = overrides.drain;
            
            // Immediate synergy effects (not deferred status)
            if (spell.name === 'Wildfire') this.scene.pendingExtraAction = true;
            if (spell.name === 'Billow') { this.scene.logMessage('Top 3 cards cycled!'); for(let i=0;i<3;i++) { let d = this.scene.sharedDeck.shift(); if(d) this.scene.sharedDeck.push(d); } }
            if (spell.name === 'Vaporize') { this.scene.logMessage('Top 3 cards destroyed!'); for(let i=0;i<3;i++) { let d = this.scene.sharedDeck.shift(); if(d) this.scene.sharedDiscard.push(d); } this.scene.updateDeckDiscardDisplay(); }
            if (spell.name === 'Scour') { defChar.shield = 0; this.scene.updateShieldDisplay(defender); this.scene.logMessage(`${defender.toUpperCase()}'s shield scoured!`); }
        }

        // Force Cycle always triggers (not gated by isEmp)
        if (spell.synergyType === 'force_cycle') {
            const fcMap = { 'Tempest': 'air', 'Pillar': 'earth', 'Blaze': 'fire', 'Deluge': 'water' };
            const fcEl = fcMap[spell.name];
            if (fcEl) {
                this.scene.cycleIndex = this.scene.cycleElements.indexOf(fcEl);
                this.scene.logMessage(`The Cycle is forced to ${fcEl.toUpperCase()}!`);
                this.scene.cycleCenterText.setText(fcEl.toUpperCase());
                this.scene.triggerCycleParticles(fcEl);
            }
        }

        // Apply self buffs immediately (like shields)
        if (finalShield > 0) {
            if (attChar.status.shieldDamageDebuff > 0) {
                this.scene.forceDiscardRandom(attacker, 1);
                this.scene.logMessage(`${attacker.toUpperCase()} takes 1 damage from unstable shield!`);
            }
            attChar.shield += finalShield;
            this.scene.updateShieldDisplay(attacker);
            this.scene.logMessage(`${attacker.toUpperCase()} gains ${finalShield} Shield.`);
        }

        // Draw logic
        if (finalDraw > 0) {
            for (let i = 0; i < finalDraw; i++) {
                const drawn = this.scene.drawCard();
                if (drawn) {
                    if (attChar.status.autoPlayDraw > 0 && attChar.board.length < 3) {
                        attChar.board.push(drawn);
                        this.scene.logMessage(`Auto-played drawn mana!`);
                    } else {
                        attChar.hand.push(drawn);
                    }
                    if (attChar.status.loseManaOnDraw > 0 && attChar.board.length > 0) {
                        this.scene.sharedDiscard.push(attChar.board.pop());
                        this.scene.logMessage(`${attacker.toUpperCase()} lost a board mana from drawing!`);
                    }
                }
            }
            this.scene.updatePlayerHandDisplay(); this.scene.updatePlayerBoardDisplay(); this.scene.updatePlayerLifeDisplay();
            this.scene.updateAIHandDisplay(); this.scene.updateAIBoardDisplay(); this.scene.updateAILifeDisplay();
        }
        
        // Drain logic
        if (finalDrain > 0) {
            this.scene.forceDiscardRandom(defender, finalDrain);
        }

        if (isEmp) {
            this.scene.synergy.applyDeferredStatusEffects(spell.name, attChar, defChar);
        }
        // Trigger reaction window if there's incoming damage and defender has active mana
        if (finalDmg > 0 && defChar.board.length > 0) {
            this.scene.startReactionPhase(attacker, defender, { ...spell, damage: finalDmg, bypassShield: false });
        } else {
            // Direct hit
            if (finalDmg > 0) {
                if (defChar.status.retaliationDamage > 0) {
                    this.scene.forceDiscardRandom(attacker, 1);
                    this.scene.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
                }
                this.scene.applyDamage(defender, finalDmg, false);
            } else {
                // Done with spelling, auto-end turn after a slight delay
                this.scene.time.delayedCall(800, () => this.resolvePostAction());
            }
        }
    }

    startReactionPhase(attacker, defender, incomingSpell) {
        this.scene.phase = 'reaction';
        this.scene.reactionTargetSpell = incomingSpell;
        this.scene.reactionSource = attacker;
        this.scene.reactionCaster = defender;

        this.scene.logMessage(`Reaction window triggers for ${defender.toUpperCase()}!`);

        if (defender === 'player') {
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
        } else {
            if (this.scene.mode === 'online') {
                this.scene.logMessage('Waiting for opponent to react...');
                this.scene.phase = 'reaction_request';
                this.scene.syncToFirebase('reaction_request');
            } else {
                // AI Reaction automation
                this.scene.time.delayedCall(1000, () => {
                    const reactionSpell = this.scene.calculateAIReaction(incomingSpell.damage);
                    this.scene.resolveDefendingReaction(reactionSpell);
                });
            }
        }
    }

    resolveDefendingReaction(reactionSpell) {

        const defender = this.scene.reactionCaster;
        const attacker = this.scene.reactionSource;
        const defChar = defender === 'player' ? this.scene.player : this.scene.ai;
        const attChar = attacker === 'player' ? this.scene.player : this.scene.ai;

        if (reactionSpell) {
            this.scene.logMessage(`${defender.toUpperCase()} casts reaction: ${reactionSpell.name}!`);

            // Apply synergy using the new three-way system
            const cycle = this.scene.cycleElements[this.scene.cycleIndex];
            let isEmp = false;
            if (reactionSpell.synergyType === 'constructive' && cycle === reactionSpell.element) isEmp = true;
            else if (reactionSpell.synergyType === 'destructive' && cycle !== reactionSpell.element && reactionSpell.combo.includes(cycle)) isEmp = true;
            else if (reactionSpell.synergyType === 'prestructive' && reactionSpell.combo && !reactionSpell.combo.includes(cycle)) isEmp = true;

            let rDmg = reactionSpell.damage;
            let rShield = reactionSpell.shield;

            if (isEmp) {
                // Apply empowered value overrides for reaction spells
                if (reactionSpell.name === 'Shell') rShield = 5;
                if (reactionSpell.name === 'Spark') rDmg = 3;
                if (reactionSpell.name === 'Carapace') rShield = 8;
                if (reactionSpell.name === 'Blast') rDmg = 5;
                this.scene.logMessage(`${reactionSpell.name} is empowered by synergy!`);
            }

            // Apply reaction shield
            if (rShield > 0) {
                defChar.shield += rShield;
                this.scene.updateShieldDisplay(defender);
                this.scene.logMessage(`${defender.toUpperCase()} gains ${rShield} Reaction Shield.`);
            }

            // Counter damage check
            if (rDmg > 0) {
                this.scene.logMessage(`Reaction deals ${rDmg} counter damage back!`);
                this.scene.applyDamage(attacker, rDmg);
            }
        } else {
            this.scene.logMessage(`${defender.toUpperCase()} takes the direct hit.`);
        }

        // Retaliaton damage: fires when defender has retaliationDamage status
        if (defChar.status.retaliationDamage > 0) {
            this.scene.forceDiscardRandom(attacker, 1);
            this.scene.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
        }

        // Apply incoming damage minus final shield
        const finalDmg = this.scene.reactionTargetSpell.damage;
        this.scene.applyDamage(defender, finalDmg, this.scene.reactionTargetSpell.bypassShield || false);
    }

    applyDamage(who, amount, bypassShield = false) {
        const char = who === 'player' ? this.scene.player : this.scene.ai;
        
        // Shield absorption (Lava Surge bypasses shields entirely)
        if (bypassShield) {
            this.scene.logMessage(`Lava Surge bypasses ${who.toUpperCase()}'s shield!`);
        } else if (char.shield > 0) {
            if (char.shield >= amount) {
                char.shield -= amount;
                this.scene.logMessage(`${who.toUpperCase()}'s shield absorbed all ${amount} DMG!`);
                amount = 0;
            } else {
                amount -= char.shield;
                this.scene.logMessage(`${who.toUpperCase()}'s shield absorbed ${char.shield} DMG. ${amount} DMG passes through!`);
                char.shield = 0;
            }
            this.scene.updateShieldDisplay(who);
        }

        // Clean giant fortress temporary shield
        if (who === 'player' && char.shield > 90) char.shield = 0;
        if (who === 'ai' && char.shield > 90) char.shield = 0;
        this.scene.updateShieldDisplay(who);

        if (amount > 0) {
            this.scene.logMessage(`${who.toUpperCase()} is hit for ${amount} DMG!`);
            this.scene.playSound('hit');

            // Set state to discard
            this.scene.phase = 'discard';
            this.scene.enablePlayerControls(false);

            if (who === 'player') {
                this.scene.cardsToDiscardCount = amount;
                this.scene.promptDiscardSelection();
            } else {
                if (this.scene.mode === 'online') {
                    this.scene.phase = 'discard_request';
                    this.scene.discardTargetCount = amount;
                    this.scene.syncToFirebase('discard_request');
                    this.scene.logMessage('Waiting for opponent to discard...');
                } else {
                    // AI automatically discards
                    this.scene.runAIDiscardAutomation(amount);
                }
            }
        } else {
            // Attack completed without card losses
            this.scene.time.delayedCall(800, () => {
                if (this.scene.pendingExtraAction) {
                    this.scene.pendingExtraAction = false;
                    this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                    this.scene.logMessage(`${this.scene.turn.toUpperCase()} gets another action!`);
                    if (this.scene.turn === 'player') {
                        this.scene.phase = 'action';
                        this.scene.enablePlayerControls(true);
                    } else {
                        this.scene.runAITurn();
                    }
                } else {
                    this.scene.checkTurnContinuation();
                }
            });
        }
    }

    // --- PLAYER MANUAL DISCARD HANDLING ---
    promptDiscardSelection() {
        // Double check if player has enough cards left to discard
        const total = this.scene.player.hand.length + this.scene.player.board.length;
        if (total === 0 || total <= this.scene.cardsToDiscardCount) {
            this.scene.logMessage("Player is out of cards!");
            this.scene.player.hand = [];
            this.scene.player.board = [];
            this.scene.updatePlayerHandDisplay();
            this.scene.updatePlayerBoardDisplay();
            this.scene.updatePlayerLifeDisplay();
            this.scene.checkDefeatCondition('player');
            return;
        }

        this.scene.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.scene.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
        this.scene.discardPromptText.setVisible(true);
    }

    discardCardFromZone(zone, index, who) {
        if (who === 'player' && (this.scene.phase === 'discard' || this.scene.phase === 'discard_request_active') && this.scene.cardsToDiscardCount > 0) {
            const char = this.scene.player;
            let discarded;
            if (zone === 'hand') {
                discarded = char.hand.splice(index, 1)[0];
                this.scene.updatePlayerHandDisplay();
            } else {
                discarded = char.board.splice(index, 1)[0];
                this.scene.updatePlayerBoardDisplay();
            }

            this.scene.sharedDiscard.push(discarded);
            this.scene.updateDeckDiscardDisplay();
            this.scene.updatePlayerLifeDisplay();

            this.scene.cardsToDiscardCount--;
            this.scene.playSound('fire');

            if (this.scene.cardsToDiscardCount <= 0) {
                this.scene.discardPromptText.setVisible(false);
                this.scene.logMessage("Player finished discarding cards.");
                
                if (this.scene.phase === 'discard_request_active') {
                    this.scene.phase = 'discard_response';
                    this.scene.syncToFirebase('discard_response');
                    this.scene.enablePlayerControls(false);
                    this.scene.logMessage('Waiting for turn resolution...');
                } else {
                    this.scene.phase = 'action';
                    // End turn and rotate (or grant extra action)
                    this.scene.time.delayedCall(600, () => {
                        if (this.scene.pendingExtraAction) {
                            this.scene.pendingExtraAction = false;
                            this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                            this.scene.logMessage('Player gets another action!');
                            this.scene.enablePlayerControls(true);
                        } else {
                            this.scene.checkTurnContinuation();
                        }
                    });
                }
            } else {
                this.scene.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.scene.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
            }
        }
    }

    // --- AI STRATEGIC AGENT ---
    getValidBoardCombos(board) {
        const results = [];
        const n = board.length;
        if (n === 0) return results;
        
        // 1-card combos
        for (let i = 0; i < n; i++) results.push([i]);
        
        // 2-card combos
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                results.push([i, j]);
            }
        }
        
        // 3-card combos
        if (n >= 3) {
            results.push([0, 1, 2]);
        }
        
        return results;
    }

    scoreAISpell(spell, isReaction, incomingDamage) {
        let score = 0;
        const cycle = this.scene.cycleElements[this.scene.cycleIndex];
        
        let isEmp = false;
        if (spell.synergyType === 'constructive' && cycle === spell.element) isEmp = true;
        else if (spell.synergyType === 'destructive' && cycle !== spell.element && spell.combo.includes(cycle)) isEmp = true;
        else if (spell.synergyType === 'prestructive' && !spell.combo.includes(cycle)) isEmp = true;

        if (isReaction) {
            if (spell.shield > 0) {
                score += spell.shield * 10;
                if (spell.shield >= incomingDamage) score += 20; // Bonus for fully blocking
                if (isEmp) score += 5;
                score -= spell.combo.length; // Tie-breaker: use fewer cards
            } else {
                return -1; // Not a defensive spell
            }
        } else {
            score += spell.damage * 10;
            score += spell.shield * 8;
            score += spell.draw * 5;
            score += spell.drain * 6;
            
            if (isEmp) score += 15; // Strongly prefer empowered spells
            
            // Situational adjustments
            if (this.scene.ai.life <= 4) {
                score += spell.shield * 10; // Desperate for shield
                score += spell.drain * 10; // Desperate to drain opponent's capability
            }
            if (this.scene.player.life <= 4) {
                score += spell.damage * 15; // Go for the kill
            }
            
            score += spell.combo.length; 
        }
        
        return score;
    }

    checkTurnContinuation() {
        if (this.scene.turn === 'player' && (!this.scene.manaPlacedThisTurn || !this.scene.spellCastThisTurn)) {
            this.scene.phase = 'action';
            this.scene.enablePlayerControls(true);
        } else if (this.scene.turn === 'ai' && (!this.scene.manaPlacedThisTurn || !this.scene.spellCastThisTurn)) {
            this.scene.runAITurn();
        } else {
            this.scene.endTurn();
        }
    }

    runAITurn() {
        if (this.scene.phase === 'gameover') return;

        this.scene.logMessage("AI is evaluating options...");

        // Smart decision making logic:
        // 1. Play mana if board has less than 3 cards
        if (!this.scene.manaPlacedThisTurn && this.scene.ai.board.length < 3 && this.scene.ai.hand.length > 0) {
            this.scene.manaPlacedThisTurn = true;
            // Find a duplicate element or just play first
            const idxToPlay = 0; 
            const el = this.scene.ai.hand.splice(idxToPlay, 1)[0];
            this.scene.ai.board.push(el);

            this.scene.playSound('draw');
            this.scene.logMessage(`AI plays [${el.toUpperCase()}] mana to board.`);
            if (this.scene.ai.status.manaPlayDamage > 0) {
                this.scene.forceDiscardRandom('player', 1);
                this.scene.logMessage(`AI's mana play deals 1 damage to Player!`);
            }
            if (this.scene.player.status.oppManaPlayDamage > 0) {
                this.scene.forceDiscardRandom('ai', 1);
                this.scene.logMessage(`AI takes 1 damage from playing mana due to Player Surge!`);
            }
            
            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();

            this.scene.time.delayedCall(1200, () => {
                // Check bonusManaPlays: AI gets a second mana play
                if (this.scene.ai.status.bonusManaPlays > 0 && this.scene.ai.hand.length > 0 && this.scene.ai.board.length < 3) {
                    this.scene.ai.status.bonusManaPlays = 0;
                    this.scene.manaPlacedThisTurn = false;
                    this.scene.logMessage(`AI plays a second mana!`);
                    const el2 = this.scene.ai.hand.splice(0, 1)[0];
                    this.scene.ai.board.push(el2);
                    this.scene.logMessage(`AI plays [${el2.toUpperCase()}] mana to board.`);
                    this.scene.updateAIHandDisplay();
                    this.scene.updateAIBoardDisplay();
                    this.scene.updateAILifeDisplay();
                }
                this.scene.runAITurn();
            });
            return;
        }

        // 2. Try to form a spell combo from board
        if (!this.scene.spellCastThisTurn && this.scene.ai.board.length >= 2) {
            const combos = this.scene.getValidBoardCombos(this.scene.ai.board);
            let bestSpell = null;
            let bestComboIndices = null;
            let bestScore = -1;

            combos.forEach(indices => {
                const elements = indices.map(idx => this.scene.ai.board[idx]);
                const spell = this.scene.getSpellFromCombo(elements);
                if (spell) {
                    const score = this.scene.scoreAISpell(spell, false, 0);
                    if (score > bestScore) {
                        bestScore = score;
                        bestSpell = spell;
                        bestComboIndices = indices;
                    }
                }
            });

            if (bestSpell) {
                this.scene.spellCastThisTurn = true;
                // Consume
                bestComboIndices.sort((a,b) => b-a);
                bestComboIndices.forEach(idx => {
                    const consumed = this.scene.ai.board.splice(idx, 1)[0];
                    this.scene.sharedDiscard.push(consumed);
                });

                this.scene.updateAIBoardDisplay();
                this.scene.updateAILifeDisplay();
                this.scene.updateDeckDiscardDisplay();

                this.scene.logMessage(`AI casts: ${bestSpell.name}!`);

                const w = this.scene.scale.width;
                this.scene.triggerSpellVisual(bestSpell, w / 2 + 100, 200, w / 2 + 100, 500, () => {
                    this.scene.initiateAttack('ai', 'player', bestSpell);
                });
                return;
            }
        }

        if (this.scene.manaPlacedThisTurn || this.scene.spellCastThisTurn) {
            this.scene.logMessage("AI ends turn.");
            this.scene.time.delayedCall(1200, () => {
                this.scene.endTurn();
            });
            return;
        }

        // 3. Fallback: pass to draw
        this.scene.logMessage("AI chooses Pass to Draw.");
        const extra = this.scene.drawCard();
        if (extra) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (this.scene.ai.status.autoPlayDraw > 0 && this.scene.ai.board.length < 3) {
                this.scene.ai.board.push(extra);
                this.scene.logMessage(`AI's drawn mana is auto-played to board!`);
            } else {
                this.scene.ai.hand.push(extra);
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (this.scene.ai.status.loseManaOnDraw > 0 && this.scene.ai.hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * this.scene.ai.hand.length);
                const lost = this.scene.ai.hand.splice(lostIdx, 1)[0];
                this.scene.sharedDiscard.push(lost);
                this.scene.logMessage(`AI lost a hand mana from drawing!`);
            }

            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
        }

        this.scene.time.delayedCall(1200, () => {
            this.scene.endTurn();
        });
    }

    calculateAIReaction(incomingDamage) {
        if (this.scene.ai.board.length === 0) return null;
        if (this.scene.mode === 'test' && this.scene.dummyMode === 'passive') return null;

        const combos = this.scene.getValidBoardCombos(this.scene.ai.board);
        let bestSpell = null;
        let bestComboIndices = null;
        let bestScore = -1;

        combos.forEach(indices => {
            const elements = indices.map(idx => this.scene.ai.board[idx]);
            const spell = this.scene.getSpellFromCombo(elements);
            if (spell) {
                const score = this.scene.scoreAISpell(spell, true, incomingDamage);
                if (score > bestScore) {
                    bestScore = score;
                    bestSpell = spell;
                    bestComboIndices = indices;
                }
            }
        });

        if (bestSpell && bestScore > -1) {
            // Consume board mana
            bestComboIndices.sort((a,b) => b-a);
            bestComboIndices.forEach(idx => {
                const consumed = this.scene.ai.board.splice(idx, 1)[0];
                this.scene.sharedDiscard.push(consumed);
            });

            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
            this.scene.updateDeckDiscardDisplay();
            return bestSpell;
        }

        return null;
    }

    runAIDiscardAutomation(amount) {
        const total = this.scene.ai.hand.length + this.scene.ai.board.length;
        if (total === 0 || total <= amount) {
            this.scene.logMessage("AI is out of cards!");
            this.scene.ai.hand = [];
            this.scene.ai.board = [];
            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
            this.scene.checkDefeatCondition('ai');
            return;
        }

        this.scene.logMessage(`AI is selecting ${amount} card(s) to discard...`);

        for (let i = 0; i < amount; i++) {
            // Prefer discarding from board mana first if excess, then hand
            if (this.scene.ai.board.length > 1) {
                const burned = this.scene.ai.board.pop();
                this.scene.sharedDiscard.push(burned);
            } else {
                const burned = this.scene.ai.hand.pop();
                this.scene.sharedDiscard.push(burned);
            }
            this.scene.playSound('fire');
        }

        this.scene.updateAIHandDisplay();
        this.scene.updateAIBoardDisplay();
        this.scene.updateAILifeDisplay();
        this.scene.updateDeckDiscardDisplay();

        this.scene.phase = 'action';
        
        // Turn cleanup (or grant extra action)
        this.scene.time.delayedCall(1200, () => {
            if (this.scene.pendingExtraAction) {
                this.scene.pendingExtraAction = false;
                this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                if (this.scene.turn === 'player') {
                    this.scene.logMessage('Player gets another action!');
                    this.scene.enablePlayerControls(true);
                } else {
                    this.scene.logMessage('AI gets another action!');
                    this.scene.runAITurn();
                }
            } else {
                this.scene.checkTurnContinuation();
            }
        });
    }

    // --- ALPHABETICAL SPELL COMBO PARSER ---
    getSpellFromCombo(combo) {

        return getSpellFromCombo(combo);

    }

    isWeakenedByCycle(spellEl, cycleEl) {


        return isWeakenedByCycle(spellEl, cycleEl);


    }

    // --- GAME OVER DISPLAY ---
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
    }

    // ============================================================
    // ONLINE MULTIPLAYER ENGINE
    // ============================================================

    /**
     * Set up an online game. Host initializes state and syncs to Firebase.
     * Guest waits for the initial state from Firebase.
     */
    setupOnlineGame() {
        this.scene.logMessage(`Online mode: you are the ${this.scene.myRole.toUpperCase()}.`);
        this.scene.logMessage(`Lobby: ${this.scene.lobbyCode}`);

        if (this.scene.myRole === 'host') {
            // Host initializes the game state
            this.scene.initSharedDeck();
            this.scene.dealStartingHands();

            // Write initial state to Firebase so guest can load it
            this.scene.syncToFirebase('init');

            // Host goes first
            this.scene.startTurn('player');
        }

        // Both host and guest listen for state changes
        this.scene.startFirebaseListener();
    }

    /**
     * Serialize the current game state into a plain object for Firebase.
     */
    serializeState() {
        const myKey = this.scene.myRole;
        const oppKey = this.scene.myRole === 'host' ? 'guest' : 'host';

        return {
            deck: this.scene.sharedDeck.slice(),
            discard: this.scene.sharedDiscard.slice(),
            cycleIndex: this.scene.cycleIndex,
            firstCycleIndex: this.scene.firstCycleIndex,
            turn: this.scene.turn === 'player' ? myKey : oppKey,
            phase: this.scene.phase,
            actionUsed: this.scene.actionUsedThisTurn,
            [`${myKey}Hand`]: this.scene.player.hand.slice(),
            [`${myKey}Board`]: this.scene.player.board.slice(),
            [`${myKey}Shield`]: this.scene.player.shield,
            [`${myKey}Life`]: this.scene.player.life,
            [`${myKey}SteamDebuff`]: this.scene.player.steamDebuff || false,
            [`${oppKey}Hand`]: this.scene.ai.hand.slice(),
            [`${oppKey}Board`]: this.scene.ai.board.slice(),
            [`${oppKey}Shield`]: this.scene.ai.shield,
            [`${oppKey}Life`]: this.scene.ai.life,
            [`${oppKey}SteamDebuff`]: this.scene.ai.steamDebuff || false,
            reactionTargetSpell: this.scene.reactionTargetSpell || null,
            reactionResponseSpell: this.scene.reactionResponseSpell || null,
            reactionSource: this.scene.reactionSource || null,
            reactionCaster: this.scene.reactionCaster || null,
            discardTargetCount: this.scene.discardTargetCount || 0,
            seq: Date.now()
        };
    }

    /**
     * Write current state to Firebase.
     */
    async syncToFirebase(actionType) {
        if (this.scene.mode !== 'online' || !this.scene.lobbyCode) return;

        try {
            const state = this.scene.serializeState();
            const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);
            await ref.update({
                gameState: state,
                lastActionBy: this.scene.myRole,
                status: this.scene.phase === 'gameover' ? 'finished' : 'playing'
            });
        } catch (err) {
            console.error('[Whelmen Online] Sync error:', err);
            this.scene.logMessage('⚠ Network sync error. Retrying...');
        }
    }

    /**
     * Start listening for Firebase state changes from the opponent.
     */
    startFirebaseListener() {
        const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);

        const handler = (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.gameState) return;

            const state = data.gameState;
            const lastBy = data.lastActionBy;

            // Ignore our own writes
            if (lastBy === this.scene.myRole) return;

            // Handle disconnection
            if (data.status === 'abandoned' || data.status === 'disconnected') {
                this.scene.logMessage('⚠ Opponent disconnected!');
                this.scene.showDisconnectOverlay();
                return;
            }

            // Load the remote state
            this.scene.loadFromFirebase(state);
        };

        ref.on('value', handler);
        this.scene.firebaseUnsub = () => ref.off('value', handler);
    }

    /**
     * Load game state from Firebase (called when opponent acts).
     * Maps host/guest data to local player/ai based on our role.
     */
    loadFromFirebase(state) {
        const myKey = this.scene.myRole;
        const oppKey = this.scene.myRole === 'host' ? 'guest' : 'host';

        // Update deck and discard
        this.scene.sharedDeck = state.deck ? state.deck.slice() : [];
        this.scene.sharedDiscard = state.discard ? state.discard.slice() : [];

        // Update cycle
        this.scene.cycleIndex = state.cycleIndex || 0;
        this.scene.firstCycleIndex = state.firstCycleIndex || 1;

        // Map MY data to this.scene.player
        this.scene.player.hand = (state[`${myKey}Hand`] || []).slice();
        this.scene.player.board = (state[`${myKey}Board`] || []).slice();
        this.scene.player.shield = state[`${myKey}Shield`] || 0;
        this.scene.player.life = this.scene.player.hand.length + this.scene.player.board.length;
        this.scene.player.steamDebuff = state[`${myKey}SteamDebuff`] || false;

        // Map OPPONENT data to this.scene.ai
        this.scene.ai.hand = (state[`${oppKey}Hand`] || []).slice();
        this.scene.ai.board = (state[`${oppKey}Board`] || []).slice();
        this.scene.ai.shield = state[`${oppKey}Shield`] || 0;
        this.scene.ai.life = this.scene.ai.hand.length + this.scene.ai.board.length;
        this.scene.ai.steamDebuff = state[`${oppKey}SteamDebuff`] || false;

        // Update action state
        this.scene.actionUsedThisTurn = state.actionUsed || false;
        this.scene.phase = state.phase || 'action';

        // Determine whose turn it is locally
        const isMyTurn = state.turn === myKey;
        this.scene.turn = isMyTurn ? 'player' : 'ai';

        // Refresh all UI
        this.scene.refreshAllUI();

        // Handle game over
        if (state.phase === 'gameover') {
            this.scene.phase = 'gameover';
            return;
        }

        // Handle Request/Response phases FIRST
        if (state.phase === 'reaction_request' && !isMyTurn) {
            // We are the guest and need to react
            this.scene.reactionTargetSpell = state.reactionTargetSpell;
            this.scene.reactionSource = state.reactionSource;
            this.scene.reactionCaster = state.reactionCaster;
            
            this.scene.phase = 'reaction_request_active';
            this.scene.logMessage(`Reaction window triggers for you!`);
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            return;
        }

        if (state.phase === 'reaction_response' && isMyTurn) {
            // We are the host and the guest responded
            this.scene.phase = 'action'; // Reset phase internally
            const responseSpell = state.reactionResponseSpell || null;
            this.scene.resolveDefendingReaction(responseSpell);
            return;
        }

        if (state.phase === 'discard_request' && !isMyTurn) {
            this.scene.cardsToDiscardCount = state.discardTargetCount;
            this.scene.phase = 'discard_request_active';
            this.scene.promptDiscardSelection();
            return;
        }

        if (state.phase === 'discard_response' && isMyTurn) {
            this.scene.phase = 'action';
            // Complete the attack process
            this.scene.time.delayedCall(600, () => {
                if (this.scene.pendingExtraAction) {
                    this.scene.pendingExtraAction = false;
                    this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                    this.scene.logMessage('You get another action!');
                    this.scene.enablePlayerControls(true);
                } else {
                    this.scene.checkTurnContinuation();
                }
            });
            return;
        }

        // Normal Turn Logic
        if (isMyTurn) {
            this.scene.logMessage("--- YOUR TURN ---");
            this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            this.scene.logMessage('It is your turn. Choose an action.');
        } else {
            this.scene.enablePlayerControls(false);
            this.scene.logMessage('Waiting for opponent...');
        }
    }

    /**
     * Refresh all UI elements to match current state.
     */
    refreshAllUI() {
        this.scene.updatePlayerHandDisplay();
        this.scene.updatePlayerBoardDisplay();
        this.scene.updatePlayerLifeDisplay();
        this.scene.updateAIHandDisplay();
        this.scene.updateAIBoardDisplay();
        this.scene.updateAILifeDisplay();
        this.scene.updateDeckDiscardDisplay();
        // Update cycle indicator rotation directly
        if (this.scene.cycleContainer) {
            this.scene.cycleContainer.rotation = -(this.scene.cycleIndex - 1) * (Math.PI / 2);
            this.scene.updateCycleDisplayColor(this.scene.cycleElements[this.scene.cycleIndex]);
        }
        this.scene.updateComboPreview();

        // Update shield visuals
        this.scene.updateShieldDisplay('player');
        this.scene.updateShieldDisplay('ai');
    }

    /**
     * Show a disconnect overlay when opponent leaves.
     */
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
    }

    /**
     * Clean up Firebase listeners and lobby on exit.
     */
    cleanupOnline() {
        if (this.scene.firebaseUnsub) {
            this.scene.firebaseUnsub();
            this.scene.firebaseUnsub = null;
        }
        if (this.scene.lobbyCode) {
            firebase.database().ref(`lobbies/${this.scene.lobbyCode}/status`).set('finished').catch(() => {});
        }
    }

    update() {
        if (this.scene.cycleContainer) {
            const rot = this.scene.cycleContainer.rotation;
            if (this.scene.cycleCenterText) {
                this.scene.cycleCenterText.rotation = -rot;
            }
            if (this.scene.cycleLabels) {
                this.scene.cycleLabels.forEach(label => {
                    label.rotation = -rot;
                });
            }
        }
    }

    findSpellInMessage(msg) {


        return findSpellInMessage(msg);


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
        const totalHeight = this.scene.getLogTotalHeight();
        
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
        this.scene.updateScrollbar();
    }

    scrollDuelHistoryTo(targetY) {
        if (!this.scene.logScrollContainer || !this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return;
        
        const viewportHeight = 360;
        const totalHeight = this.scene.getLogTotalHeight();
        
        if (totalHeight <= viewportHeight) {
            this.scene.logScrollContainer.y = 0;
            this.scene.updateScrollbar();
            return;
        }
        
        const minY = viewportHeight - totalHeight;
        const maxY = 0;
        
        if (targetY < minY) targetY = minY;
        if (targetY > maxY) targetY = maxY;
        
        this.scene.logScrollContainer.y = targetY;
        this.scene.updateScrollbar();
    }

    scrollDuelHistory(deltaY) {
        if (!this.scene.logScrollContainer || !this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return;
        
        // Scroll by 1 line height (26px) per tick
        const scrollAmount = -Math.sign(deltaY) * 26;
        this.scene.scrollDuelHistoryTo(this.scene.logScrollContainer.y + scrollAmount);
    }

    updateScrollbar() {
        if (!this.scene.logScrollbarGraphics) return;
        
        this.scene.logScrollbarGraphics.clear();
        
        const viewportHeight = 360;
        const totalHeight = this.scene.getLogTotalHeight();
        
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
                    this.scene.showSandboxNotification("Board is full!");
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
            this.scene.resetDummyState();
            this.scene.showSandboxNotification("Dummy Health Reset!");
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
                        this.scene.showSandboxNotification("Must discard first!");
                        return;
                    }
                    
                    this.scene.playSound('click');
                    this.scene.logMessage(`[Sandbox] Instant Casting: ${spell.name}!`);
                    const w = this.scene.scale.width;
                    
                    // Visual spell fire from player center to AI center
                    this.scene.triggerSpellVisual(spell, w / 2 - 100, 500, w / 2 - 100, 100, () => {
                        this.scene.initiateAttack('player', 'ai', spell);
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
    }

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
    }
}


applyDamage(defender, finalDmg, false);
            } else {
                // Done with spelling, auto-end turn after a slight delay
                this.scene.time.delayedCall(800, () => this.resolvePostAction());
            }
        }
    }

    startReactionPhase(attacker, defender, incomingSpell) {
        this.scene.phase = 'reaction';
        this.scene.reactionTargetSpell = incomingSpell;
        this.scene.reactionSource = attacker;
        this.scene.reactionCaster = defender;

        this.scene.logMessage(`Reaction window triggers for ${defender.toUpperCase()}!`);

        if (defender === 'player') {
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
        } else {
            if (this.scene.mode === 'online') {
                this.scene.logMessage('Waiting for opponent to react...');
                this.scene.phase = 'reaction_request';
                this.scene.syncToFirebase('reaction_request');
            } else {
                // AI Reaction automation
                this.scene.time.delayedCall(1000, () => {
                    const reactionSpell = this.scene.calculateAIReaction(incomingSpell.damage);
                    this.scene.resolveDefendingReaction(reactionSpell);
                });
            }
        }
    }

    resolveDefendingReaction(reactionSpell) {

        const defender = this.scene.reactionCaster;
        const attacker = this.scene.reactionSource;
        const defChar = defender === 'player' ? this.scene.player : this.scene.ai;
        const attChar = attacker === 'player' ? this.scene.player : this.scene.ai;

        if (reactionSpell) {
            this.scene.logMessage(`${defender.toUpperCase()} casts reaction: ${reactionSpell.name}!`);

            // Apply synergy using the new three-way system
            const cycle = this.scene.cycleElements[this.scene.cycleIndex];
            let isEmp = false;
            if (reactionSpell.synergyType === 'constructive' && cycle === reactionSpell.element) isEmp = true;
            else if (reactionSpell.synergyType === 'destructive' && cycle !== reactionSpell.element && reactionSpell.combo.includes(cycle)) isEmp = true;
            else if (reactionSpell.synergyType === 'prestructive' && reactionSpell.combo && !reactionSpell.combo.includes(cycle)) isEmp = true;

            let rDmg = reactionSpell.damage;
            let rShield = reactionSpell.shield;

            if (isEmp) {
                // Apply empowered value overrides for reaction spells
                if (reactionSpell.name === 'Shell') rShield = 5;
                if (reactionSpell.name === 'Spark') rDmg = 3;
                if (reactionSpell.name === 'Carapace') rShield = 8;
                if (reactionSpell.name === 'Blast') rDmg = 5;
                this.scene.logMessage(`${reactionSpell.name} is empowered by synergy!`);
            }

            // Apply reaction shield
            if (rShield > 0) {
                defChar.shield += rShield;
                this.scene.updateShieldDisplay(defender);
                this.scene.logMessage(`${defender.toUpperCase()} gains ${rShield} Reaction Shield.`);
            }

            // Counter damage check
            if (rDmg > 0) {
                this.scene.logMessage(`Reaction deals ${rDmg} counter damage back!`);
                this.scene.applyDamage(attacker, rDmg);
            }
        } else {
            this.scene.logMessage(`${defender.toUpperCase()} takes the direct hit.`);
        }

        // Retaliaton damage: fires when defender has retaliationDamage status
        if (defChar.status.retaliationDamage > 0) {
            this.scene.forceDiscardRandom(attacker, 1);
            this.scene.logMessage(`${defender.toUpperCase()} retaliates for 1 damage!`);
        }

        // Apply incoming damage minus final shield
        const finalDmg = this.scene.reactionTargetSpell.damage;
        this.scene.applyDamage(defender, finalDmg, this.scene.reactionTargetSpell.bypassShield || false);
    }

    applyDamage(who, amount, bypassShield = false) {
        const char = who === 'player' ? this.scene.player : this.scene.ai;
        
        // Shield absorption (Lava Surge bypasses shields entirely)
        if (bypassShield) {
            this.scene.logMessage(`Lava Surge bypasses ${who.toUpperCase()}'s shield!`);
        } else if (char.shield > 0) {
            if (char.shield >= amount) {
                char.shield -= amount;
                this.scene.logMessage(`${who.toUpperCase()}'s shield absorbed all ${amount} DMG!`);
                amount = 0;
            } else {
                amount -= char.shield;
                this.scene.logMessage(`${who.toUpperCase()}'s shield absorbed ${char.shield} DMG. ${amount} DMG passes through!`);
                char.shield = 0;
            }
            this.scene.updateShieldDisplay(who);
        }

        // Clean giant fortress temporary shield
        if (who === 'player' && char.shield > 90) char.shield = 0;
        if (who === 'ai' && char.shield > 90) char.shield = 0;
        this.scene.updateShieldDisplay(who);

        if (amount > 0) {
            this.scene.logMessage(`${who.toUpperCase()} is hit for ${amount} DMG!`);
            this.scene.playSound('hit');

            // Set state to discard
            this.scene.phase = 'discard';
            this.scene.enablePlayerControls(false);

            if (who === 'player') {
                this.scene.cardsToDiscardCount = amount;
                this.scene.promptDiscardSelection();
            } else {
                if (this.scene.mode === 'online') {
                    this.scene.phase = 'discard_request';
                    this.scene.discardTargetCount = amount;
                    this.scene.syncToFirebase('discard_request');
                    this.scene.logMessage('Waiting for opponent to discard...');
                } else {
                    // AI automatically discards
                    this.scene.runAIDiscardAutomation(amount);
                }
            }
        } else {
            // Attack completed without card losses
            this.scene.time.delayedCall(800, () => {
                if (this.scene.pendingExtraAction) {
                    this.scene.pendingExtraAction = false;
                    this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                    this.scene.logMessage(`${this.scene.turn.toUpperCase()} gets another action!`);
                    if (this.scene.turn === 'player') {
                        this.scene.phase = 'action';
                        this.scene.enablePlayerControls(true);
                    } else {
                        this.scene.runAITurn();
                    }
                } else {
                    this.scene.checkTurnContinuation();
                }
            });
        }
    }

    // --- PLAYER MANUAL DISCARD HANDLING ---
    promptDiscardSelection() {
        // Double check if player has enough cards left to discard
        const total = this.scene.player.hand.length + this.scene.player.board.length;
        if (total === 0 || total <= this.scene.cardsToDiscardCount) {
            this.scene.logMessage("Player is out of cards!");
            this.scene.player.hand = [];
            this.scene.player.board = [];
            this.scene.updatePlayerHandDisplay();
            this.scene.updatePlayerBoardDisplay();
            this.scene.updatePlayerLifeDisplay();
            this.scene.checkDefeatCondition('player');
            return;
        }

        this.scene.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.scene.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
        this.scene.discardPromptText.setVisible(true);
    }

    discardCardFromZone(zone, index, who) {
        if (who === 'player' && (this.scene.phase === 'discard' || this.scene.phase === 'discard_request_active') && this.scene.cardsToDiscardCount > 0) {
            const char = this.scene.player;
            let discarded;
            if (zone === 'hand') {
                discarded = char.hand.splice(index, 1)[0];
                this.scene.updatePlayerHandDisplay();
            } else {
                discarded = char.board.splice(index, 1)[0];
                this.scene.updatePlayerBoardDisplay();
            }

            this.scene.sharedDiscard.push(discarded);
            this.scene.updateDeckDiscardDisplay();
            this.scene.updatePlayerLifeDisplay();

            this.scene.cardsToDiscardCount--;
            this.scene.playSound('fire');

            if (this.scene.cardsToDiscardCount <= 0) {
                this.scene.discardPromptText.setVisible(false);
                this.scene.logMessage("Player finished discarding cards.");
                
                if (this.scene.phase === 'discard_request_active') {
                    this.scene.phase = 'discard_response';
                    this.scene.syncToFirebase('discard_response');
                    this.scene.enablePlayerControls(false);
                    this.scene.logMessage('Waiting for turn resolution...');
                } else {
                    this.scene.phase = 'action';
                    // End turn and rotate (or grant extra action)
                    this.scene.time.delayedCall(600, () => {
                        if (this.scene.pendingExtraAction) {
                            this.scene.pendingExtraAction = false;
                            this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                            this.scene.logMessage('Player gets another action!');
                            this.scene.enablePlayerControls(true);
                        } else {
                            this.scene.checkTurnContinuation();
                        }
                    });
                }
            } else {
                this.scene.discardPromptText.setText(`DAMAGE! CHOOSE & DISCARD ${this.scene.cardsToDiscardCount} CARD(S)\nFROM HAND OR BOARD MANA`);
            }
        }
    }

    // --- AI STRATEGIC AGENT ---
    getValidBoardCombos(board) {
        const results = [];
        const n = board.length;
        if (n === 0) return results;
        
        // 1-card combos
        for (let i = 0; i < n; i++) results.push([i]);
        
        // 2-card combos
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                results.push([i, j]);
            }
        }
        
        // 3-card combos
        if (n >= 3) {
            results.push([0, 1, 2]);
        }
        
        return results;
    }

    scoreAISpell(spell, isReaction, incomingDamage) {
        let score = 0;
        const cycle = this.scene.cycleElements[this.scene.cycleIndex];
        
        let isEmp = false;
        if (spell.synergyType === 'constructive' && cycle === spell.element) isEmp = true;
        else if (spell.synergyType === 'destructive' && cycle !== spell.element && spell.combo.includes(cycle)) isEmp = true;
        else if (spell.synergyType === 'prestructive' && !spell.combo.includes(cycle)) isEmp = true;

        if (isReaction) {
            if (spell.shield > 0) {
                score += spell.shield * 10;
                if (spell.shield >= incomingDamage) score += 20; // Bonus for fully blocking
                if (isEmp) score += 5;
                score -= spell.combo.length; // Tie-breaker: use fewer cards
            } else {
                return -1; // Not a defensive spell
            }
        } else {
            score += spell.damage * 10;
            score += spell.shield * 8;
            score += spell.draw * 5;
            score += spell.drain * 6;
            
            if (isEmp) score += 15; // Strongly prefer empowered spells
            
            // Situational adjustments
            if (this.scene.ai.life <= 4) {
                score += spell.shield * 10; // Desperate for shield
                score += spell.drain * 10; // Desperate to drain opponent's capability
            }
            if (this.scene.player.life <= 4) {
                score += spell.damage * 15; // Go for the kill
            }
            
            score += spell.combo.length; 
        }
        
        return score;
    }

    checkTurnContinuation() {
        if (this.scene.turn === 'player' && (!this.scene.manaPlacedThisTurn || !this.scene.spellCastThisTurn)) {
            this.scene.phase = 'action';
            this.scene.enablePlayerControls(true);
        } else if (this.scene.turn === 'ai' && (!this.scene.manaPlacedThisTurn || !this.scene.spellCastThisTurn)) {
            this.scene.runAITurn();
        } else {
            this.scene.endTurn();
        }
    }

    runAITurn() {
        if (this.scene.phase === 'gameover') return;

        this.scene.logMessage("AI is evaluating options...");

        // Smart decision making logic:
        // 1. Play mana if board has less than 3 cards
        if (!this.scene.manaPlacedThisTurn && this.scene.ai.board.length < 3 && this.scene.ai.hand.length > 0) {
            this.scene.manaPlacedThisTurn = true;
            // Find a duplicate element or just play first
            const idxToPlay = 0; 
            const el = this.scene.ai.hand.splice(idxToPlay, 1)[0];
            this.scene.ai.board.push(el);

            this.scene.playSound('draw');
            this.scene.logMessage(`AI plays [${el.toUpperCase()}] mana to board.`);
            if (this.scene.ai.status.manaPlayDamage > 0) {
                this.scene.forceDiscardRandom('player', 1);
                this.scene.logMessage(`AI's mana play deals 1 damage to Player!`);
            }
            if (this.scene.player.status.oppManaPlayDamage > 0) {
                this.scene.forceDiscardRandom('ai', 1);
                this.scene.logMessage(`AI takes 1 damage from playing mana due to Player Surge!`);
            }
            
            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();

            this.scene.time.delayedCall(1200, () => {
                // Check bonusManaPlays: AI gets a second mana play
                if (this.scene.ai.status.bonusManaPlays > 0 && this.scene.ai.hand.length > 0 && this.scene.ai.board.length < 3) {
                    this.scene.ai.status.bonusManaPlays = 0;
                    this.scene.manaPlacedThisTurn = false;
                    this.scene.logMessage(`AI plays a second mana!`);
                    const el2 = this.scene.ai.hand.splice(0, 1)[0];
                    this.scene.ai.board.push(el2);
                    this.scene.logMessage(`AI plays [${el2.toUpperCase()}] mana to board.`);
                    this.scene.updateAIHandDisplay();
                    this.scene.updateAIBoardDisplay();
                    this.scene.updateAILifeDisplay();
                }
                this.scene.runAITurn();
            });
            return;
        }

        // 2. Try to form a spell combo from board
        if (!this.scene.spellCastThisTurn && this.scene.ai.board.length >= 2) {
            const combos = this.scene.getValidBoardCombos(this.scene.ai.board);
            let bestSpell = null;
            let bestComboIndices = null;
            let bestScore = -1;

            combos.forEach(indices => {
                const elements = indices.map(idx => this.scene.ai.board[idx]);
                const spell = this.scene.getSpellFromCombo(elements);
                if (spell) {
                    const score = this.scene.scoreAISpell(spell, false, 0);
                    if (score > bestScore) {
                        bestScore = score;
                        bestSpell = spell;
                        bestComboIndices = indices;
                    }
                }
            });

            if (bestSpell) {
                this.scene.spellCastThisTurn = true;
                // Consume
                bestComboIndices.sort((a,b) => b-a);
                bestComboIndices.forEach(idx => {
                    const consumed = this.scene.ai.board.splice(idx, 1)[0];
                    this.scene.sharedDiscard.push(consumed);
                });

                this.scene.updateAIBoardDisplay();
                this.scene.updateAILifeDisplay();
                this.scene.updateDeckDiscardDisplay();

                this.scene.logMessage(`AI casts: ${bestSpell.name}!`);

                const w = this.scene.scale.width;
                this.scene.triggerSpellVisual(bestSpell, w / 2 + 100, 200, w / 2 + 100, 500, () => {
                    this.scene.initiateAttack('ai', 'player', bestSpell);
                });
                return;
            }
        }

        if (this.scene.manaPlacedThisTurn || this.scene.spellCastThisTurn) {
            this.scene.logMessage("AI ends turn.");
            this.scene.time.delayedCall(1200, () => {
                this.scene.endTurn();
            });
            return;
        }

        // 3. Fallback: pass to draw
        this.scene.logMessage("AI chooses Pass to Draw.");
        const extra = this.scene.drawCard();
        if (extra) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (this.scene.ai.status.autoPlayDraw > 0 && this.scene.ai.board.length < 3) {
                this.scene.ai.board.push(extra);
                this.scene.logMessage(`AI's drawn mana is auto-played to board!`);
            } else {
                this.scene.ai.hand.push(extra);
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (this.scene.ai.status.loseManaOnDraw > 0 && this.scene.ai.hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * this.scene.ai.hand.length);
                const lost = this.scene.ai.hand.splice(lostIdx, 1)[0];
                this.scene.sharedDiscard.push(lost);
                this.scene.logMessage(`AI lost a hand mana from drawing!`);
            }

            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
        }

        this.scene.time.delayedCall(1200, () => {
            this.scene.endTurn();
        });
    }

    calculateAIReaction(incomingDamage) {
        if (this.scene.ai.board.length === 0) return null;
        if (this.scene.mode === 'test' && this.scene.dummyMode === 'passive') return null;

        const combos = this.scene.getValidBoardCombos(this.scene.ai.board);
        let bestSpell = null;
        let bestComboIndices = null;
        let bestScore = -1;

        combos.forEach(indices => {
            const elements = indices.map(idx => this.scene.ai.board[idx]);
            const spell = this.scene.getSpellFromCombo(elements);
            if (spell) {
                const score = this.scene.scoreAISpell(spell, true, incomingDamage);
                if (score > bestScore) {
                    bestScore = score;
                    bestSpell = spell;
                    bestComboIndices = indices;
                }
            }
        });

        if (bestSpell && bestScore > -1) {
            // Consume board mana
            bestComboIndices.sort((a,b) => b-a);
            bestComboIndices.forEach(idx => {
                const consumed = this.scene.ai.board.splice(idx, 1)[0];
                this.scene.sharedDiscard.push(consumed);
            });

            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
            this.scene.updateDeckDiscardDisplay();
            return bestSpell;
        }

        return null;
    }

    runAIDiscardAutomation(amount) {
        const total = this.scene.ai.hand.length + this.scene.ai.board.length;
        if (total === 0 || total <= amount) {
            this.scene.logMessage("AI is out of cards!");
            this.scene.ai.hand = [];
            this.scene.ai.board = [];
            this.scene.updateAIHandDisplay();
            this.scene.updateAIBoardDisplay();
            this.scene.updateAILifeDisplay();
            this.scene.checkDefeatCondition('ai');
            return;
        }

        this.scene.logMessage(`AI is selecting ${amount} card(s) to discard...`);

        for (let i = 0; i < amount; i++) {
            // Prefer discarding from board mana first if excess, then hand
            if (this.scene.ai.board.length > 1) {
                const burned = this.scene.ai.board.pop();
                this.scene.sharedDiscard.push(burned);
            } else {
                const burned = this.scene.ai.hand.pop();
                this.scene.sharedDiscard.push(burned);
            }
            this.scene.playSound('fire');
        }

        this.scene.updateAIHandDisplay();
        this.scene.updateAIBoardDisplay();
        this.scene.updateAILifeDisplay();
        this.scene.updateDeckDiscardDisplay();

        this.scene.phase = 'action';
        
        // Turn cleanup (or grant extra action)
        this.scene.time.delayedCall(1200, () => {
            if (this.scene.pendingExtraAction) {
                this.scene.pendingExtraAction = false;
                this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                if (this.scene.turn === 'player') {
                    this.scene.logMessage('Player gets another action!');
                    this.scene.enablePlayerControls(true);
                } else {
                    this.scene.logMessage('AI gets another action!');
                    this.scene.runAITurn();
                }
            } else {
                this.scene.checkTurnContinuation();
            }
        });
    }

    // --- ALPHABETICAL SPELL COMBO PARSER ---
    getSpellFromCombo(combo) {

        return getSpellFromCombo(combo);

    }

    isWeakenedByCycle(spellEl, cycleEl) {


        return isWeakenedByCycle(spellEl, cycleEl);


    }

    // --- GAME OVER DISPLAY ---
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
    }

    // ============================================================
    // ONLINE MULTIPLAYER ENGINE
    // ============================================================

    /**
     * Set up an online game. Host initializes state and syncs to Firebase.
     * Guest waits for the initial state from Firebase.
     */
    setupOnlineGame() {
        this.scene.logMessage(`Online mode: you are the ${this.scene.myRole.toUpperCase()}.`);
        this.scene.logMessage(`Lobby: ${this.scene.lobbyCode}`);

        if (this.scene.myRole === 'host') {
            // Host initializes the game state
            this.scene.initSharedDeck();
            this.scene.dealStartingHands();

            // Write initial state to Firebase so guest can load it
            this.scene.syncToFirebase('init');

            // Host goes first
            this.scene.startTurn('player');
        }

        // Both host and guest listen for state changes
        this.scene.startFirebaseListener();
    }

    /**
     * Serialize the current game state into a plain object for Firebase.
     */
    serializeState() {
        const myKey = this.scene.myRole;
        const oppKey = this.scene.myRole === 'host' ? 'guest' : 'host';

        return {
            deck: this.scene.sharedDeck.slice(),
            discard: this.scene.sharedDiscard.slice(),
            cycleIndex: this.scene.cycleIndex,
            firstCycleIndex: this.scene.firstCycleIndex,
            turn: this.scene.turn === 'player' ? myKey : oppKey,
            phase: this.scene.phase,
            actionUsed: this.scene.actionUsedThisTurn,
            [`${myKey}Hand`]: this.scene.player.hand.slice(),
            [`${myKey}Board`]: this.scene.player.board.slice(),
            [`${myKey}Shield`]: this.scene.player.shield,
            [`${myKey}Life`]: this.scene.player.life,
            [`${myKey}SteamDebuff`]: this.scene.player.steamDebuff || false,
            [`${oppKey}Hand`]: this.scene.ai.hand.slice(),
            [`${oppKey}Board`]: this.scene.ai.board.slice(),
            [`${oppKey}Shield`]: this.scene.ai.shield,
            [`${oppKey}Life`]: this.scene.ai.life,
            [`${oppKey}SteamDebuff`]: this.scene.ai.steamDebuff || false,
            reactionTargetSpell: this.scene.reactionTargetSpell || null,
            reactionResponseSpell: this.scene.reactionResponseSpell || null,
            reactionSource: this.scene.reactionSource || null,
            reactionCaster: this.scene.reactionCaster || null,
            discardTargetCount: this.scene.discardTargetCount || 0,
            seq: Date.now()
        };
    }

    /**
     * Write current state to Firebase.
     */
    async syncToFirebase(actionType) {
        if (this.scene.mode !== 'online' || !this.scene.lobbyCode) return;

        try {
            const state = this.scene.serializeState();
            const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);
            await ref.update({
                gameState: state,
                lastActionBy: this.scene.myRole,
                status: this.scene.phase === 'gameover' ? 'finished' : 'playing'
            });
        } catch (err) {
            console.error('[Whelmen Online] Sync error:', err);
            this.scene.logMessage('⚠ Network sync error. Retrying...');
        }
    }

    /**
     * Start listening for Firebase state changes from the opponent.
     */
    startFirebaseListener() {
        const ref = firebase.database().ref(`lobbies/${this.scene.lobbyCode}`);

        const handler = (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.gameState) return;

            const state = data.gameState;
            const lastBy = data.lastActionBy;

            // Ignore our own writes
            if (lastBy === this.scene.myRole) return;

            // Handle disconnection
            if (data.status === 'abandoned' || data.status === 'disconnected') {
                this.scene.logMessage('⚠ Opponent disconnected!');
                this.scene.showDisconnectOverlay();
                return;
            }

            // Load the remote state
            this.scene.loadFromFirebase(state);
        };

        ref.on('value', handler);
        this.scene.firebaseUnsub = () => ref.off('value', handler);
    }

    /**
     * Load game state from Firebase (called when opponent acts).
     * Maps host/guest data to local player/ai based on our role.
     */
    loadFromFirebase(state) {
        const myKey = this.scene.myRole;
        const oppKey = this.scene.myRole === 'host' ? 'guest' : 'host';

        // Update deck and discard
        this.scene.sharedDeck = state.deck ? state.deck.slice() : [];
        this.scene.sharedDiscard = state.discard ? state.discard.slice() : [];

        // Update cycle
        this.scene.cycleIndex = state.cycleIndex || 0;
        this.scene.firstCycleIndex = state.firstCycleIndex || 1;

        // Map MY data to this.scene.player
        this.scene.player.hand = (state[`${myKey}Hand`] || []).slice();
        this.scene.player.board = (state[`${myKey}Board`] || []).slice();
        this.scene.player.shield = state[`${myKey}Shield`] || 0;
        this.scene.player.life = this.scene.player.hand.length + this.scene.player.board.length;
        this.scene.player.steamDebuff = state[`${myKey}SteamDebuff`] || false;

        // Map OPPONENT data to this.scene.ai
        this.scene.ai.hand = (state[`${oppKey}Hand`] || []).slice();
        this.scene.ai.board = (state[`${oppKey}Board`] || []).slice();
        this.scene.ai.shield = state[`${oppKey}Shield`] || 0;
        this.scene.ai.life = this.scene.ai.hand.length + this.scene.ai.board.length;
        this.scene.ai.steamDebuff = state[`${oppKey}SteamDebuff`] || false;

        // Update action state
        this.scene.actionUsedThisTurn = state.actionUsed || false;
        this.scene.phase = state.phase || 'action';

        // Determine whose turn it is locally
        const isMyTurn = state.turn === myKey;
        this.scene.turn = isMyTurn ? 'player' : 'ai';

        // Refresh all UI
        this.scene.refreshAllUI();

        // Handle game over
        if (state.phase === 'gameover') {
            this.scene.phase = 'gameover';
            return;
        }

        // Handle Request/Response phases FIRST
        if (state.phase === 'reaction_request' && !isMyTurn) {
            // We are the guest and need to react
            this.scene.reactionTargetSpell = state.reactionTargetSpell;
            this.scene.reactionSource = state.reactionSource;
            this.scene.reactionCaster = state.reactionCaster;
            
            this.scene.phase = 'reaction_request_active';
            this.scene.logMessage(`Reaction window triggers for you!`);
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            return;
        }

        if (state.phase === 'reaction_response' && isMyTurn) {
            // We are the host and the guest responded
            this.scene.phase = 'action'; // Reset phase internally
            const responseSpell = state.reactionResponseSpell || null;
            this.scene.resolveDefendingReaction(responseSpell);
            return;
        }

        if (state.phase === 'discard_request' && !isMyTurn) {
            this.scene.cardsToDiscardCount = state.discardTargetCount;
            this.scene.phase = 'discard_request_active';
            this.scene.promptDiscardSelection();
            return;
        }

        if (state.phase === 'discard_response' && isMyTurn) {
            this.scene.phase = 'action';
            // Complete the attack process
            this.scene.time.delayedCall(600, () => {
                if (this.scene.pendingExtraAction) {
                    this.scene.pendingExtraAction = false;
                    this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                    this.scene.logMessage('You get another action!');
                    this.scene.enablePlayerControls(true);
                } else {
                    this.scene.checkTurnContinuation();
                }
            });
            return;
        }

        // Normal Turn Logic
        if (isMyTurn) {
            this.scene.logMessage("--- YOUR TURN ---");
            this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
            this.scene.selectedBoardMana = [];
            this.scene.updateComboPreview();
            this.scene.enablePlayerControls(true);
            this.scene.logMessage('It is your turn. Choose an action.');
        } else {
            this.scene.enablePlayerControls(false);
            this.scene.logMessage('Waiting for opponent...');
        }
    }

    /**
     * Refresh all UI elements to match current state.
     */
    refreshAllUI() {
        this.scene.updatePlayerHandDisplay();
        this.scene.updatePlayerBoardDisplay();
        this.scene.updatePlayerLifeDisplay();
        this.scene.updateAIHandDisplay();
        this.scene.updateAIBoardDisplay();
        this.scene.updateAILifeDisplay();
        this.scene.updateDeckDiscardDisplay();
        // Update cycle indicator rotation directly
        if (this.scene.cycleContainer) {
            this.scene.cycleContainer.rotation = -(this.scene.cycleIndex - 1) * (Math.PI / 2);
            this.scene.updateCycleDisplayColor(this.scene.cycleElements[this.scene.cycleIndex]);
        }
        this.scene.updateComboPreview();

        // Update shield visuals
        this.scene.updateShieldDisplay('player');
        this.scene.updateShieldDisplay('ai');
    }

    /**
     * Show a disconnect overlay when opponent leaves.
     */
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
    }

    /**
     * Clean up Firebase listeners and lobby on exit.
     */
    cleanupOnline() {
        if (this.scene.firebaseUnsub) {
            this.scene.firebaseUnsub();
            this.scene.firebaseUnsub = null;
        }
        if (this.scene.lobbyCode) {
            firebase.database().ref(`lobbies/${this.scene.lobbyCode}/status`).set('finished').catch(() => {});
        }
    }

    update() {
        if (this.scene.cycleContainer) {
            const rot = this.scene.cycleContainer.rotation;
            if (this.scene.cycleCenterText) {
                this.scene.cycleCenterText.rotation = -rot;
            }
            if (this.scene.cycleLabels) {
                this.scene.cycleLabels.forEach(label => {
                    label.rotation = -rot;
                });
            }
        }
    }

    findSpellInMessage(msg) {


        return findSpellInMessage(msg);


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
        const totalHeight = this.scene.getLogTotalHeight();
        
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
        this.scene.updateScrollbar();
    }

    scrollDuelHistoryTo(targetY) {
        if (!this.scene.logScrollContainer || !this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return;
        
        const viewportHeight = 360;
        const totalHeight = this.scene.getLogTotalHeight();
        
        if (totalHeight <= viewportHeight) {
            this.scene.logScrollContainer.y = 0;
            this.scene.updateScrollbar();
            return;
        }
        
        const minY = viewportHeight - totalHeight;
        const maxY = 0;
        
        if (targetY < minY) targetY = minY;
        if (targetY > maxY) targetY = maxY;
        
        this.scene.logScrollContainer.y = targetY;
        this.scene.updateScrollbar();
    }

    scrollDuelHistory(deltaY) {
        if (!this.scene.logScrollContainer || !this.scene.allLogTextLines || this.scene.allLogTextLines.length === 0) return;
        
        // Scroll by 1 line height (26px) per tick
        const scrollAmount = -Math.sign(deltaY) * 26;
        this.scene.scrollDuelHistoryTo(this.scene.logScrollContainer.y + scrollAmount);
    }

    updateScrollbar() {
        if (!this.scene.logScrollbarGraphics) return;
        
        this.scene.logScrollbarGraphics.clear();
        
        const viewportHeight = 360;
        const totalHeight = this.scene.getLogTotalHeight();
        
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
                    this.scene.showSandboxNotification("Board is full!");
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
            this.scene.resetDummyState();
            this.scene.showSandboxNotification("Dummy Health Reset!");
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
                        this.scene.showSandboxNotification("Must discard first!");
                        return;
                    }
                    
                    this.scene.playSound('click');
                    this.scene.logMessage(`[Sandbox] Instant Casting: ${spell.name}!`);
                    const w = this.scene.scale.width;
                    
                    // Visual spell fire from player center to AI center
                    this.scene.triggerSpellVisual(spell, w / 2 - 100, 500, w / 2 - 100, 100, () => {
                        this.scene.initiateAttack('player', 'ai', spell);
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
    }

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
    }
}


}
