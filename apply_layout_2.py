import re
with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Name position
code = code.replace("char.nameT = this.add.text(pos === 1 || pos === 3 ? 0 : (pos === 0 ? -150 : 60), pos === 2 ? 180 : (pos === 0 ? 140 : 0)",
                    "char.nameT = this.add.text(pos === 1 || pos === 3 ? 0 : (pos === 0 ? -150 : 60), pos === 2 ? 180 : (pos === 0 ? 120 : 0)")

# 2. Shield position
code = code.replace("char.shieldG.fillRoundedRect(-80, 140, 140, 24, 6);", "char.shieldG.fillRoundedRect(-80, 120, 140, 24, 6);")
code = code.replace("char.shieldG.strokeRoundedRect(-80, 140, 140, 24, 6);", "char.shieldG.strokeRoundedRect(-80, 120, 140, 24, 6);")
code = code.replace("char.shieldT.setPosition(-70, 144);", "char.shieldT.setPosition(-70, 124);")

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)
