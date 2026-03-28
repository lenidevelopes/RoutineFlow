/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Priority = 'low' | 'medium' | 'high';
export type TaskCategory = string;

export interface Task {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  priority: Priority;
  category: TaskCategory;
  tags: string[];
  dueDate?: string;
  checklist: { text: string; completed: boolean }[];
  createdAt: string;
  updatedAt: string;
}

export interface RoutineTask {
  id: string;
  title: string;
  description?: string;
  start_time?: string; // 12h format: "07:00 AM"
  end_time?: string;   // 12h format: "07:30 AM"
  duration_minutes: number;
  mode: 'fixed' | 'duration';
  completed: boolean;
  alarm?: {
    enabled: boolean;
    sound: string;
    vibration: boolean;
    volume?: number;
    snooze_delay: number; // 5-10
  };
}

export type RoutineType = 'morning' | 'school' | 'evening' | 'custom';

export interface Routine {
  id?: string;
  userId: string;
  name: string;
  type: RoutineType;
  activeDays: string[]; // ['Mon', 'Tue', ...]
  tasks: RoutineTask[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id?: string;
  userId: string;
  title: string;
  frequency: 'daily' | 'weekly' | 'custom';
  currentStreak: number;
  bestStreak: number;
  lastCompleted: string | null; // ISO date
  completedToday: boolean;
  logs: string[]; // ISO dates
  createdAt: string;
}

export interface Alarm {
  id?: string;
  userId: string;
  time: string;
  label: string;
  isActive: boolean;
  routineId?: string;
  days: string[];
  createdAt: string;
  customSource?: {
    type: 'tiktok' | 'youtube' | 'mp3' | 'song_name';
    value: string;
  };
}

export type GoalType = 'tasks_completed' | 'routine_consistency' | 'habit_streak' | 'time_spent' | 'xp_earned' | 'routines_completed';

export interface Goal {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  type: GoalType;
  target_value: number;
  current_value: number;
  deadline?: string;
  status: 'active' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface AdminConfig {
  features: {
    [key: string]: {
      enabled: boolean;
      beta: boolean;
      requiredLevel: number;
      title: string;
      description: string;
    };
  };
  appVersion: string;
  updateMessage: string;
  maintenanceMode: boolean;
}

export interface UserSettings {
  userId: string;
  email?: string;
  darkMode: boolean;
  notifications: boolean;
  theme: 'system' | 'default' | 'dark' | 'light';
  onboardingCompleted: boolean;
  agreedToTerms: boolean;
  level: number;
  xp: number;
  isBanned?: boolean;
  skills: {
    discipline: number;
    fitness: number;
    focus: number;
  };
  onboardingData?: {
    age: number;
    weight?: number;
    goals: string[];
    sports: string[];
    lifestyle: string;
  };
  skipsToday: number;
  lastSkipReset: string; // ISO date
  dailyXp: number;
  lastXpReset: string; // ISO date
  appVersion?: string;
}

export interface DashboardProps {
  user: any;
  settings: UserSettings | null;
  setActiveTab: (tab: any) => void;
  adminConfig: AdminConfig | null;
}

export interface RoutinesScreenProps {
  user: any;
  settings: UserSettings | null;
  initialRoutines: Routine[];
  isLocked?: boolean;
}

export interface GoalsScreenProps {
  user: any;
  isLocked?: boolean;
}

export interface AlarmsScreenProps {
  user: any;
  isLocked?: boolean;
}

export interface Policy {
  id: 'tos' | 'privacy';
  content: string;
  updatedAt: string;
  updatedBy: string;
}
