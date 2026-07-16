import re

with open('src/scenes/Game.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Import
code = code.replace("import { AIAgent } from '../systems/AIAgent.js';", "import { AIAgent } from '../systems/AIAgent.js';\nimport { ContestAIAgent } from '../systems/ContestAIAgent.js';")

# 2. Init
code = code.replace("this.aiAgent = new AIAgent(this);", "this.aiAgent = new AIAgent(this);\n        this.contestAiAgent = new ContestAIAgent(this);")

# 3. Setup playerIds
player_setup = '''        if (this.mode === 'online' && this.lobbyPlayers) {
            this.playerIds = Object.values(this.lobbyPlayers).map(p => p.role).sort();
        } else {
            this.playerIds = ['player', 'ai'];
        }'''
new_player_setup = '''        if (this.mode === 'online' && this.lobbyPlayers) {
            this.playerIds = Object.values(this.lobbyPlayers).map(p => p.role).sort();
        } else if (this.mode === 'ai_contest') {
            this.playerIds = ['player', 'ai1', 'ai2', 'ai3'];
        } else {
            this.playerIds = ['player', 'ai'];
        }'''
code = code.replace(player_setup, new_player_setup)

# 4. Routing turns in startTurn
start_turn_ai = '''            if (this.mode === 'ai') {
                this.time.delayedCall(1200, () => {
                    this.aiAgent.runAITurn();
                });
            } else if (this.mode === 'test') {'''
new_start_turn_ai = '''            if (this.mode === 'ai') {
                this.time.delayedCall(1200, () => {
                    this.aiAgent.runAITurn();
                });
            } else if (this.mode === 'ai_contest') {
                this.time.delayedCall(1200, () => {
                    this.contestAiAgent.runAITurn(this.turn);
                });
            } else if (this.mode === 'test') {'''
code = code.replace(start_turn_ai, new_start_turn_ai)

# 5. Routing in checkTurnContinuation
check_turn_ai = '''                        } else {
                            this.aiAgent.runAITurn();
                        }'''
new_check_turn_ai = '''                        } else if (this.mode === 'ai_contest') {
                            this.contestAiAgent.runAITurn(this.turn);
                        } else {
                            this.aiAgent.runAITurn();
                        }'''
code = code.replace(check_turn_ai, new_check_turn_ai, 2) # applies twice: startTurn fallback and checkTurnContinuation

# 6. Routing in handleSpellCast phase routing
ai_reaction = '''            } else if (defenderId === 'ai') {
                // AI Reaction automation
                this.time.delayedCall(1000, () => {
                    const reactionSpell = this.aiAgent.calculateAIReaction(incomingSpell.damage);
                    this.combat.resolveDefendingReaction(reactionSpell);
                });'''
new_ai_reaction = '''            } else if (defenderId.startsWith('ai')) {
                // AI Reaction automation
                this.time.delayedCall(1000, () => {
                    let reactionSpell = null;
                    if (this.mode === 'ai_contest') {
                        reactionSpell = this.contestAiAgent.calculateAIReaction(defenderId, incomingSpell.damage);
                    } else {
                        reactionSpell = this.aiAgent.calculateAIReaction(incomingSpell.damage);
                    }
                    this.combat.resolveDefendingReaction(reactionSpell);
                });'''
code = code.replace(ai_reaction, new_ai_reaction)

# 7. Routing discard automation
ai_discard = '''                } else {
                    // AI automatically discards
                    this.aiAgent.runAIDiscardAutomation(amount);
                }'''
new_ai_discard = '''                } else {
                    // AI automatically discards
                    if (this.mode === 'ai_contest') {
                        this.contestAiAgent.runAIDiscardAutomation(pid, amount);
                    } else {
                        this.aiAgent.runAIDiscardAutomation(amount);
                    }
                }'''
code = code.replace(ai_discard, new_ai_discard)

with open('src/scenes/Game.js', 'w', encoding='utf-8') as f:
    f.write(code)
