import re

with open('src/systems/AIAgent.js', 'r', encoding='utf-8') as f:
    code = f.read()

ai_alias = "'ai'"

code = re.sub(r'this\.scene\.updateAIHandDisplay\(\);', f"this.scene.updatePlayerHandDisplay({ai_alias});", code)
code = re.sub(r'this\.scene\.updateAIBoardDisplay\(\);', f"this.scene.updatePlayerBoardDisplay({ai_alias});", code)
code = re.sub(r'this\.scene\.updateAILifeDisplay\(\);', f"this.scene.updatePlayerLifeDisplay({ai_alias});", code)

with open('src/systems/AIAgent.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated AIAgent.js update calls")
