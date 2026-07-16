import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace this.updatePlayerHandDisplay() with this.updatePlayerHandDisplay('player') if in single player context or local player alias
# Actually, since these methods were originally designed for 'player' and 'ai', the empty call meant 'player'
code = re.sub(r'this\.updatePlayerHandDisplay\(\);', "this.updatePlayerHandDisplay(this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole);", code)
code = re.sub(r'this\.updatePlayerBoardDisplay\(\);', "this.updatePlayerBoardDisplay(this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole);", code)
code = re.sub(r'this\.updatePlayerLifeDisplay\(\);', "this.updatePlayerLifeDisplay(this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole);", code)

# For AI, we can map to the opponent in 1v1
ai_alias = "(this.playerIds.find(p => p !== (this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole)) || this.playerIds[1])"
code = re.sub(r'this\.updateAIHandDisplay\(\);', f"this.updatePlayerHandDisplay({ai_alias});", code)
code = re.sub(r'this\.updateAIBoardDisplay\(\);', f"this.updatePlayerBoardDisplay({ai_alias});", code)
code = re.sub(r'this\.updateAILifeDisplay\(\);', f"this.updatePlayerLifeDisplay({ai_alias});", code)

# Let's fix the parameter names in discardCardFromZone where it might be empty
# e.g., if (who === 'player') this.updatePlayerHandDisplay();
code = re.sub(r'if \(who === \'player\'\) this\.updatePlayerHandDisplay\((.*?)\);', r"this.updatePlayerHandDisplay(who);", code)
code = re.sub(r'if \(who === \'ai\'\) this\.updatePlayerHandDisplay\((.*?)\);', r"this.updatePlayerHandDisplay(who);", code)

# Let's just fix the calls passing who
code = re.sub(r'this\.updatePlayerHandDisplay\(this\.myRole === \'host\' \|\| this\.mode !== \'online\' \? \'player\' : this\.myRole\); this\.updatePlayerBoardDisplay\(this\.myRole === \'host\' \|\| this\.mode !== \'online\' \? \'player\' : this\.myRole\); this\.updatePlayerLifeDisplay\(this\.myRole === \'host\' \|\| this\.mode !== \'online\' \? \'player\' : this\.myRole\);\n\s*this\.updatePlayerHandDisplay\(\(this\.playerIds\.find.*?\|\| this\.playerIds\[1\]\)\); this\.updatePlayerBoardDisplay\(\(this\.playerIds\.find.*?\|\| this\.playerIds\[1\]\)\); this\.updatePlayerLifeDisplay\(\(this\.playerIds\.find.*?\|\| this\.playerIds\[1\]\)\);', 
r'this.playerIds.forEach(pid => { this.updatePlayerHandDisplay(pid); this.updatePlayerBoardDisplay(pid); this.updatePlayerLifeDisplay(pid); });', code)


with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Fixed update method calls")
