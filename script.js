// Supported exchanges and endpoints
const EXCHANGES = [
  { name: 'Kraken', url: 'https://api.kraken.com/0/public/Ticker?pair=XXBTZEUR' },
  { name: 'Binance', url: 'https://api.binance.com/api/v3/ticker/price?symbol=BTCEUR' },
  { name: 'Bitstamp', url: 'https://www.bitstamp.net/api/v2/ticker/btceur/' },
  { name: 'Coinbase', url: 'https://api.coinbase.com/v2/prices/BTC-EUR/spot' },
  { name: 'Bitfinex', url: 'https://api-pub.bitfinex.com/v2/ticker/tBTCUSD' }
];

// Copy the value of an input to clipboard
function copyToClipboard(id) {
  const el = document.getElementById(id);
  el.select();
  document.execCommand('copy');
}

// Format number using chosen separator
function formatNumber(value, separator) {
  return value.toString().replace('.', separator);
}

// Convert fiat to BTC and SATS
async function convert() {
  const fiat = parseFloat(document.getElementById('fiat-input').value.replace(',', '.'));
  const currency = document.getElementById('currency-select').value;
  const separator = document.getElementById('decimal-toggle').value;

  if (isNaN(fiat)) return;

  // Fetch all prices and calculate median
  const prices = await Promise.all(EXCHANGES.map(e => fetch(e.url)
    .then(res => res.json())
    .then(data => {
      if (e.name === 'Kraken') return parseFloat(data.result.XXBTZEUR.c[0]);
      if (e.name === 'Binance') return parseFloat(data.price);
      if (e.name === 'Bitstamp') return parseFloat(data.last);
      if (e.name === 'Coinbase') return parseFloat(data.data.amount);
      if (e.name === 'Bitfinex') return parseFloat(data[6]); // BTC/USD only
    }).catch(() => null)
  ));

  const validPrices = prices.filter(p => p && !isNaN(p));
  if (validPrices.length === 0) return;

  // For USD, convert BTC/USD to BTC/EUR approximation using average EUR/USD ~1.08
  let btcPrice = median(validPrices);
  if (currency === 'USD') btcPrice = btcPrice / 1.08;

  const btc = fiat / btcPrice;
  const sats = btc * 100000000;

  // Update outputs with proper formatting
  document.getElementById('btc-output').value = formatNumber(btc.toFixed(8), separator);
  document.getElementById('sats-output').value = formatNumber(sats.toFixed(0), separator);
}

// Helper function to calculate median
function median(values) {
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}
