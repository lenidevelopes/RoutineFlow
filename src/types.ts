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
  longestStreak: number;
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

export interface UserSettings {
  userId: string;
  darkMode: boolean;
  notifications: boolean;
  theme: 'system' | 'default' | 'dark' | 'light';
  onboardingCompleted: boolean;
  level: number;
  xp: number;
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
}
