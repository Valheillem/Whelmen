from PIL import Image
import numpy as np

img = Image.open('C:/Users/agar8/.gemini/antigravity/brain/0d9d9268-6908-4fc1-ae43-4c7592e6c8a5/media__1784572984515.png').convert('RGB')
arr = np.array(img)

# Let's find the center of the opponent's hand (the dark cards at the top)
top_half = arr[:img.height//3, :, :]
# Find dark pixels (card backs)
dark_mask = (top_half[:, :, 0] < 50) & (top_half[:, :, 1] < 50) & (top_half[:, :, 2] < 50)
dark_y, dark_x = np.where(dark_mask)

if len(dark_x) > 0:
    print(f"Opponent hand X bounds: {np.min(dark_x)} to {np.max(dark_x)}")
    print(f"Center of opponent hand: {(np.min(dark_x) + np.max(dark_x)) // 2}")
