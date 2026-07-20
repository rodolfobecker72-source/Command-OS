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

export const MEMBER_COLOR_PALETTE: MemberColor[] = [
  { key: 'violet',   bg: 'bg-violet-500/15',   border: 'border-violet-500/40',   text: 'text-violet-700 dark:text-violet-300',   dot: 'bg-violet-500',   hex: '#8b5cf6' },
  { key: 'emerald',  bg: 'bg-emerald-500/15',  border: 'border-emerald-500/40',  text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500',  hex: '#10b981' },
  { key: 'amber',    bg: 'bg-amber-500/15',    border: 'border-amber-500/40',    text: 'text-amber-700 dark:text-amber-300',     dot: 'bg-amber-500',    hex: '#f59e0b' },
  { key: 'rose',     bg: 'bg-rose-500/15',     border: 'border-rose-500/40',     text: 'text-rose-700 dark:text-rose-300',       dot: 'bg-rose-500',     hex: '#f43f5e' },
  { key: 'cyan',     bg: 'bg-cyan-500/15',     border: 'border-cyan-500/40',     text: 'text-cyan-700 dark:text-cyan-300',       dot: 'bg-cyan-500',     hex: '#06b6d4' },
  { key: 'orange',   bg: 'bg-orange-500/15',   border: 'border-orange-500/40',   text: 'text-orange-700 dark:text-orange-300',   dot: 'bg-orange-500',   hex: '#f97316' },
  { key: 'indigo',   bg: 'bg-indigo-500/15',   border: 'border-indigo-500/40',   text: 'text-indigo-700 dark:text-indigo-300',   dot: 'bg-indigo-500',   hex: '#6366f1' },
  { key: 'teal',     bg: 'bg-teal-500/15',     border: 'border-teal-500/40',     text: 'text-teal-700 dark:text-teal-300',       dot: 'bg-teal-500',     hex: '#14b8a6' },
  { key: 'pink',     bg: 'bg-pink-500/15',     border: 'border-pink-500/40',     text: 'text-pink-700 dark:text-pink-300',       dot: 'bg-pink-500',     hex: '#ec4899' },
  { key: 'lime',     bg: 'bg-lime-500/15',     border: 'border-lime-500/40',     text: 'text-lime-700 dark:text-lime-300',       dot: 'bg-lime-500',     hex: '#84cc16' },
  { key: 'sky',      bg: 'bg-sky-500/15',      border: 'border-sky-500/40',      text: 'text-sky-700 dark:text-sky-300',         dot: 'bg-sky-500',      hex: '#0ea5e9' },
  { key: 'fuchsia',  bg: 'bg-fuchsia-500/15',  border: 'border-fuchsia-500/40',  text: 'text-fuchsia-700 dark:text-fuchsia-300', dot: 'bg-fuchsia-500',  hex: '#d946ef' },
  { key: 'red',      bg: 'bg-red-500/15',      border: 'border-red-500/40',      text: 'text-red-700 dark:text-red-300',         dot: 'bg-red-500',      hex: '#ef4444' },
  { key: 'slate',    bg: 'bg-slate-500/20',    border: 'border-slate-500/40',    text: 'text-slate-700 dark:text-slate-300',     dot: 'bg-slate-500',    hex: '#64748b' },
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
