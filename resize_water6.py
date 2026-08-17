from PIL import Image

# Resize water6
img = Image.open('assets/spritesheets/water6.png')
# Original is 21600x1200 (12 frames of 1800x1200)
# We scale it down to 450x300 (1/4 scale)
new_w = img.width // 4
new_h = img.height // 4
resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
resized.save('assets/spritesheets/water6.png')
print(f"Resized water6.png to {new_w}x{new_h}")
