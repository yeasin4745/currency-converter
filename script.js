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

const API_URL = 'https://open.er-api.com/v6/latest/';
const HISTORY_KEY = 'currencyConverterHistory';
const THEME_KEY = 'currencyConverterTheme';
const FAVORITES_KEY = 'currencyConverterFavorites';
const MAX_HISTORY = 5;

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
historyToggle.addEventListener('click', toggleHistory);
clearHistoryBtn.addEventListener('click', clearHistory);
themeToggle.addEventListener('click', toggleTheme);
favoriteBtn.addEventListener('click', toggleFavorite);
copyBtn.addEventListener('click', copyToClipboard);
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

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    themeToggle.innerHTML = newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    if (marketChart) updateChartTheme();
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
    } else {
        favoritePairs.splice(index, 1);
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
        updateMarketChart(rates, from, to);
        hideLoading();
    } catch (error) {
        hideLoading();
        showError('Failed to fetch exchange rates.');
    }
}

async function fetchExchangeRates(baseCurrency) {
    if (baseCurrency === lastBaseCurrency && Object.keys(exchangeRates).length > 0) return exchangeRates;
    
    try {
        const response = await fetch(`${API_URL}${baseCurrency}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        exchangeRates = data.rates;
        lastBaseCurrency = baseCurrency;
        
        localStorage.setItem(`cache_${baseCurrency}`, JSON.stringify({
            rates: exchangeRates,
            timestamp: new Date().getTime()
        }));
        
        return exchangeRates;
    } catch (error) {
        const cached = localStorage.getItem(`cache_${baseCurrency}`);
        if (cached) {
            const { rates, timestamp } = JSON.parse(cached);
            const age = Math.round((new Date().getTime() - timestamp) / 1000 / 60);
            console.log(`Using cached rates for ${baseCurrency} (${age} mins old)`);
            exchangeRates = rates;
            lastBaseCurrency = baseCurrency;
            showOfflineWarning(age);
            return exchangeRates;
        }
        throw error;
    }
}

function showOfflineWarning(ageInMinutes) {
    const warning = document.createElement('div');
    warning.className = 'offline-warning';
    warning.innerHTML = `<i class="fas fa-wifi-slash"></i> Offline Mode: Using rates from ${ageInMinutes} mins ago`;
    
    const existingWarning = document.querySelector('.offline-warning');
    if (existingWarning) existingWarning.remove();
    
    document.querySelector('.converter-body').prepend(warning);
    setTimeout(() => warning.remove(), 5000);
}

function swapCurrencies() {
    const temp = fromCurrency.value;
    fromCurrency.value = toCurrency.value;
    toCurrency.value = temp;
    
    fromSearch.value = '';
    toSearch.value = '';
    renderOptions(fromCurrency, fromCurrency.value);
    renderOptions(toCurrency, toCurrency.value);

    updateFavoriteBtnState();
    if (amountInput.value) convertCurrency();
}

function numberToWords(num) {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';

    function convert(n) {
        let s = '';
        if (n >= 100) {
            s += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }
        if (n >= 20) {
            s += tens[Math.floor(n / 10)] + ' ';
            n %= 10;
        } else if (n >= 10) {
            s += teens[n - 10] + ' ';
            return s;
        }
        if (n > 0) {
            s += ones[n] + ' ';
        }
        return s;
    }

    let result = '';
    if (num >= 1000000000) {
        result += convert(Math.floor(num / 1000000000)) + 'Billion ';
        num %= 1000000000;
    }
    if (num >= 1000000) {
        result += convert(Math.floor(num / 1000000)) + 'Million ';
        num %= 1000000;
    }
    if (num >= 1000) {
        result += convert(Math.floor(num / 1000)) + 'Thousand ';
        num %= 1000;
    }
    result += convert(Math.floor(num));

    return result.trim();
}

function showResult(originalAmount, convertedAmount, rate, from, to) {
    const formattedAmount = convertedAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    resultAmount.textContent = `${formattedAmount} ${to}`;
    exchangeRate.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
    
    const wholePart = Math.floor(convertedAmount);
    const decimalPart = Math.round((convertedAmount - wholePart) * 100);
    let words = numberToWords(wholePart);
    if (decimalPart > 0) {
        words += ` and ${numberToWords(decimalPart)} Cents`;
    }
    amountInWords.textContent = `(${words} ${CURRENCY_NAMES[to] || to})`;
    
    updateTrendIndicator(rate);
    resultDiv.classList.remove('hidden');
}

function updateTrendIndicator(currentRate) {
    const from = fromCurrency.value;
    const to = toCurrency.value;
    const pair = `${from}-${to}`;
    const previousRateKey = `prevRate_${pair}`;
    const previousRate = parseFloat(localStorage.getItem(previousRateKey));
    
    rateTrend.classList.remove('hidden', 'trend-up', 'trend-down', 'trend-neutral');
    
    if (previousRate && previousRate !== currentRate) {
        const diff = ((currentRate - previousRate) / previousRate) * 100;
        const isUp = diff > 0;
        
        rateTrend.classList.add(isUp ? 'trend-up' : 'trend-down');
        rateTrend.innerHTML = `
            <i class="fas fa-caret-${isUp ? 'up' : 'down'}"></i>
            ${Math.abs(diff).toFixed(2)}%
        `;
    } else {
        rateTrend.classList.add('trend-neutral');
        rateTrend.innerHTML = `<i class="fas fa-minus"></i> 0.00%`;
    }
    
    localStorage.setItem(previousRateKey, currentRate);
}

function copyToClipboard() {
    const text = `${amountInput.value} ${fromCurrency.value} = ${resultAmount.textContent} (Rate: ${exchangeRate.textContent})`;
    navigator.clipboard.writeText(text).then(() => {
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="far fa-copy"></i>';
        }, 2000);
    });
}

function updateMarketChart(rates, base, target) {
    const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'BDT', 'INR'];
    const labels = majorCurrencies.filter(c => rates[c] !== undefined);
    const data = labels.map(c => rates[c]);
    
    chartSection.classList.remove('hidden');
    const ctx = document.getElementById('marketChart').getContext('2d');
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
    
    if (marketChart) {
        marketChart.data.labels = labels;
        marketChart.data.datasets[0].data = data;
        marketChart.data.datasets[0].label = `1 ${base} to Major Currencies`;
        marketChart.options.scales.x.ticks.color = textColor;
        marketChart.options.scales.y.ticks.color = textColor;
        marketChart.options.scales.x.grid.color = gridColor;
        marketChart.options.scales.y.grid.color = gridColor;
        marketChart.update();
    } else {
        marketChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `1 ${base} to Major Currencies`,
                    data: data,
                    backgroundColor: 'rgba(79, 70, 229, 0.6)',
                    borderColor: '#4f46e5',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: gridColor },
                        ticks: { color: textColor, font: { size: 10 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor, font: { size: 10 } }
                    }
                }
            }
        });
    }
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

window.addEventListener('load', async () => {
    loadTheme();
    loadFavorites();
    loadHistoryFromStorage();
    await populateCurrencies();
    renderHistory();
    updateFavoriteBtnState();
    if (amountInput.value) convertCurrency();
});
