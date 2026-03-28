/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserSettings, Routine, Habit, Task, Goal, Alarm, AdminConfig, Policy } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Management
export const getUserData = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserSettings;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
};

export const createUserData = async (uid: string, email: string) => {
  const initialData: any = {
    userId: uid,
    email,
    level: 1,
    xp: 0,
    isBanned: false,
    appVersion: '1.0.0',
    darkMode: false,
    notifications: true,
    theme: 'system',
    onboardingCompleted: false,
    agreedToTerms: false,
    skills: {
      discipline: 1,
      fitness: 1,
      focus: 1
    },
    skipsToday: 0,
    lastSkipReset: new Date().toISOString(),
    dailyXp: 0,
    lastXpReset: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, 'users', uid), initialData);
    return initialData as UserSettings;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
  }
};

export const updateUserSettings = async (uid: string, updates: Partial<UserSettings>) => {
  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const updateSettings = updateUserSettings;

export const subscribeSettings = (uid: string, callback: (settings: UserSettings) => void) => {
  return onSnapshot(doc(db, 'users', uid), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as UserSettings);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  });
};

// Routines
export const subscribeRoutines = (uid: string, callback: (routines: Routine[]) => void) => {
  const q = query(collection(db, 'routines'), where('userId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const routines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Routine));
    callback(routines);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'routines');
  });
};

export const createRoutine = async (routine: Omit<Routine, 'id'>) => {
  const newDoc = doc(collection(db, 'routines'));
  try {
    await setDoc(newDoc, routine);
    return newDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'routines');
  }
};

export const updateRoutine = async (id: string, updates: Partial<Routine>) => {
  try {
    await updateDoc(doc(db, 'routines', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `routines/${id}`);
  }
};

export const deleteRoutine = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'routines', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `routines/${id}`);
  }
};

// Tasks
export const subscribeTasks = (uid: string, callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, 'tasks'), where('userId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    callback(tasks);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'tasks');
  });
};

export const createTask = async (task: Omit<Task, 'id'>) => {
  const newDoc = doc(collection(db, 'tasks'));
  try {
    await setDoc(newDoc, task);
    return newDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'tasks');
  }
};

