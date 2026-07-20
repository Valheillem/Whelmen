from PIL import Image
import numpy as np

img = Image.open('C:/Users/agar8/.gemini/antigravity/brain/0d9d9268-6908-4fc1-ae43-4c7592e6c8a5/media__1784572984515.png').convert('RGB')
arr = np.array(img)

# Find the Red card in the top half (which is hovering above the central sigil)
top_half = arr[:img.height//2, :, :]
# Red pixels
red_mask = (top_half[:, :, 0] > 150) & (top_half[:, :, 1] < 80) & (top_half[:, :, 2] < 80)
red_y, red_x = np.where(red_mask)

if len(red_x) > 0:
    red_center_x = (np.min(red_x) + np.max(red_x)) // 2
    print(f"Center of Red Board Card (Central Sigil): {red_center_x}")
else:
    print("Red card not found")

