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
  
    // Assemble
    toggleRow.appendChild(offButton);
    toggleRow.appendChild(onButton);
    container.appendChild(toggleRow);
  
    // Insert after deploy button's parent
    deployButton.parentElement.parentElement.appendChild(container);
  
    updateToggleButton();
    return container;
  }
  
  function updateToggleButton() {
    const offButton = document.getElementById('ore-ev-toggle-off');
    const onButton = document.getElementById('ore-ev-toggle-on');
    
    if (!offButton || !onButton) return;
  
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
  
  function showEV(btn, evValue, isHighest) {
    if (getComputedStyle(btn).position === 'static') {
      btn.style.position = 'relative';
    }
  
    if (isHighest) {
      btn.classList.add('ore-ev-highlighted');
      btn.style.boxShadow = '0 0 0 3px rgba(0,255,0,0.95) inset, 0 0 10px rgba(0,255,0,0.5)';
      btn.style.borderColor = 'rgba(0,255,0,0.95)';
    }
  
    let overlay = document.createElement('div');
    overlay.className = 'ore-ev-overlay';
    
    let textColor, fontWeight;
    if (isHighest && evValue > 0) {
      textColor = '#2dff2d';
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
    overlay.textContent = `${formatSol(evValue)}`;
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
          console.log(`🔄 Round reset detected! Round #${lastRoundNumber} → #${currentRoundNumber}`);
          clearOldHighlights();
          roundResetTime = Date.now();
          isInCooldown = true;
          lastRoundNumber = currentRoundNumber;
          lastSelectedButton = null;
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
  
      for (const b of validBlocks) {
        const isHighest = (best && b === best && b.EV > 0);
        showEV(b.btn, b.EV, isHighest);
        
        if (isHighest) {
          b.btn._evValue = b.EV;
        }
      }

      if (best && best.EV > 0) {
        autoSelectBestButton(best.btn);
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

  console.log('🚀 ORE EV highlighter running with live prices from DexScreener!');
  console.log('📊 Prices update every 15 seconds. Call oreEvStop() to stop.');
  console.log('🎯 Auto-select toggle will appear below the Deploy button!');
})();