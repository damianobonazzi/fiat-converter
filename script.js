// === Helper to copy values to clipboard ===
function copyToClipboard(id) {
  const el = document.getElementById(id);
  el.select();
  document.execCommand("copy");
}

// === State and config ===
let currentRate = 0;
let currentExchange = "";
let useComma = false;
let currency = "EUR";

const fiatInput = document.getElementById("fiat");
const btcInput = document.getElementById("btc");
const satsInput = document.getElementById("sats");
const toggle = document.getElementById("decimal-toggle");
const currencySelect = document.getElementById("currency");
const rateInfo = document.getElementById("rate-info");
const circleProgress = document.getElementById("circle-progress");
const emptyAllBtn = document.getElementById("empty-all-btn");

// === Empty all editable fields ===
if (emptyAllBtn) {
  emptyAllBtn.addEventListener("click", () => {
    fiatInput.value = "";
    btcInput.value = "";
    satsInput.value = "";
  });
}

// === Structured API configuration per currency ===
const exchangeConfigs = {
  EUR: [
    { name: "Kraken", url: "https://api.kraken.com/0/public/Ticker?pair=XBTEUR", parsePrice: d => parseFloat(Object.values(d.result)[0].c[0]) },
    { name: "Coinbase", url: "https://api.coinbase.com/v2/prices/BTC-EUR/spot", parsePrice: d => parseFloat(d.data.amount) },
    { name: "Bitstamp", url: "https://www.bitstamp.net/api/v2/ticker/btceur/", parsePrice: d => parseFloat(d.last) },
    { name: "Bitfinex", url: "https://api-pub.bitfinex.com/v2/ticker/tBTCEUR", parsePrice: d => parseFloat(d[6]) },
    { name: "CEX.IO", url: "https://cex.io/api/ticker/BTC/EUR", parsePrice: d => parseFloat(d.last) },
    { name: "KuCoin", url: "https://api.kucoin.com/api/ua/v1/market/ticker?tradeType=SPOT&symbol=BTC-EUR", parsePrice: d => parseFloat(d.data.list[0].lastPrice) },
    { name: "OKX", url: "https://www.okx.com/api/v5/market/ticker?instId=BTC-EUR", parsePrice: d => parseFloat(d.data[0].last) },
    { name: "bitFlyer", url: "https://api.bitflyer.com/v1/ticker?product_code=BTC_EUR", parsePrice: d => parseFloat(d.ltp) }
  ],
  USD: [
    { name: "Kraken", url: "https://api.kraken.com/0/public/Ticker?pair=XBTUSD", parsePrice: d => parseFloat(Object.values(d.result)[0].c[0]) },
    { name: "Coinbase", url: "https://api.coinbase.com/v2/prices/BTC-USD/spot", parsePrice: d => parseFloat(d.data.amount) },
    { name: "Bitstamp", url: "https://www.bitstamp.net/api/v2/ticker/btcusd/", parsePrice: d => parseFloat(d.last) },
    { name: "Gemini", url: "https://api.gemini.com/v2/ticker/btcusd", parsePrice: d => parseFloat(d.close) },
    { name: "Bitfinex", url: "https://api-pub.bitfinex.com/v2/ticker/tBTCUSD", parsePrice: d => parseFloat(d[6]) },
    { name: "CEX.IO", url: "https://cex.io/api/ticker/BTC/USD", parsePrice: d => parseFloat(d.last) },
    { name: "Binance", url: "https://data-api.binance.vision/api/v3/ticker/price?symbol=BTCUSDT", parsePrice: d => parseFloat(d.price) },
    { name: "KuCoin", url: "https://api.kucoin.com/api/ua/v1/market/ticker?tradeType=SPOT&symbol=BTC-USDT", parsePrice: d => parseFloat(d.data.list[0].lastPrice) },
    { name: "Bybit", url: "https://api.bybit.com/v5/market/tickers?category=spot&symbol=BTCUSDT", parsePrice: d => parseFloat(d.result.list[0].lastPrice) },
    { name: "OKX", url: "https://www.okx.com/api/v5/market/ticker?instId=BTC-USD", parsePrice: d => parseFloat(d.data[0].last) },
    { name: "Bitget", url: "https://api.bitget.com/api/v3/market/tickers?category=SPOT&symbol=BTCUSDT", parsePrice: d => parseFloat(d.data[0].lastPrice) }
  ],
  CHF: [
    { name: "Kraken", url: "https://api.kraken.com/0/public/Ticker?pair=XBTCHF", parsePrice: d => parseFloat(Object.values(d.result)[0].c[0]) },
    { name: "Coinbase", url: "https://api.coinbase.com/v2/prices/BTC-CHF/spot", parsePrice: d => parseFloat(d.data.amount) }
  ],
  GBP: [
    { name: "Kraken", url: "https://api.kraken.com/0/public/Ticker?pair=XBTGBP", parsePrice: d => parseFloat(Object.values(d.result)[0].c[0]) },
    { name: "Coinbase", url: "https://api.coinbase.com/v2/prices/BTC-GBP/spot", parsePrice: d => parseFloat(d.data.amount) },
    { name: "Bitstamp", url: "https://www.bitstamp.net/api/v2/ticker/btcgbp/", parsePrice: d => parseFloat(d.last) },
    { name: "Bitfinex", url: "https://api-pub.bitfinex.com/v2/ticker/tBTCGBP", parsePrice: d => parseFloat(d[6]) },
    { name: "CEX.IO", url: "https://cex.io/api/ticker/BTC/GBP", parsePrice: d => parseFloat(d.last) }
  ],
  JPY: [
    { name: "Kraken", url: "https://api.kraken.com/0/public/Ticker?pair=XBTJPY", parsePrice: d => parseFloat(Object.values(d.result)[0].c[0]) },
    { name: "bitFlyer", url: "https://api.bitflyer.com/v1/ticker?product_code=BTC_JPY", parsePrice: d => parseFloat(d.ltp) },
    { name: "Coincheck", url: "https://coincheck.com/api/ticker?pair=btc_jpy", parsePrice: d => parseFloat(d.last) },
    { name: "bitbank", url: "https://public.bitbank.cc/btc_jpy/ticker", parsePrice: d => parseFloat(d.data.last) }
  ]
};

