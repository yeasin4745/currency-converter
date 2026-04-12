const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const resultDiv = document.getElementById('result');
const resultAmount = document.getElementById('resultAmount');
const exchangeRate = document.getElementById('exchangeRate');
const amountInWords = document.getElementById('amountInWords');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const historyToggle = document.getElementById('historyToggle');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const themeToggle = document.getElementById('themeToggle');
const favoriteBtn = document.getElementById('favoriteBtn');
const favoritesList = document.getElementById('favoritesList');
const fromSearch = document.getElementById('fromSearch');
const toSearch = document.getElementById('toSearch');
const chartSection = document.getElementById('chartSection');
const copyBtn = document.getElementById('copyBtn');
const rateTrend = document.getElementById('rateTrend');
const reverseBtn = document.getElementById('reverseBtn');
const comparisonSection = document.getElementById('comparisonSection');
const comparisonTable = document.getElementById('comparisonTable');
const resetBtn = document.getElementById('resetBtn');
const lastUpdatedDiv = document.getElementById('lastUpdated');
const notificationContainer = document.getElementById('notificationContainer');
const offlineIndicator = document.getElementById('offlineIndicator');
const mostUsedSection = document.getElementById('mostUsedSection');
const mostUsedList = document.getElementById('mostUsedList');

const API_URL = 'https://open.er-api.com/v6/latest/';
const HISTORY_KEY = 'currencyConverterHistory';
const THEME_KEY = 'currencyConverterTheme';
const FAVORITES_KEY = 'currencyConverterFavorites';
const RATES_CACHE_KEY = 'currencyConverterRatesCache';
const USAGE_STATS_KEY = 'currencyConverterUsageStats';
const MAX_HISTORY = 5;
const COMPARISON_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'BDT', 'INR', 'CHF', 'SGD', 'NZD'];

let exchangeRates = {};
let lastBaseCurrency = '';
let conversionHistory = [];
let favoritePairs = [];
let marketChart = null;
let usageStats = {};

const CURRENCY_NAMES = {
    "USD": "US Dollar", "EUR": "Euro", "GBP": "British Pound", "BDT": "Bangladeshi Taka",
    "INR": "Indian Rupee", "JPY": "Japanese Yen", "CNY": "Chinese Yuan", "AUD": "Australian Dollar",
    "CAD": "Canadian Dollar", "CHF": "Swiss Franc", "AED": "UAE Dirham", "SAR": "Saudi Riyal",
    "PKR": "Pakistani Rupee", "TRY": "Turkish Lira", "BRL": "Brazilian Real", "RUB": "Russian Ruble",
    "KRW": "South Korean Won", "SGD": "Singapore Dollar", "NZD": "New Zealand Dollar", "MYR": "Malaysian Ringgit"
};

convertBtn.addEventListener('click', convertCurrency);
swapBtn.addEventListener('click', swapCurrencies);
resetBtn.addEventListener('click', resetFields);
historyToggle.addEventListener('click', toggleHistory);
clearHistoryBtn.addEventListener('click', clearHistory);
themeToggle.addEventListener('click', toggleTheme);
favoriteBtn.addEventListener('click', toggleFavorite);
copyBtn.addEventListener('click', copyToClipboard);
reverseBtn.addEventListener('click', reverseConversion);
fromSearch.addEventListener('input', (e) => filterCurrencies(e.target.value, fromCurrency));
toSearch.addEventListener('input', (e) => filterCurrencies(e.target.value, toCurrency));

amountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') convertCurrency();
});

fromCurrency.addEventListener('change', () => {
    updateFavoriteBtnState();
    convertCurrency();
});
toCurrency.addEventListener('change', () => {
    updateFavoriteBtnState();
    convertCurrency();
});

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

function updateOnlineStatus() {
    if (navigator.onLine) {
        offlineIndicator.classList.add('hidden');
        showNotification('You are back online', 'success');
    } else {
        offlineIndicator.classList.remove('hidden');
        showNotification('You are offline. Using cached data.', 'info');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    let icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-circle' : 'info-circle');
    notification.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    notificationContainer.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    if (marketChart) updateChartTheme();
    showNotification(`${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode enabled`, 'success');
}

function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.innerHTML = savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

function loadFavorites() {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) favoritePairs = JSON.parse(stored);
    renderFavorites();
}

function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoritePairs));
}

