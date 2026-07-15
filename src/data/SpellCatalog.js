export const SPELLS_CATALOG = {
    'air': { name: 'Breeze', element: 'air', combo: ['air'], damage: 0, shield: 0, draw: 0, drain: 1, synergyType: 'constructive', synergyText: 'Constructive: 2 drain', desc: 'Drain 1. Constructive: 2 drain' },
    'water': { name: 'Stream', element: 'water', combo: ['water'], damage: 0, shield: 0, draw: 1, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 2 draw', desc: 'Draw 1. Constructive: 2 draw' },
    'fire': { name: 'Spark', element: 'fire', combo: ['fire'], damage: 1, shield: 0, draw: 0, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 3 damage', desc: '1 DMG. Constructive: 3 damage' },
    'earth': { name: 'Shell', element: 'earth', combo: ['earth'], damage: 0, shield: 3, draw: 0, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 5 shield', desc: '+3 Shield. Constructive: 5 shield' },
    'air,air': { name: 'Gust', element: 'air', combo: ['air', 'air'], damage: 0, shield: 0, draw: 0, drain: 2, synergyType: 'constructive', synergyText: 'Constructive: 3 drain', desc: 'Drain 2. Constructive: 3 drain' },
    'water,water': { name: 'Rain', element: 'water', combo: ['water', 'water'], damage: 0, shield: 0, draw: 2, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 3 draw', desc: 'Draw 2. Constructive: 3 draw' },
    'fire,fire': { name: 'Blast', element: 'fire', combo: ['fire', 'fire'], damage: 3, shield: 0, draw: 0, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 5 damage', desc: '3 DMG. Constructive: 5 damage' },
    'earth,earth': { name: 'Carapace', element: 'earth', combo: ['earth', 'earth'], damage: 0, shield: 5, draw: 0, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: 8 shield', desc: '+5 Shield. Constructive: 8 shield' },
    'air,fire': { name: 'Ignition', element: 'n/a', combo: ['air', 'fire'], damage: 1, shield: 0, draw: 0, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, 2 mana can be played', desc: '1 DMG, Drain 1. Prestructive: Next round, 2 mana can be played' },
    'fire,water': { name: 'Haze', element: 'n/a', combo: ['fire', 'water'], damage: 1, shield: 0, draw: 1, drain: 0, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, all players lose hand mana as they draw mana', desc: '1 DMG, Draw 1. Prestructive: Next round, all players lose hand mana as they draw mana' },
    'earth,fire': { name: 'Quake', element: 'n/a', combo: ['earth', 'fire'], damage: 1, shield: 3, draw: 0, drain: 0, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, applying Shield deals 1 damage', desc: '1 DMG, +3 Shield. Prestructive: Next round, applying Shield deals 1 damage' },
    'air,earth': { name: 'Dust', element: 'n/a', combo: ['air', 'earth'], damage: 0, shield: 3, draw: 0, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, damage has a 50% chance of missing', desc: '+3 Shield, Drain 1. Prestructive: Next round, damage has a 50% chance of missing' },
    'air,water': { name: 'Typhoon', element: 'n/a', combo: ['air', 'water'], damage: 0, shield: 0, draw: 1, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, drawn mana is immediately played', desc: 'Draw 1, Drain 1. Prestructive: Next round, drawn mana is immediately played' },
    'earth,water': { name: 'Enrich', element: 'n/a', combo: ['earth', 'water'], damage: 0, shield: 3, draw: 1, drain: 0, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, everyone draws 3 mana', desc: '+3 Shield, Draw 1. Prestructive: Next round, everyone draws 3 mana' },
    'air,air,fire': { name: 'Firestorm', element: 'air', combo: ['air', 'air', 'fire'], damage: 1, shield: 0, draw: 0, drain: 2, synergyType: 'constructive', synergyText: 'Constructive: Next played mana deals 1 damage to opponent', desc: '1 DMG, Drain 2. Constructive: Next played mana deals 1 damage to opponent' },
    'earth,earth,water': { name: 'Fortress', element: 'earth', combo: ['earth', 'earth', 'water'], damage: 0, shield: 5, draw: 1, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: Next turn, draw an extra mana if you still have shield', desc: '+5 Shield, Draw 1. Constructive: Next turn, draw an extra mana if you still have shield' },
    'air,fire,fire': { name: 'Wildfire', element: 'fire', combo: ['air', 'fire', 'fire'], damage: 3, shield: 0, draw: 0, drain: 1, synergyType: 'constructive', synergyText: 'Constructive: Next turn, play 2 spells instead of 1', desc: '3 DMG, Drain 1. Constructive: Next turn, play 2 spells instead of 1' },
    'earth,water,water': { name: 'Quagmire', element: 'water', combo: ['earth', 'water', 'water'], damage: 0, shield: 3, draw: 2, drain: 0, synergyType: 'constructive', synergyText: 'Constructive: Next turn, you can redraw up to 2 mana', desc: '+3 Shield, Draw 2. Constructive: Next turn, you can redraw up to 2 mana' },
    'fire,water,water': { name: 'Billow', element: 'water', combo: ['fire', 'water', 'water'], damage: 1, shield: 0, draw: 2, drain: 0, synergyType: 'destructive', synergyText: 'Destructive: Cycle the top 3 deck cards', desc: '1 DMG, Draw 2. Destructive: Cycle the top 3 deck cards' },
    'fire,fire,water': { name: 'Vaporize', element: 'fire', combo: ['fire', 'fire', 'water'], damage: 3, shield: 0, draw: 1, drain: 0, synergyType: 'destructive', synergyText: 'Destructive: Destroy the top 3 deck cards', desc: '3 DMG, Draw 1. Destructive: Destroy the top 3 deck cards' },
    'earth,fire,fire': { name: 'Surge', element: 'fire', combo: ['earth', 'fire', 'fire'], damage: 3, shield: 3, draw: 0, drain: 0, synergyType: 'destructive', synergyText: 'Destructive: Next mana played by opponent deals 1 damage to them', desc: '3 DMG, +3 Shield. Destructive: Next mana played by opponent deals 1 damage to them' },
    'earth,earth,fire': { name: 'Crucible', element: 'earth', combo: ['earth', 'earth', 'fire'], damage: 1, shield: 5, draw: 0, drain: 0, synergyType: 'destructive', synergyText: 'Destructive: Next round, deal 1 retaliation damage to attacking opponents', desc: '1 DMG, +5 Shield. Destructive: Next round, deal 1 retaliation damage to attacking opponents' },
    'air,air,water': { name: 'Hurricane', element: 'air', combo: ['air', 'air', 'water'], damage: 0, shield: 0, draw: 1, drain: 2, synergyType: 'destructive', synergyText: 'Destructive: Next round, opponent can\'t draw mana', desc: 'Draw 1, Drain 2. Destructive: Next round, opponent can\'t draw mana' },
    'air,water,water': { name: 'Flood', element: 'water', combo: ['air', 'water', 'water'], damage: 0, shield: 0, draw: 2, drain: 1, synergyType: 'destructive', synergyText: 'Destructive: Next round, opponent draws 4 mana', desc: 'Draw 2, Drain 1. Destructive: Next round, opponent draws 4 mana' },
    'air,earth,earth': { name: 'Tower', element: 'earth', combo: ['air', 'earth', 'earth'], damage: 0, shield: 5, draw: 0, drain: 1, synergyType: 'destructive', synergyText: 'Destructive: Next round, opponent\'s spells have 50% chance of failing', desc: '+5 Shield, Drain 1. Destructive: Next round, opponent\'s spells have 50% chance of failing' },
    'air,air,earth': { name: 'Scour', element: 'air', combo: ['air', 'air', 'earth'], damage: 0, shield: 3, draw: 0, drain: 2, synergyType: 'destructive', synergyText: 'Destructive: Remove opponent\'s Shield', desc: '+3 Shield, Drain 2. Destructive: Remove opponent\'s Shield' },
    'air,air,air': { name: 'Tempest', element: 'air', combo: ['air', 'air', 'air'], damage: 0, shield: 0, draw: 0, drain: 3, synergyType: 'force_cycle', synergyText: 'Force Cycle to Air', desc: 'Drain 3. Force Cycle to Air' },
    'earth,earth,earth': { name: 'Pillar', element: 'earth', combo: ['earth', 'earth', 'earth'], damage: 0, shield: 8, draw: 0, drain: 0, synergyType: 'force_cycle', synergyText: 'Force Cycle to Earth', desc: '+8 Shield. Force Cycle to Earth' },
    'fire,fire,fire': { name: 'Blaze', element: 'fire', combo: ['fire', 'fire', 'fire'], damage: 5, shield: 0, draw: 0, drain: 0, synergyType: 'force_cycle', synergyText: 'Force Cycle to Fire', desc: '5 DMG. Force Cycle to Fire' },
    'water,water,water': { name: 'Deluge', element: 'water', combo: ['water', 'water', 'water'], damage: 0, shield: 0, draw: 3, drain: 0, synergyType: 'force_cycle', synergyText: 'Force Cycle to Water', desc: 'Draw 3. Force Cycle to Water' },
    'air,earth,water': { name: 'Mudslide', element: 'n/a', combo: ['air', 'earth', 'water'], damage: 0, shield: 3, draw: 1, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, everyone discards and replaces their hand', desc: '+3 Shield, Draw 1, Drain 1. Prestructive: Next round, everyone discards and replaces their hand' },
    'air,fire,water': { name: 'Tide', element: 'n/a', combo: ['air', 'fire', 'water'], damage: 1, shield: 0, draw: 1, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, everyone rotates hands clockwise', desc: '1 DMG, Draw 1, Drain 1. Prestructive: Next round, everyone rotates hands clockwise' },
    'earth,fire,water': { name: 'Aegis', element: 'n/a', combo: ['earth', 'fire', 'water'], damage: 1, shield: 3, draw: 1, drain: 0, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, no damage can be dealt', desc: '1 DMG, +3 Shield, Draw 1. Prestructive: Next round, no damage can be dealt' },
    'air,earth,fire': { name: 'Cataclysm', element: 'n/a', combo: ['air', 'earth', 'fire'], damage: 1, shield: 3, draw: 0, drain: 1, synergyType: 'prestructive', synergyText: 'Prestructive: Next round, spells are randomly targeted (including self)', desc: '1 DMG, +3 Shield, Drain 1. Prestructive: Next round, spells are randomly targeted (including self)' }
};

export function getSpellFromCombo(combo) {
    if (combo.length === 0 || combo.length > 3) return null;
    
    // Sort alphabetically to maintain order independence
    const sorted = [...combo].sort();
    const key = sorted.join(',');

    return SPELLS_CATALOG[key] || null;
}

export function findSpellInMessage(msg) {
    const lowerMsg = msg.toLowerCase();
    const sortedSpells = Object.values(SPELLS_CATALOG).sort((a, b) => b.name.length - a.name.length);
    for (const spell of sortedSpells) {
        if (lowerMsg.includes(spell.name.toLowerCase())) {
            return spell;
        }
    }
    return null;
}

export function getAllSpellNames() {
    return Object.values(SPELLS_CATALOG).map(spell => spell.name);
}
