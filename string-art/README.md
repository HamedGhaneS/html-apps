# String Art Pattern Generator

**Author:** Hamed Ghane  
**Date:** December 18, 2025

A fully client-side web application that generates string art patterns from images using an **error-based greedy algorithm**. Upload an image, configure your frame, and get a step-by-step CSV file showing which pins to connect.

🔗 **Live Demo:** [https://your-username.github.io/html-apps/string-art/](https://your-username.github.io/html-apps/string-art/)

![String Art Generator Preview](preview.png)

## Features

- ✅ **100% Client-Side** - Runs entirely in your browser, no server needed
- ✅ **Error-Based Algorithm** - Mathematically optimal thread placement
- ✅ **Multiple Frame Shapes** - Circle, Ellipse, Rectangle
- ✅ **Quality Presets** - Draft, Normal, High, Ultra
- ✅ **Real-time Preview** - See frame configuration before generating
- ✅ **Export Options** - Download CSV instructions and PNG preview
- ✅ **Mobile Friendly** - Responsive design works on all devices

## Algorithm

This generator uses an **error-based greedy algorithm** that directly minimizes the squared error between the thread canvas and target image:

1. **Start with white canvas** (intensity = 1.0)
2. **Multiplicative darkening**: Each thread multiplies pixels by `(1 - α)`
3. **Line selection**: Choose the line that maximizes `Σ[(old_error)² - (new_error)²]`
4. **Repeat** until target number of lines is reached

This approach is superior to simple darkness-sum algorithms because it:
- Directly optimizes for matching the target image
- Prevents over-darkening in already dark areas
- Produces smoother gradients and better portraits

## Quick Start

### Option 1: GitHub Pages (Recommended)

1. Copy the `string-art` folder to your repository
2. Go to **Settings** → **Pages**
3. Select branch and folder, then **Save**
4. Access at `https://your-username.github.io/repo-name/string-art/`

### Option 2: Run Locally

Simply open `index.html` in any modern browser:

```bash
# Clone the repo
git clone https://github.com/your-username/html-apps.git
cd html-apps/string-art

# Open in browser (macOS)
open index.html

# Windows
start index.html

# Linux
xdg-open index.html
```

## How to Use

### Step 1: Load Image
- **Upload**: Drag & drop or click to browse
- **URL**: Paste image URL (may fail due to CORS - download locally if needed)

### Step 2: Configure Frame
1. Select frame shape (Circle, Ellipse, Rectangle)
2. Set number of pins (50-500, default 200)
3. Set Pin #1 position (0°=top, 90°=right, 180°=bottom, 270°=left)
4. Click **Preview Frame** to verify
5. Click **Confirm** when correct

### Step 3: Generate Pattern

Choose a quality preset or customize:

| Preset | Lines | Best For |
|--------|-------|----------|
| Draft | 2,000 | Quick preview |
| Normal | 3,500 | General use |
| High | 5,000 | Detailed images |
| Ultra | 7,000 | Maximum quality |

**Advanced Parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| Thread Darkness (α) | 0.05 | Darkening per thread (0.02-0.15) |
| Min Pin Gap | 20 | Minimum pins between connections |
| Gamma | 1.0 | Contrast adjustment (>1 = more contrast) |
| Resolution | 600 | Internal canvas size (400-1000) |

### Step 4: Export

- **Download CSV** - Step-by-step pin connections
- **Download PNG** - Preview image

## CSV Format

```csv
step,start_pin,end_pin
1,1,105
2,105,42
3,42,156
...
```

Follow each row: wrap thread from `start_pin` to `end_pin`.

## Tips for Best Results

1. **Use high-contrast images** - Clear difference between subject and background
2. **Simple backgrounds work best** - Portraits on plain backgrounds produce cleaner results
3. **Adjust gamma for outdoor photos** - Try 1.2-1.5 for better contrast
4. **More pins ≠ always better** - 200-250 pins usually optimal
5. **Thread color matters** - Light threads on dark board, or vice versa

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

## File Structure

```
string-art/
├── index.html    # Main application
├── style.css     # Styling
├── app.js        # Algorithm & logic
└── README.md     # Documentation
```

## Technical Details

### Algorithm Complexity
- **Time**: O(L × C × P) where L=lines, C=candidates/step, P=pixels/line
- **Space**: O(S²) where S=canvas size

### Performance
- Draft (2000 lines): ~5-10 seconds
- Normal (3500 lines): ~15-25 seconds
- High (5000 lines): ~30-45 seconds
- Ultra (7000 lines): ~60-90 seconds

## Troubleshooting

**Image won't load from URL**
→ Download the image and upload locally (CORS restriction)

**Generation is slow**
→ Use Draft preset or reduce canvas resolution

**Result looks too light/dark**
→ Adjust Gamma (higher = more contrast) or Thread Darkness (α)

**Too much noise/artifacts**
→ Increase Min Pin Gap or use fewer pins

## License

MIT License - Free to use, modify, and distribute.

## Acknowledgments

- Algorithm inspired by mathematical string art optimization research
- Built with vanilla HTML, CSS, and JavaScript for maximum compatibility
