with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()
html = html.replace('CONTEST (4-Player FFA)', 'CONTEST<br><span style="font-size: 0.6em;">(4-PLAYER FFA)</span>')
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    game_js = f.read()
game_js = game_js.replace("Object.defineProperty(this, 'player', { get: () => this.players[this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole] || this.players[this.playerIds[0]] });", "Object.defineProperty(this, 'player', { configurable: true, get: () => this.players[this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole] || this.players[this.playerIds[0]] });")
game_js = game_js.replace("Object.defineProperty(this, 'ai', { get: () => this.players[this.playerIds.find(p => p !== (this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole))] || this.players[this.playerIds[1]] });", "Object.defineProperty(this, 'ai', { configurable: true, get: () => this.players[this.playerIds.find(p => p !== (this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole))] || this.players[this.playerIds[1]] });")
with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(game_js)

with open('src/scenes/Start.js', 'r', encoding='utf-8') as f:
    start_js = f.read()
start_js = start_js.replace("this.textures.addCanvas('star', starCanvas);", "if(!this.textures.exists('star')) this.textures.addCanvas('star', starCanvas);")
start_js = start_js.replace("this.textures.addCanvas('nebula', nebulaCanvas);", "if(!this.textures.exists('nebula')) this.textures.addCanvas('nebula', nebulaCanvas);")
with open('src/scenes/Start.js', 'w', encoding='utf-8') as f:
    f.write(start_js)
