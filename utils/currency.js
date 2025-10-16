// utils/currency.js

/**
 * Convert amount to display currency based on user country
 * @param {number} amount - Amount in default currency (INR)
 * @param {string} countryCode - e.g., "IN", "US", "NP"
 * @returns {string} formatted currency string
 */
export function formatCurrency(amount, countryCode) {
  let currency = "INR"; // default
  let locale = "en-IN";

  switch (countryCode.toUpperCase()) {
    case "US":
      currency = "USD";
      locale = "en-US";
      break;
    case "NP":
      currency = "NPR";
      locale = "en-NP";
      break;
    case "IN":
      currency = "INR";
      locale = "en-IN";
      break;
    default:
      currency = "USD";
      locale = "en-US";
      break;
  }

  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

/**
 * Convert amount from INR to other currency using exchange rates
 * @param {number} amount - Amount in INR
 * @param {string} countryCode - User country
 * @returns {number} converted amount
 */
export function convertAmount(amount, countryCode) {
  const exchangeRates = {
    USD: 0.012, // 1 INR = 0.012 USD
    NPR: 1.6,   // 1 INR = 1.6 NPR
    INR: 1      // 1 INR = 1 INR
  };

  let currency = "INR";
  switch (countryCode.toUpperCase()) {
    case "US":
      currency = "USD";
      break;
    case "NP":
      currency = "NPR";
      break;
    case "IN":
      currency = "INR";
      break;
    default:
      currency = "USD";
      break;
  }

  return amount * exchangeRates[currency];
}

/**
 * Example usage:
 * let display = formatCurrency(convertAmount(500, "US"), "US");
 * console.log(display); // $6.00
 */
