# Favicon Setup Instructions

## Current Issue
The ARTLEE favicon is not appearing because the favicon files are missing.

## Required Files
Place your ARTLEE favicon files in the `public` folder (NOT in public/images):

1. `favicon.ico` - Standard ICO format (16x16, 32x32, 48x48)
2. `favicon-16x16.png` - 16x16 PNG
3. `favicon-32x32.png` - 32x32 PNG
4. `apple-touch-icon.png` - 180x180 PNG (for iOS devices)

## Quick Fix
If you have a single favicon image (PNG/JPG):

1. Convert it to multiple sizes using an online tool like:
   - https://favicon.io/favicon-converter/
   - https://realfavicongenerator.net/

2. Download the generated files

3. Place them in the `public` folder:
   ```
   ARTLEE CRM/
   └── public/
       ├── favicon.ico
       ├── favicon-16x16.png
       ├── favicon-32x32.png
       └── apple-touch-icon.png
   ```

4. The browser will automatically pick up the new favicons (you may need to hard refresh: Ctrl+Shift+R)

## Current Configuration
The `index.html` is already configured to use these standard favicon paths.
