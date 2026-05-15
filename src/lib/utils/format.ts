// src/lib/utils/format.ts
import { CURRENCY_SYMBOL, TAX_RATE, SERVICE_RATE } from "@/constants";

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${CURRENCY_SYMBOL} ${num.toLocaleString("id-ID")}`;
}

export function formatNumber(num: number | string, decimals = 0): string {
  const n = typeof num === "string" ? parseFloat(num) : num;
  return n.toLocaleString("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function calculateOrderAmounts(subtotal: number) {
  const taxAmount = subtotal * TAX_RATE;
  const serviceAmount = subtotal * SERVICE_RATE;
  const totalAmount = subtotal + taxAmount + serviceAmount;
  return { taxAmount, serviceAmount, totalAmount };
}

export function generateOrderNumber(): string {
  const now = new Date();
  const dateStr = now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${dateStr}-${rand}`;
}

export function generateOpnameCode(): string {
  const now = new Date();
  const dateStr = now
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
  const rand = Math.floor(Math.random() * 900) + 100;
  return `OPN-${dateStr}-${rand}`;
}

export function elapsedMinutes(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / 60000);
}

export function elapsedLabel(date: Date | string): string {
  const mins = elapsedMinutes(date);
  if (mins < 1) return "< 1 min";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}
