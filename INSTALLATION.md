# 📦 ORE EV Calculator Chrome Extension - ZIP Installation Guide

**File**: `ore-ev-calculator-extension.zip` (20 KB)

## ✨ What's Included

This ZIP package contains a complete Chrome extension with:

- ✅ **52% Win Rate** (13 blocks default)
- ✅ **Real-time Win Tracking** with ✅/❌ emojis
- ✅ **Performance Analytics**
- ✅ **Auto-Select** functionality
- ✅ **Live Price Updates** (ORE/SOL)
- ✅ **Beautiful Popup UI**
- ✅ **Persistent Settings**

---

## 🚀 Quick Installation (3 Steps)

### **Step 1: Extract ZIP**

1. **Download** `ore-ev-calculator-extension.zip`
2. **Right-click** → Extract/Unzip
3. You'll get a folder named `extension/`

### **Step 2: Generate Icons** (Optional but Recommended)

**Method A - Browser Tool (Easiest):**
1. Open `extension/generate-icons.html` in any browser
2. Icons auto-generate on page load
3. Click each "Download" button (16, 32, 48, 128)
4. Save them in `extension/icons/` folder

**Method B - Skip Icons:**
- Extension works without icons (just shows Chrome default)
- You can add them later

### **Step 3: Install in Chrome**

1. **Open Chrome** and go to: `chrome://extensions/`
2. **Enable "Developer mode"** (toggle in top-right)
3. **Click "Load unpacked"** button
4. **Select** the `extension/` folder you extracted
5. **Done!** Extension appears in your list

---

## 📱 How to Use

### **First Time Setup**

1. **Visit** https://ore.supply/
2. **Extension auto-runs** - you'll see the calculator UI
3. **Click extension icon** in Chrome toolbar (optional)
4. **Configure settings** via popup

### **Extension Popup Controls**

Click the ⛏️ icon in Chrome toolbar:

```
┌─────────────────────────────────┐
│  ⛏️ ORE EV Calculator           │
├─────────────────────────────────┤
│ 📊 Blocks: [slider] 1-25        │
│ Win Rate: 52.0%                 │
│                                 │
│ Auto-Select      [Toggle]       │
│ Multi-Block      [Toggle]       │
├─────────────────────────────────┤
│ 🎯 Quick Presets:               │
│  [Conservative] [Balanced]      │
│  [Aggressive]   [Very High]     │
├─────────────────────────────────┤
│     ✅ Apply Settings           │
└─────────────────────────────────┘
```

### **Quick Presets**

| Preset | Blocks | Win Rate | Best For |
|--------|--------|----------|----------|
| Conservative | 3 | 12% | Max profit per win |
| Balanced | 5 | 20% | Good mix |
| **Aggressive** | **13** | **52%** | **Default (win often)** |
| Very High | 20 | 80% | Frequent wins |

---

## 🎮 On-Page Interface

The extension adds controls below the Deploy button:

```
┌─────────────────────────────────────┐
│ Auto Select: OFF  |  Auto Select: ON│
│ Multi-Block: OFF  |  Multi (13): ON │
├─────────────────────────────────────┤
│ Last Round: ✅ WON - Block #7       │
│ Session Win Rate: 6/10 (60.0%)     │
│ ✅ ❌ ✅ ✅ ❌ ✅ ❌ ✅ ✅ ❌         │
└─────────────────────────────────────┘
```

**What Each Part Shows:**
- **Top Row**: Toggle auto-select on/off
- **Second Row**: Toggle multi-block mode
- **Last Round**: Result of previous round
- **Win Rate**: Your session performance
- **Bottom Row**: Last 10 rounds (✅ = win, ❌ = loss)

---

## ⚙️ Configuration

### **Change Win Rate**

1. Click extension icon
2. Drag "Blocks to Select" slider
3. Click "Apply Settings"

**Formula**: Win Rate = (Blocks ÷ 25) × 100%

Examples:
- 1 block = 4% (every 25 rounds)
- 5 blocks = 20% (every 5 rounds)
- 13 blocks = 52% (every 2 rounds)
- 25 blocks = 100% (every round)

### **Enable Auto-Select**

1. Click extension icon
2. Toggle "Auto-Select" to ON
3. Click "Apply Settings"

Now the extension automatically clicks the best blocks!

### **Console Commands**

Open DevTools (F12) → Console:

```javascript
// View detailed statistics
oreEvStats()

// Change settings programmatically
oreEvConfig({ maxBlocks: 10, autoSelect: true })

// Stop calculator
oreEvStop()
```

---

## 🔧 Troubleshooting

### **Extension Not Loading?**

