import type { LucideIcon } from 'lucide-react';
import { BookOpen, Code, Coffee, FileText } from 'lucide-react';
import type { FocusMode } from '../types';

export type Tone = 'tech' | 'violet' | 'amber' | 'emerald' | 'slate' | 'rose';

export interface ModeMeta {
  label: string;
  tagline: string;
  tone: Tone;
  icon: LucideIcon;
}

export const MODE_META: Record<FocusMode, ModeMeta> = {
  'Mode A': { label: 'Mode A', tagline: 'Deep Code', tone: 'tech', icon: Code },
  'Mode B': { label: 'Mode B', tagline: 'Reading / Architecture', tone: 'violet', icon: BookOpen },
  'Mode C': { label: 'Mode C', tagline: 'Docs / Synthesis', tone: 'amber', icon: FileText },
  'Buffer/Rest': { label: 'Rest', tagline: 'Buffer / Recovery', tone: 'slate', icon: Coffee },
};

/** Text, background and ring classes per tone — chosen for ≥4.5:1 contrast on the navy surfaces. */
export const TONE_CLASSES: Record<Tone, { text: string; bg: string; border: string; solid: string; dot: string }> = {
  tech: { text: 'text-tech-300', bg: 'bg-tech-500/15', border: 'border-tech-400/30', solid: 'bg-tech-500', dot: 'bg-tech-400' },
  violet: { text: 'text-violet-300', bg: 'bg-violet-500/15', border: 'border-violet-400/30', solid: 'bg-violet-500', dot: 'bg-violet-400' },
  amber: { text: 'text-warn-300', bg: 'bg-warn-500/15', border: 'border-warn-400/30', solid: 'bg-warn-500', dot: 'bg-warn-400' },
  emerald: { text: 'text-growth-300', bg: 'bg-growth-500/15', border: 'border-growth-400/30', solid: 'bg-growth-500', dot: 'bg-growth-400' },
  slate: { text: 'text-slate-300', bg: 'bg-slate-500/15', border: 'border-slate-400/30', solid: 'bg-slate-500', dot: 'bg-slate-400' },
  rose: { text: 'text-rose-300', bg: 'bg-rose-500/15', border: 'border-rose-400/30', solid: 'bg-rose-500', dot: 'bg-rose-400' },
};

/** Phase → accent tone, so the roadmap and Gantt strip share a consistent color language. */
export const PHASE_TONES: Tone[] = ['tech', 'violet', 'emerald', 'amber', 'rose', 'tech', 'emerald'];

export function phaseTone(phaseKey: string): Tone {
  const n = Number(phaseKey.replace(/\D/g, '')) || 1;
  return PHASE_TONES[(n - 1) % PHASE_TONES.length];
}
