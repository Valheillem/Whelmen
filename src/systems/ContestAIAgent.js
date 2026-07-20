import { getSpellFromCombo } from '../data/SpellCatalog.js';

export class ContestAIAgent {
    constructor(scene) {
        this.scene = scene;
    }

    runAITurn(aiId) {
        this.scene.logMessage(`${aiId.toUpperCase()} evaluates the board...`);

        // 1. Play mana to board
        if (!this.scene.manaPlacedThisTurn && this.scene.players[aiId].hand.length > 0 && this.scene.players[aiId].board.length < 3) {
            // Find a random mana to place, or a strategic one (for now, just the first)
            const idxToPlay = 0;
            const el = this.scene.players[aiId].hand.splice(idxToPlay, 1)[0];
            this.scene.players[aiId].board.push(el);

            this.scene.playSound('draw');
            this.scene.logMessage(`${aiId.toUpperCase()} plays [${el.toUpperCase()}] mana to board.`);
            
            if (this.scene.players[aiId].status.manaPlayDamage > 0) {
                // If the bot has mana play damage, distribute to all alive opponents randomly or hit the lowest?
                const opponents = this.scene.playerIds.filter(id => id !== aiId && this.scene.players[id].life > 0);
                if (opponents.length > 0) {
                    const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
                    this.scene.forceDiscardRandom(randomOpponent, 3);
                    this.scene.logMessage(`${aiId.toUpperCase()}'s mana play deals 3 damage to ${randomOpponent.toUpperCase()}!`);
                }
            }
            // C7 Surge fix: check if any opponent has oppManaPlayDamage active from Surge
            const surgeOpponents = this.scene.playerIds.filter(id => id !== aiId && this.scene.players[id].status.oppManaPlayDamage > 0);
            surgeOpponents.forEach(oppId => {
                this.scene.players[oppId].status.oppManaPlayDamage = 0;
                this.scene.forceDiscardRandom(aiId, 3);
                this.scene.logMessage(`Surge punishes ${aiId.toUpperCase()}'s mana play for 3 damage!`);
            });
            
            this.scene.updatePlayerHandDisplay(aiId);
            this.scene.updatePlayerBoardDisplay(aiId);
            this.scene.updatePlayerLifeDisplay(aiId);
            this.scene.manaPlacedThisTurn = true;
            
            this.scene.time.delayedCall(800, () => {
                // Extra mana logic from Ignition
                if (this.scene.players[aiId].status.bonusManaPlays > 0 && this.scene.players[aiId].hand.length > 0 && this.scene.players[aiId].board.length < 3) {
                    this.scene.players[aiId].status.bonusManaPlays = 0;
                    this.scene.manaPlacedThisTurn = false;
                    this.scene.logMessage(`${aiId.toUpperCase()} plays a second mana!`);
                    const el2 = this.scene.players[aiId].hand.splice(0, 1)[0];
                    this.scene.players[aiId].board.push(el2);
                    this.scene.logMessage(`${aiId.toUpperCase()} plays [${el2.toUpperCase()}] mana to board.`);
                    this.scene.updatePlayerHandDisplay(aiId);
                    this.scene.updatePlayerBoardDisplay(aiId);
                    this.scene.updatePlayerLifeDisplay(aiId);
                }
                this.runAITurn(aiId);
            });
            return;
        }

        // 2. Try to form a spell combo from board
        if (!this.scene.spellCastThisTurn && this.scene.players[aiId].board.length >= 2) {
            const combos = this.getValidBoardCombos(this.scene.players[aiId].board);
            let bestSpell = null;
            let bestComboIndices = null;
            let bestScore = -1;
            let bestTargetId = null;

            const opponents = this.scene.playerIds.filter(id => id !== aiId && this.scene.players[id].life > 0);

            if (opponents.length > 0) {
                combos.forEach(indices => {
                    const elements = indices.map(idx => this.scene.players[aiId].board[idx]);
                    const spell = getSpellFromCombo(elements);
                    if (spell) {
                        opponents.forEach(targetId => {
                            const score = this.scoreAISpell(aiId, spell, false, 0, targetId);
                            if (score > bestScore) {
                                bestScore = score;
                                bestSpell = spell;
                                bestComboIndices = indices;
                                bestTargetId = targetId;
                            }
                        });
                    }
                });
            }

            if (bestSpell) {
                this.scene.spellCastThisTurn = true;
                // Consume
                bestComboIndices.sort((a,b) => b-a);
                bestComboIndices.forEach(idx => {
                    const consumed = this.scene.players[aiId].board.splice(idx, 1)[0];
                    this.scene.sharedDiscard.push(consumed);
                });

                this.scene.updatePlayerBoardDisplay(aiId);
                this.scene.updatePlayerLifeDisplay(aiId);
                this.scene.updateDeckDiscardDisplay();

                const w = this.scene.scale.width;
                const requiresTarget = bestSpell.damage > 0 || bestSpell.drain > 0;
                
                if (!requiresTarget) {
                    this.scene.logMessage(`${aiId.toUpperCase()} casts: ${bestSpell.name}!`);
                    // Self-cast: shield/draw only, no opponent involved
                    this.scene.spellEffects.playSelfCastEffect(bestSpell, w / 2 + 100, 200, () => {
                        this.scene.combat.resolveSelfCast(aiId, bestSpell);
                    });
                } else {
                    this.scene.logMessage(`${aiId.toUpperCase()} casts: ${bestSpell.name} targeting ${bestTargetId.toUpperCase()}!`);
                    this.scene.triggerSpellCastAnimation(bestSpell, w / 2 + 100, 200, () => {
                        this.scene.combat.initiateAttack(aiId, bestTargetId, bestSpell);
                    });
                }
                return;
            }
        }

        if (this.scene.manaPlacedThisTurn || this.scene.spellCastThisTurn) {
            this.scene.logMessage(`${aiId.toUpperCase()} ends turn.`);
            this.scene.time.delayedCall(1200, () => {
                this.scene.endTurn();
            });
            return;
        }

        // 3. Fallback: pass to draw
        this.scene.logMessage(`${aiId.toUpperCase()} chooses Pass to Draw.`);
        const extra = this.scene.drawCard();
        if (extra) {
            // Check autoPlayDraw: drawn mana goes to board instead of hand
            if (this.scene.players[aiId].status.autoPlayDraw > 0 && this.scene.players[aiId].board.length < 3) {
                this.scene.players[aiId].board.push(extra);
                this.scene.logMessage(`${aiId.toUpperCase()}'s drawn mana is auto-played to board!`);
            } else {
                this.scene.players[aiId].hand.push(extra);
            }

            // Check loseManaOnDraw: lose a hand card when drawing
            if (this.scene.players[aiId].status.loseManaOnDraw > 0 && this.scene.players[aiId].hand.length > 0) {
                const lostIdx = Math.floor(Math.random() * this.scene.players[aiId].hand.length);
                const lost = this.scene.players[aiId].hand.splice(lostIdx, 1)[0];
                this.scene.sharedDiscard.push(lost);
                this.scene.logMessage(`${aiId.toUpperCase()} lost a hand mana from drawing!`);
            }

            this.scene.updatePlayerHandDisplay(aiId);
            this.scene.updatePlayerBoardDisplay(aiId);
            this.scene.updatePlayerLifeDisplay(aiId);
        }

        this.scene.time.delayedCall(1200, () => {
            this.scene.endTurn();
        });
    }



