import re

with open('src/systems/ContestAIAgent.js', 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('this.scene.ai', 'this.scene.players[aiId]')

code = code.replace('runAITurn() {', 'runAITurn(aiId) {')
code = code.replace('calculateAIReaction(incomingDamage) {', 'calculateAIReaction(aiId, incomingDamage) {')
code = code.replace('runAIDiscardAutomation(amount) {', 'runAIDiscardAutomation(aiId, amount) {')
code = code.replace('scoreAISpell(spell, isReaction, incomingDamage) {', 'scoreAISpell(aiId, spell, isReaction, incomingDamage, targetId) {')

code = code.replace("updatePlayerHandDisplay('ai')", "updatePlayerHandDisplay(aiId)")
code = code.replace("updatePlayerBoardDisplay('ai')", "updatePlayerBoardDisplay(aiId)")
code = code.replace("updatePlayerLifeDisplay('ai')", "updatePlayerLifeDisplay(aiId)")
code = code.replace("checkDefeatCondition('ai')", "checkDefeatCondition(aiId)")
code = code.replace("this.scene.logMessage(`AI ", "this.scene.logMessage(`${aiId.toUpperCase()} ")
code = code.replace("this.scene.logMessage('AI ", "this.scene.logMessage(`${aiId.toUpperCase()} ")
code = code.replace("this.scene.logMessage(\"AI ", "this.scene.logMessage(`${aiId.toUpperCase()} ")
code = code.replace("this.scene.logMessage(`AI's", "this.scene.logMessage(`${aiId.toUpperCase()}'s")

with open('src/systems/ContestAIAgent.js', 'w', encoding='utf-8') as f:
    f.write(code)