function toggleFavorite() {
    const from = fromCurrency.value;
    const to = toCurrency.value;
    const pair = `${from}-${to}`;
    const index = favoritePairs.indexOf(pair);
    if (index === -1) {
        favoritePairs.push(pair);
        showNotification(`Saved ${from}/${to} to favorites`, 'success');
    } else {
        favoritePairs.splice(index, 1);
        showNotification(`Removed ${from}/${to} from favorites`, 'info');
    }
    saveFavorites();
    renderFavorites();
    updateFavoriteBtnState();
}

function renderFavorites() {
    if (favoritePairs.length === 0) {
        favoritesList.classList.add('hidden');
        return;
    }
    favoritesList.classList.remove('hidden');
    favoritesList.innerHTML = favoritePairs.map(pair => {
        const [from, to] = pair.split('-');
        return `<div class="favorite-chip" onclick="useFavorite('${pair}')"><span>${from} ⇄ ${to}</span><i class="fas fa-times remove-fav" onclick="event.stopPropagation(); removeFavorite('${pair}')"></i></div>`;
    }).join('');
}

window.useFavorite = function(pair) {
    const [from, to] = pair.split('-');
    fromCurrency.value = from;
    toCurrency.value = to;
    updateFavoriteBtnState();
    convertCurrency();
};

window.removeFavorite = function(pair) {
    favoritePairs = favoritePairs.filter(p => p !== pair);
    saveFavorites();
    renderFavorites();
    updateFavoriteBtnState();
    showNotification('Favorite removed', 'info');
};

function updateFavoriteBtnState() {
    const from = fromCurrency.value;
    const to = toCurrency.value;
    const pair = `${from}-${to}`;
    const isActive = favoritePairs.includes(pair);
    favoriteBtn.classList.toggle('active', isActive);
    favoriteBtn.innerHTML = isActive ? '<i class="fas fa-star"></i> Favorited' : '<i class="far fa-star"></i> Save to Favorites';
}

function loadHistoryFromStorage() {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) conversionHistory = JSON.parse(stored);
}

function saveHistoryToStorage() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(conversionHistory));
}

function addToHistory(amount, from, to, result, rate) {
    const historyItem = { amount, from, to, result: parseFloat(result.toFixed(2)), rate: parseFloat(rate.toFixed(4)), timestamp: new Date().toLocaleTimeString() };
    conversionHistory.unshift(historyItem);
    if (conversionHistory.length > MAX_HISTORY) conversionHistory.pop();
    saveHistoryToStorage();
    renderHistory();
}

function renderHistory() {
    if (conversionHistory.length === 0) {
        historyList.innerHTML = '<p class="history-empty">No conversions yet</p>';
        return;
    }
    historyList.innerHTML = conversionHistory.map((item, index) => `
        <div class="history-item">
            <div class="history-item-content">
                <span class="history-conversion">${item.amount} ${item.from} → ${item.result} ${item.to}</span>
                <span class="history-rate">1 ${item.from} = ${item.rate} ${item.to}</span>
                <span class="history-time">${item.timestamp}</span>
            </div>
            <button class="history-item-btn" onclick="useHistoryItem(${index})" title="Use this conversion"><i class="fas fa-redo-alt"></i></button>
        </div>
    `).join('');
}

window.useHistoryItem = function(index) {
    const item = conversionHistory[index];
    amountInput.value = item.amount;
    fromCurrency.value = item.from;
    toCurrency.value = item.to;
    convertCurrency();
};

function toggleHistory() {
    const isHidden = historyPanel.classList.toggle('hidden');
    historyToggle.innerHTML = isHidden ? '<i class="fas fa-history"></i> Recent Conversions' : '<i class="fas fa-times"></i> Close History';
}

function clearHistory() {
    if (confirm('Clear all conversion history?')) {
        conversionHistory = [];
        saveHistoryToStorage();
        renderHistory();
        showNotification('History cleared', 'info');
    }
}

let allCurrencies = [];

async function populateCurrencies() {
    try {
        let data;
        if (navigator.onLine) {
            const response = await fetch(`${API_URL}USD`);
            data = await response.json();
            localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({timestamp: new Date().getTime(), rates: data.rates}));
        } else {
            const cached = JSON.parse(localStorage.getItem(RATES_CACHE_KEY));
            if (cached) {
                data = {rates: cached.rates};
                updateOnlineStatus();
            } else {
                throw new Error('No internet and no cached data');
            }
        }
        allCurrencies = Object.keys(data.rates);
        renderOptions(fromCurrency, 'USD');
        renderOptions(toCurrency, 'BDT');
    } catch (error) {
        showError('Failed to load currency list.');
    }
}

