export type FocusMode = 'Mode A' | 'Mode B' | 'Mode C' | 'Buffer/Rest';

export interface DailyTaskOption {
  id: string;
  title: string;
  description: string;
  mode: FocusMode;
}

export interface WeekData {
  weekNumber: number;
  dateRange: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  phase: string;
  title: string;
  topics: string[];
  milestoneDeliverable: string;
  isMilestoneCompleted: boolean;
  dailyOptions: DailyTaskOption[];
  /** Topics (by exact text) the user has checked off in the Roadmap view. Optional for seed/back-compat. */
  completedTopics?: string[];
}

export type LogStatus = 'Completed' | 'In Progress' | 'Rest Day';

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  weekNumber: number;
  mode: FocusMode;
  taskTitle: string;
  durationHours: number;
  outputArtifact: string;
  notesAndBlockers: string;
  status: LogStatus;
  createdAt: string;
}

export interface CapstoneProject {
  id: string;
  title: string;
  stack: string[];
  description: string;
  deliverables: { id: string; text: string; done: boolean }[];
  repoUrl?: string;
  liveUrl?: string;
}

export type CompetencyStatus = 'Not Started' | 'In Progress' | 'Production Ready';

export interface CompetencyItem {
  id: string;
  title: string;
  benchmark: string;
  status: CompetencyStatus;
}

export interface AppState {
  weeks: WeekData[];
  logs: DailyLog[];
  capstones: CapstoneProject[];
  competencies: CompetencyItem[];
  activeWeek: number;
}

export type TabId = 'cockpit' | 'roadmap' | 'logs' | 'capstones';
