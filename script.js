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

// === API endpoints for exchanges ===
const exchanges = [
  { name: "Kraken", url: "https://api.kraken.com/0/public/Ticker?pair=XXBTZEUR", supportedCurrencies: ["EUR", "USD"] },
  { name: "Binance", url: "https://api.binance.com/api/v3/ticker/price?symbol=BTCEUR", supportedCurrencies: [] },
  { name: "Bitstamp", url: "https://www.bitstamp.net/api/v2/ticker/btceur/", supportedCurrencies: ["EUR", "USD"] },
  { name: "Coinbase", url: "https://api.coinbase.com/v2/prices/BTC-EUR/spot", supportedCurrencies: ["EUR", "USD", "CHF"] },
  { name: "Bitfinex", url: "https://api.bitfinex.com/v1/pubticker/btceur", supportedCurrencies: ["EUR", "USD"] }
];

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

// === Get BTC rate from multiple exchanges and compute median ===
async function updateRates() {
  const suffix = currency.toLowerCase();

    fetch(ex.url.replace(/eur/gi, suffix))
      .then(res => res.json())
      .then(data => {
        try {
          if (ex.name === "Kraken") return { name: ex.name, rate: parseFloat(Object.values(data.result)[0].c[0]) };
          if (ex.name === "Binance") return { name: ex.name, rate: parseFloat(data.price) };
          if (ex.name === "Bitstamp") return { name: ex.name, rate: parseFloat(data.last) };
          if (ex.name === "Coinbase") return { name: ex.name, rate: parseFloat(data.data.amount) };
          if (ex.name === "Bitfinex") return { name: ex.name, rate: parseFloat(data.last_price) };
        } catch {
          return null;
        }
      }).catch(() => null)
  ));

  const valid = updated.filter(e => e && !isNaN(e.rate)).sort((a, b) => a.rate - b.rate);
  if (valid.length > 0) {
    const mid = Math.floor(valid.length / 2);
    currentRate = valid[mid].rate;
    currentExchange = valid[mid].name;
    rateInfo.textContent = `Median Rate = ${currentRate.toFixed(2)} ${currency} (${currentExchange})`;
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
