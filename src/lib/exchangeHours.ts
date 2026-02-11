// Exchange trading hours and utilities

interface ExchangeHours {
  open: { hour: number; minute: number };
  close: { hour: number; minute: number };
  timezone: string;
  weekdays: number[]; // 0 = Sunday, 1 = Monday, etc.
}

const exchangeHours: Record<string, ExchangeHours> = {
  OSL: {
    open: { hour: 9, minute: 0 },
    close: { hour: 16, minute: 20 },
    timezone: "Europe/Oslo",
    weekdays: [1, 2, 3, 4, 5],
  },
  CPH: {
    open: { hour: 9, minute: 0 },
    close: { hour: 17, minute: 0 },
    timezone: "Europe/Copenhagen",
    weekdays: [1, 2, 3, 4, 5],
  },
  NYSE: {
    open: { hour: 9, minute: 30 },
    close: { hour: 16, minute: 0 },
    timezone: "America/New_York",
    weekdays: [1, 2, 3, 4, 5],
  },
  NASDAQ: {
    open: { hour: 9, minute: 30 },
    close: { hour: 16, minute: 0 },
    timezone: "America/New_York",
    weekdays: [1, 2, 3, 4, 5],
  },
  XETRA: {
    open: { hour: 9, minute: 0 },
    close: { hour: 17, minute: 30 },
    timezone: "Europe/Berlin",
    weekdays: [1, 2, 3, 4, 5],
  },
  LSE: {
    open: { hour: 8, minute: 0 },
    close: { hour: 16, minute: 30 },
    timezone: "Europe/London",
    weekdays: [1, 2, 3, 4, 5],
  },
  EPA: {
    open: { hour: 9, minute: 0 },
    close: { hour: 17, minute: 30 },
    timezone: "Europe/Paris",
    weekdays: [1, 2, 3, 4, 5],
  },
  STO: {
    open: { hour: 9, minute: 0 },
    close: { hour: 17, minute: 30 },
    timezone: "Europe/Stockholm",
    weekdays: [1, 2, 3, 4, 5],
  },
  AMS: {
    open: { hour: 9, minute: 0 },
    close: { hour: 17, minute: 30 },
    timezone: "Europe/Amsterdam",
    weekdays: [1, 2, 3, 4, 5],
  },
  SWX: {
    open: { hour: 9, minute: 0 },
    close: { hour: 17, minute: 30 },
    timezone: "Europe/Zurich",
    weekdays: [1, 2, 3, 4, 5],
  },
  HEL: {
    open: { hour: 10, minute: 0 },
    close: { hour: 18, minute: 30 },
    timezone: "Europe/Helsinki",
    weekdays: [1, 2, 3, 4, 5],
  },
  HKEX: {
    open: { hour: 9, minute: 30 },
    close: { hour: 16, minute: 0 },
    timezone: "Asia/Hong_Kong",
    weekdays: [1, 2, 3, 4, 5],
  },
  TSE: {
    open: { hour: 9, minute: 0 },
    close: { hour: 15, minute: 0 },
    timezone: "Asia/Tokyo",
    weekdays: [1, 2, 3, 4, 5],
  },
  KRX: {
    open: { hour: 9, minute: 0 },
    close: { hour: 15, minute: 30 },
    timezone: "Asia/Seoul",
    weekdays: [1, 2, 3, 4, 5],
  },
  CRYPTO: {
    open: { hour: 0, minute: 0 },
    close: { hour: 23, minute: 59 },
    timezone: "UTC",
    weekdays: [0, 1, 2, 3, 4, 5, 6],
  },
};

/**
 * Get the current time in a specific timezone
 */
function getTimeInTimezone(timezone: string): { hour: number; minute: number; dayOfWeek: number } {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  };
  
  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(now);
  
  const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find(p => p.type === "minute")?.value || "0", 10);
  
  // Get day of week (0-6, Sunday = 0)
  const dayStr = parts.find(p => p.type === "weekday")?.value || "";
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOfWeek = dayMap[dayStr] ?? 0;

  return { hour, minute, dayOfWeek };
}

/**
 * Check if an exchange is currently open for trading
 */
export function isExchangeOpen(exchange: string): boolean {
  const hours = exchangeHours[exchange];
  if (!hours) {
    // Unknown exchange - default to closed to be safe
    console.warn(`Unknown exchange: ${exchange}`);
    return false;
  }

  // CRYPTO is always open
  if (exchange === "CRYPTO") {
    return true;
  }

  const { hour, minute, dayOfWeek } = getTimeInTimezone(hours.timezone);

  // Check if it's a trading day
  if (!hours.weekdays.includes(dayOfWeek)) {
    return false;
  }

  // Check if within trading hours
  const currentMinutes = hour * 60 + minute;
  const openMinutes = hours.open.hour * 60 + hours.open.minute;
  const closeMinutes = hours.close.hour * 60 + hours.close.minute;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Get trading hours info for display
 */
export function getExchangeInfo(exchange: string): {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  timezone: string;
  tradingDays: string;
} {
  const hours = exchangeHours[exchange];
  if (!hours) {
    return {
      isOpen: false,
      openTime: "N/A",
      closeTime: "N/A",
      timezone: "Unknown",
      tradingDays: "N/A",
    };
  }

  const formatTime = (h: number, m: number) => 
    `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

  return {
    isOpen: isExchangeOpen(exchange),
    openTime: formatTime(hours.open.hour, hours.open.minute),
    closeTime: formatTime(hours.close.hour, hours.close.minute),
    timezone: hours.timezone.replace("_", " "),
    tradingDays: exchange === "CRYPTO" ? "Alle dager" : "Man-Fre",
  };
}

/**
 * Get user-friendly exchange name
 */
export function getExchangeName(exchange: string): string {
  const names: Record<string, string> = {
    OSL: "Oslo Børs",
    CPH: "Copenhagen Stock Exchange",
    NYSE: "New York Stock Exchange",
    NASDAQ: "NASDAQ",
    XETRA: "Frankfurt Stock Exchange",
    LSE: "London Stock Exchange",
    EPA: "Euronext Paris",
    STO: "Stockholm Stock Exchange",
    AMS: "Euronext Amsterdam",
    SWX: "SIX Swiss Exchange",
    HEL: "Helsinki Stock Exchange",
    HKEX: "Hong Kong Stock Exchange",
    TSE: "Tokyo Stock Exchange",
    KRX: "Korea Exchange",
    CRYPTO: "Krypto (24/7)",
  };
  return names[exchange] || exchange;
}

/**
 * Determine exchange from ticker
 */
export function getExchangeFromTicker(ticker: string): string {
  if (ticker.endsWith(".OL")) return "OSL";
  if (ticker.endsWith(".CO")) return "CPH";
  if (ticker.endsWith(".ST")) return "STO";
  if (ticker.endsWith(".DE")) return "XETRA";
  if (ticker.endsWith(".L")) return "LSE";
  if (ticker.endsWith(".PA")) return "EPA";
  if (ticker.endsWith(".BR")) return "EPA";
  if (ticker.endsWith(".SW")) return "SWX";
  if (ticker.endsWith(".AS")) return "AMS";
  if (ticker.endsWith(".HE")) return "HEL";
  if (ticker.endsWith(".HK")) return "HKEX";
  if (ticker.endsWith(".T")) return "TSE";
  if (ticker.endsWith(".KS")) return "KRX";
  if (ticker.includes("-USD")) return "CRYPTO";
  
  // Default to NYSE for US tickers without suffix
  return "NYSE";
}
