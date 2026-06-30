import os

replacements = {
    # Borders & Text & Particles
    'ff3c00': 'df1b2d',
    'FF3C00': 'DF1B2D',
    '00e676': 'a67032',
    '00E676': 'A67032',
    '00b0ff': '1084e9',
    '00B0FF': '1084E9',
    '00e5ff': 'bf8cff',
    '00E5FF': 'BF8CFF',
    
    # Fire Gradient
    '#2e0a0a': '#33050a',
    '#4a1200': '#590a13',
    '#0f0300': '#140204',
    
    # Earth Gradient
    '#0a2412': '#2e1d0d',
    '#12381c': '#4d3216',
    '#020d05': '#140c05',
    
    # Water Gradient
    '#061c30': '#061a2e',
    '#0d2d4c': '#0a2b4d',
    '#020b14': '#020912',
    
    # Air Gradient
    '#05222c': '#1f1433',
    '#0a3644': '#332054',
    '#010c10': '#0d0817'
}

files_to_modify = [
    'src/scenes/Game.js',
    'src/styles.css',
    'src/scenes/Start.js'
]

for filepath in files_to_modify:
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        for old_val, new_val in replacements.items():
            content = content.replace(old_val, new_val)
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
print("Done modifying colors.")
