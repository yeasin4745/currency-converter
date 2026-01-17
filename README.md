# 💱 Currency Converter

A modern, real-time currency converter web application that provides instant currency conversion with live exchange rates.

## 🌐 Live Demo

**[View Live Project](https://yeasin4745.github.io/currency-converter/)**

## 📸 Preview

A beautiful and responsive currency converter with gradient design, smooth animations, and real-time exchange rates.

## ✨ Features

- 🔄 **Real-Time Conversion** - Fetches live exchange rates from Exchange Rate API
- 💰 **Multiple Currencies** - Supports 10+ major global currencies
- 🔁 **Currency Swap** - Instantly swap between source and target currencies
- ⚡ **Auto-Convert** - Automatically converts when currencies change
- 📱 **Responsive Design** - Works seamlessly on all devices (mobile, tablet, desktop)
- 🎨 **Modern UI** - Clean interface with gradient backgrounds and smooth animations
- ⚠️ **Error Handling** - User-friendly error messages for API failures
- 💾 **Smart Caching** - Reduces API calls by caching exchange rates

## 🛠️ Technologies Used

- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with gradients, animations, and flexbox
- **JavaScript (ES6+)** - Async/await, fetch API, DOM manipulation
- **Exchange Rate API** - Free currency exchange rate data

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection for API calls

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yeasin4745/currency-converter.git
   ```

2. Navigate to the project directory
   ```bash
   cd currency-converter
   ```

3. Open `index.html` in your browser
   ```bash
   # Or simply double-click the index.html file
   ```

## 📂 Project Structure

```
currency-converter/
│
├── index.html          # Main HTML file
├── style.css           # Stylesheet with all designs
├── script.js           # JavaScript logic and API integration
└── README.md           # Project documentation
```

## 💻 How It Works

1. **User Input** - Enter the amount to convert
2. **Select Currencies** - Choose source and target currencies from dropdowns
3. **API Call** - Fetches latest exchange rates from `https://open.er-api.com/v6/latest/`
4. **Calculation** - Converts amount using the fetched exchange rate
5. **Display Result** - Shows converted amount and exchange rate

## 🌍 Supported Currencies

- USD - US Dollar
- EUR - Euro
- GBP - British Pound
- BDT - Bangladeshi Taka
- INR - Indian Rupee
- JPY - Japanese Yen
- CNY - Chinese Yuan
- AUD - Australian Dollar
- CAD - Canadian Dollar
- CHF - Swiss Franc

## 🎯 Key Functionalities

### Currency Conversion
```javascript
// Fetches real-time rates and converts amount
async function convertCurrency() {
    const rates = await fetchExchangeRates(baseCurrency);
    const convertedAmount = amount * rates[targetCurrency];
}
```

### Smart Caching
```javascript
// Caches rates to minimize API calls
if (baseCurrency === lastBaseCurrency) {
    return exchangeRates; // Use cached rates
}
```

### Swap Feature
```javascript
// One-click currency swap
function swapCurrencies() {
    [fromCurrency.value, toCurrency.value] = 
    [toCurrency.value, fromCurrency.value];
}
```

## 🎨 Design Features

- **Gradient Backgrounds** - Eye-catching purple gradient theme
- **Smooth Animations** - Fade-in, slide-up, and rotation effects
- **Loading States** - Spinner animation during API calls
- **Hover Effects** - Interactive button and input hover states
- **Mobile-First** - Fully responsive design

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Yeasin**
- GitHub: [@yeasin4745](https://github.com/yeasin4745)
- Project Link: [Currency Converter](https://yeasin4745.github.io/currency-converter/)

## 🙏 Acknowledgments

- [Exchange Rate API](https://www.exchangerate-api.com/) - Free currency exchange rate data
- Inspiration from modern web design trends
- Built with passion for learning and innovation

## 📞 Support

If you have any questions or need help, feel free to:
- Open an issue on GitHub
- Contact via GitHub profile

---

⭐ **If you find this project useful, please consider giving it a star!** ⭐
