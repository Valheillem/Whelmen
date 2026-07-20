from PIL import Image
import numpy as np

img = Image.open('C:/Users/agar8/.gemini/antigravity/brain/0d9d9268-6908-4fc1-ae43-4c7592e6c8a5/media__1784572984515.png').convert('RGB')
arr = np.array(img)
w, h = img.size

# Background is mostly uniform. Let's just find the leftmost and rightmost non-background pixels in the bottom half.
bottom_half = arr[h//2:, :, :]
bg_color = bottom_half[0, 0] # Top left of bottom half is background

diff = np.abs(bottom_half.astype(int) - bg_color.astype(int)).sum(axis=2)
non_bg = np.where(diff > 50)

min_x = np.min(non_bg[1])
max_x = np.max(non_bg[1])

print(f"Hand bounding box X: {min_x} to {max_x}")
print(f"Center of hand: {(min_x + max_x) // 2}")
print(f"Center of image: {w // 2}")
