import re

with open('src/systems/ContestAIAgent.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix the quote issue
code = code.replace('`${aiId.toUpperCase()} is out of cards!");', '`${aiId.toUpperCase()} is out of cards!`);')

# Change scoreAISpell signature
code = code.replace('scoreAISpell(aiId, spell, isReaction, incomingDamage) {', 'scoreAISpell(aiId, spell, isReaction, incomingDamage, targetId) {')

# Replace this.scene.player with this.scene.players[targetId]
code = code.replace('this.scene.player.', 'this.scene.players[targetId].')

# In runAITurn(aiId), we need to pick a target and pass it to scoreAISpell
# But wait, runAITurn iterates over combos and scores them. It doesn't pick a target first!
# It should evaluate each combo against EVERY possible target to find the best (spell, target) pair.
