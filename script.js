const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const resultDiv = document.getElementById('result');
const resultAmount = document.getElementById('resultAmount');
const exchangeRate = document.getElementById('exchangeRate');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const historyToggle = document.getElementById('historyToggle');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const themeToggle = document.getElementById('themeToggle');

const API_URL = 'https://open.er-api.com/v6/latest/';
const HISTORY_KEY = 'currencyConverterHistory';
const THEME_KEY = 'currencyConverterTheme';
const MAX_HISTORY = 5;

let exchangeRates = {};
let lastBaseCurrency = '';
let conversionHistory = [];

convertBtn.addEventListener('click', convertCurrency);
swapBtn.addEventListener('click', swapCurrencies);
historyToggle.addEventListener('click', toggleHistory);
clearHistoryBtn.addEventListener('click', clearHistory);
themeToggle.addEventListener('click', toggleTheme);

amountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        convertCurrency();
    }
});

fromCurrency.addEventListener('change', convertCurrency);
toCurrency.addEventListener('change', convertCurrency);

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

function loadHistoryFromStorage() {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) {
        conversionHistory = JSON.parse(stored);
    }
}

function saveHistoryToStorage() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(conversionHistory));
}

function addToHistory(amount, from, to, result, rate) {
    const historyItem = {
        amount,
        from,
        to,
        result: parseFloat(result.toFixed(2)),
        rate: parseFloat(rate.toFixed(4)),
        timestamp: new Date().toLocaleTimeString()
    };

    conversionHistory.unshift(historyItem);
    if (conversionHistory.length > MAX_HISTORY) {
        conversionHistory.pop();
    }

    saveHistoryToStorage();
    renderHistory();
}

function renderHistory() {
    if (conversionHistory.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No conversions yet</p>';
        return;
    }

    historyList.innerHTML = conversionHistory.map((item, index) => `
        <div class="history-item" data-index="${index}">
            <div class="history-item-content">
                <span class="history-conversion">${item.amount} ${item.from} → ${item.result} ${item.to}</span>
                <span class="history-rate">1 ${item.from} = ${item.rate} ${item.to}</span>
                <span class="history-time">${item.timestamp}</span>
            </div>
            <button class="history-item-btn" title="Use this conversion">↻</button>
        </div>
    `).join('');

    document.querySelectorAll('.history-item-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => useHistoryItem(index));
    });
}

function useHistoryItem(index) {
    const item = conversionHistory[index];
    amountInput.value = item.amount;
    fromCurrency.value = item.from;
    toCurrency.value = item.to;
    convertCurrency();
}

function toggleHistory() {
    const isHidden = historyPanel.classList.toggle('hidden');
    historyToggle.textContent = isHidden ? '📋 View Recent History' : '✕ Close History';
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all conversion history?')) {
        conversionHistory = [];
        saveHistoryToStorage();
        renderHistory();
    }
}

async function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (!amount || amount <= 0) {
        showError('Please enter a valid amount');
        return;
    }

    if (from === to) {
        showResult(amount, amount, 1, from, to);
        return;
    }

    try {
        showLoading();
        hideError();
        hideResult();

        const rates = await fetchExchangeRates(from);
        
        const rate = rates[to];
        const convertedAmount = amount * rate;

        showResult(amount, convertedAmount, rate, from, to);
        addToHistory(amount, from, to, convertedAmount, rate);
        hideLoading();

    } catch (error) {
        hideLoading();
        showError('Failed to fetch exchange rates. Please try again.');
        console.error('Conversion error:', error);
    }
}

async function fetchExchangeRates(baseCurrency) {
    if (baseCurrency === lastBaseCurrency && Object.keys(exchangeRates).length > 0) {
        return exchangeRates;
    }

    const response = await fetch(`${API_URL}${baseCurrency}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.result === 'error') {
        throw new Error(data['error-type'] || 'API Error');
    }

    exchangeRates = data.rates;
    lastBaseCurrency = baseCurrency;
    
    return exchangeRates;
}

function swapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    
    if (amountInput.value) {
        convertCurrency();
    }
}

function showResult(originalAmount, convertedAmount, rate, from, to) {
    resultAmount.textContent = `${convertedAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${to}`;
    exchangeRate.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    resultDiv.classList.remove('hidden');
}

function hideResult() {
    resultDiv.classList.add('hidden');
}

function showLoading() {
    loadingDiv.classList.remove('hidden');
}

function hideLoading() {
    loadingDiv.classList.add('hidden');
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

window.addEventListener('load', () => {
    loadTheme();
    loadHistoryFromStorage();
    renderHistory();
    if (amountInput.value) {
        convertCurrency();
    }
});
