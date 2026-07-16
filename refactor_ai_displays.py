import re

files = ['src/systems/CombatSystem.js', 'src/ui/SandboxDashboard.js']
ai_alias = "'ai'"

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        code = f.read()

    code = re.sub(r'this\.scene\.updateAIHandDisplay\(\);?', f"this.scene.updatePlayerHandDisplay({ai_alias});", code)
    code = re.sub(r'this\.scene\.updateAIBoardDisplay\(\);?', f"this.scene.updatePlayerBoardDisplay({ai_alias});", code)
    code = re.sub(r'this\.scene\.updateAILifeDisplay\(\);?', f"this.scene.updatePlayerLifeDisplay({ai_alias});", code)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(code)

print('Updated CombatSystem and SandboxDashboard update calls')
