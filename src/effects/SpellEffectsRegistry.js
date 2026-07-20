// VFX Registry — All spells cleared, ready for new asset mapping
export const SPELL_EFFECTS = {
    'Spark': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        projectile: { animKey: 'anim_fire_arrow', size: 64, speed: 500, shape: 'sprite', flipX: true },
        impact: { animKey: 'anim_explosion_vector_sprite_effects_3', screenShake: { intensity: 2, duration: 100 }, flash: 0xff2200 },
        sound: { type: 'fire' }
    },
    'Shell': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: { animKey: 'anim_earth_shield' },
        sound: { type: 'shield' }
    },
    'Stream': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: { animKey: 'anim_water1', targetOverride: 'center', size: 500, offsetX: -20, offsetY: -30, timeScale: 5 },
        sound: { type: 'water' }
    },
    'Breeze': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: { animKey: 'anim_slash_sprite_cartoon_effects_2', size: 256 },
        sound: { type: 'air' }
    },
    'Blast': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        projectile: { animKey: 'anim_fire_spell', size: 80, speed: 500, shape: 'sprite', flipX: true },
        impact: { animKey: 'anim_explosion_vector_sprite_effects_3', screenShake: { intensity: 3, duration: 150 }, flash: 0xff4400 },
        sound: { type: 'fire' }
    },
    'Carapace': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        projectile: { animKey: 'anim_earth_shield', size: 128, speed: 400, shape: 'sprite' },
        impact: { animKey: 'anim_earth_fissure', size: 200 },
        sound: { type: 'earth' }
    },
    'Gust': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        projectile: { animKey: 'anim_wind_spell', size: 128, speed: 600, shape: 'sprite', flipX: true },
        sound: { type: 'air' }
    },
    'Rain': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: { animKey: 'anim_water6', targetOverride: 'center', size: 300 },
        sound: { type: 'water' }
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
