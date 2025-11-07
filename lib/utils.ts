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

export const polylineBox = (
  points: ReadonlyArray<{ x: number; y: number }>
) => {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const { x, y } = points[i];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
};
