#!/bin/bash

# Simple script to create placeholder icons for the Chrome extension
# These are basic colored squares with the ORE logo emoji

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Installing placeholder method..."
    echo ""
    echo "To create proper icons, you can:"
    echo "1. Use an online icon generator (https://icon.kitchen/)"
    echo "2. Use Figma or Photoshop to create PNG files"
    echo "3. Install ImageMagick: sudo apt install imagemagick (Linux) or brew install imagemagick (Mac)"
    echo ""
    echo "For now, creating simple colored PNG placeholders..."
fi

# Create icons directory
mkdir -p icons

# Create simple colored squares as placeholders
# These will work but look basic - replace with better icons later

create_placeholder() {
    size=$1
    output=$2

    if command -v convert &> /dev/null; then
        # Create a gradient background with text
        convert -size ${size}x${size} \
                gradient:#667eea-#764ba2 \
                -gravity center \
                -pointsize $((size / 3)) \
                -fill white \
                -annotate +0+0 "⛏️" \
                "$output"
        echo "✅ Created $output with ImageMagick"
    else
        # Fallback: Create SVG and note that it needs conversion
        cat > "${output%.png}.svg" <<EOF
<svg width="$size" height="$size" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="$size" height="$size" fill="url(#grad)"/>
  <text x="50%" y="50%" text-anchor="middle" dy=".3em"
        font-size="${size}px" fill="white">⛏️</text>
</svg>
EOF
        echo "📝 Created ${output%.png}.svg (needs PNG conversion)"
    fi
}

# Create all required sizes
create_placeholder 16 "icons/icon16.png"
create_placeholder 32 "icons/icon32.png"
create_placeholder 48 "icons/icon48.png"
create_placeholder 128 "icons/icon128.png"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Icon creation complete!"
echo ""
echo "If you see SVG files instead of PNG:"
echo "1. Visit https://cloudconvert.com/svg-to-png"
echo "2. Convert each SVG to PNG"
echo "3. Save with the original filename"
echo ""
echo "Or use the extension as-is (it will work, just without icons)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
