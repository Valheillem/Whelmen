import re
with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix player lookup logic across Game.js
# 1. applyHealing
code = code.replace("const char = who === 'player' ? this.player : this.ai;", "const char = this.players[who];")

# 2. forceDiscardRandom
code = code.replace("const char = who === 'player' ? this.player : this.ai;", "const char = this.players[who];")

# 3. initiateAttack
code = code.replace("let defChar = defender === 'player' ? this.player : this.ai;", "let defChar = this.players[defender];")
code = code.replace("let attChar = attacker === 'player' ? this.player : this.ai;", "let attChar = this.players[attacker];")

# 4. resolveDefendingReaction
code = code.replace("const defChar = defender === 'player' ? this.player : this.ai;", "const defChar = this.players[defender];")
code = code.replace("const attChar = attacker === 'player' ? this.player : this.ai;", "const attChar = this.players[attacker];")

# 5. applyDamage
code = code.replace("const char = who === 'player' ? this.player : this.ai;", "const char = this.players[who];")

# Fix shield overflow clear
code = code.replace("if (who === 'player' && char.shield > 90) char.shield = 0;", "")
code = code.replace("if (who === 'ai' && char.shield > 90) char.shield = 0;", "if (char.shield > 90) char.shield = 0;")

# Fix global status effects
def fix_global_status(match):
    spell = match.group(1)
    prop = match.group(2)
    val = match.group(3)
    return f"if (spell.name === '{spell}') {{ this.playerIds.forEach(p => this.players[p].status.{prop} = {val}); }}"

code = re.sub(r"if \(spell\.name === '([^']+)'\) \{ this\.player\.status\.([^ ]+) = (\d+); this\.ai\.status\.[^ ]+ = \d+; \}", fix_global_status, code)

# Fix runAIDiscardAutomation call
code = code.replace("this.contestAiAgent.runAIDiscardAutomation(pid, amount);", "this.contestAiAgent.runAIDiscardAutomation(who, amount);")

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)
