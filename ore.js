(() => {
  // ---------- Config ----------
  const ORE_TOKEN_ADDRESS = 'oreoU2P8bN6jkk3jbaiVxYnG1dCXcYxwhwyK9jSybcp';
  const REF_MULT = 0.9;
  const ADMIN_FEE = 0.01;
  const PROTOCOL_CUT = 0.10;
  const P_WIN = 1 / 25;
  const HIT_PROB = 1 / 625;
  const UPDATE_MS = 1000;
  const RESET_DELAY_MS = 5000;
  const PRICE_UPDATE_MS = 15_000;

  // Dynamic prices (will be updated from API)
  let PRICE_ORE_USD = 110;
  let PRICE_SOL_USD = 200;
  let priceOreSol = PRICE_ORE_USD / PRICE_SOL_USD;

  const ADMIN_COST_FACTOR = ADMIN_FEE / (1 - ADMIN_FEE);
  const C = 24 + (ADMIN_COST_FACTOR) / P_WIN;

  // Track round state
  let lastRoundNumber = null;
  let roundResetTime = null;
  let isInCooldown = false;
  let lastHighlightedEV = null;

  // Auto-select state
  let autoSelectEnabled = false;
  let lastSelectedButton = null;

  // ---------- Multi-Block Staking Config ----------
  const MULTI_BLOCK_CONFIG = {
    enabled: true,            // Toggle multi-block staking (ON for 50% win rate)
    maxBlocks: 13,            // Stake on top N blocks (13 blocks = 52% win rate)
    minEVThreshold: 0.01,     // Only stake if EV > 0.01 SOL (improved filtering)
    smartSelection: true,     // Enable intelligent block selection
    budgetLimit: null,        // Set to your SOL budget (null = no limit)
    minEVPercentage: 0.02,    // Minimum 2% return on stake (EV/stake ratio)
    adaptiveMode: true        // Auto-adjust block count based on quality
  };

  // ---------- Historical Data Tracking ----------
  const historicalData = {
    blockWins: new Array(25).fill(0),  // Track wins per block position (0-24)
    totalRounds: 0,
    lastRoundTracked: null,
    enabled: true,  // Set to false to disable tracking
    hotBlockThreshold: 1.5  // Block wins 50% more than expected = "hot"
  };

  // ---------- Performance Tracking ----------
  const performance = {
    roundsPlayed: 0,
    roundsWon: 0,
    totalStaked: 0,
    totalWon: 0,
    actualWinRate: P_WIN,
    lastUpdated: Date.now(),
    recentRounds: [],  // Store last 10 rounds
    lastWinningBlock: null,
    lastRoundWon: false
  };

  // ---------- Auto-Select Toggle Button ----------
  function createToggleButton() {
    // Remove existing button if any
    const existing = document.getElementById('ore-ev-auto-select-container');
    if (existing) existing.remove();
  
    // Find the deploy button and its parent
    const deployButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Deploy')
    );
    
    if (!deployButton || !deployButton.parentElement) {
      console.error('Could not find deploy button to attach toggle');
      return null;
    }
  
    // Create container - cleaner, more minimal
    const container = document.createElement('div');
    container.id = 'ore-ev-auto-select-container';
    container.className = 'flex flex-col border border-gray-800 rounded-lg bg-surface-elevated mt-2 overflow-hidden';
  
    // Create toggle row with subtle styling
    const toggleRow = document.createElement('div');
    toggleRow.className = 'flex flex-row gap-2 px-2 py-2';
  
    // Create OFF button
    const offButton = document.createElement('button');
    offButton.id = 'ore-ev-toggle-off';
    offButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm';
    offButton.textContent = 'Auto Select: OFF';
    
    // Create ON button
    const onButton = document.createElement('button');
    onButton.id = 'ore-ev-toggle-on';
    onButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm';
    onButton.textContent = 'Auto Select: ON';
  
    // Add click handlers
    offButton.addEventListener('click', () => {
      if (autoSelectEnabled) {
        autoSelectEnabled = false;
        updateToggleButton();
        console.log('🎯 Auto-select DISABLED');
      }
    });
  
    onButton.addEventListener('click', () => {
      if (!autoSelectEnabled) {
        autoSelectEnabled = true;
        updateToggleButton();
        console.log('🎯 Auto-select ENABLED');
      }
    });
  
    // Assemble auto-select row
    toggleRow.appendChild(offButton);
    toggleRow.appendChild(onButton);
    container.appendChild(toggleRow);

    // Create multi-block staking row
    const multiBlockRow = document.createElement('div');
    multiBlockRow.className = 'flex flex-row gap-2 px-2 py-2 border-t border-gray-800';

    // Create multi-block OFF button
    const multiOffButton = document.createElement('button');
    multiOffButton.id = 'ore-ev-multi-off';
    multiOffButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm';
    multiOffButton.textContent = `Multi-Block: OFF`;

    // Create multi-block ON button
    const multiOnButton = document.createElement('button');
    multiOnButton.id = 'ore-ev-multi-on';
    multiOnButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm';
    multiOnButton.textContent = `Multi (${MULTI_BLOCK_CONFIG.maxBlocks}): ON`;

    // Add click handlers for multi-block
    multiOffButton.addEventListener('click', () => {
      if (MULTI_BLOCK_CONFIG.enabled) {
        MULTI_BLOCK_CONFIG.enabled = false;
        updateToggleButton();
        console.log('📊 Multi-block staking DISABLED (single block mode)');
      }
    });

    multiOnButton.addEventListener('click', () => {
      if (!MULTI_BLOCK_CONFIG.enabled) {
        MULTI_BLOCK_CONFIG.enabled = true;
        updateToggleButton();
        console.log(`📊 Multi-block staking ENABLED (top ${MULTI_BLOCK_CONFIG.maxBlocks} blocks, ${MULTI_BLOCK_CONFIG.maxBlocks * 4}% win rate)`);
      }
    });

    // Assemble multi-block row
    multiBlockRow.appendChild(multiOffButton);
    multiBlockRow.appendChild(multiOnButton);
    container.appendChild(multiBlockRow);

    // Create stats display row
    const statsRow = document.createElement('div');
    statsRow.id = 'ore-ev-stats-display';
    statsRow.className = 'flex flex-col gap-1 px-2 py-2 border-t border-gray-800 text-xs';
    statsRow.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-gray-400">Last Round:</span>
        <span id="ore-ev-last-result" class="font-semibold">Waiting...</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-gray-400">Session Win Rate:</span>
        <span id="ore-ev-win-rate" class="font-semibold text-gray-300">0/0 (0%)</span>
      </div>
      <div id="ore-ev-recent-history" class="text-center text-gray-500 mt-1">
        No rounds yet
      </div>
    `;
    container.appendChild(statsRow);

    // Insert after deploy button's parent
    deployButton.parentElement.parentElement.appendChild(container);

    updateToggleButton();
    updateStatsDisplay();
    return container;
  }
  
  function updateStatsDisplay() {
    const lastResultEl = document.getElementById('ore-ev-last-result');
    const winRateEl = document.getElementById('ore-ev-win-rate');
    const historyEl = document.getElementById('ore-ev-recent-history');

    if (!lastResultEl || !winRateEl || !historyEl) return;

    // Update last round result
    if (performance.recentRounds.length > 0) {
      const lastRound = performance.recentRounds[0];
      const emoji = lastRound.won ? '✅' : '❌';
      const color = lastRound.won ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
      const text = lastRound.won ? 'WON' : 'LOST';
      lastResultEl.innerHTML = `<span style="color: ${color}">${emoji} ${text} - Block #${lastRound.winningBlock}</span>`;
    }

    // Update win rate
    if (performance.roundsPlayed > 0) {
      const winPercentage = (performance.roundsWon / performance.roundsPlayed * 100).toFixed(1);
      const color = winPercentage >= 50 ? 'rgb(34, 197, 94)' : winPercentage >= 25 ? 'rgb(234, 179, 8)' : 'rgb(239, 68, 68)';
      winRateEl.innerHTML = `<span style="color: ${color}">${performance.roundsWon}/${performance.roundsPlayed} (${winPercentage}%)</span>`;
    }

    // Update history (last 10 rounds)
    if (performance.recentRounds.length > 0) {
      const history = performance.recentRounds.slice(0, 10).map(r => r.won ? '✅' : '❌').join(' ');
      historyEl.textContent = history;
      historyEl.className = 'text-center mt-1 text-sm';
    }
  }

  function updateToggleButton() {
    const offButton = document.getElementById('ore-ev-toggle-off');
    const onButton = document.getElementById('ore-ev-toggle-on');
    const multiOffButton = document.getElementById('ore-ev-multi-off');
    const multiOnButton = document.getElementById('ore-ev-multi-on');

    if (!offButton || !onButton) return;

    // Update auto-select buttons
    if (autoSelectEnabled) {
      // ON state
      offButton.style.cssText = `
        color: rgb(156, 163, 175);
        background-color: transparent;
        cursor: pointer;
      `;
      offButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm text-elements-lowEmphasis hover:text-elements-midEmphasis hover:bg-surface-floating';

      onButton.style.cssText = `
        color: rgb(34, 197, 94);
        background-color: rgba(34, 197, 94, 0.1);
        cursor: default;
        border: 1px solid rgb(34, 197, 94);
      `;
      onButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm';
    } else {
      // OFF state
      offButton.style.cssText = `
        color: rgb(239, 68, 68);
        background-color: rgba(239, 68, 68, 0.1);
        cursor: default;
        border: 1px solid rgb(239, 68, 68);
      `;
      offButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm';

      onButton.style.cssText = `
        color: rgb(156, 163, 175);
        background-color: transparent;
        cursor: pointer;
      `;
      onButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm text-elements-lowEmphasis hover:text-elements-midEmphasis hover:bg-surface-floating';
    }

    // Update multi-block buttons
    if (multiOffButton && multiOnButton) {
      if (MULTI_BLOCK_CONFIG.enabled) {
        // Multi-block ON state
        multiOffButton.style.cssText = `
          color: rgb(156, 163, 175);
          background-color: transparent;
          cursor: pointer;
        `;
        multiOffButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm text-elements-lowEmphasis hover:text-elements-midEmphasis hover:bg-surface-floating';

        multiOnButton.style.cssText = `
          color: rgb(59, 130, 246);
          background-color: rgba(59, 130, 246, 0.1);
          cursor: default;
          border: 1px solid rgb(59, 130, 246);
        `;
        multiOnButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm';
      } else {
        // Multi-block OFF state
        multiOffButton.style.cssText = `
          color: rgb(156, 163, 175);
          background-color: rgba(156, 163, 175, 0.1);
          cursor: default;
          border: 1px solid rgb(107, 114, 128);
        `;
        multiOffButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm';

        multiOnButton.style.cssText = `
          color: rgb(156, 163, 175);
          background-color: transparent;
          cursor: pointer;
        `;
        multiOnButton.className = 'flex-1 py-1 h-min transition-colors rounded-lg font-semibold text-sm text-elements-lowEmphasis hover:text-elements-midEmphasis hover:bg-surface-floating';
      }
    }
  }

  // ---------- Price Fetching ----------
  async function updatePrices() {
    try {
      const oreResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ORE_TOKEN_ADDRESS}`);
      const oreData = await oreResponse.json();
      
      if (oreData && oreData.pairs && oreData.pairs.length > 0) {
        const bestPair = oreData.pairs.reduce((best, pair) => {
          const volume = parseFloat(pair.volume?.h24 || 0);
          const bestVolume = parseFloat(best.volume?.h24 || 0);
          return volume > bestVolume ? pair : best;
        });
        
        const orePrice = parseFloat(bestPair.priceUsd);
        if (orePrice && orePrice > 0) {
          PRICE_ORE_USD = orePrice;
          console.log(`✅ ORE price updated: $${PRICE_ORE_USD.toFixed(2)}`);
        }
      }
      
      const solAddress = 'So11111111111111111111111111111111111111112';
      const solResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${solAddress}`);
      const solData = await solResponse.json();
      
      if (solData && solData.pairs && solData.pairs.length > 0) {
        const bestPair = solData.pairs.reduce((best, pair) => {
          const volume = parseFloat(pair.volume?.h24 || 0);
          const bestVolume = parseFloat(best.volume?.h24 || 0);
          return volume > bestVolume ? pair : best;
        });
        
        const solPrice = parseFloat(bestPair.priceUsd);
        if (solPrice && solPrice > 0) {
          PRICE_SOL_USD = solPrice;
          console.log(`✅ SOL price updated: $${PRICE_SOL_USD.toFixed(2)}`);
        }
      }
      
      priceOreSol = PRICE_ORE_USD / PRICE_SOL_USD;
      console.log(`📊 ORE/SOL ratio: ${priceOreSol.toFixed(6)}`);
      
    } catch (error) {
      if (error.status === 429) {
        console.warn('⚠️ Rate limited, backing off...');
        const newInterval = Math.min(PRICE_UPDATE_MS * 2, 60000);
        clearInterval(window.__orePriceInterval);
        window.__orePriceInterval = setInterval(updatePrices, newInterval);
      }
      console.error('❌ Error fetching prices from DexScreener:', error);
      console.log('ℹ️ Using last known prices: ORE=$' + PRICE_ORE_USD.toFixed(2) + ', SOL=$' + PRICE_SOL_USD.toFixed(2));
    }
  }

  // ---------- Helpers ----------
  function selectGridButtons() {
    const grids = Array.from(document.querySelectorAll('div.grid.grid-cols-5'));
    for (const g of grids) {
      const btns = g.querySelectorAll(':scope > button');
      if (btns.length === 25) return Array.from(btns);
    }
    return [];
  }

  function detectWinningBlock() {
    const btns = selectGridButtons();
    if (btns.length !== 25) return null;

    // Try to detect winning block by looking for visual indicators
    // Common indicators: checkmark, different background, "winner" class, etc.
    for (let i = 0; i < btns.length; i++) {
      const btn = btns[i];

      // Check for various winning indicators
      const hasCheckmark = btn.textContent.includes('✓') || btn.textContent.includes('✔');
      const hasWinnerClass = btn.className.includes('winner') || btn.className.includes('selected');
      const hasGreenBg = btn.className.includes('bg-green') || btn.className.includes('bg-success');

      // Check if button is disabled (common for winning block)
      const isDisabled = btn.disabled;

      // Check for specific text patterns
      const hasWinText = btn.textContent.toLowerCase().includes('win') ||
                         btn.textContent.toLowerCase().includes('won');

      if (hasCheckmark || hasWinnerClass || hasGreenBg || (isDisabled && hasWinText)) {
        const blockNum = parseBlockNumber(btn);
        return blockNum !== null ? blockNum : i;
      }
    }

    return null;
  }

  function parseRoundNumber() {
    const buttons = Array.from(document.querySelectorAll('button'));
    for (const btn of buttons) {
      const text = btn.textContent || '';
      const match = text.match(/Round\s*#([\d,]+)/i);
      if (match) {
        return parseInt(match[1].replace(/,/g, ''), 10);
      }
    }
    return null;
  }

  function parseBlockNumber(btn) {
    const text = btn.textContent || '';
    const match = text.match(/#(\d+)/);
    return match ? parseInt(match[1]) : null;
  }

  function parseBlockSOL(btn) {
    const spans = Array.from(btn.querySelectorAll('span'));
    for (let i = spans.length - 1; i >= 0; i--) {
      const raw = (spans[i].textContent || '').trim().replace(/,/g, '');
      if (/^\d+(\.\d+)?$/.test(raw) && raw.includes('.')) {
        const v = parseFloat(raw);
        if (!isNaN(v)) return v;
      }
    }
    const text = (btn.textContent || '').replace(/\s+/g, ' ').trim().replace(/,/g, '');
    const matches = text.match(/\d+\.\d+/g);
    if (matches && matches.length) {
      const v = parseFloat(matches[matches.length - 1]);
      if (!isNaN(v)) return v;
    }
    return 0;
  }

  function parseMotherlodeORE() {
    const buttons = Array.from(document.querySelectorAll('button'));
    const mBtn = buttons.find(b => ((b.textContent || '').toLowerCase().includes('motherlode')));
    if (!mBtn) return null;

    const txt = (mBtn.textContent || '').replace(/,/g, '');
    const dec = txt.match(/\d+\.\d+/);
    if (dec) return parseFloat(dec[0]);

    const parts = Array.from(txt.matchAll(/(\d+\.\d+)|(\.\d+)|(\d+)/g)).map(m => m[0]);
    for (let i = 0; i < parts.length; i++) {
      if (/^\d+$/.test(parts[i]) && i + 1 < parts.length && /^\.\d+$/.test(parts[i + 1])) {
        return parseFloat(parts[i] + parts[i + 1]);
      }
    }
    for (const p of parts) {
      if (/^\d+$/.test(p)) return parseFloat(p);
    }
    return null;
  }

  function formatSol(x) {
    const abs = Math.abs(x);
    const sign = x >= 0 ? '+' : '-';
    
    if (abs === 0) return '+0.0000';
    
    if (abs < 0.01) {
      const str = abs.toFixed(10);
      const afterDecimal = str.split('.')[1];
      let leadingZeros = 0;
      for (let i = 0; i < afterDecimal.length; i++) {
        if (afterDecimal[i] === '0') {
          leadingZeros++;
        } else {
          break;
        }
      }
      
      if (leadingZeros >= 2) {
        const significantPart = afterDecimal.substring(leadingZeros);
        const truncated = significantPart.substring(0, 4);
        
        const subscripts = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉'];
        const subscriptNum = leadingZeros.toString().split('').map(d => subscripts[parseInt(d)]).join('');
        
        return `${sign}0.0${subscriptNum}${truncated}`;
      }
    }
    
    if (abs < 0.1) {
      return sign + abs.toFixed(5);
    } else if (abs < 1) {
      return sign + abs.toFixed(4);
    } else {
      return sign + abs.toFixed(3);
    }
  }

  function clearOldHighlights() {
    document.querySelectorAll('.ore-ev-overlay').forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  
    const allButtons = selectGridButtons();
    allButtons.forEach(btn => {
      btn.classList.remove('ore-ev-highlighted');
      btn.style.position = '';
      btn.style.boxShadow = '';
      btn.style.borderColor = '';
      btn.style.border = '';
      btn.style.outline = '';
    });
  
    document.querySelectorAll('.ore-ev-highlighted').forEach(el => {
      el.classList.remove('ore-ev-highlighted');
      el.style.position = '';
      el.style.boxShadow = '';
      el.style.borderColor = '';
      el.style.border = '';
      el.style.outline = '';
    });
  
    lastHighlightedEV = null;
  }
  
  function showEV(btn, evValue, rank) {
    // rank: 0 = best, 1 = 2nd best, 2 = 3rd best, etc., null = not in top
    if (getComputedStyle(btn).position === 'static') {
      btn.style.position = 'relative';
    }

    const isHighest = rank === 0;
    const isTopMulti = rank !== null && rank >= 0 && rank < MULTI_BLOCK_CONFIG.maxBlocks;

    if (isHighest) {
      btn.classList.add('ore-ev-highlighted');
      btn.style.boxShadow = '0 0 0 3px rgba(0,255,0,0.95) inset, 0 0 10px rgba(0,255,0,0.5)';
      btn.style.borderColor = 'rgba(0,255,0,0.95)';
    } else if (isTopMulti) {
      // 2nd and 3rd best blocks get blue highlight
      btn.classList.add('ore-ev-highlighted');
      btn.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.8) inset, 0 0 6px rgba(59,130,246,0.3)';
      btn.style.borderColor = 'rgba(59,130,246,0.8)';
    }

    let overlay = document.createElement('div');
    overlay.className = 'ore-ev-overlay';

    let textColor, fontWeight;
    if (isHighest && evValue > 0) {
      textColor = '#2dff2d';
      fontWeight = '700';
    } else if (isTopMulti && evValue > 0) {
      textColor = '#3b82f6';  // Blue for 2nd/3rd best
      fontWeight = '700';
    } else if (evValue < 0) {
      textColor = '#ff6b6b';
      fontWeight = '600';
    } else if (evValue < 0.0001) {
      textColor = '#888888';
      fontWeight = '500';
    } else {
      textColor = '#cccccc';
      fontWeight = '600';
    }

    const bgOpacity = isHighest ? '0.90' : '0.80';

    // Add rank badge for top blocks
    let displayText = formatSol(evValue);
    if (isTopMulti && MULTI_BLOCK_CONFIG.enabled) {
      const badges = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮'];
      const rankBadge = badges[rank] || `#${rank + 1}`;
      displayText = `${rankBadge} ${displayText}`;
    }

    overlay.style.cssText = `
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      padding: 2px 5px;
      background: rgba(0,0,0,${bgOpacity});
      color: ${textColor};
      font-weight: ${fontWeight};
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
      border-radius: 3px;
      font-size: 0.75em;
      white-space: nowrap;
      z-index: 1000;
      line-height: 1.2;
    `;
    overlay.textContent = displayText;
    btn.appendChild(overlay);
  }

  function computeEVStarForBlock(O, T, oreValueInSOL) {
    if (!isFinite(O) || O <= 0) return { y: 0, EV: -Infinity };
    if (!isFinite(T) || T <= 0) return { y: 0, EV: -Infinity };
  
    const V_initial = (1 - PROTOCOL_CUT) * (T - O) + oreValueInSOL;
    if (V_initial <= 0) return { y: 0, EV: -Infinity };
  
    let yStar = Math.sqrt((oreValueInSOL * O) / C);
    let V = V_initial;
    
    for (let i = 0; i < 3; i++) {
      V = (1 - PROTOCOL_CUT) * (T - O - yStar) + oreValueInSOL;
      if (V <= 0) break;
      yStar = Math.max(0, Math.sqrt((V * O) / C) - O);
    }
    
    if (yStar <= 0) return { y: 0, EV: 0 };
  
    const f = yStar / (O + yStar);
    const adminCost = ADMIN_COST_FACTOR * yStar;
    const EV = P_WIN * (-24 * yStar + V * f) - adminCost;
    return { y: yStar, EV };
  }

  function autoSelectBestButton(bestButton) {
    if (!autoSelectEnabled || !bestButton) return;

    // If there's a different button that was previously selected, deselect it first
    if (lastSelectedButton && lastSelectedButton !== bestButton) {
      try {
        lastSelectedButton.click();
        console.log(`🔄 Deselected previous tile`);
      } catch (e) {
        console.error('Error deselecting previous button:', e);
      }
    }

    // Select the new best button (or keep it selected if it's the same)
    if (lastSelectedButton !== bestButton) {
      try {
        bestButton.click();
        lastSelectedButton = bestButton;
        console.log(`🎯 Auto-selected block with EV: ${formatSol(bestButton._evValue || 0)}`);
      } catch (e) {
        console.error('Error auto-selecting button:', e);
      }
    }
  }

  function autoSelectMultipleBlocks(topBlocks) {
    if (!autoSelectEnabled || !topBlocks || topBlocks.length === 0) return;

    const currentlySelected = Array.isArray(lastSelectedButton) ? lastSelectedButton : [lastSelectedButton].filter(Boolean);
    const newSelections = topBlocks.map(b => b.btn);

    // Deselect blocks that are no longer in top N
    currentlySelected.forEach(btn => {
      if (!newSelections.includes(btn)) {
        try {
          btn.click();  // Deselect
          console.log(`🔄 Deselected block (no longer in top ${MULTI_BLOCK_CONFIG.maxBlocks})`);
        } catch (e) {
          console.error('Error deselecting button:', e);
        }
      }
    });

    // Select new top blocks
    const finalSelections = [];
    topBlocks.forEach((block, index) => {
      if (!currentlySelected.includes(block.btn)) {
        try {
          block.btn.click();
          console.log(`🎯 Auto-selected block #${block.blockNum} (rank ${index + 1}, EV: ${formatSol(block.EV)})`);
        } catch (e) {
          console.error('Error selecting button:', e);
        }
      }
      finalSelections.push(block.btn);
      block.btn._evValue = block.EV;
    });

    lastSelectedButton = finalSelections;

    if (topBlocks.length > 0) {
      const totalWinRate = topBlocks.length * P_WIN * 100;
      console.log(`📊 Multi-block: ${topBlocks.length} blocks selected (${totalWinRate.toFixed(1)}% combined win rate)`);
    }
  }

  function tick() {
    try {
      const btns = selectGridButtons();
      if (btns.length !== 25) {
        clearOldHighlights();
        return;
      }
  
      const currentRoundNumber = parseRoundNumber();
  
      if (lastRoundNumber !== null && currentRoundNumber !== null) {
        if (currentRoundNumber !== lastRoundNumber) {
          // Try to detect winning block before round resets
          const winningBlock = detectWinningBlock();

          if (winningBlock !== null) {
            // Check if we had this block selected
            const selectedBlocks = Array.isArray(lastSelectedButton)
              ? lastSelectedButton.map(btn => parseBlockNumber(btn)).filter(n => n !== null)
              : lastSelectedButton ? [parseBlockNumber(lastSelectedButton)].filter(n => n !== null) : [];

            const didWin = selectedBlocks.includes(winningBlock);

            // Update performance tracking
            performance.roundsPlayed++;
            if (didWin) performance.roundsWon++;
            performance.actualWinRate = performance.roundsWon / performance.roundsPlayed;

            // Add to recent rounds (keep last 10)
            performance.recentRounds.unshift({
              roundNumber: lastRoundNumber,
              winningBlock,
              won: didWin,
              selectedBlocks: [...selectedBlocks]
            });
            if (performance.recentRounds.length > 10) {
              performance.recentRounds.pop();
            }

            // Update historical data
            if (historicalData.enabled && winningBlock < 25) {
              historicalData.blockWins[winningBlock]++;
            }

            // Log result
            const emoji = didWin ? '✅ 🎉' : '❌';
            const result = didWin ? 'WON' : 'LOST';
            console.log(`${emoji} Round #${lastRoundNumber} ${result}! Winning block: #${winningBlock}`);
            console.log(`   Selected: [${selectedBlocks.join(', ')}] | Win Rate: ${(performance.actualWinRate * 100).toFixed(1)}% (${performance.roundsWon}/${performance.roundsPlayed})`);

            // Update UI
            updateStatsDisplay();
          }

          console.log(`🔄 Round reset detected! Round #${lastRoundNumber} → #${currentRoundNumber}`);
          clearOldHighlights();
          roundResetTime = Date.now();
          isInCooldown = true;
          lastRoundNumber = currentRoundNumber;
          lastSelectedButton = MULTI_BLOCK_CONFIG.enabled ? [] : null;  // Reset selections
          return;
        }
      }
  
      if (currentRoundNumber !== null) {
        lastRoundNumber = currentRoundNumber;
      }
  
      if (isInCooldown) {
        const elapsed = Date.now() - roundResetTime;
        if (elapsed < RESET_DELAY_MS) {
          clearOldHighlights();
          return;
        } else {
          isInCooldown = false;
          console.log(`✅ Cooldown complete for Round #${currentRoundNumber}. EV calculations resumed.`);
        }
      }
  
      const blocks = btns.map(btn => ({
        btn,
        blockNum: parseBlockNumber(btn),
        O: parseBlockSOL(btn)
      }));
  
      const T = blocks.reduce((acc, b) => acc + (isFinite(b.O) && b.O > 0 ? b.O : 0), 0);
  
      if (T < 0.1) {
        clearOldHighlights();
        return;
      }
  
      const M = parseMotherlodeORE();
      const expectedMotherlodeOREThisRound = (M != null && isFinite(M)) ? (M * HIT_PROB) : (0.2 * HIT_PROB);
      const oreValueInSOL = priceOreSol * REF_MULT * (1 + expectedMotherlodeOREThisRound);
  
      clearOldHighlights();
  
      let best = null;
      const validBlocks = [];
      
      for (const b of blocks) {
        if (!isFinite(b.O) || b.O <= 0) continue;
  
        const { y, EV } = computeEVStarForBlock(b.O, T, oreValueInSOL);
        b.y = y;
        b.EV = EV;
        
        if (isFinite(EV)) {
          validBlocks.push(b);
          if (!best || EV > best.EV) {
            best = b;
          }
        }
      }
  
      // Sort blocks by EV for ranking
      const sortedBlocks = validBlocks
        .filter(b => isFinite(b.EV))
        .sort((a, b) => b.EV - a.EV);

      // Create a rank map
      const rankMap = new Map();
      sortedBlocks.forEach((block, index) => {
        rankMap.set(block.btn, index);
      });

      // Display EV with rank indicators
      for (const b of validBlocks) {
        const rank = rankMap.get(b.btn);
        showEV(b.btn, b.EV, rank);

        if (rank === 0) {
          b.btn._evValue = b.EV;
        }
      }

      // Multi-block or single-block selection
      if (MULTI_BLOCK_CONFIG.enabled) {
        // Smart block selection with improved filtering
        let candidateBlocks = sortedBlocks.filter(b => {
          // Filter 1: Minimum EV threshold
          if (b.EV <= MULTI_BLOCK_CONFIG.minEVThreshold) return false;

          // Filter 2: Minimum EV percentage (ROI)
          if (MULTI_BLOCK_CONFIG.smartSelection && b.O > 0) {
            const evPercentage = b.EV / b.O;
            if (evPercentage < MULTI_BLOCK_CONFIG.minEVPercentage) return false;
          }

          return true;
        });

        // Budget-aware selection
        if (MULTI_BLOCK_CONFIG.budgetLimit !== null && MULTI_BLOCK_CONFIG.budgetLimit > 0) {
          let totalCost = 0;
          const affordableBlocks = [];

          for (const block of candidateBlocks) {
            const stakeCost = block.y || block.O || 0;
            if (totalCost + stakeCost <= MULTI_BLOCK_CONFIG.budgetLimit) {
              affordableBlocks.push(block);
              totalCost += stakeCost;
            }
          }

          candidateBlocks = affordableBlocks;
          console.log(`💰 Budget-aware: Selected ${candidateBlocks.length} blocks within ${MULTI_BLOCK_CONFIG.budgetLimit} SOL budget (total: ${totalCost.toFixed(2)} SOL)`);
        }

        // Adaptive mode: adjust block count based on quality
        let targetBlocks = MULTI_BLOCK_CONFIG.maxBlocks;
        if (MULTI_BLOCK_CONFIG.adaptiveMode && candidateBlocks.length > 0) {
          // If we have fewer quality blocks than maxBlocks, use what we have
          if (candidateBlocks.length < MULTI_BLOCK_CONFIG.maxBlocks) {
            targetBlocks = candidateBlocks.length;
            console.log(`🎯 Adaptive: Only ${targetBlocks} blocks meet quality criteria (reduced from ${MULTI_BLOCK_CONFIG.maxBlocks})`);
          }

          // Additional quality check: if average EV drops significantly, reduce count
          const avgEV = candidateBlocks.slice(0, targetBlocks).reduce((sum, b) => sum + b.EV, 0) / targetBlocks;
          if (avgEV < MULTI_BLOCK_CONFIG.minEVThreshold * 2 && targetBlocks > 5) {
            targetBlocks = Math.max(5, Math.floor(targetBlocks * 0.6));
            console.log(`⚠️ Adaptive: Low average EV (${formatSol(avgEV)}), reducing to ${targetBlocks} blocks`);
          }
        }

        const topBlocks = candidateBlocks.slice(0, targetBlocks);

        if (topBlocks.length > 0) {
          autoSelectMultipleBlocks(topBlocks);
        } else {
          console.log(`⚠️ No blocks meet selection criteria this round`);
        }
      } else {
        // Single block mode (original behavior)
        if (best && best.EV > 0) {
          autoSelectBestButton(best.btn);
        }
      }

      // Update historical data tracking every 10 rounds
      if (historicalData.enabled && currentRoundNumber !== null) {
        if (historicalData.lastRoundTracked !== currentRoundNumber) {
          historicalData.totalRounds++;
          historicalData.lastRoundTracked = currentRoundNumber;

          // Every 50 rounds, show hot block statistics
          if (historicalData.totalRounds % 50 === 0) {
            console.log(`📊 Historical Data (${historicalData.totalRounds} rounds tracked):`);
            const hotBlocks = historicalData.blockWins
              .map((wins, idx) => ({
                block: idx,
                wins,
                rate: wins / historicalData.totalRounds,
                expectedRate: P_WIN
              }))
              .filter(b => b.rate > P_WIN * historicalData.hotBlockThreshold)
              .sort((a, b) => b.rate - a.rate);

            if (hotBlocks.length > 0) {
              console.log(`  🔥 Hot blocks (win > ${(P_WIN * historicalData.hotBlockThreshold * 100).toFixed(1)}%):`);
              hotBlocks.slice(0, 5).forEach(b => {
                console.log(`     Block #${b.block}: ${(b.rate * 100).toFixed(1)}% (${b.wins} wins)`);
              });
            } else {
              console.log(`  ℹ️ No significant patterns detected yet (need more data)`);
            }
          }
        }
      }

    } catch (e) {
      console.error('EV highlighter error:', e);
    }
  }

  // Wait for page to load before creating toggle
  function initToggle() {
    const toggle = createToggleButton();
    if (!toggle) {
      // Retry after a short delay if deploy button not found
      setTimeout(initToggle, 1000);
    }
  }

  // Start price updates immediately and then every 15 seconds
  updatePrices();
  if (window.__orePriceInterval) clearInterval(window.__orePriceInterval);
  window.__orePriceInterval = setInterval(updatePrices, PRICE_UPDATE_MS);

  // Start EV calculations
  if (window.__oreEvInterval) clearInterval(window.__oreEvInterval);
  window.__oreEvInterval = setInterval(tick, UPDATE_MS);

  // Initialize toggle button
  setTimeout(initToggle, 500);

  clearOldHighlights();
  tick();

  // Expose stop function
  window.oreEvStop = () => {
    clearInterval(window.__oreEvInterval);
    clearInterval(window.__orePriceInterval);
    window.__oreEvInterval = null;
    window.__orePriceInterval = null;
    clearOldHighlights();

    const toggleContainer = document.getElementById('ore-ev-auto-select-container');
    if (toggleContainer) toggleContainer.remove();

    console.log('ORE EV highlighter stopped.');
  };

  // Expose stats function
  window.oreEvStats = () => {
    console.log('═══════════════════════════════════════════════');
    console.log('📊 ORE EV Calculator - Statistics Report');
    console.log('═══════════════════════════════════════════════');
    console.log(`\n💰 Current Prices:`);
    console.log(`   ORE: $${PRICE_ORE_USD.toFixed(2)}`);
    console.log(`   SOL: $${PRICE_SOL_USD.toFixed(2)}`);
    console.log(`   Ratio: ${priceOreSol.toFixed(6)} ORE/SOL`);

    console.log(`\n⚙️  Configuration:`);
    console.log(`   Auto-select: ${autoSelectEnabled ? 'ON ✅' : 'OFF ❌'}`);
    console.log(`   Multi-block: ${MULTI_BLOCK_CONFIG.enabled ? 'ON ✅' : 'OFF ❌'}`);
    if (MULTI_BLOCK_CONFIG.enabled) {
      console.log(`   Blocks selected: ${MULTI_BLOCK_CONFIG.maxBlocks}`);
      console.log(`   Combined win rate: ${(MULTI_BLOCK_CONFIG.maxBlocks * P_WIN * 100).toFixed(1)}%`);
    } else {
      console.log(`   Win rate: ${(P_WIN * 100).toFixed(1)}% (single block)`);
    }

    console.log(`\n📈 Performance:`);
    console.log(`   Rounds tracked: ${historicalData.totalRounds}`);
    console.log(`   Rounds played: ${performance.roundsPlayed}`);
    console.log(`   Rounds won: ${performance.roundsWon}`);
    if (performance.roundsPlayed > 0) {
      console.log(`   Actual win rate: ${(performance.actualWinRate * 100).toFixed(2)}%`);
      const expectedRate = MULTI_BLOCK_CONFIG.enabled ? MULTI_BLOCK_CONFIG.maxBlocks * P_WIN : P_WIN;
      console.log(`   Expected win rate: ${(expectedRate * 100).toFixed(2)}%`);
    }

    if (performance.recentRounds.length > 0) {
      console.log(`\n🎯 Recent Rounds (Last ${Math.min(10, performance.recentRounds.length)}):`);
      performance.recentRounds.forEach((round, i) => {
        const emoji = round.won ? '✅' : '❌';
        const status = round.won ? 'WON ' : 'LOST';
        console.log(`   ${emoji} Round #${round.roundNumber}: ${status} - Winner: Block #${round.winningBlock} | Selected: [${round.selectedBlocks.join(', ')}]`);
      });
    }

    if (historicalData.totalRounds >= 25) {
      console.log(`\n🔥 Hot Blocks (Top 5):`);
      const topBlocks = historicalData.blockWins
        .map((wins, idx) => ({ block: idx, wins, rate: wins / historicalData.totalRounds }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 5);

      topBlocks.forEach((b, i) => {
        const isHot = b.rate > P_WIN * historicalData.hotBlockThreshold;
        const marker = isHot ? '🔥' : '  ';
        console.log(`   ${marker} #${i + 1}. Block #${b.block}: ${b.wins} wins (${(b.rate * 100).toFixed(1)}%)`);
      });
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('💡 Tip: Adjust MULTI_BLOCK_CONFIG.maxBlocks to trade win rate for profit');
    console.log('═══════════════════════════════════════════════\n');
  };

  // Expose config helper
  window.oreEvConfig = (options) => {
    if (options.multiBlock !== undefined) {
      MULTI_BLOCK_CONFIG.enabled = options.multiBlock;
      console.log(`Multi-block staking ${options.multiBlock ? 'ENABLED' : 'DISABLED'}`);
      updateToggleButton();
    }
    if (options.maxBlocks !== undefined) {
      MULTI_BLOCK_CONFIG.maxBlocks = Math.max(1, Math.min(25, options.maxBlocks));
      console.log(`Max blocks set to: ${MULTI_BLOCK_CONFIG.maxBlocks} (${MULTI_BLOCK_CONFIG.maxBlocks * 4}% win rate)`);
      updateToggleButton();
    }
    if (options.autoSelect !== undefined) {
      autoSelectEnabled = options.autoSelect;
      console.log(`Auto-select ${options.autoSelect ? 'ENABLED' : 'DISABLED'}`);
      updateToggleButton();
    }
    if (options.minEV !== undefined) {
      MULTI_BLOCK_CONFIG.minEVThreshold = options.minEV;
      console.log(`Min EV threshold set to: ${options.minEV}`);
    }

    console.log('\nCurrent config:');
    console.log(JSON.stringify({
      autoSelect: autoSelectEnabled,
      multiBlock: MULTI_BLOCK_CONFIG.enabled,
      maxBlocks: MULTI_BLOCK_CONFIG.maxBlocks,
      minEV: MULTI_BLOCK_CONFIG.minEVThreshold
    }, null, 2));
  };

  console.log('═══════════════════════════════════════════════');
  console.log('🚀 ORE EV Calculator - Enhanced Edition');
  console.log('═══════════════════════════════════════════════');
  console.log('✅ Live prices from DexScreener (15s updates)');
  console.log('✅ Multi-block staking: 13 blocks = 52% WIN RATE');
  console.log('✅ Real-time win tracking with emojis');
  console.log('✅ Historical data & performance analytics');
  console.log('✅ Auto-select toggle');
  console.log('\n📊 UI Features:');
  console.log('   • Last round result with ✅/❌ emoji');
  console.log('   • Session win rate percentage');
  console.log('   • Recent 10 rounds history');
  console.log('\n📋 Available commands:');
  console.log('   oreEvStats()  - View detailed statistics');
  console.log('   oreEvConfig() - Configure settings');
  console.log('   oreEvStop()   - Stop calculator');
  console.log('\n💡 Examples:');
  console.log('   oreEvConfig({ maxBlocks: 5 })  // 20% win rate');
  console.log('   oreEvConfig({ maxBlocks: 13 }) // 52% win rate');
  console.log('═══════════════════════════════════════════════\n');
})();