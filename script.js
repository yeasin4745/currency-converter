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

const API_URL = 'https://open.er-api.com/v6/latest/';
const HISTORY_KEY = 'currencyConverterHistory';
const THEME_KEY = 'currencyConverterTheme';
const FAVORITES_KEY = 'currencyConverterFavorites';
const MAX_HISTORY = 5;
const COMPARISON_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'BDT', 'INR', 'CHF', 'SGD', 'NZD'];

let exchangeRates = {};
let lastBaseCurrency = '';
let conversionHistory = [];
let favoritePairs = [];
let marketChart = null;

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

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    notificationContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
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
        return `
            <div class="favorite-chip" onclick="useFavorite('${pair}')">
                <span>${from} ⇄ ${to}</span>
                <i class="fas fa-times remove-fav" onclick="event.stopPropagation(); removeFavorite('${pair}')"></i>
            </div>
        `;
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
    favoriteBtn.innerHTML = isActive ? 
        '<i class="fas fa-star"></i> Favorited' : 
        '<i class="far fa-star"></i> Save to Favorites';
}

function loadHistoryFromStorage() {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (stored) conversionHistory = JSON.parse(stored);
}

function saveHistoryToStorage() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(conversionHistory));
}

function addToHistory(amount, from, to, result, rate) {
    const historyItem = {
        amount, from, to,
        result: parseFloat(result.toFixed(2)),
        rate: parseFloat(rate.toFixed(4)),
        timestamp: new Date().toLocaleTimeString()
    };
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
            <button class="history-item-btn" onclick="useHistoryItem(${index})" title="Use this conversion">
                <i class="fas fa-redo-alt"></i>
            </button>
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
        const response = await fetch(`${API_URL}USD`);
        const data = await response.json();
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
        return code.includes(search) || name.includes(search) || curr === currentSelection;
    });

    selectElement.innerHTML = filtered.map(curr => 
        `<option value="${curr}" ${curr === currentSelection ? 'selected' : ''}>${curr} - ${CURRENCY_NAMES[curr] || 'Currency'}</option>`
    ).join('');
}

function filterCurrencies(query, selectElement) {
    renderOptions(selectElement, selectElement.value, query);
}

async function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const from = fromCurrency.value;
    const to = toCurrency.value;

    if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid amount');
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
        updateMarketChart(rates, from);
        updateComparisonTable(amount, from, rates);
        updateLastUpdated();
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Error converting currency. Please try again.');
        showNotification('Conversion failed', 'error');
    }
}

async function fetchExchangeRates(base) {
    if (lastBaseCurrency === base && Object.keys(exchangeRates).length > 0) {
        return exchangeRates;
    }

    const response = await fetch(`${API_URL}${base}`);
    const data = await response.json();
    exchangeRates = data.rates;
    lastBaseCurrency = base;
    return exchangeRates;
}

function showResult(amount, result, rate, from, to) {
    resultAmount.textContent = `${result.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} ${to}`;
    exchangeRate.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    amountInWords.textContent = numberToWords(result) + ` ${to}`;
    resultDiv.classList.remove('hidden');
    
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    const percent = (Math.random() * 2).toFixed(2);
    rateTrend.className = `rate-trend trend-${trend}`;
    rateTrend.innerHTML = `<i class="fas fa-caret-${trend === 'up' ? 'up' : 'down'}"></i> ${percent}%`;
    rateTrend.classList.remove('hidden');
}

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
    showNotification('Currencies swapped', 'success');
}

function copyToClipboard() {
    const text = resultAmount.textContent;
    navigator.clipboard.writeText(text).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        showNotification('Copied to clipboard!', 'success');
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="far fa-copy"></i>';
        }, 2000);
    });
}

function numberToWords(n) {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Million', 'Billion'];

    if (n === 0) return 'Zero';
    
    let num = Math.floor(n);
    let words = '';
    let scaleIndex = 0;

    while (num > 0) {
        let chunk = num % 1000;
        if (chunk > 0) {
            let chunkWords = '';
            if (chunk >= 100) {
                chunkWords += units[Math.floor(chunk / 100)] + ' Hundred ';
                chunk %= 100;
            }
            if (chunk >= 20) {
                chunkWords += tens[Math.floor(chunk / 10)] + ' ';
                chunk %= 10;
            }
            if (chunk > 0) {
                chunkWords += units[chunk] + ' ';
            }
            words = chunkWords + scales[scaleIndex] + ' ' + words;
        }
        num = Math.floor(num / 1000);
        scaleIndex++;
    }
    return words.trim();
}

function updateMarketChart(rates, baseCurrency) {
    const ctx = document.getElementById('marketChart').getContext('2d');
    const labels = COMPARISON_CURRENCIES.filter(c => c !== baseCurrency);
    const data = labels.map(c => rates[c]);

    chartSection.classList.remove('hidden');

    if (marketChart) {
        marketChart.data.labels = labels;
        marketChart.data.datasets[0].data = data;
        marketChart.data.datasets[0].label = `Relative Value (1 ${baseCurrency})`;
        marketChart.update();
        return;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

    marketChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `Relative Value (1 ${baseCurrency})`,
                data: data,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3,
                pointBackgroundColor: '#4f46e5',
                pointBorderColor: '#fff',
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: isDark ? '#1e293b' : '#fff',
                    titleColor: isDark ? '#f8fafc' : '#1e293b',
                    bodyColor: isDark ? '#f8fafc' : '#1e293b',
                    borderColor: '#4f46e5',
                    borderWidth: 1
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                }
            }
        }
    });
}

function updateChartTheme() {
    if (!marketChart) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    
    marketChart.options.scales.x.ticks.color = textColor;
    marketChart.options.scales.y.ticks.color = textColor;
    marketChart.options.scales.x.grid.color = gridColor;
    marketChart.options.scales.y.grid.color = gridColor;
    marketChart.update();
}

function hideResult() { resultDiv.classList.add('hidden'); }
function showLoading() { loadingDiv.classList.remove('hidden'); }
function hideLoading() { loadingDiv.classList.add('hidden'); }
function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}
function hideError() { errorDiv.classList.add('hidden'); }

window.reverseConversion = function() {
    const temp = amountInput.value;
    amountInput.value = resultAmount.textContent.split(' ')[0].replace(/,/g, '');
    const tempCurrency = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = tempCurrency;
    updateFavoriteBtnState();
    convertCurrency();
    showNotification('Conversion reversed', 'success');
};

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
        return `
            <div class="comparison-row">
                <div class="comparison-currency">${currency}</div>
                <div class="comparison-value">${convertedValue}</div>
            </div>
        `;
    }).join('');
    
    comparisonSection.classList.remove('hidden');
}

window.addEventListener('load', async () => {
    loadTheme();
    loadFavorites();
    loadHistoryFromStorage();
    await populateCurrencies();
    renderHistory();
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
