/**
 * Format a number with commas and specified decimal places
 */
export const formatNumber = (value: number | undefined | null, digits = 1): string => {
  if (value === undefined || value === null) return 'N/A';
  
  return Number(value).toLocaleString(undefined, { 
    minimumFractionDigits: digits, 
    maximumFractionDigits: digits 
  });
};

/**
 * Format a number as currency
 */
export const formatMoney = (value: number | undefined | null): string => {
  if (value === undefined || value === null) return '$0';
  
  return `$${Number(value).toLocaleString(undefined, { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
};

/**
 * Format a number as a percentage
 */
export const formatPercent = (value: number | undefined | null, digits = 1): string => {
  if (value === undefined || value === null) return '0%';
  
  // Get the absolute value for formatting and add the sign
  const absValue = Math.abs(Number(value));
  const sign = Number(value) < 0 ? '-' : '';
  
  return `${sign}${absValue.toLocaleString(undefined, { 
    minimumFractionDigits: digits, 
    maximumFractionDigits: digits 
  })}%`;
};

/**
 * Format a date string or Date object to a readable format
 */
export const formatDateString = (date: string | Date | undefined | null): string => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
