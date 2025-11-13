// Popup script for ORE EV Calculator Extension

// Load saved settings
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings from storage
  const settings = await chrome.storage.sync.get({
    maxBlocks: 13,
    autoSelect: false,
    multiBlock: true,
    budgetLimit: null,
    smartSelection: true,
    adaptiveMode: true
  });

  // Update UI with saved settings
  document.getElementById('max-blocks').value = settings.maxBlocks;
  document.getElementById('auto-select').checked = settings.autoSelect;
  document.getElementById('multi-block').checked = settings.multiBlock;
  document.getElementById('budget-limit').value = settings.budgetLimit || 0;
  document.getElementById('smart-selection').checked = settings.smartSelection !== false;
  document.getElementById('adaptive-mode').checked = settings.adaptiveMode !== false;

  updateDisplayValues(settings.maxBlocks);
  updateBudgetDisplay(settings.budgetLimit || 0);

  // Add event listeners
  document.getElementById('max-blocks').addEventListener('input', (e) => {
    updateDisplayValues(parseInt(e.target.value));
  });

  document.getElementById('budget-limit').addEventListener('input', (e) => {
    updateBudgetDisplay(parseFloat(e.target.value));
  });

  document.getElementById('apply-settings').addEventListener('click', applySettings);
});

function updateDisplayValues(blocks) {
  const winRate = (blocks / 25 * 100).toFixed(1);
  document.getElementById('blocks-value').textContent = blocks;
  document.getElementById('win-rate-display').textContent = `${winRate}%`;
  document.getElementById('current-win-rate').textContent = `${winRate}%`;

  // Update expected wins text
  const roundsToWin = Math.round(25 / blocks);
  const expectedWinsText = roundsToWin === 1
    ? 'Almost every round'
    : `~1 in ${roundsToWin} rounds`;

  document.querySelector('.stats-row:nth-child(2) .stats-value').textContent = expectedWinsText;
}

function updateBudgetDisplay(budget) {
  const budgetValue = parseFloat(budget);
  if (budgetValue === 0 || budgetValue === null) {
    document.getElementById('budget-value').textContent = 'Unlimited';
    document.getElementById('budget-display').textContent = '∞';
  } else {
    document.getElementById('budget-value').textContent = `${budgetValue.toFixed(1)} SOL`;
    document.getElementById('budget-display').textContent = `${budgetValue.toFixed(1)} SOL`;
  }
}

function setPreset(blocks) {
  document.getElementById('max-blocks').value = blocks;
  updateDisplayValues(blocks);
}

async function applySettings() {
  const budgetValue = parseFloat(document.getElementById('budget-limit').value);

  const settings = {
    maxBlocks: parseInt(document.getElementById('max-blocks').value),
    autoSelect: document.getElementById('auto-select').checked,
    multiBlock: document.getElementById('multi-block').checked,
    budgetLimit: budgetValue > 0 ? budgetValue : null,
    smartSelection: document.getElementById('smart-selection').checked,
    adaptiveMode: document.getElementById('adaptive-mode').checked
  };

  // Save to storage
  await chrome.storage.sync.set(settings);

  // Send message to content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab && tab.url && tab.url.includes('ore.supply')) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'UPDATE_SETTINGS',
        settings: settings
      });

      // Visual feedback
      const button = document.getElementById('apply-settings');
      const originalText = button.textContent;
      button.textContent = '✅ Applied!';
      button.style.background = 'rgba(34, 197, 94, 0.3)';

      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 1500);
    } catch (error) {
      console.error('Error applying settings:', error);
      alert('Please refresh the ore.supply page and try again.');
    }
  } else {
    alert('Please open ore.supply to apply settings.');
  }
}

// Expose setPreset globally for button onclick
window.setPreset = setPreset;
