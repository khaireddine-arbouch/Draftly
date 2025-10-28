import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const combinedSlug = (name: string, maxLen = 80): string => {
  const base = name;
  
  // If no name is provided, return 'untitled'
  if (!base) return 'untitled';

  let s = base;

  // Normalize string, remove diacritical marks, convert to lowercase, remove spaces, and non-alphanumeric characters
  s = s.normalize('NFKD')
    .replace(/\p{M}+/gu, '')  // Remove diacritics (accents)
    .toLowerCase()
    .replace(/\s+/g, '-')      // Replace spaces with dashes
    .replace(/[^a-z0-9-]/g, '');  // Keep only lowercase letters, digits, and dashes

  // If the resulting string is empty, return 'untitled'
  if (!s) s = 'untitled';

  // Trim to the maximum length if needed
  if (s.length > maxLen) s = s.slice(0, maxLen);

  return s;
};
