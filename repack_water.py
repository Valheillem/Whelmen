from PIL import Image

def repack_and_scale(file_path, frame_w, frame_h, scale_factor, cols):
    img = Image.open(file_path)
    total_w, total_h = img.size
    frames = total_w // frame_w
    
    new_frame_w = int(frame_w * scale_factor)
    new_frame_h = int(frame_h * scale_factor)
    
    rows = (frames + cols - 1) // cols
    new_img = Image.new("RGBA", (cols * new_frame_w, rows * new_frame_h))
    
    for i in range(frames):
        # Extract frame
        box = (i * frame_w, 0, (i + 1) * frame_w, frame_h)
        frame = img.crop(box)
        # Scale
        frame = frame.resize((new_frame_w, new_frame_h), Image.Resampling.LANCZOS)
        # Paste
        col = i % cols
        row = i // cols
        new_img.paste(frame, (col * new_frame_w, row * new_frame_h))
        
    new_img.save(file_path)
    print(f"Repacked {file_path}: new frame {new_frame_w}x{new_frame_h}, total {new_img.size}")

repack_and_scale('assets/spritesheets/water1.png', 1280, 720, 0.25, 8)
