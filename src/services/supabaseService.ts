import { supabase } from '../lib/supabase';
import { Task, Routine, Habit, Alarm, Goal, UserSettings, Policy, AdminConfig } from '../types';

// Local Storage Keys
const STORAGE_KEYS = {
  TASKS: 'rf_tasks',
  ROUTINES: 'rf_routines',
  HABITS: 'rf_habits',
  ALARMS: 'rf_alarms',
  GOALS: 'rf_goals',
  SETTINGS: 'rf_settings',
  ADMIN_CONFIG: 'rf_admin_config',
};

// Helper to get local data
const getLocal = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

// Helper to set local data
const setLocal = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- AUTH ---
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (data.user) {
    // Create initial profile
    await createProfile(data.user.id, email);
  }
  return data;
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const signOut = () => supabase.auth.signOut();

export const createProfile = async (userId: string, email: string) => {
  const initialSettings: UserSettings = {
    userId,
    email,
    darkMode: false,
    notifications: true,
    theme: 'system',
    onboardingCompleted: false,
    agreedToTerms: true,
    level: 1,
    xp: 0,
    skills: { discipline: 1, fitness: 1, focus: 1 },
    skipsToday: 0,
    lastSkipReset: new Date().toISOString(),
    dailyXp: 0,
    lastXpReset: new Date().toISOString(),
  };
  
  const { error } = await supabase.from('profiles').upsert(initialSettings);
  if (error) console.error('Error creating profile:', error);
  setLocal(STORAGE_KEYS.SETTINGS, initialSettings);
};

// --- DATA SYNC ---
export const syncData = async (userId: string) => {
  if (!navigator.onLine) return;

  const tables = [
    { key: STORAGE_KEYS.TASKS, table: 'tasks' },
    { key: STORAGE_KEYS.ROUTINES, table: 'routines' },
    { key: STORAGE_KEYS.HABITS, table: 'habits' },
    { key: STORAGE_KEYS.ALARMS, table: 'alarms' },
    { key: STORAGE_KEYS.GOALS, table: 'goals' },
  ];

  for (const { key, table } of tables) {
    const localData = getLocal<any>(key);
    if (localData.length > 0) {
      const { error } = await supabase.from(table).upsert(localData.map(d => ({ ...d, userId })));
      if (error) console.error(`Error syncing ${table}:`, error);
    }
  }
};

// --- TASKS ---
export const getTasks = async (userId: string) => {
  if (navigator.onLine) {
    const { data, error } = await supabase.from('tasks').select('*').eq('userId', userId).order('createdAt', { ascending: false });
    if (!error && data) {
      setLocal(STORAGE_KEYS.TASKS, data);
      return data as Task[];
    }
  }
  return getLocal<Task>(STORAGE_KEYS.TASKS);
};

export const saveTask = async (task: Task) => {
  const tasks = getLocal<Task>(STORAGE_KEYS.TASKS);
  const newTasks = task.id 
    ? tasks.map(t => t.id === task.id ? task : t)
    : [...tasks, { ...task, id: crypto.randomUUID() }];
  
  setLocal(STORAGE_KEYS.TASKS, newTasks);

  if (navigator.onLine) {
    await supabase.from('tasks').upsert(task);
  }
};

// --- SETTINGS ---
export const getSettings = async (userId: string): Promise<UserSettings | null> => {
  if (navigator.onLine) {
    const { data, error } = await supabase.from('profiles').select('*').eq('userId', userId).single();
    if (!error && data) {
      setLocal(STORAGE_KEYS.SETTINGS, data);
      return data as UserSettings;
    }
  }
  const local = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  return local ? JSON.parse(local) : null;
};

export const updateSettings = async (userId: string, settings: Partial<UserSettings>) => {
  const current = await getSettings(userId);
  const updated = { ...current, ...settings, userId };
  setLocal(STORAGE_KEYS.SETTINGS, updated);

  if (navigator.onLine) {
    await supabase.from('profiles').upsert(updated);
  }
};

// --- ADMIN CONFIG ---
export const getAdminConfig = async (): Promise<AdminConfig | null> => {
  if (navigator.onLine) {
    const { data, error } = await supabase.from('admin_config').select('*').single();
    if (!error && data) {
      setLocal(STORAGE_KEYS.ADMIN_CONFIG, data);
      return data as AdminConfig;
    }
  }
  const local = localStorage.getItem(STORAGE_KEYS.ADMIN_CONFIG);
  return local ? JSON.parse(local) : null;
};

export const updateAdminConfig = async (config: AdminConfig) => {
  setLocal(STORAGE_KEYS.ADMIN_CONFIG, config);
  if (navigator.onLine) {
    await supabase.from('admin_config').upsert(config);
  }
};

// --- BACKUP & RESTORE ---
export const backupData = async (userId: string) => {
  const data = {
    tasks: getLocal(STORAGE_KEYS.TASKS),
    routines: getLocal(STORAGE_KEYS.ROUTINES),
    habits: getLocal(STORAGE_KEYS.HABITS),
    alarms: getLocal(STORAGE_KEYS.ALARMS),
    goals: getLocal(STORAGE_KEYS.GOALS),
    settings: await getSettings(userId),
  };

  const { error } = await supabase.from('backups').upsert({
    userId,
    data,
    createdAt: new Date().toISOString(),
  });

  if (error) throw error;
};

export const restoreData = async (userId: string) => {
  const { data, error } = await supabase
    .from('backups')
    .select('data')
    .eq('userId', userId)
    .order('createdAt', { ascending: false })
    .limit(1)
    .single();

  if (error) throw error;
  if (data?.data) {
    const backup = data.data;
    setLocal(STORAGE_KEYS.TASKS, backup.tasks || []);
    setLocal(STORAGE_KEYS.ROUTINES, backup.routines || []);
    setLocal(STORAGE_KEYS.HABITS, backup.habits || []);
    setLocal(STORAGE_KEYS.ALARMS, backup.alarms || []);
    setLocal(STORAGE_KEYS.GOALS, backup.goals || []);
    setLocal(STORAGE_KEYS.SETTINGS, backup.settings || null);
    return true;
  }
  return false;
};
