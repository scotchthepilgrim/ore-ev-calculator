# ORE EV Calculator - Chrome Extension

A powerful Chrome extension for ORE mining with advanced EV calculations, multi-block staking, and real-time performance tracking.

## Features

✅ **Multi-Block Staking** - Stake on up to 25 blocks simultaneously
✅ **52% Win Rate Default** - Configure for any win rate (4% to 100%)
✅ **Real-Time Win Tracking** - Track every round with ✅/❌ emojis
✅ **Performance Analytics** - Historical data and hot block detection
✅ **Auto-Select** - Automatically click the best blocks
✅ **Live Price Updates** - Real-time ORE and SOL prices from DexScreener
✅ **Easy Configuration** - Simple popup UI with presets

## Installation

### Method 1: Load Unpacked Extension (Development Mode)

1. **Download this folder** to your computer

2. **Open Chrome Extensions page**:
   - Go to `chrome://extensions/`
   - Or click Menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**:
   - Toggle the "Developer mode" switch in the top right

4. **Load the extension**:
   - Click "Load unpacked"
   - Select the `extension` folder
   - The extension should now appear in your extensions list

5. **Pin the extension** (optional):
   - Click the puzzle icon in Chrome toolbar
   - Find "ORE EV Calculator"
   - Click the pin icon to keep it visible

### Method 2: Create Icons (Before Loading)

The extension needs icon files. You can either:

**Option A: Use the provided script**
```bash
cd extension
node create-icons.js
```

**Option B: Create icons manually**
- Create PNG files: `icons/icon16.png`, `icons/icon32.png`, `icons/icon48.png`, `icons/icon128.png`
- Use any image editor or online icon generator
- Recommended: Mining pickaxe ⛏️ or ORE logo

**Option C: Use placeholder icons** (temporary)
- The extension will work without icons, but you'll see a warning
- Icons only affect appearance, not functionality

## Usage

### 1. Basic Usage

1. **Visit ore.supply** - The extension automatically activates
2. **Check the UI panel** - You'll see toggle buttons below the Deploy button
3. **Configure settings** - Click the extension icon for advanced controls

### 2. Extension Popup Controls

Click the ORE EV Calculator icon in Chrome toolbar to access:

- **Blocks Slider**: Choose how many blocks to stake on (1-25)
- **Auto-Select Toggle**: Enable/disable automatic clicking
- **Multi-Block Toggle**: Enable/disable multi-block mode
- **Quick Presets**: One-click configurations
  - Conservative (3 blocks, 12% win rate)
  - Balanced (5 blocks, 20% win rate)
  - Aggressive (13 blocks, 52% win rate)
  - Very High (20 blocks, 80% win rate)

### 3. On-Page Controls

The extension adds a control panel on ore.supply:

```
┌─────────────────────────────────────┐
│ Auto Select: OFF  |  Auto Select: ON│
├─────────────────────────────────────┤
│ Multi-Block: OFF  |  Multi (13): ON │
├─────────────────────────────────────┤
│ Last Round: ✅ WON - Block #7       │
│ Session Win Rate: 6/10 (60.0%)     │
│ ✅ ❌ ✅ ✅ ❌ ✅ ❌ ✅ ✅ ❌         │
└─────────────────────────────────────┘
```

### 4. Console Commands

Open DevTools (F12) → Console tab:

```javascript
// View detailed statistics
oreEvStats()

// Change configuration programmatically
oreEvConfig({ maxBlocks: 10, autoSelect: true })

// Stop the calculator
oreEvStop()
```

## Configuration

### Win Rate vs Profit Trade-off

| Blocks | Win Rate | Expected Wins | Profit Impact |
|--------|----------|---------------|---------------|
| 1      | 4%       | 1 in 25 rounds | Maximum profit |
| 3      | 12%      | 1 in 8 rounds  | High profit |
| 5      | 20%      | 1 in 5 rounds  | Good profit |
| 10     | 40%      | 2 in 5 rounds  | Medium profit |
| 13     | 52%      | 1 in 2 rounds  | Balanced |
| 20     | 80%      | 4 in 5 rounds  | Lower profit |
| 25     | 100%     | Every round    | Minimum profit |

**Rule of Thumb**: More blocks = win more often but earn less per win

## Troubleshooting

### Extension not working?

1. **Refresh the page**: Press F5 on ore.supply
2. **Check console**: Open DevTools (F12) → Console for error messages
3. **Verify installation**: Go to `chrome://extensions/` and ensure it's enabled
4. **Reload extension**: Click reload icon on extension card

### Settings not saving?

1. **Check permissions**: Extension needs "storage" permission
2. **Re-apply settings**: Click "Apply Settings" in popup after changes
3. **Clear storage**: Remove and reinstall extension if corrupted

### Icons not showing?

1. **Create icon files**: See "Create Icons" section above
2. **Or ignore**: Extension works fine without icons

## File Structure

```
extension/
├── manifest.json      # Extension configuration
├── content.js         # Main calculator script (runs on ore.supply)
├── popup.html         # Extension popup UI
├── popup.js           # Popup controls and logic
├── icons/             # Extension icons (create these)
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## Privacy & Permissions

This extension requires:

- **`storage`**: Save your preferences
- **`activeTab`**: Access ore.supply page content
- **`https://ore.supply/*`**: Run calculator on ORE mining site
- **`https://api.dexscreener.com/*`**: Fetch real-time token prices

**No data is collected or sent to external servers** except for price API calls.

## Support

For issues or questions:
1. Check the console for error messages (F12)
2. Review this README
3. Create an issue on GitHub

## Updates

The extension automatically updates when you modify the files. Just:
1. Make your changes
2. Go to `chrome://extensions/`
3. Click the reload icon (🔄) on the extension card

## License

MIT License - Feel free to modify and share!

---

**Pro Tip**: Start with the "Aggressive" preset (13 blocks, 52% win rate) for balanced results, then adjust based on your preferences!
