// VFX Registry — All spells cleared, ready for new asset mapping
export const SPELL_EFFECTS = {
    'Spark': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        projectile: { animKey: 'anim_fire_arrow', size: 64, speed: 500, shape: 'sprite', flipX: true },
        impact: { animKey: 'anim_explosion_3', screenShake: { intensity: 2, duration: 100 }, flash: 0xff2200 },
        sound: { type: 'magic_spell_fire_01' }
    },
    'Shell': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: { animKey: 'anim_earth_shield', repeat: 0, size: 250 },
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
        impact: { animKey: 'anim_explosion_3', screenShake: { intensity: 3, duration: 150 }, flash: 0xff4400 },
        sound: { type: 'fire' }
    },
    'Carapace': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: [
            { animKey: 'anim_earth_shield', repeat: 0, size: 250 },
            { animKey: 'anim_earth_fissure', size: 200 }
        ],
        sound: { type: 'earth' }
    },
    'Gust': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        projectile: { animKey: 'anim_wind_spell', size: 128, speed: 600, shape: 'sprite', flipX: true },
        sound: { type: 'air' }
    },
    'Splash': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: { animKey: 'anim_water6', targetOverride: 'center', size: 300, offsetX: -30, offsetY: -60 },
        sound: { type: 'water' }
    },
    'Ignition': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: { animKey: 'anim_flame', targetOverride: 'center', size: 400, offsetY: -140 },
        sound: { type: 'fire' }
    },
    'Haze': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: [
            { animKey: 'anim_magic2', targetOverride: 'center', size: 300, alpha: 0.6, offsetX: -120, offsetY: -80, timeScale: 0.6 },
            { animKey: 'anim_magic2', targetOverride: 'center', size: 350, alpha: 0.7, offsetX: 80, offsetY: 40, timeScale: 0.7 },
            { animKey: 'anim_magic2', targetOverride: 'center', size: 250, alpha: 0.5, offsetX: -40, offsetY: 120, timeScale: 0.5 },
            { animKey: 'anim_magic2', targetOverride: 'center', size: 400, alpha: 0.8, offsetX: 120, offsetY: -120, timeScale: 0.8 },
            { animKey: 'anim_magic2', targetOverride: 'center', size: 500, alpha: 0.6, offsetX: 0, offsetY: 0, timeScale: 0.5 }
        ],
        sound: { type: 'air' }
    },
    'Quake': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: { animKey: 'anim_ground_hit', targetOverride: 'center', size: 800, timeScale: 0.5, screenShake: { intensity: 4, duration: 250 } },
        sound: { type: 'earth' }
    },
    'Dust': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: { animKey: 'anim_slash_7', targetOverride: 'center', size: 500, offsetY: -100 },
        sound: { type: 'earth' }
    },
    'Typhoon': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: { animKey: 'anim_typhoon', targetOverride: 'center', size: 450, growAndShrink: true, duration: 3000, repeat: -1 },
        sound: { type: 'air' }
    },
    'Enrich': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        impact: [
            { animKey: 'anim_leaf_shield', targetOverride: 'center', size: 440, repeat: 0 },
            { animKey: 'anim_water_shield', targetOverride: 'center', size: 440, repeat: 0, timeScale: 0.5 }
        ],
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
