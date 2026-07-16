import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

start_turn_regex = r'    startTurn\(who\) \{.*?\n        // Draw phase'
start_turn_replacement = '''    startTurn(who) {
        this.turn = who;
        let char = this.players[who];
        
        this.updateTurnHighlights();

        // Apply start of turn effects BEFORE decrementing
        if (char.status.everyoneDraw3 > 0) {
            for(let i=0;i<3;i++) { 
                this.playerIds.forEach(pid => {
                    let d = this.drawCard(); 
                    if(d) this.players[pid].hand.push(d);
                });
            }
            this.duelHistory.logMessage("Everyone draws 3 mana!");
            this.playerIds.forEach(pid => this.players[pid].status.everyoneDraw3 = 0);
            this.playerIds.forEach(pid => {
                this.updatePlayerHandDisplay(pid); 
                this.updatePlayerLifeDisplay(pid);
            });
        }
        
        if (char.status.discardReplaceHand > 0) {
            this.playerIds.forEach(pid => {
                let pChar = this.players[pid];
                let count = pChar.hand.length;
                while(pChar.hand.length > 0) this.sharedDiscard.push(pChar.hand.pop());
                for(let i=0;i<count;i++) { let d = this.drawCard(); if(d) pChar.hand.push(d); }
                pChar.status.discardReplaceHand = 0;
                this.updatePlayerHandDisplay(pid); 
                this.updatePlayerLifeDisplay(pid);
            });
            this.duelHistory.logMessage("Hands were discarded and replaced!");
        }

        if (char.status.rotateHands > 0) {
            // Rotate hands clockwise
            const firstHand = [...this.players[this.playerIds[0]].hand];
            for (let i = 0; i < this.playerIds.length - 1; i++) {
                this.players[this.playerIds[i]].hand = [...this.players[this.playerIds[i+1]].hand];
            }
            this.players[this.playerIds[this.playerIds.length - 1]].hand = firstHand;
            
            this.playerIds.forEach(pid => {
                this.players[pid].status.rotateHands = 0;
                this.updatePlayerHandDisplay(pid);
                this.updatePlayerLifeDisplay(pid);
            });
            this.duelHistory.logMessage("Hands were rotated!");
        }
        
        if (char.status.oppDraw4 > 0) {
            for(let i=0;i<4;i++) { let d = this.drawCard(); if(d) char.hand.push(d); }
            char.status.oppDraw4 = 0;
            this.duelHistory.logMessage(`${who.toUpperCase()} is flooded with 4 extra mana!`);
            this.updatePlayerHandDisplay(who); this.updatePlayerLifeDisplay(who);
        }
        
        if (char.status.extraDrawIfShield > 0 && char.shield > 0) {
            let d = this.drawCard(); if(d) char.hand.push(d);
            this.duelHistory.logMessage(`${who.toUpperCase()} draws extra mana from Shield!`);
            this.updatePlayerHandDisplay(who); this.updatePlayerLifeDisplay(who);
        }

        // Quagmire redrawMana: discard up to 2 hand cards and draw replacements
        if (char.status.redrawMana > 0 && char.hand.length > 0) {
            const redrawCount = Math.min(2, char.hand.length);
            for (let i = 0; i < redrawCount; i++) {
                const discIdx = Math.floor(Math.random() * char.hand.length);
                this.sharedDiscard.push(char.hand.splice(discIdx, 1)[0]);
            }
            for (let i = 0; i < redrawCount; i++) {
                let d = this.drawCard(); if(d) char.hand.push(d);
            }
            char.status.redrawMana = 0;
            this.duelHistory.logMessage(`${who.toUpperCase()} redraws ${redrawCount} mana!`);
            this.updatePlayerHandDisplay(who); this.updatePlayerLifeDisplay(who);
        }
        
        this.phase = 'action';
        this.manaPlacedThisTurn = false; this.spellCastThisTurn = false;
        this.selectedBoardMana = [];
        this.updateComboPreview();

        const isLocal = who === (this.myRole === 'host' || this.mode !== 'online' ? 'player' : this.myRole);
        const displayName = (this.mode === 'online' && isLocal) ? 'YOUR' : who.toUpperCase() + "'S";
        this.duelHistory.logMessage(`--- ${displayName} TURN ---`);

        // Draw phase'''

code = re.sub(start_turn_regex, start_turn_replacement, code, flags=re.DOTALL)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated startTurn in Game.js")
