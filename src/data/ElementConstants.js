export const ELEMENT_COLORS = {
    fire: 0xdf1b2d,
    earth: 0xa67032,
    water: 0x1084e9,
    air: 0xbf8cff,
    'n/a': 0x4a4a4a,
    neutral: 0x4a4a4a
};

export const ELEMENT_HEX = {
    fire: '#df1b2d',
    earth: '#a67032',
    water: '#1084e9',
    air: '#bf8cff',
    'n/a': '#4a4a4a',
    neutral: '#4a4a4a'
};

export const WEAKNESS_MAP = {
    fire: 'water',
    earth: 'fire',
    air: 'earth',
    water: 'air'
};

export const CYCLE_ELEMENTS = ['neutral', 'fire', 'earth', 'air', 'water'];

export const ELEMENT_ICONS = {
    fire: 'icon_fire',
    earth: 'icon_earth',
    water: 'icon_water',
    air: 'icon_air'
};

export function isWeakenedByCycle(spellEl, cycleEl) {
    return WEAKNESS_MAP[spellEl] === cycleEl;
}
