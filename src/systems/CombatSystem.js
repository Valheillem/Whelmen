export class CombatSystem {
    constructor(scene) {
        this.scene = scene;
    }

    consumeBoardMana(who, indices) {
        const state = this.scene.players[who];
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
                this.scene.aiAgent.runAITurn();
            }
        } else {
            this.scene.checkTurnContinuation();
        }
    }

    drawCardWithStatusEffects(who) {
        const char = this.scene.players[who];
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




    initiateAttack(attacker, defender, spell) {
        let defChar = this.scene.players[defender];
        let attChar = this.scene.players[attacker];
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
            if (attChar.status.shieldFailChance > 0 && Math.random() < 0.5) {
                finalShield = 0;
                this.scene.logMessage(`${attacker.toUpperCase()}'s Shield application failed due to Quake!`);
            } else {
                if (attChar.status.shieldDamageDebuff > 0) {
                    this.scene.forceDiscardRandom(attacker, 1);
                    this.scene.logMessage(`${attacker.toUpperCase()} takes 1 damage from unstable shield!`);
                }
                attChar.shield += finalShield;
                this.scene.updateShieldDisplay(attacker);
                this.scene.logMessage(`${attacker.toUpperCase()} gains ${finalShield} Shield.`);
            }
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
            this.scene.playerIds.forEach(p => {
                this.scene.updatePlayerHandDisplay(p);
                this.scene.updatePlayerBoardDisplay(p);
                this.scene.updatePlayerLifeDisplay(p);
            });
        }
        
        // Drain logic deferred to after reaction phase

        if (isEmp) {
            this.scene.synergy.applyDeferredStatusEffects(spell.name, attChar, defChar);
        }
        // Trigger reaction window if defender has active mana
        if (defChar.board.length > 0) {
            this.scene.startReactionPhase(attacker, defender, { ...spell, damage: finalDmg, bypassShield: false, drain: finalDrain });
        } else {
            // Direct hit
            if (finalDrain > 0) {
                if (attChar.status.drainFailChance > 0 && Math.random() < 0.5) {
                    this.scene.logMessage(`${attacker.toUpperCase()}'s Drain missed due to Tower!`);
                } else {
                    this.scene.forceDiscardRandom(defender, finalDrain, 'board');
                }
            }
            
            if (finalDmg > 0) {
                if (attChar.status.oppSpellReflect > 0) {
                    this.scene.logMessage(`Surge reflects ${finalDmg} damage back to ${attacker.toUpperCase()}!`);
                    this.applyDamage(attacker, finalDmg, false);
                }
                if (defChar.status.retaliationDamage > 0) {
                    this.scene.forceDiscardRandom(attacker, 3);
                    this.scene.logMessage(`${defender.toUpperCase()} retaliates for 3 damage!`);
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
        const defChar = this.scene.players[defender];
        const attChar = this.scene.players[attacker];

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
                if (defChar.status.shieldFailChance > 0 && Math.random() < 0.5) {
                    this.scene.logMessage(`${defender.toUpperCase()}'s Reaction Shield failed due to Quake!`);
                } else {
                    defChar.shield += rShield;
                    this.scene.updateShieldDisplay(defender);
                    this.scene.logMessage(`${defender.toUpperCase()} gains ${rShield} Reaction Shield.`);
                }
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
            this.scene.forceDiscardRandom(attacker, 3);
            this.scene.logMessage(`${defender.toUpperCase()} retaliates for 3 damage!`);
        }

        // Apply incoming damage minus final shield
        const finalDmg = this.scene.reactionTargetSpell.damage;
        if (finalDmg > 0 && attChar.status.oppSpellReflect > 0) {
            this.scene.logMessage(`Surge reflects ${finalDmg} damage back to ${attacker.toUpperCase()}!`);
            this.applyDamage(attacker, finalDmg, false);
        }
        this.scene.applyDamage(defender, finalDmg, this.scene.reactionTargetSpell.bypassShield || false);

        // Apply deferred drain
        if (this.scene.reactionTargetSpell.drain > 0) {
            if (attChar.status.drainFailChance > 0 && Math.random() < 0.5) {
                this.scene.logMessage(`${attacker.toUpperCase()}'s Drain missed due to Tower!`);
            } else {
                this.scene.forceDiscardRandom(defender, this.scene.reactionTargetSpell.drain, 'board');
            }
        }
    }





    applyDamage(who, amount, bypassShield = false) {
        const char = this.scene.players[who];
        
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
        if (who === (this.scene.myRole === "host" || this.scene.mode !== "online" ? "player" : this.scene.myRole) && char.shield > 90) char.shield = 0;
        if (who === 'ai' && char.shield > 90) char.shield = 0;
        this.scene.updateShieldDisplay(who);

        if (amount > 0) {
            this.scene.logMessage(`${who.toUpperCase()} is hit for ${amount} DMG!`);
            this.scene.playSound('hit');

            // Set state to discard
            this.scene.phase = 'discard';
            this.scene.enablePlayerControls(false);

            if (who === (this.scene.myRole === "host" || this.scene.mode !== "online" ? "player" : this.scene.myRole)) {
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
                    this.scene.aiAgent.runAIDiscardAutomation(amount);
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
                        this.scene.aiAgent.runAITurn();
                    }
                } else {
                    this.scene.checkTurnContinuation();
                }
            });
        }
    }

}
