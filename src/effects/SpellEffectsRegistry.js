export const SPELL_EFFECTS = {
    // TIER 1 (Basic)
    'Spark': {
        castAnim: { type: 'pulse', scale: 1.2, duration: 200 },
        projectile: { animKey: 'anim_fire_ball', size: 64, speed: 500, shape: 'sprite' },
        impact: { animKey: 'anim_fire_explosion', screenShake: { intensity: 2, duration: 100 }, flash: 0xff2200 },
        sound: { type: 'fire' }
    },
    'Breeze': {
        castAnim: { type: 'fade', duration: 150 },
        projectile: { animKey: 'anim_wind_ball', size: 64, speed: 600, shape: 'sprite' },
        impact: { animKey: 'anim_wind_spell', pushback: 10, windEffect: true },
        sound: { type: 'air' }
    },
    'Stream': {
        castAnim: { type: 'ripple', duration: 250 },
        projectile: { animKey: 'anim_water_arrow', size: 64, speed: 400, shape: 'sprite' },
        impact: { animKey: 'anim_water_spell', splash: true },
        sound: { type: 'water' }
    },
    'Shell': {
        castAnim: { type: 'shield_grow', duration: 300 },
        projectile: null,
        impact: { animKey: 'anim_earth_shield', shieldDome: true, color: 0x88aa44, size: 128 },
        sound: { type: 'shield' }
    },

    // TIER 2 (Combinations)
    'Gust': {
        projectile: { animKey: 'anim_smoke_blow', size: 80, speed: 700, shape: 'sprite' },
        impact: { animKey: 'anim_wind_spell', size: 128 },
        sound: { type: 'air' }
    },
    'Rain': {
        projectile: { animKey: 'anim_water_ball', size: 70, speed: 400, shape: 'sprite' },
        impact: { animKey: 'anim_water_spell', size: 128 },
        sound: { type: 'water' }
    },
    'Blast': {
        projectile: { animKey: 'anim_fire_spell', size: 80, speed: 600, shape: 'sprite' },
        impact: { animKey: 'anim_fire_explosion', size: 150, screenShake: { intensity: 3, duration: 150 } },
        sound: { type: 'fire' }
    },
    'Carapace': {
        projectile: null,
        impact: { animKey: 'anim_leaf_shield', size: 128, shieldDome: true },
        sound: { type: 'shield' }
    },
    'Ignition': {
        projectile: null,
        impact: { animKey: 'anim_flame', size: 100 },
        sound: { type: 'fire' }
    },
    'Haze': {
        projectile: null,
        impact: { animKey: 'anim_smoke_explosion', size: 150 },
        sound: { type: 'water' }
    },
    'Quake': {
        projectile: null,
        impact: { animKey: 'anim_earth_fissure', size: 200, screenShake: { intensity: 4, duration: 300 } },
        sound: { type: 'earth' }
    },
    'Dust': {
        projectile: { animKey: 'anim_smoke_blow', size: 70, speed: 500, shape: 'sprite' },
        impact: { animKey: 'anim_smoke_blow', size: 128 },
        sound: { type: 'earth' }
    },
    'Typhoon': {
        projectile: { animKey: 'anim_typhoon', size: 100, speed: 400, shape: 'sprite' },
        impact: { animKey: 'anim_typhoon', size: 200, screenShake: { intensity: 3, duration: 200 } },
        sound: { type: 'air' }
    },
    'Enrich': {
        projectile: null,
        impact: { animKey: 'anim_leaf_shield', size: 128 },
        sound: { type: 'earth' }
    },

    // TIER 3 (Epics)
    'Firestorm': {
        projectile: { animKey: 'anim_meteor', size: 100, speed: 700, shape: 'sprite' },
        impact: { animKey: 'anim_fire_explosion', size: 250, screenShake: { intensity: 5, duration: 250 } },
        sound: { type: 'fire' }
    },
    'Fortress': {
        projectile: null,
        impact: { animKey: 'anim_earth_shield', size: 150, shieldDome: true },
        sound: { type: 'shield' }
    },
    'Wildfire': {
        projectile: null,
        impact: { animKey: 'anim_flame', size: 150 },
        sound: { type: 'fire' }
    },
    'Quagmire': {
        projectile: null,
        impact: { animKey: 'anim_poisonous_smoke', size: 150 },
        sound: { type: 'water' }
    },
    'Billow': {
        projectile: null,
        impact: { animKey: 'anim_chemical_smoke', size: 150 },
        sound: { type: 'air' }
    },
    'Vaporize': {
        projectile: null,
        impact: { animKey: 'anim_smoke_explosion', size: 200 },
        sound: { type: 'fire' }
    },
    'Surge': {
        projectile: { animKey: 'anim_lightning_strike', size: 100, speed: 900, shape: 'sprite' },
        impact: { animKey: 'anim_lightning_strike', size: 150, screenShake: { intensity: 4, duration: 150 } },
        sound: { type: 'air' }
    },
    'Crucible': {
        projectile: { animKey: 'anim_ground_hit', size: 80, speed: 500, shape: 'sprite' },
        impact: { animKey: 'anim_ground_hit', size: 200, screenShake: { intensity: 5, duration: 250 } },
        sound: { type: 'earth' }
    },
    'Hurricane': {
        projectile: { animKey: 'anim_typhoon', size: 120, speed: 300, shape: 'sprite' },
        impact: { animKey: 'anim_typhoon', size: 250, screenShake: { intensity: 4, duration: 300 } },
        sound: { type: 'air' }
    },
    'Flood': {
        projectile: { animKey: 'anim_water_ball', size: 120, speed: 450, shape: 'sprite' },
        impact: { animKey: 'anim_water_ball', size: 200 },
        sound: { type: 'water' }
    },
    'Tower': {
        projectile: { animKey: 'anim_earth_spike', size: 80, speed: 600, shape: 'sprite' },
        impact: { animKey: 'anim_earth_spike', size: 150, screenShake: { intensity: 3, duration: 200 } },
        sound: { type: 'earth' }
    },
    'Scour': {
        projectile: { animKey: 'anim_wind_spell', size: 80, speed: 800, shape: 'sprite' },
        impact: { animKey: 'anim_wind_spell', size: 150 },
        sound: { type: 'air' }
    },
    'Tempest': {
        projectile: { animKey: 'anim_lightning_arrow', size: 80, speed: 900, shape: 'sprite' },
        impact: { animKey: 'anim_lightning_strike', size: 150, screenShake: { intensity: 4, duration: 150 } },
        sound: { type: 'air' }
    },
    'Pillar': {
        projectile: { animKey: 'anim_earth_spike', size: 100, speed: 600, shape: 'sprite' },
        impact: { animKey: 'anim_earth_spike', size: 200, screenShake: { intensity: 4, duration: 250 } },
        sound: { type: 'earth' }
    },
    'Blaze': {
        projectile: { animKey: 'anim_fire_arrow', size: 90, speed: 800, shape: 'sprite' },
        impact: { animKey: 'anim_fire_explosion', size: 200, screenShake: { intensity: 4, duration: 200 } },
        sound: { type: 'fire' }
    },
    'Deluge': {
        projectile: { animKey: 'anim_water_ball', size: 100, speed: 500, shape: 'sprite' },
        impact: { animKey: 'anim_water_spell', size: 200 },
        sound: { type: 'water' }
    },
    'Mudslide': {
        projectile: { animKey: 'anim_ground_hit', size: 80, speed: 400, shape: 'sprite' },
        impact: { animKey: 'anim_ground_hit', size: 200, screenShake: { intensity: 3, duration: 300 } },
        sound: { type: 'earth' }
    },
    'Tide': {
        projectile: null,
        impact: { animKey: 'anim_water_spell', size: 200 },
        sound: { type: 'water' }
    },
    'Aegis': {
        projectile: null,
        impact: { animKey: 'anim_fire_shield', size: 150, shieldDome: true },
        sound: { type: 'shield' }
    },
    'Cataclysm': {
        projectile: { animKey: 'anim_meteor', size: 150, speed: 600, shape: 'sprite' },
        impact: { animKey: 'anim_earth_fissure', size: 300, screenShake: { intensity: 6, duration: 400 } },
        sound: { type: 'earth' }
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
