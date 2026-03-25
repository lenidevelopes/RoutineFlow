/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, getDocs, setDoc } from 'firebase/firestore';
import { Task, Routine, Habit, Alarm, Goal, UserSettings } from '../types';

// Generic CRUD helper
async function createDoc<T>(colName: string, data: T): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, colName), data as any);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, colName);
    throw error;
  }
}

async function updateDocument<T>(colName: string, docId: string, data: Partial<T>): Promise<void> {
  try {
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(doc(db, colName, docId), cleanData as any);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${colName}/${docId}`);
    throw error;
  }
}

async function deleteDocument(colName: string, docId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, colName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${colName}/${docId}`);
    throw error;
  }
}

// Tasks
export const createTask = (task: Task) => createDoc<Task>('tasks', task);
export const updateTask = (id: string, task: Partial<Task>) => updateDocument<Task>('tasks', id, task);
export const deleteTask = (id: string) => deleteDocument('tasks', id);

// XP and Leveling
export const gainXP = async (userId: string, amount: number, skillType: 'discipline' | 'fitness' | 'focus') => {
  const settingsRef = doc(db, 'settings', userId);
  const snapshot = await getDocs(query(collection(db, 'settings'), where('userId', '==', userId)));
  if (snapshot.empty) return;
  
  const settings = snapshot.docs[0].data() as UserSettings;
  let { xp, level, skills } = settings;
  
  // Initialize if missing
  xp = xp || 0;
  level = level || 1;
  skills = skills || { discipline: 1, fitness: 1, focus: 1 };
  
  const newXP = xp + amount;
  const xpToNextLevel = level * 1000;
  
  let newLevel = level;
  let finalXP = newXP;
  
  if (newXP >= xpToNextLevel) {
    newLevel += 1;
    finalXP = newXP - xpToNextLevel;
  }
  
  const newSkills = { ...skills };
  newSkills[skillType] = (newSkills[skillType] || 1) + (amount / 100);
  
  await updateDoc(doc(db, 'settings', userId), {
    xp: finalXP,
    level: newLevel,
    skills: newSkills,
    updatedAt: new Date().toISOString()
  } as any);
};

export const toggleTaskCompletion = async (task: Task, userId: string) => {
  const newCompleted = !task.completed;
  const now = new Date().toISOString();
  
  // Update task
  await updateTask(task.id!, {
    completed: newCompleted,
    completedAt: newCompleted ? now : null,
    updatedAt: now
  });

  // XP Reward
  if (newCompleted) {
    // Basic anti-farming: check if task title was completed recently (simplified)
    // For now, just give XP.
    await gainXP(userId, 50, 'discipline');
  }

  // Update goals of type 'tasks_completed'
  if (newCompleted) {
    const goalsRef = collection(db, 'goals');
    const q = query(goalsRef, where('userId', '==', userId), where('type', '==', 'tasks_completed'), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    
    for (const goalDoc of snapshot.docs) {
      const goal = { id: goalDoc.id, ...goalDoc.data() } as Goal;
      const newCurrentValue = goal.current_value + 1;
      const newStatus = newCurrentValue >= goal.target_value ? 'completed' : 'active';
      
      await updateGoal(goal.id!, {
        current_value: newCurrentValue,
        status: newStatus,
        updatedAt: now
      });
    }
  } else {
    // If task was un-completed, decrement goal progress
    const goalsRef = collection(db, 'goals');
    const q = query(goalsRef, where('userId', '==', userId), where('type', '==', 'tasks_completed'));
    const snapshot = await getDocs(q);
    
    for (const goalDoc of snapshot.docs) {
      const goal = { id: goalDoc.id, ...goalDoc.data() } as Goal;
      if (goal.current_value > 0) {
        await updateGoal(goal.id!, {
          current_value: goal.current_value - 1,
          status: 'active', // Re-activate if it was completed
          updatedAt: now
        });
      }
    }
  }
};
export const subscribeTasks = (userId: string, callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, 'tasks'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    callback(tasks);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'tasks'));
};

// Routines
export const createRoutine = (routine: Routine) => createDoc<Routine>('routines', routine);
export const updateRoutine = (id: string, routine: Partial<Routine>) => updateDocument<Routine>('routines', id, routine);
export const deleteRoutine = (id: string) => deleteDocument('routines', id);
export const subscribeRoutines = (userId: string, callback: (routines: Routine[]) => void) => {
  const q = query(collection(db, 'routines'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const routines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Routine));
    callback(routines);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'routines'));
};

// Habits
export const createHabit = (habit: Habit) => createDoc<Habit>('habits', habit);
export const updateHabit = (id: string, habit: Partial<Habit>) => updateDocument<Habit>('habits', id, habit);
export const deleteHabit = (id: string) => deleteDocument('habits', id);
export const subscribeHabits = (userId: string, callback: (habits: Habit[]) => void) => {
  const q = query(collection(db, 'habits'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Habit));
    callback(habits);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'habits'));
};

// Alarms
export const createAlarm = (alarm: Alarm) => createDoc<Alarm>('alarms', alarm);
export const updateAlarm = (id: string, alarm: Partial<Alarm>) => updateDocument<Alarm>('alarms', id, alarm);
export const deleteAlarm = (id: string) => deleteDocument('alarms', id);
export const subscribeAlarms = (userId: string, callback: (alarms: Alarm[]) => void) => {
  const q = query(collection(db, 'alarms'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const alarms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alarm));
    callback(alarms);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'alarms'));
};

// Goals
export const createGoal = (goal: Goal) => createDoc<Goal>('goals', goal);
export const updateGoal = (id: string, goal: Partial<Goal>) => updateDocument<Goal>('goals', id, goal);
export const deleteGoal = (id: string) => deleteDocument('goals', id);
export const subscribeGoals = (userId: string, callback: (goals: Goal[]) => void) => {
  const q = query(collection(db, 'goals'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
    callback(goals);
  }, (error) => handleFirestoreError(error, OperationType.LIST, 'goals'));
};

// Settings
export const updateSettings = (userId: string, settings: Partial<UserSettings>) => {
  const docRef = doc(db, 'settings', userId);
  return setDoc(docRef, settings, { merge: true }).catch(error => handleFirestoreError(error, OperationType.WRITE, `settings/${userId}`));
};
export const subscribeSettings = (userId: string, callback: (settings: UserSettings) => void) => {
  return onSnapshot(doc(db, 'settings', userId), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as UserSettings);
    }
  }, (error) => handleFirestoreError(error, OperationType.GET, `settings/${userId}`));
};