// === Handle separator toggle ===
toggle.addEventListener("change", () => {
  useComma = toggle.checked;

  // Riformatta il campo FIAT solo se il valore è valido
  const value = fiatInput.value;
  const num = parseInput(value);
  if (!isNaN(num)) {
    fiatInput.value = formatOutput(num, 2);
  }

  // Aggiorna gli altri campi
  updateValues("fiat");
});

// === Handle currency change ===
currencySelect.addEventListener("change", () => {
  currency = currencySelect.value;
  document.getElementById("fiat-label").textContent = currency;
  updateRates();
});

// === Convert formatted input to number ===
function parseInput(value) {
  if (useComma) value = value.replace(",", ".");
  return parseFloat(value);
}

// === Format number for output ===
function formatOutput(value, decimals = 8) {
  let str = value.toFixed(decimals);
  if (useComma) str = str.replace(".", ",");
  return str;
}

// === Handle input events ===
fiatInput.addEventListener("input", () => updateValues("fiat"));
btcInput.addEventListener("input", () => updateValues("btc"));
satsInput.addEventListener("input", () => updateValues("sats"));

// === Main conversion logic ===
function updateValues(source) {
  const fiatVal = parseInput(fiatInput.value);
  const btcVal = parseInput(btcInput.value);
  const satsVal = parseInput(satsInput.value);

  if (!currentRate) return;

  if (source === "fiat" && !isNaN(fiatVal)) {
    const btc = fiatVal / currentRate;
    const sats = btc * 1e8;
    btcInput.value = formatOutput(btc);
    satsInput.value = Math.round(sats);
  } else if (source === "btc" && !isNaN(btcVal)) {
    const fiat = btcVal * currentRate;
    const sats = btcVal * 1e8;
    fiatInput.value = formatOutput(fiat, 2);
    satsInput.value = Math.round(sats);
  } else if (source === "sats" && !isNaN(satsVal)) {
    const btc = satsVal / 1e8;
    const fiat = btc * currentRate;
    btcInput.value = formatOutput(btc);
    fiatInput.value = formatOutput(fiat, 2);
  }
}

// === Get BTC rate from exchange endpoints and compute median ===
async function updateRates() {
  const configList = exchangeConfigs[currency] || [];

  if (configList.length === 0) {
    rateInfo.textContent = `No exchange rate available for ${currency}.`;
    currentRate = 0;
    fiatInput.value = "";
    btcInput.value = "";
    satsInput.value = "";
    return;
  }

  const updated = await Promise.all(configList.map(ex => {
    return fetch(ex.url)
      .then(res => res.json())
      .then(data => {
        try {
          const price = ex.parsePrice(data);
          if (!isNaN(price) && price > 0) {
            return { name: ex.name, rate: price };
          }
          return null;
        } catch {
          return null;
        }
      }).catch(() => null);
  }));

  const valid = updated.filter(e => e && !isNaN(e.rate)).sort((a, b) => a.rate - b.rate);
  if (valid.length > 0) {
    const mid = Math.floor(valid.length / 2);
    const medianItem = valid[mid];
    currentRate = medianItem.rate;
    currentExchange = medianItem.name;

    const sortedDesc = [...valid].sort((a, b) => b.rate - a.rate);
    rateInfo.innerHTML = sortedDesc.map(item => {
      const isMedian = item === medianItem;
      const formattedRate = item.rate.toFixed(2);
      if (isMedian) {
        return `<div style="color: #000; font-weight: bold;">${formattedRate} ${currency} (${item.name})</div>`;
      } else {
        return `<div style="color: #666;">${formattedRate} ${currency} (${item.name})</div>`;
      }
    }).join("");

    updateValues("fiat");
  } else {
    rateInfo.textContent = `Could not fetch rate for ${currency}.`;
    currentRate = 0;
  }
}

// === Animate circular progress bar every second ===
let progress = 0;
setInterval(() => {
  progress++;
  if (progress >= 30) {
    updateRates();
    progress = 0;
  }
  const percent = (progress / 30) * 100;
  circleProgress.setAttribute("stroke-dasharray", `${percent}, 100`);
}, 1000);

// === Initial rate fetch ===
updateRates();
