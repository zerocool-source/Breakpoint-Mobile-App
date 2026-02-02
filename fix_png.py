from PIL import Image
import os
import glob

# Find the logo file
patterns = ['**/breakpointlogo.png', '**/assets/**/logo*.png', '**/images/**/logo*.png']
for pattern in patterns:
    files = glob.glob(pattern, recursive=True)
    for f in files:
        print(f"Found: {f}")
        try:
            img = Image.open(f)
            # Convert to RGBA and save as clean PNG
            img = img.convert('RGBA')
            img.save(f, 'PNG', optimize=True)
            print(f"Fixed: {f}")
        except Exception as e:
            print(f"Error with {f}: {e}")
