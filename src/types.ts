export interface User {
  id: number;
  email: string;
  level: number;
  xp: number;
  is_banned: boolean;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  status: 'pending' | 'completed';
  type: string;
  validation_data?: string;
  created_at: string;
}

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  target_value: number;
  current_value: number;
  status: 'active' | 'completed';
  created_at: string;
}

export interface Feature {
  id: string;
  name: string;
  isEnabled: boolean;
  isBeta: boolean;
  requiredLevel: number;
}

export interface AdminConfig {
  features: Feature[];
  xpSettings: {
    taskXP: number;
    routineXP: number;
    dailyCap: number;
  };
  content: {
    tos: string;
    privacy: string;
    version: string;
    updateMessage: string;
    lastUpdated: string;
  };
}
