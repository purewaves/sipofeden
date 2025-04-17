import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Generates a consistent className by merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency in USD
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

// Generate a session ID for cart tracking
export function getSessionId(): string {
  let sessionId = localStorage.getItem('sessionId');
  
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('sessionId', sessionId);
  }
  
  return sessionId;
}

// Stock status helper functions
export function getStockStatus(stock: number) {
  if (stock <= 0) return 'Out of Stock';
  if (stock < 20) return 'Low Stock';
  return 'In Stock';
}

export function getStockStatusClass(stock: number) {
  if (stock <= 0) return 'bg-red-100 text-red-800';
  if (stock < 20) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

// Format date to readable format
export function formatDate(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
