import os
import glob
import json
from PIL import Image

def pack_spritesheets(source_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    spritesheet_metadata = {}

    for root, dirs, files in os.walk(source_dir):
        if root.endswith("PNG"):
            # Determine the name of the effect based on the parent folder
            effect_name = os.path.basename(os.path.dirname(root))
            
            # Use glob to find all pngs and sort them
            frames = sorted(glob.glob(os.path.join(root, "*.png")))
            if not frames:
                continue
                
            print(f"Packing {effect_name} from {len(frames)} frames...")
            
            images = [Image.open(f) for f in frames]
            
            # Ensure all frames have same size (use the first one as reference)
            frame_width, frame_height = images[0].size
            
            # Create a blank image for the spritesheet
            spritesheet_width = frame_width * len(frames)
            spritesheet = Image.new("RGBA", (spritesheet_width, frame_height))
            
            # Paste frames into the spritesheet
            for i, img in enumerate(images):
                spritesheet.paste(img, (i * frame_width, 0))
                
            safe_name = effect_name.lower().replace(" ", "_")
            output_file = os.path.join(output_dir, f"{safe_name}.png")
            spritesheet.save(output_file)
            
            spritesheet_metadata[safe_name] = {
                "frameWidth": frame_width,
                "frameHeight": frame_height,
                "frameCount": len(frames),
                "originalName": effect_name
            }
            
    # Save the metadata
    with open(os.path.join(output_dir, "spritesheets.json"), "w") as f:
        json.dump(spritesheet_metadata, f, indent=4)
        
    print(f"Saved {len(spritesheet_metadata)} spritesheets and metadata to {output_dir}")

if __name__ == "__main__":
    src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "spell_effects"))
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "assets", "spritesheets"))
    pack_spritesheets(src_dir, out_dir)
