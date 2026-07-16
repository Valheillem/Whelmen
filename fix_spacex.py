import re
with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix spaceX redeclaration
code = code.replace("const spaceX = posIndex === 0 ? 90 : 60;", "const handSpaceX = posIndex === 0 ? 90 : 60;")
code = code.replace("const totalW = Math.max(0, (count - 1) * spaceX);", "const totalW = Math.max(0, (count - 1) * handSpaceX);")
code = code.replace("relX = -totalW / 2 + index * spaceX;", "relX = -totalW / 2 + index * handSpaceX;")
code = code.replace("relX = 150 - totalW / 2 + index * spaceX;", "relX = 150 - totalW / 2 + index * handSpaceX;")
code = code.replace("relY = 150 - totalW / 2 + index * spaceX;", "relY = 150 - totalW / 2 + index * handSpaceX;")

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

# Bump cache buster
with open('index.html', 'r', encoding='utf-8') as f:
    code_index = f.read()
code_index = code_index.replace('v=1.2.35', 'v=1.2.36')
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(code_index)

with open('index_test.html', 'r', encoding='utf-8') as f:
    code_test = f.read()
code_test = code_test.replace('v=1.2.35', 'v=1.2.36')
with open('index_test.html', 'w', encoding='utf-8') as f:
    f.write(code_test)
