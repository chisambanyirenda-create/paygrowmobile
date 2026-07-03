import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatZMW(amount: number) {
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat('en-ZM', {
    style: 'currency',
    currency: 'ZMW',
    minimumFractionDigits: 2,
  }).format(abs).replace('ZMW', 'K');
  return amount < 0 ? `-${formatted}` : formatted;
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat('en-ZM').format(num);
}
