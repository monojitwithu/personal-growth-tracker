import type { AppState, WeekData, CapstoneProject, CompetencyItem } from '../types';
import curriculumData from './curriculum.json';

export const initialSeedData: AppState = {
  activeWeek: curriculumData.activeWeek ?? 1,
  weeks: curriculumData.weeks as WeekData[],
  capstones: curriculumData.capstones as CapstoneProject[],
  competencies: curriculumData.competencies as CompetencyItem[],
  logs: [
    {
      id: 'log-1',
      date: '2026-10-21',
      weekNumber: 1,
      mode: 'Mode B',
      taskTitle: 'V8 Execution Context & Closure Memory Tracing',
      durationHours: 1.5,
      outputArtifact: 'notes/v8-execution-context.md (commit #a1b8c4d)',
      notesAndBlockers: 'Traced V8 call stack, lexical environment records, and closure memory heap retention in DevTools.',
      status: 'Completed',
      createdAt: '2026-10-21T10:30:00Z'
    },
    {
      id: 'log-2',
      date: '2026-10-21',
      weekNumber: 1,
      mode: 'Mode A',
      taskTitle: 'Browser Task Queue vs Microtask Tracing Harness',
      durationHours: 2.0,
      outputArtifact: 'src/harness/event-loop-harness.ts (commit #e2f4a10)',
      notesAndBlockers: 'Built benchmark proving microtask execution precedence before paint and requestAnimationFrame dispatch.',
      status: 'Completed',
      createdAt: '2026-10-21T14:15:00Z'
    }
  ]
};
