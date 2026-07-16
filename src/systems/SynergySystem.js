export class SynergySystem {
    constructor(scene) {
        this.scene = scene;
    }

    calculateSynergy(spell, cycleElement) {
        if (!spell) return false;
        let isEmp = false;
        
        if (spell.synergyType === 'constructive' && cycleElement === spell.element) isEmp = true;
        else if (spell.synergyType === 'destructive' && cycleElement !== spell.element && spell.combo && spell.combo.includes(cycleElement)) isEmp = true;
        else if (spell.synergyType === 'prestructive' && spell.combo && !spell.combo.includes(cycleElement)) isEmp = true;
        else if (spell.synergyType === 'force_cycle') isEmp = true;

        return isEmp;
    }

    getEmpoweredOverrides(spellName) {
        const overrides = {};
        if (spellName === 'Breeze') overrides.drain = 2;
        if (spellName === 'Stream') overrides.draw = 2;
        if (spellName === 'Spark') overrides.damage = 3;
        if (spellName === 'Shell') overrides.shield = 5;
        if (spellName === 'Gust') overrides.drain = 3;
        if (spellName === 'Rain') overrides.draw = 3;
        if (spellName === 'Blast') overrides.damage = 5;
        if (spellName === 'Carapace') overrides.shield = 8;
        return overrides;
    }

    applyDeferredStatusEffects(spellName, attChar, defChar) {
        if (spellName === 'Ignition') attChar.status.bonusManaPlays = 2;
        if (spellName === 'Haze') { this.scene.playerIds.forEach(pid => this.scene.players[pid].status.loseManaOnDraw = 2); }
        if (spellName === 'Quake') attChar.status.shieldFailChance = 2;
        if (spellName === 'Dust') { this.scene.playerIds.forEach(pid => this.scene.players[pid].status.missChance = 2); }
        if (spellName === 'Typhoon') attChar.status.autoPlayDraw = 2;
        if (spellName === 'Enrich') { this.scene.playerIds.forEach(pid => this.scene.players[pid].status.everyoneDraw3 = 1); }
        if (spellName === 'Firestorm') attChar.status.manaPlayDamage = 2;
        if (spellName === 'Fortress') attChar.status.extraDrawIfShield = 1;
        if (spellName === 'Quagmire') attChar.status.redrawMana = 1;
        if (spellName === 'Surge') defChar.status.oppSpellReflect = 2;
        if (spellName === 'Crucible') attChar.status.retaliationDamage = 1;
        if (spellName === 'Hurricane') defChar.status.noDrawDebuff = 2;
        if (spellName === 'Flood') defChar.status.oppDraw4 = 1;
        if (spellName === 'Tower') defChar.status.drainFailChance = 2;
        if (spellName === 'Mudslide') { this.scene.playerIds.forEach(pid => this.scene.players[pid].status.discardReplaceHand = 1); }
        if (spellName === 'Tide') { this.scene.playerIds.forEach(pid => this.scene.players[pid].status.rotateHands = 1); }
        if (spellName === 'Aegis') { this.scene.playerIds.forEach(pid => this.scene.players[pid].status.rotateShields = 1); }
        if (spellName === 'Cataclysm') { this.scene.playerIds.forEach(pid => this.scene.players[pid].status.randomTargeting = 2); }
    }
}