1. Make sure you extracted the ZIP (don't load the ZIP directly)
2. Check "Developer mode" is enabled
3. Try clicking "Reload" (🔄) on the extension card

### **Not Working on ore.supply?**

1. Refresh the page (F5)
2. Check console for errors (F12 → Console tab)
3. Verify extension is enabled at `chrome://extensions/`

### **Settings Not Saving?**

1. Click "Apply Settings" button after changes
2. Check extension has "storage" permission
3. Try reloading the extension

### **Icons Not Showing?**

Extension works fine without icons! To add them:
1. Open `generate-icons.html` in browser
2. Download all 4 icon sizes
3. Save in `extension/icons/` folder
4. Reload extension

---

## 📊 Features Explained

### **Multi-Block Staking**

Instead of betting on 1 block (4% chance), bet on multiple blocks:
- **13 blocks** = 52% win rate (default)
- Win **more often** but earn **less per win**
- Profit splits across all selected blocks

### **Real-Time Tracking**

After each round:
- Detects which block won
- Checks if you had it selected
- Updates win/loss statistics
- Shows ✅ or ❌ emoji
- Logs full details to console

### **Historical Data**

Tracks over time:
- Which blocks win most often
- "Hot blocks" that win >6% (vs expected 4%)
- Your actual vs expected win rate
- Last 10 rounds with details

### **Live Prices**

Updates every 15 seconds:
- ORE price from DexScreener
- SOL price from DexScreener
- Calculates ORE/SOL ratio
- Uses in EV calculations

---

## 📁 File Structure

```
extension/
├── manifest.json           # Chrome extension config
├── content.js              # Main calculator (38KB)
├── popup.html              # Popup UI
├── popup.js                # Settings logic
├── README.md               # Full documentation
├── generate-icons.html     # Icon generator tool
├── create-icons.sh         # CLI icon script (Linux/Mac)
└── icons/                  # Place icon files here
    ├── icon16.png          (create with generator)
    ├── icon32.png          (create with generator)
    ├── icon48.png          (create with generator)
    └── icon128.png         (create with generator)
```

---

## 🎯 Best Practices

### **For Maximum Wins**
```javascript
oreEvConfig({ maxBlocks: 13, autoSelect: true })
```
- 52% win rate
- Wins every ~2 rounds
- Balanced profit

### **For Maximum Profit**
```javascript
oreEvConfig({ maxBlocks: 1, autoSelect: true })
```
- 4% win rate
- Wins every ~25 rounds
- Highest profit per win

### **For Frequent Action**
```javascript
oreEvConfig({ maxBlocks: 20, autoSelect: true })
```
- 80% win rate
- Wins 4 out of 5 rounds
- Lower profit but consistent

---

## 🔒 Privacy & Security

This extension:
- ✅ **No data collection** - everything stays local
- ✅ **No external servers** - except price API
- ✅ **Open source** - you can inspect all code
- ✅ **No tracking** - no analytics or telemetry
- ✅ **Minimal permissions** - only what's needed

**Required Permissions:**
- `storage`: Save your settings
- `activeTab`: Access ore.supply page
- `ore.supply`: Run calculator on mining site
- `api.dexscreener.com`: Fetch token prices

---

## 📈 Performance Tips

1. **Start with Aggressive preset** (13 blocks)
2. **Enable auto-select** for hands-free operation
3. **Check stats regularly** with `oreEvStats()`
4. **Adjust based on results** after 20+ rounds
5. **Watch for hot blocks** (appear every 50 rounds)

---

## 🆘 Support

### **Get Help**

1. Check `extension/README.md` for detailed docs
2. Open console (F12) for error messages
3. Verify all files extracted correctly
4. Try reloading extension

### **Common Issues**

**"Extension failed to load"**
- Make sure folder contains `manifest.json`
- Don't load the ZIP directly, extract first

**"Cannot read property"**
- Refresh ore.supply page
- Clear browser cache
- Reload extension

**"Settings not applying"**
- Click "Apply Settings" button
- Check ore.supply tab is active
- Try closing/reopening popup

---

## 🎉 You're Ready!

1. ✅ **Extract ZIP**
2. ✅ **Generate icons** (optional)
3. ✅ **Load in Chrome**
4. ✅ **Visit ore.supply**
5. ✅ **Start mining smarter!**

**Default Settings:**
- 13 blocks selected (52% win rate)
- Auto-select: OFF (toggle to enable)
- Multi-block: ON
- Min EV threshold: 0.0001 SOL

Happy mining! ⛏️💰

---

**Package Info:**
- Version: 1.0.0
- Size: 20 KB
- Files: 9
- Compatible: Chrome, Edge, Brave (Chromium-based)