function renderOptions(selectElement, selectedValue, filter = '') {
    const currentSelection = selectElement.value || selectedValue;
    const filtered = allCurrencies.filter(curr => {
        const name = (CURRENCY_NAMES[curr] || '').toLowerCase();
        const code = curr.toLowerCase();
        const search = filter.toLowerCase();
        return code.includes(search) || name.includes(search);
    });
    selectElement.innerHTML = filtered.map(curr => `<option value="${curr}" ${curr === currentSelection ? 'selected' : ''}>${curr} - ${CURRENCY_NAMES[curr] || 'Currency'}</option>`).join('');
}

function filterCurrencies(query, selectElement) {
    renderOptions(selectElement, selectElement.value, query);
}

async function convertCurrency() {
    const amount = amountInput.value;
    const from = fromCurrency.value;
    const to = toCurrency.value;
    if (!amount || amount <= 0) return;
    showLoading();
    hideError();
    try {
        let rates;
        if (navigator.onLine) {
            if (lastBaseCurrency !== from) {
                const response = await fetch(`${API_URL}${from}`);
                const data = await response.json();
                exchangeRates = data.rates;
                lastBaseCurrency = from;
                localStorage.setItem(`${RATES_CACHE_KEY}_${from}`, JSON.stringify({timestamp: new Date().getTime(), rates: exchangeRates}));
            } else {
                rates = exchangeRates;
            }
        } else {
            const cached = JSON.parse(localStorage.getItem(`${RATES_CACHE_KEY}_${from}`));
            if (cached) {
                exchangeRates = cached.rates;
                lastBaseCurrency = from;
            } else {
                throw new Error('Currency data not available offline');
            }
        }
        const rate = exchangeRates[to];
        const convertedAmount = amount * rate;
        displayResult(amount, from, to, convertedAmount, rate);
        addToHistory(parseFloat(amount), from, to, convertedAmount, rate);
        updateMarketChart(from, exchangeRates);
        updateComparisonTable(amount, from, exchangeRates);
        updateLastUpdated();
        trackUsage(from);
        trackUsage(to);
    } catch (error) {
        showError(error.message || 'Something went wrong. Please try again.');
    } finally {
        hideLoading();
    }
}

function trackUsage(currency) {
    usageStats[currency] = (usageStats[currency] || 0) + 1;
    localStorage.setItem(USAGE_STATS_KEY, JSON.stringify(usageStats));
    renderMostUsed();
}

function renderMostUsed() {
    const sorted = Object.entries(usageStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length === 0) {
        mostUsedSection.classList.add('hidden');
        return;
    }
    mostUsedSection.classList.remove('hidden');
    mostUsedList.innerHTML = sorted.map(([curr]) => `<div class="most-used-chip" onclick="setCurrency('${curr}')">${curr}</div>`).join('');
}

window.setCurrency = function(curr) {
    if (fromCurrency.value !== curr) {
        toCurrency.value = curr;
    } else {
        fromCurrency.value = curr === 'USD' ? 'EUR' : 'USD';
    }
    convertCurrency();
};

function displayResult(amount, from, to, result, rate) {
    resultAmount.textContent = `${parseFloat(amount).toLocaleString()} ${from} = ${result.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${to}`;
    exchangeRate.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    amountInWords.textContent = numberToWords(result) + ` ${to}`;
    resultDiv.classList.remove('hidden');
}

function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    if (num === 0) return 'Zero';
    function convert(n) {
        let s = '';
        if (n >= 100) { s += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
        if (n >= 20) { s += tens[Math.floor(n / 10)] + ' '; n %= 10; }
        else if (n >= 10) { s += teens[n - 10] + ' '; n = 0; }
        if (n > 0) { s += ones[n] + ' '; }
        return s;
    }
    let integerPart = Math.floor(num);
    let decimalPart = Math.round((num - integerPart) * 100);
    let res = '';
    if (integerPart >= 1000000) { res += convert(Math.floor(integerPart / 1000000)) + 'Million '; integerPart %= 1000000; }
    if (integerPart >= 1000) { res += convert(Math.floor(integerPart / 1000)) + 'Thousand '; integerPart %= 1000; }
    res += convert(integerPart);
    if (decimalPart > 0) { res += 'and ' + convert(decimalPart) + 'Cents'; }
    return res.trim();
}

