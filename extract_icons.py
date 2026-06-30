from psd_tools import PSDImage
import os

psd = PSDImage.open('Primordial_Icons.psd')
os.makedirs('assets/icons', exist_ok=True)

def export_layers(layer):
    if layer.is_group():
        for child in layer:
            export_layers(child)
    else:
        print(f"Exporting layer: {layer.name}")
        image = layer.topil()
        if image:
            image.save(f"assets/icons/{layer.name}.png")

for layer in psd:
    export_layers(layer)
print("Done extracting layers.")
