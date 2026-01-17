 
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

// ========== API Configuration ==========
const API_URL = 'https://open.er-api.com/v6/latest/';

 
let exchangeRates = {};
let lastBaseCurrency = '';

 
convertBtn.addEventListener('click', convertCurrency);
swapBtn.addEventListener('click', swapCurrencies);

// Convert on Enter key press
amountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        convertCurrency();
    }
});

// Auto-convert when currency changes
fromCurrency.addEventListener('change', convertCurrency);
toCurrency.addEventListener('change', convertCurrency);
 
 
async function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    // Validation
    if (!amount || amount <= 0) {
        showError('Please enter a valid amount');
        return;
    }

    if (from === to) {
        showResult(amount, amount, 1, from, to);
        return;
    }

    try {
        // Show loading state
        showLoading();
        hideError();
        hideResult();

        // Fetch exchange rates
        const rates = await fetchExchangeRates(from);
        
        // Calculate conversion
        const rate = rates[to];
        const convertedAmount = amount * rate;

        // Display result
        showResult(amount, convertedAmount, rate, from, to);
        hideLoading();

    } catch (error) {
        hideLoading();
        showError('Failed to fetch exchange rates. Please try again.');
        console.error('Conversion error:', error);
    }
}
 
async function fetchExchangeRates(baseCurrency) {
    // Use cached rates if available for same base currency
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

    // Cache the rates
    exchangeRates = data.rates;
    lastBaseCurrency = baseCurrency;
    
    return exchangeRates;
}

// ========== Swap Currencies ==========
function swapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    
    // Auto-convert after swap
    if (amountInput.value) {
        convertCurrency();
    }
}

 
function showResult(originalAmount, convertedAmount, rate, from, to) {
    resultAmount.textContent = `${convertedAmount.toFixed(2)} ${to}`;
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
 
function formatNumber(number) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
}

 
 
window.addEventListener('load', () => {
    if (amountInput.value) {
        convertCurrency();
    }
});