function showLoading() { loadingDiv.classList.remove('hidden'); }
function hideLoading() { loadingDiv.classList.add('hidden'); }
function showError(msg) { errorDiv.textContent = msg; errorDiv.classList.remove('hidden'); }
function hideError() { errorDiv.classList.add('hidden'); }
function hideResult() { resultDiv.classList.add('hidden'); }

function swapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    const tempSearch = fromSearch.value;
    fromSearch.value = toSearch.value;
    toSearch.value = tempSearch;
    renderOptions(fromCurrency, fromCurrency.value);
    renderOptions(toCurrency, toCurrency.value);
    updateFavoriteBtnState();
    convertCurrency();
}

function copyToClipboard() {
    const text = resultAmount.textContent;
    navigator.clipboard.writeText(text).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        showNotification('Result copied to clipboard', 'success');
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="far fa-copy"></i>';
        }, 2000);
    });
}

function reverseConversion() {
    swapCurrencies();
    showNotification('Conversion reversed', 'success');
}

function updateLastUpdated() {
    const now = new Date();
    lastUpdatedDiv.innerHTML = `<i class="far fa-clock"></i> Rates as of: ${now.toLocaleTimeString()} on ${now.toLocaleDateString()}`;
    lastUpdatedDiv.classList.remove('hidden');
}

function resetFields() {
    amountInput.value = '1';
    fromCurrency.value = 'USD';
    toCurrency.value = 'BDT';
    fromSearch.value = '';
    toSearch.value = '';
    renderOptions(fromCurrency, 'USD');
    renderOptions(toCurrency, 'BDT');
    hideResult();
    hideError();
    lastUpdatedDiv.classList.add('hidden');
    chartSection.classList.add('hidden');
    comparisonSection.classList.add('hidden');
    updateFavoriteBtnState();
    showNotification('All fields reset', 'info');
}

function updateComparisonTable(amount, baseCurrency, rates) {
    const availableCurrencies = COMPARISON_CURRENCIES.filter(c => rates[c] !== undefined && c !== baseCurrency);
    if (availableCurrencies.length === 0) {
        comparisonSection.classList.add('hidden');
        return;
    }
    comparisonTable.innerHTML = availableCurrencies.map(currency => {
        const convertedValue = (amount * rates[currency]).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        return `<div class="comparison-row"><div class="comparison-currency">${currency}</div><div class="comparison-value">${convertedValue}</div></div>`;
    }).join('');
    comparisonSection.classList.remove('hidden');
}

function updateMarketChart(base, rates) {
    const ctx = document.getElementById('marketChart').getContext('2d');
    const data = COMPARISON_CURRENCIES.filter(c => rates[c] !== undefined && c !== base).slice(0, 8);
    const labels = data;
    const values = data.map(c => rates[c]);
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    if (marketChart) marketChart.destroy();
    marketChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{ label: `1 ${base} to Others`, data: values, backgroundColor: 'rgba(79, 70, 229, 0.6)', borderColor: '#4f46e5', borderWidth: 1 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { ticks: { color: textColor }, grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' } },
                x: { ticks: { color: textColor }, grid: { display: false } }
            }
        }
    });
    chartSection.classList.remove('hidden');
}

function updateChartTheme() {
    if (marketChart) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#94a3b8' : '#64748b';
        marketChart.options.scales.y.ticks.color = textColor;
        marketChart.options.scales.x.ticks.color = textColor;
        marketChart.options.scales.y.grid.color = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        marketChart.update();
    }
}

window.addEventListener('load', async () => {
    loadTheme();
    loadFavorites();
    loadHistoryFromStorage();
    const storedStats = localStorage.getItem(USAGE_STATS_KEY);
    if (storedStats) usageStats = JSON.parse(storedStats);
    await populateCurrencies();
    renderHistory();
    renderMostUsed();
    updateFavoriteBtnState();
    if (amountInput.value) convertCurrency();
});

window.quickConvert = function(from, to) {
    amountInput.value = '1';
    fromCurrency.value = from;
    toCurrency.value = to;
    updateFavoriteBtnState();
    convertCurrency();
    showNotification(`Quick converted to ${to}`, 'success');
};
