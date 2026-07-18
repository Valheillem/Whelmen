export const SPELL_EFFECTS = {
    // TIER 1 (Sprite)
    'Spark': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        projectile: { animKey: 'anim_fire_ball', size: 64, speed: 500, shape: 'sprite' },
        impact: { animKey: 'anim_fire_explosion', screenShake: { intensity: 2, duration: 100 }, flash: 0xff2200, sparks: 10 },
        sound: { type: 'fire' }
    },
    'Breeze': {
        castAnim: { type: 'fade', duration: 150 },
        projectile: { color: 0xcccccc, trailParticles: 'air', size: 10, speed: 600, shape: 'streak' },
        impact: { pushback: 10, windEffect: true },
        sound: { type: 'air' }
    },
    'Stream': {
        castAnim: { type: 'ripple', duration: 250 },
        projectile: { color: 0x0088ff, trailParticles: 'water', size: 14, speed: 400, shape: 'drop' },
        impact: { splash: true, drops: 8 },
        sound: { type: 'water' }
    },
    'Shell': {
        castAnim: { type: 'shield_grow', duration: 300 },
        projectile: null, // Applied directly to self, no projectile
        impact: { shieldDome: true, color: 0x88aa44 },
        sound: { type: 'shield' }
    }
};

export const DEFAULT_SPELL_EFFECT = {
    castAnim: { type: 'generic_pulse', duration: 200 },
    projectile: { color: 0xffffff, trailParticles: 'generic', size: 10, speed: 500, shape: 'circle' },
    impact: { screenShake: { intensity: 1, duration: 100 } },
    sound: { type: 'hit' }
};

export function getSpellEffect(spellName) {
    return SPELL_EFFECTS[spellName] || DEFAULT_SPELL_EFFECT;
}
