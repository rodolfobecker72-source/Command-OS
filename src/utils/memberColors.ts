/**
 * Deterministic color assignment per user id, shared across calendars.
 * Each palette entry uses Tailwind classes so both light and dark modes stay legible.
 * Classes are declared as full literal strings so Tailwind's JIT keeps them in the bundle.
 */

export interface MemberColor {
  key: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
  hex: string;
}

// Hues are spaced ~40-60° apart to maximize visual distinction.
// Saturation/opacity increased so dots and badges are clearly separable.
export const MEMBER_COLOR_PALETTE: MemberColor[] = [
  { key: 'red',      bg: 'bg-red-500/25',      border: 'border-red-600/60',      text: 'text-red-800 dark:text-red-200',         dot: 'bg-red-600',      hex: '#dc2626' },
  { key: 'orange',   bg: 'bg-orange-500/25',   border: 'border-orange-600/60',   text: 'text-orange-800 dark:text-orange-200',   dot: 'bg-orange-500',   hex: '#f97316' },
  { key: 'yellow',   bg: 'bg-yellow-400/30',   border: 'border-yellow-500/70',   text: 'text-yellow-800 dark:text-yellow-200',   dot: 'bg-yellow-400',   hex: '#facc15' },
  { key: 'green',    bg: 'bg-green-500/25',    border: 'border-green-600/60',    text: 'text-green-800 dark:text-green-200',     dot: 'bg-green-600',    hex: '#16a34a' },
  { key: 'teal',     bg: 'bg-teal-500/25',     border: 'border-teal-600/60',     text: 'text-teal-800 dark:text-teal-200',       dot: 'bg-teal-500',     hex: '#14b8a6' },
  { key: 'blue',     bg: 'bg-blue-600/25',     border: 'border-blue-700/60',     text: 'text-blue-800 dark:text-blue-200',       dot: 'bg-blue-600',     hex: '#2563eb' },
  { key: 'purple',   bg: 'bg-purple-600/25',   border: 'border-purple-700/60',   text: 'text-purple-800 dark:text-purple-200',   dot: 'bg-purple-600',   hex: '#9333ea' },
  { key: 'pink',     bg: 'bg-pink-500/25',     border: 'border-pink-600/60',     text: 'text-pink-800 dark:text-pink-200',       dot: 'bg-pink-500',     hex: '#ec4899' },
  { key: 'brown',    bg: 'bg-amber-800/25',    border: 'border-amber-900/60',    text: 'text-amber-900 dark:text-amber-200',     dot: 'bg-amber-800',    hex: '#92400e' },
  { key: 'slate',    bg: 'bg-slate-600/25',    border: 'border-slate-700/60',    text: 'text-slate-800 dark:text-slate-200',     dot: 'bg-slate-700',    hex: '#334155' },
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getMemberColor(userId: string | null | undefined): MemberColor {
  if (!userId) return MEMBER_COLOR_PALETTE[MEMBER_COLOR_PALETTE.length - 1];
  const idx = hashString(userId) % MEMBER_COLOR_PALETTE.length;
  return MEMBER_COLOR_PALETTE[idx];
}
