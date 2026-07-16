import { getSpellFromCombo } from '../data/SpellCatalog.js';

export class AIAgent {
    constructor(scene) {
        this.scene = scene;
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
                this.scene.forceDiscardRandom('player', 3);
                this.scene.logMessage(`AI's mana play deals 3 damage to Player!`);
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
                this.runAITurn();
            });
            return;
        }

        // 2. Try to form a spell combo from board
        if (!this.scene.spellCastThisTurn && this.scene.ai.board.length >= 2) {
            const combos = this.getValidBoardCombos(this.scene.ai.board);
            let bestSpell = null;
            let bestComboIndices = null;
            let bestScore = -1;

            combos.forEach(indices => {
                const elements = indices.map(idx => this.scene.ai.board[idx]);
                const spell = getSpellFromCombo(elements);
                if (spell) {
                    const score = this.scoreAISpell(spell, false, 0);
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
                    this.scene.combat.initiateAttack('ai', 'player', bestSpell);
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

        const combos = this.getValidBoardCombos(this.scene.ai.board);
        let bestSpell = null;
        let bestComboIndices = null;
        let bestScore = -1;

        combos.forEach(indices => {
            const elements = indices.map(idx => this.scene.ai.board[idx]);
            const spell = getSpellFromCombo(elements);
            if (spell) {
                const score = this.scoreAISpell(spell, true, incomingDamage);
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
                    this.runAITurn();
                }
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

    scoreAISpell(spell, isReaction, incomingDamage) {
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
}
