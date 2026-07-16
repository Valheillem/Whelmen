import re
with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_reaction = '''                // AI Reaction automation
                this.time.delayedCall(1000, () => {
                    const reactionSpell = this.aiAgent.calculateAIReaction(incomingSpell.damage);
                    this.combat.resolveDefendingReaction(reactionSpell);
                });'''

new_reaction = '''                // AI Reaction automation
                this.time.delayedCall(1000, () => {
                    let reactionSpell;
                    if (this.mode === 'ai_contest') {
                        reactionSpell = this.contestAiAgent.calculateAIReaction(defender, incomingSpell.damage);
                    } else {
                        reactionSpell = this.aiAgent.calculateAIReaction(incomingSpell.damage);
                    }
                    this.combat.resolveDefendingReaction(reactionSpell);
                });'''

code = code.replace(old_reaction, new_reaction)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)
