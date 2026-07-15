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
        if (spellName === 'Haze') { this.scene.player.status.loseManaOnDraw = 2; this.scene.ai.status.loseManaOnDraw = 2; }
        if (spellName === 'Quake') attChar.status.shieldDamageDebuff = 2;
        if (spellName === 'Dust') { this.scene.player.status.missChance = 2; this.scene.ai.status.missChance = 2; }
        if (spellName === 'Typhoon') attChar.status.autoPlayDraw = 2;
        if (spellName === 'Enrich') { this.scene.player.status.everyoneDraw3 = 1; this.scene.ai.status.everyoneDraw3 = 1; }
        if (spellName === 'Firestorm') attChar.status.manaPlayDamage = 2;
        if (spellName === 'Fortress') attChar.status.extraDrawIfShield = 1;
        if (spellName === 'Quagmire') attChar.status.redrawMana = 1;
        if (spellName === 'Surge') defChar.status.oppManaPlayDamage = 2;
        if (spellName === 'Crucible') attChar.status.retaliationDamage = 1;
        if (spellName === 'Hurricane') defChar.status.noDrawDebuff = 2;
        if (spellName === 'Flood') defChar.status.oppDraw4 = 1;
        if (spellName === 'Tower') defChar.status.spellFailChance = 2;
        if (spellName === 'Mudslide') { this.scene.player.status.discardReplaceHand = 1; this.scene.ai.status.discardReplaceHand = 1; }
        if (spellName === 'Tide') { this.scene.player.status.rotateHands = 1; this.scene.ai.status.rotateHands = 1; }
        if (spellName === 'Aegis') { this.scene.player.status.damageImmunity = 2; this.scene.ai.status.damageImmunity = 2; }
        if (spellName === 'Cataclysm') { this.scene.player.status.randomTargeting = 2; this.scene.ai.status.randomTargeting = 2; }
    }
}