    calculateAIReaction(aiId, incomingDamage) {
        if (this.scene.players[aiId].board.length === 0) return null;
        if (this.scene.mode === 'test' && this.scene.dummyMode === 'passive') return null;

        const combos = this.getValidBoardCombos(this.scene.players[aiId].board);
        let bestSpell = null;
        let bestComboIndices = null;
        let bestScore = -1;

        combos.forEach(indices => {
            const elements = indices.map(idx => this.scene.players[aiId].board[idx]);
            const spell = getSpellFromCombo(elements);
            if (spell) {
                const score = this.scoreAISpell(aiId, spell, true, incomingDamage, null);
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
                const consumed = this.scene.players[aiId].board.splice(idx, 1)[0];
                this.scene.sharedDiscard.push(consumed);
            });

            this.scene.updatePlayerBoardDisplay(aiId);
            this.scene.updatePlayerLifeDisplay(aiId);
            this.scene.updateDeckDiscardDisplay();
            return bestSpell;
        }

        return null;
    }



    runAIDiscardAutomation(aiId, amount) {
        const total = this.scene.players[aiId].hand.length + this.scene.players[aiId].board.length;
        if (total === 0 || total <= amount) {
            this.scene.logMessage(`${aiId.toUpperCase()} is out of cards!`);
            this.scene.players[aiId].hand = [];
            this.scene.players[aiId].board = [];
            this.scene.updatePlayerHandDisplay(aiId);
            this.scene.updatePlayerBoardDisplay(aiId);
            this.scene.updatePlayerLifeDisplay(aiId);
            this.scene.checkDefeatCondition(aiId);
            this.scene.time.delayedCall(1200, () => {
                this.scene.checkTurnContinuation();
            });
            return;
        }

        this.scene.logMessage(`${aiId.toUpperCase()} is selecting ${amount} card(s) to discard...`);

        for (let i = 0; i < amount; i++) {
            // Prefer discarding from board mana first if excess, then hand
            // C10 fix: guard against popping from empty arrays (hand.pop() returns undefined if empty)
            let burned;
            if (this.scene.players[aiId].board.length > 1) {
                burned = this.scene.players[aiId].board.pop();
            } else if (this.scene.players[aiId].hand.length > 0) {
                burned = this.scene.players[aiId].hand.pop();
            }
            if (burned !== undefined) {
                this.scene.sharedDiscard.push(burned);
            }
            this.scene.playSound('fire');
        }

        this.scene.updatePlayerHandDisplay(aiId);
        this.scene.updatePlayerBoardDisplay(aiId);
        this.scene.updatePlayerLifeDisplay(aiId);
        this.scene.updateDeckDiscardDisplay();

        this.scene.phase = 'action';
        
        // Turn cleanup (or grant extra action)
        this.scene.time.delayedCall(1200, () => {
            if (this.scene.pendingExtraAction) {
                this.scene.pendingExtraAction = false;
                this.scene.manaPlacedThisTurn = false; this.scene.spellCastThisTurn = false;
                
                this.scene.logMessage(`${aiId.toUpperCase()} gets another action!`);
                this.runAITurn(aiId);
                
            } else {
                this.scene.checkTurnContinuation();
            }
        });
    }


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

    scoreAISpell(aiId, spell, isReaction, incomingDamage, targetId) {
        let score = 0;
        const cycle = this.scene.cycleElements[this.scene.cycleIndex];
        
        let isEmp = this.scene.synergy.calculateSynergy(spell, cycle);

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
            if (this.scene.players[aiId].life <= 4) {
                score += spell.shield * 10; // Desperate for shield
                score += spell.drain * 10; // Desperate to drain opponent's capability
            }

            if (targetId && this.scene.players[targetId]) {
                if (this.scene.players[targetId].life <= spell.damage) {
                    score += 50; // Massively prioritize killing an opponent
                } else if (this.scene.players[targetId].life <= 4) {
                    score += spell.damage * 15; // Go for the kill if they are weak
                }
            }
            
            score += spell.combo.length; 
        }
        
        return score;
    }
}