export const updateTask = async (id: string, updates: Partial<Task>) => {
  try {
    await updateDoc(doc(db, 'tasks', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${id}`);
  }
};

// Goals
export const subscribeGoals = (uid: string, callback: (goals: Goal[]) => void) => {
  const q = query(collection(db, 'goals'), where('userId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
    callback(goals);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'goals');
  });
};

export const createGoal = async (goal: Omit<Goal, 'id'>) => {
  const newDoc = doc(collection(db, 'goals'));
  try {
    await setDoc(newDoc, goal);
    return newDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'goals');
  }
};

export const deleteGoal = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'goals', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `goals/${id}`);
  }
};

// Alarms
export const subscribeAlarms = (uid: string, callback: (alarms: Alarm[]) => void) => {
  const q = query(collection(db, 'alarms'), where('userId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const alarms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alarm));
    callback(alarms);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'alarms');
  });
};

export const createAlarm = async (alarm: Omit<Alarm, 'id'>) => {
  const newDoc = doc(collection(db, 'alarms'));
  try {
    await setDoc(newDoc, alarm);
    return newDoc.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'alarms');
  }
};

export const updateAlarm = async (id: string, updates: Partial<Alarm>) => {
  try {
    await updateDoc(doc(db, 'alarms', id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `alarms/${id}`);
  }
};

export const deleteAlarm = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'alarms', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `alarms/${id}`);
  }
};

// Admin Config
export const getAdminConfig = async () => {
  try {
    const configDoc = await getDoc(doc(db, 'appConfig', 'admin'));
    if (configDoc.exists()) {
      return configDoc.data() as AdminConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'appConfig/admin');
  }
};

export const subscribeAdminConfig = (callback: (config: AdminConfig) => void) => {
  return onSnapshot(doc(db, 'appConfig', 'admin'), (doc) => {
    if (doc.exists()) {
      callback(doc.data() as AdminConfig);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'appConfig/admin');
  });
};

export const updateAdminConfig = async (updates: Partial<AdminConfig>) => {
  try {
    await updateDoc(doc(db, 'appConfig', 'admin'), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'appConfig/admin');
  }
};

// App Config (Version)
export const getAppConfig = async () => {
  try {
    const configDoc = await getDoc(doc(db, 'appConfig', 'main'));
    if (configDoc.exists()) {
      return configDoc.data() as { version: string, updateMessage: string };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'appConfig/main');
  }
};

// Policies
export const getPolicies = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'policies'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Policy));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'policies');
  }
};

export const updatePolicy = async (id: string, content: string) => {
  try {
    await setDoc(doc(db, 'policies', id), {
      content,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `policies/${id}`);
  }
};

// Habits
export const subscribeHabits = (uid: string, callback: (habits: Habit[]) => void) => {
  const q = query(collection(db, 'habits'), where('userId', '==', uid));
  return onSnapshot(q, (snapshot) => {
    const habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
    callback(habits);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'habits');
  });
};

// Stats & XP
export const addXP = async (uid: string, amount: number) => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      xp: increment(amount)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

// Bulk Save / Restore
export const saveAllData = async (uid: string, data: any) => {
  try {
    await setDoc(doc(db, 'backups', uid), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `backups/${uid}`);
  }
};

export const restoreAllData = async (uid: string) => {
  try {
    const backupDoc = await getDoc(doc(db, 'backups', uid));
    if (backupDoc.exists()) {
      return backupDoc.data();
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `backups/${uid}`);
  }
};

export const handleSkip = async (uid: string) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      skipsToday: increment(1)
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const toggleTaskCompletion = async (task: Task, uid: string) => {
  try {
    const taskRef = doc(db, 'tasks', task.id!);
    await updateDoc(taskRef, {
      completed: !task.completed,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
  }
};

export const createHabit = async (habit: Habit) => {
  try {
    const docRef = await addDoc(collection(db, 'habits'), habit);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'habits');
  }
};

export const updateHabit = async (habitId: string, updates: Partial<Habit>) => {
  try {
    await updateDoc(doc(db, 'habits', habitId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `habits/${habitId}`);
  }
};

export const deleteHabit = async (habitId: string) => {
  try {
    await deleteDoc(doc(db, 'habits', habitId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `habits/${habitId}`);
  }
};

export const toggleHabitCompletion = async (habit: Habit) => {
  try {
    const habitRef = doc(db, 'habits', habit.id!);
    const completedToday = !habit.completedToday;
    const updates: any = {
      completedToday,
      lastCompleted: completedToday ? new Date().toISOString() : habit.lastCompleted
    };
    
    if (completedToday) {
      updates.currentStreak = habit.currentStreak + 1;
      if (updates.currentStreak > habit.bestStreak) {
        updates.bestStreak = updates.currentStreak;
      }
      updates.logs = [...(habit.logs || []), new Date().toISOString()];
    } else {
      updates.currentStreak = Math.max(0, habit.currentStreak - 1);
      updates.logs = (habit.logs || []).filter(l => !l.startsWith(new Date().toISOString().split('T')[0]));
    }
    
    await updateDoc(habitRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `habits/${habit.id}`);
  }
};

export const subscribePolicy = (id: string, callback: (policy: Policy) => void) => {
  return onSnapshot(doc(db, 'policies', id), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Policy);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, `policies/${id}`);
  });
};

// Admin: User Management
export const getAllUsers = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => doc.data() as UserSettings);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
};

export const banUser = async (uid: string, isBanned: boolean) => {
  try {
    await updateDoc(doc(db, 'users', uid), { isBanned });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export const updateUserLevel = async (uid: string, level: number, xp: number) => {
  try {
    await updateDoc(doc(db, 'users', uid), { level, xp });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};
