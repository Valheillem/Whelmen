import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Fix playHandCardToBoard
play_regex = r'        // Calculate Start Position \(from hand\)\s*const startX = this\.playerZone\.x \+ 60 \+ index \* 90;\s*const startY = this\.playerZone\.y \+ 80;\s*// Apply state changes to calculate target layout'
play_replacement = '''        // Calculate Start Position (from hand)
        const localId = this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole;
        const pGroup = this.playerGroups[localId];
        const startX = pGroup.zone.x + 60 + index * 90;
        const startY = pGroup.zone.y + 80;

        // Apply state changes to calculate target layout'''

code = re.sub(play_regex, play_replacement, code)

target_regex = r'        const centerX = w / 2 - 20;\s*const spaceX = 75;\s*const targetX = centerX - \(\(uniqueElements\.length - 1\) \* spaceX\) / 2 \+ elIndex \* spaceX;\s*const targetY = h / 2 - 40 \+ 160;'
target_replacement = '''        const targetX = pGroup.zone.x + 60 + (this.player.board.length - 1) * 90;
        const targetY = pGroup.zone.y - 30;'''

code = re.sub(target_regex, target_replacement, code)


# Fix discardCardFromZone
discard_regex = r"    discardCardFromZone\(zone, index, who\) \{\s*if \(who === 'player' && \(this\.phase === 'discard' \|\| this\.phase === 'discard_request_active'\) && this\.cardsToDiscardCount > 0\) \{"
discard_replacement = '''    discardCardFromZone(zone, index, who) {
        const localId = this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole;
        if (who === localId && (this.phase === 'discard' || this.phase === 'discard_request_active') && this.cardsToDiscardCount > 0) {'''

code = re.sub(discard_regex, discard_replacement, code)


with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated playHandCardToBoard and discardCardFromZone")
