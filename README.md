# ORE EV Calculator

A browser console script that calculates and displays Expected Value (EV) for ORE mining blocks in real-time.

## What It Does

- **Fetches live prices** for ORE and SOL tokens from DexScreener API (updates every 15 seconds)
- **Calculates optimal EV** for each block based on current pool state
- **Highlights the best block** with a green glow and displays EV overlays
- **Auto-resets** when a new round starts (5-second cooldown)

## How to Use

```
1. **Go to https://ore.supply/**
2. **Open Developer Console**:
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+J` (Windows/Linux) / `Cmd+Option+J` (Mac)
   - Firefox: Press `F12` or `Ctrl+Shift+K` (Windows/Linux) / `Cmd+Option+K` (Mac)
3. **Copy the entire contents** of `ore.js`
4. **Paste into the console** and press Enter
5. **Watch the magic happen** - EV values will appear on each block, with the best option highlighted in green

## Understanding the Display

- **Green highlight** = Best EV block (positive expected value)
- **Green text** = Highest EV value
- **Red text** = Negative EV (not recommended)
- **Gray text** = Near-zero or very small EV
- **Format**: Values shown as `+X.XXXX` or `-X.XXXX` SOL

For very small values, subscript notation is used (e.g., `+0.0₃1234` means 0.0001234).

## Stopping the Script

To stop the calculator, run this in the console:
```javascript
oreEvStop()
```

## Configuration

Key parameters (defined at top of `ore.js`):
- `REF_MULT`: 0.9 (referral multiplier)
- `ADMIN_FEE`: 0.01 (1% admin fee)
- `PROTOCOL_CUT`: 0.10 (10% protocol cut)
- `P_WIN`: 1/25 (win probability)
- `PRICE_UPDATE_MS`: 15000 (price update interval)

## Notes

- Prices fallback to ORE=$110, SOL=$200 if API fails
- Script automatically handles round resets
- EV calculations update every second
- Rate limiting protection included for API calls