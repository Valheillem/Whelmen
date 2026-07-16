import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Update Player Hand Display to curve cards
old_hand_display = '''        const totalW = Math.max(0, (char.hand.length - 1) * spaceX);
        char.hand.forEach((el, index) => {
            let x = 0, y = 0, angle = 0;
            if (pos === 0) {
                x = -totalW / 2 + index * spaceX;
                y = -20;
                angle = 0;
            } else if (pos === 2) {
                x = 150 - totalW / 2 + index * spaceX;
                y = 20;
                angle = 180;
            } else if (pos === 1) {
                y = 150 - totalW / 2 + index * spaceX;
                x = 0;
                angle = 90;
            } else if (pos === 3) {
                y = 150 - totalW / 2 + index * spaceX;
                x = 80;
                angle = -90;
            }'''

new_hand_display = '''        const count = char.hand.length;
        const totalW = Math.max(0, (count - 1) * spaceX);
        const middle = (count - 1) / 2;
        const curveAmount = 6;
        const rotAmount = 4;

        char.hand.forEach((el, index) => {
            const offset = index - middle;
            const curveOffset = Math.abs(offset) * Math.abs(offset) * curveAmount;
            const rotOffset = offset * rotAmount;

            let x = 0, y = 0, angle = 0;
            if (pos === 0) {
                x = -totalW / 2 + index * spaceX;
                y = -20 + curveOffset;
                angle = rotOffset;
            } else if (pos === 2) {
                x = 150 - totalW / 2 + index * spaceX;
                y = 20 - curveOffset;
                angle = 180 + rotOffset;
            } else if (pos === 1) {
                y = 150 - totalW / 2 + index * spaceX;
                x = -curveOffset;
                angle = 90 + rotOffset;
            } else if (pos === 3) {
                y = 150 - totalW / 2 + index * spaceX;
                x = 80 + curveOffset;
                angle = -90 + rotOffset;
            }'''
code = code.replace(old_hand_display, new_hand_display)

# Update pointerover tweens in updatePlayerHandDisplay
code = code.replace("y: pos === 0 ? 60 : y,", "y: pos === 0 ? y - 30 : y,")
code = code.replace("y: pos === 0 ? 80 : y,", "y: pos === 0 ? y : y,")

# 2. Update animateCardMovement
old_animate = '''        // Calculate Start Position (from hand)
        const localId = this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole;
        const pGroup = this.playerGroups[localId];
        const startX = pGroup.zone.x + 60 + index * 90;
        const startY = pGroup.zone.y + 80;

        // Apply state changes to calculate target layout
        this.player.hand.splice(index, 1);
        this.player.board.push(el);'''

new_animate = '''        // Calculate Start Position (from hand)
        const localId = this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole;
        const pGroup = this.playerGroups[localId];
        const posIndex = this.getPlayerPositionIndex(localId);
        
        // Exact matching for curve math from hand display
        const count = this.player.hand.length; 
        const spaceX = posIndex === 0 ? 90 : 60;
        const totalW = Math.max(0, (count - 1) * spaceX);
        const middle = (count - 1) / 2;
        const offset = index - middle;
        const curveOffset = Math.abs(offset) * Math.abs(offset) * 6;
        
        let relX = 0, relY = 0;
        if (posIndex === 0) {
            relX = -totalW / 2 + index * spaceX;
            relY = -20 + curveOffset;
        } else if (posIndex === 2) {
            relX = 150 - totalW / 2 + index * spaceX;
            relY = 20 - curveOffset;
        } else if (posIndex === 1) {
            relY = 150 - totalW / 2 + index * spaceX;
            relX = -curveOffset;
        } else if (posIndex === 3) {
            relY = 150 - totalW / 2 + index * spaceX;
            relX = 80 + curveOffset;
        }
        
        const startX = pGroup.zone.x + relX;
        const startY = pGroup.zone.y + relY;

        // Apply state changes to calculate target layout
        this.player.hand.splice(index, 1);
        this.player.board.push(el);'''
code = code.replace(old_animate, new_animate)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)
