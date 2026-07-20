// VFX Registry — All spells cleared, ready for new asset mapping
export const SPELL_EFFECTS = {
    'Spark': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        projectile: { animKey: 'anim_fire_arrow', size: 64, speed: 500, shape: 'sprite' },
        impact: { animKey: 'anim_explosion_vector_sprite_effects_3', screenShake: { intensity: 2, duration: 100 }, flash: 0xff2200 },
        sound: { type: 'fire' }
    }
};

export const DEFAULT_SPELL_EFFECT = {
    castAnim: null,
    projectile: null,
    impact: null,
    sound: { type: 'hit' }
};

export function getSpellEffect(spellName) {
    return SPELL_EFFECTS[spellName] || DEFAULT_SPELL_EFFECT;
}
