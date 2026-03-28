/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Habit } from '../types';
import { subscribeHabits, createHabit, updateHabit, deleteHabit, toggleHabitCompletion } from '../services/firebaseService';
import { Plus, Flame, Trash2, CheckCircle2, Circle, X, Sparkles, TrendingUp, Award, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Header from '../components/Header';

interface HabitsScreenProps {
  user: User;
  isLocked?: boolean;
}

export default function HabitsScreen({ user, isLocked }: HabitsScreenProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitFrequency, setNewHabitFrequency] = useState('daily');

  useEffect(() => {
    const unsub = subscribeHabits(user.uid, setHabits);
    return () => unsub();
  }, [user.uid]);

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    const habit: Habit = {
      userId: user.uid,
      title: newHabitTitle,
      frequency: newHabitFrequency as any,
      currentStreak: 0,
      bestStreak: 0,
      lastCompleted: null,
      completedToday: false,
      logs: [],
      createdAt: new Date().toISOString()
    };

    await createHabit(habit);
    setNewHabitTitle('');
    setIsAdding(false);
  };

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-900 rounded-[40px] flex items-center justify-center shadow-sm border border-slate-200 dark:border-zinc-800">
          <Zap className="w-12 h-12 text-slate-300 dark:text-zinc-700" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Feature Locked</h2>
          <p className="text-slate-500 dark:text-zinc-400 font-medium max-w-xs mx-auto">
            Reach a higher level to unlock Habit Tracking and start building your streaks!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950">
      <Header 
        title="Habits" 
        subtitle={`${habits.length} active streaks`}
        rightElement={
          <button
            onClick={() => setIsAdding(true)}
            className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-90"
          >
            <Plus className="w-6 h-6" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide pb-32">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Best Streak</span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {habits.length > 0 ? Math.max(...habits.map(h => h.bestStreak || 0)) : 0}
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-indigo-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Habits</span>
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{habits.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {habits.map((habit) => (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-6 bg-white dark:bg-zinc-900 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                    habit.completedToday 
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" 
                      : "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
                  )}>
                    <Flame className={cn("w-7 h-7", habit.completedToday ? "animate-pulse" : "")} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-zinc-200 tracking-tight">{habit.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{habit.frequency}</span>
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="text-xs font-black text-orange-500">{habit.currentStreak} Day Streak</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleHabitCompletion(habit)}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 border-2",
                      habit.completedToday 
                        ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30" 
                        : "bg-transparent border-slate-100 dark:border-zinc-800 text-slate-300 hover:border-emerald-500 hover:text-emerald-500"
                    )}
                  >
                    {habit.completedToday ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={() => deleteHabit(habit.id!)}
                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all active:scale-90"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {habits.length === 0 && (
            <div className="text-center py-24 px-6">
              <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100 dark:border-zinc-800">
                <TrendingUp className="w-10 h-10 text-slate-300 dark:text-zinc-700" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-200 mb-2">Start a Streak</h3>
              <p className="text-slate-400 dark:text-zinc-500 font-medium">Build positive habits and track your progress daily.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Habit Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] p-8 sm:p-10 shadow-2xl border border-white/20 dark:border-zinc-800/50"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl">
                    <Sparkles className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">New Habit</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Build your discipline</p>
                  </div>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl transition-all active:scale-90">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddHabit} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">What's the habit?</label>
                  <input
                    type="text"
                    placeholder="e.g., Drink 2L Water, Read 20 mins"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    className="w-full p-5 bg-slate-50 dark:bg-zinc-800/50 rounded-[24px] border border-slate-100 dark:border-zinc-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-lg"
                    autoFocus
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Frequency</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['daily', 'weekly'].map(freq => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setNewHabitFrequency(freq)}
                        className={cn(
                          "py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border",
                          newHabitFrequency === freq 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 border-indigo-500" 
                            : "bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-100 dark:border-zinc-800"
                        )}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Start Streak
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
