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

// Helligdager der børsen er helt stengt, per børs (ISO-datoer i børsens lokale tid).
// Oslo Børs (Euronext Oslo): nyttårsdag, skjærtorsdag, langfredag, 2. påskedag,
// 1. mai, 17. mai, Kristi himmelfartsdag, 2. pinsedag, julaften, 1. og 2. juledag,
// nyttårsaften. Kilde: Euronext trading calendar. Oppdater listen årlig!
const exchangeHolidays: Record<string, string[]> = {
  OSL: [
    // 2026 (17. mai faller på en søndag og trengs ikke i listen)
    "2026-01-01", "2026-04-02", "2026-04-03", "2026-04-06", "2026-05-01",
    "2026-05-14", "2026-05-25", "2026-12-24", "2026-12-25", "2026-12-31",
    // 2027 (2. pinsedag og 17. mai er samme dag; 1. mai er lørdag)
    "2027-01-01", "2027-03-25", "2027-03-26", "2027-03-29", "2027-05-06",
    "2027-05-17", "2027-12-24", "2027-12-31",
    // 2028
    "2028-01-01", "2028-04-13", "2028-04-14", "2028-04-17", "2028-05-01",
    "2028-05-17", "2028-05-25", "2028-06-05", "2028-12-25", "2028-12-26",
  ],
};

// Halve handelsdager: børsen stenger tidligere enn normalt.
// Oslo Børs stenger 13:00 onsdag før skjærtorsdag.
const exchangeHalfDays: Record<string, Record<string, { hour: number; minute: number }>> = {
  OSL: {
    "2026-04-01": { hour: 13, minute: 0 },
    "2027-03-24": { hour: 13, minute: 0 },
    "2028-04-12": { hour: 13, minute: 0 },
  },
};

/**
 * Get the current time in a specific timezone
 */
function getTimeInTimezone(timezone: string): { hour: number; minute: number; dayOfWeek: number; isoDate: string } {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    weekday: "short",
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(now);

  const get = (type: string) => parts.find(p => p.type === type)?.value || "0";
  const hour = parseInt(get("hour"), 10) % 24;
  const minute = parseInt(get("minute"), 10);
  const isoDate = `${get("year")}-${get("month")}-${get("day")}`;

  // Get day of week (0-6, Sunday = 0)
  const dayStr = parts.find(p => p.type === "weekday")?.value || "";
  const dayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const dayOfWeek = dayMap[dayStr] ?? 0;

  return { hour, minute, dayOfWeek, isoDate };
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

  const { hour, minute, dayOfWeek, isoDate } = getTimeInTimezone(hours.timezone);

  // Check if it's a trading day
  if (!hours.weekdays.includes(dayOfWeek)) {
    return false;
  }

  // Check holiday calendar (exchange fully closed)
  if (exchangeHolidays[exchange]?.includes(isoDate)) {
    return false;
  }

  // Check if within trading hours (half days close earlier)
  const halfDayClose = exchangeHalfDays[exchange]?.[isoDate];
  const close = halfDayClose || hours.close;

  const currentMinutes = hour * 60 + minute;
  const openMinutes = hours.open.hour * 60 + hours.open.minute;
  const closeMinutes = close.hour * 60 + close.minute;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

/**
 * Get a timezone's UTC offset (in minutes) at a given instant, via Intl.
 */
function tzOffsetMinutes(timezone: string, at: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(at);
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value || "0", 10);
  const asUTC = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return (asUTC - at.getTime()) / 60000;
}

/**
 * Convert a time from one timezone to Oslo time (for display purposes).
 * Uses the offset difference at the current instant, computed with Intl —
 * robust across DST, unlike Date-parsing of locale strings.
 */
function convertToOsloTime(hour: number, minute: number, fromTimezone: string): { hour: number; minute: number } {
  const now = new Date();
  const diffMinutes = tzOffsetMinutes("Europe/Oslo", now) - tzOffsetMinutes(fromTimezone, now);

  let totalMinutes = hour * 60 + minute + diffMinutes;
  // Normalize to 0-1440
  totalMinutes = ((totalMinutes % 1440) + 1440) % 1440;

  return {
    hour: Math.floor(totalMinutes / 60),
    minute: Math.round(totalMinutes % 60),
  };
}

/**
 * Get trading hours info for display (times shown in Oslo time)
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

  // 24/7-markeder har ingen meningsfulle åpne-/stengetider å konvertere
  if (exchange === "CRYPTO") {
    return {
      isOpen: true,
      openTime: "00:00",
      closeTime: "24:00",
      timezone: "norsk tid",
      tradingDays: "Døgnåpent, alle dager",
    };
  }

  const formatTime = (h: number, m: number) =>
    `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;

  // Convert open/close times to Oslo time
  const osloOpen = convertToOsloTime(hours.open.hour, hours.open.minute, hours.timezone);
  const osloClose = convertToOsloTime(hours.close.hour, hours.close.minute, hours.timezone);

  return {
    isOpen: isExchangeOpen(exchange),
    openTime: formatTime(osloOpen.hour, osloOpen.minute),
    closeTime: formatTime(osloClose.hour, osloClose.minute),
    timezone: "norsk tid",
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
