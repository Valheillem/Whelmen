import os
import glob
import json
from PIL import Image

def get_unique_name(base_name, existing_names):
    name = base_name
    counter = 1
    while name in existing_names:
        name = f"{base_name}_{counter}"
        counter += 1
    existing_names.add(name)
    return name

def pack_spritesheets(source_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    spritesheet_metadata = {}
    existing_names = set()

    for root, dirs, files in os.walk(source_dir):
        # Look for png files in this directory
        png_files = [f for f in files if f.lower().endswith('.png')]
        
        # If this directory has PNG files AND has no subdirectories (it's a leaf node containing frames)
        if png_files and not dirs:
            # Sort the frames correctly (e.g., 1.png, 2.png, ..., 10.png)
            def extract_number(f):
                name = os.path.splitext(f)[0]
                digits = ''.join(c for c in name if c.isdigit())
                return (int(digits) if digits else 0, name)

            png_files.sort(key=extract_number)
            
            # Formulate a name based on the pack and the folder
            # e.g., craftpix-net-358572-explosion-vector-sprite-effects\PNG\1
            rel_path = os.path.relpath(root, source_dir)
            parts = [p for p in rel_path.split(os.sep) if p.lower() not in ('png', 'spritesheets', 'sprites', 'sequence')]
            
            # Clean up the pack name
            pack_name = parts[0]
            if pack_name.startswith("craftpix-net-") and len(pack_name.split("-")) >= 4:
                pack_name = "-".join(pack_name.split("-")[3:])
            
            effect_name = "_".join(parts[1:])
            if not effect_name:
                effect_name = "effect"
                
            base_name = f"{pack_name}_{effect_name}".lower().replace(" ", "_").replace("-", "_")
            safe_name = get_unique_name(base_name, existing_names)
            
            print(f"Packing {safe_name} from {len(png_files)} frames... ({root})")
            
            # Uncomment below to actually do it
            
            images = [Image.open(os.path.join(root, f)).convert("RGBA") for f in png_files]
            
            frame_width, frame_height = images[0].size
            
            spritesheet_width = frame_width * len(images)
            spritesheet = Image.new("RGBA", (spritesheet_width, frame_height))
            
            for i, img in enumerate(images):
                # Ensure it's the same size or paste at center if different? Usually they are the same size.
                if img.size != (frame_width, frame_height):
                    # just resize or ignore. Let's resize for safety
                    img = img.resize((frame_width, frame_height), Image.Resampling.LANCZOS)
                spritesheet.paste(img, (i * frame_width, 0))
                
            output_file = os.path.join(output_dir, f"{safe_name}.png")
            spritesheet.save(output_file)
            
            spritesheet_metadata[safe_name] = {
                "frameWidth": frame_width,
                "frameHeight": frame_height,
                "frameCount": len(images),
                "originalName": safe_name
            }
            

    # Save the metadata
    meta_path = os.path.join(output_dir, "spritesheets.json")
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            try:
                existing_meta = json.load(f)
            except:
                existing_meta = {}
    else:
        existing_meta = {}
        
    existing_meta.update(spritesheet_metadata)
    
    with open(meta_path, "w") as f:
        json.dump(existing_meta, f, indent=4)
        
    print(f"Saved {len(spritesheet_metadata)} new spritesheets and updated metadata.")

if __name__ == "__main__":
    src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "New Effects"))
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "spritesheets"))
    pack_spritesheets(src_dir, out_dir)
