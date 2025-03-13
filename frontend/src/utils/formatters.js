/**
 * Format a number as a currency string
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: USD)
 * @returns {string} The formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  const absAmount = Math.abs(amount);
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return amount < 0
    ? `-${formatter.format(absAmount)}`
    : formatter.format(absAmount);
};

/**
 * Format a date as a string
 * @param {Date|string} date - The date to format
 * @param {string} format - The format to use (default: 'medium')
 * @returns {string} The formatted date string
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  const options = {
    short: { month: 'numeric', day: 'numeric', year: '2-digit' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    monthYear: { month: 'short', year: 'numeric' },
  };
  
  return dateObj.toLocaleDateString('en-US', options[format] || options.medium);
};

/**
 * Truncate a string if it exceeds a certain length
 * @param {string} str - The string to truncate
 * @param {number} maxLength - The maximum length
 * @returns {string} The truncated string
 */
export const truncateString = (str, maxLength = 30) => {
  if (!str || str.length <= maxLength) {
    return str;
  }
  
  return `${str.substring(0, maxLength - 3)}...`;
};

/**
 * Group transactions by date
 * @param {Array} transactions - The transactions to group
 * @returns {Object} An object with dates as keys and arrays of transactions as values
 */
export const groupTransactionsByDate = (transactions) => {
  return transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toISOString().split('T')[0];
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(transaction);
    return groups;
  }, {});
};

/**
 * Calculate total income, expenses, and balance from transactions
 * @param {Array} transactions - The transactions to calculate totals for
 * @returns {Object} An object with income, expenses, and balance
 */
export const calculateTotals = (transactions) => {
  return transactions.reduce(
    (totals, transaction) => {
      const amount = transaction.amount;
      
      if (amount > 0) {
        totals.income += amount;
      } else {
        totals.expenses += Math.abs(amount);
      }
      
      totals.balance += amount;
      
      return totals;
    },
    { income: 0, expenses: 0, balance: 0 }
  );
};