import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Ticker uten børs-endelse til visning: «BRG.OL» → «BRG», «NOVO-B.CO» → «NOVO-B». */
export const visTicker = (ticker: string) => ticker.replace(/\.[A-Z]{1,3}$/i, "");
