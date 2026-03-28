/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Task, Routine, Habit, UserSettings, Goal, AdminConfig } from '../types';
import { Plus, Sparkles, CheckCircle2, Circle, Clock, Flame, TrendingUp, ChevronRight, LayoutGrid, Zap, Award, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import { subscribeTasks, subscribeRoutines, subscribeGoals, subscribeHabits } from '../services/firebaseService';

interface DashboardProps {
  user: User;
  setActiveTab: (tab: any) => void;
  adminConfig: AdminConfig | null;
  settings: UserSettings | null;
}

export default function Dashboard({ user, setActiveTab, adminConfig, settings: initialSettings }: DashboardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(initialSettings);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubTasks = subscribeTasks(user.uid, setTasks);
    const unsubRoutines = subscribeRoutines(user.uid, setRoutines);
    const unsubGoals = subscribeGoals(user.uid, setGoals);
    const unsubHabits = subscribeHabits(user.uid, setHabits);

    return () => {
      unsubTasks();
      unsubRoutines();
      unsubGoals();
      unsubHabits();
    };
  }, [user]);

  const todayTasks = (tasks || []).filter(t => !t.completed);
  const activeRoutine = (routines || []).find(r => r.isActive);
  const topHabits = (habits || []).slice(0, 3);

  return (
    <div className="min-h-full">
      <Header 
        title={`Hello, ${user.displayName?.split(' ')[0] || 'User'}`}
        subtitle={format(new Date(), 'EEEE, MMMM do')}
        rightElement={
          <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white dark:border-zinc-800 shadow-sm">
            <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} alt="Profile" referrerPolicy="no-referrer" />
          </div>
        }
      />

      <div className="p-6 space-y-8">
        {/* Level & XP Bar */}
        {settings && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-slate-100 dark:border-zinc-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-zinc-200">Level {settings.level || 1}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{settings.xp || 0} XP</p>
                </div>
              </div>
              <button onClick={() => setActiveTab('progress')} className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                Details
              </button>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(settings?.level || 1) > 0 ? ((settings?.xp || 0) / ((settings?.level || 1) * 1000)) * 100 : 0}%` }}
                className="h-full bg-indigo-600 rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Smart Planner Quick Action */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('routines')}
          className="w-full p-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[32px] text-white shadow-2xl shadow-indigo-500/20 flex items-center justify-between overflow-hidden relative group"
        >
          <div className="relative z-10 text-left">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-white/20 backdrop-blur-md rounded-lg">
                <Sparkles className="w-4 h-4 text-indigo-100" />
              </div>
              <span className="text-[10px] font-bold text-indigo-100 uppercase tracking-[0.2em]">Smart Planner</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight">Build your day with Ease</h2>
            <p className="text-indigo-100/70 text-sm mt-1 font-medium">Optimize your schedule in seconds</p>
          </div>
          <div className="relative z-10 bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/10 group-hover:bg-white/20 transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full -ml-16 -mb-16 blur-2xl" />
        </motion.button>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            label="Tasks Left"
            value={todayTasks.length.toString()}
            color="emerald"
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            label="Habit Streak"
            value={habits.length > 0 ? Math.max(...habits.map(h => h.currentStreak || 0)).toString() : "0"}
            color="orange"
          />
        </div>

        {/* Goals Preview */}
        {goals.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Top Goals</h3>
              </div>
              <button onClick={() => setActiveTab('goals')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {goals.slice(0, 2).map(goal => (
                <div key={goal.id} className="bg-white dark:bg-zinc-900 p-4 rounded-[24px] border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-200">{goal.title}</p>
                      <div className="w-32 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-indigo-600" style={{ width: `${goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-indigo-600">{goal.target_value > 0 ? Math.round((goal.current_value / goal.target_value) * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Routine Preview */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Active Routine</h3>
            </div>
            <button onClick={() => setActiveTab('routines')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {activeRoutine ? (
            <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-slate-100/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h4 className="font-black text-slate-800 dark:text-zinc-200 text-lg tracking-tight">{activeRoutine.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Current Schedule</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 rounded-xl text-[10px] font-bold font-mono text-slate-500">
                  <Clock className="w-3 h-3" />
                  {(activeRoutine.tasks || []).length} Tasks
                </div>
              </div>
              <div className="space-y-4 max-h-72 overflow-y-auto scrollbar-hide pr-1">
                {(activeRoutine.tasks || []).map((task, idx) => (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="relative flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/10" />
                      {idx < (activeRoutine.tasks || []).length - 1 && (
                        <div className="w-0.5 h-10 bg-slate-100 dark:bg-zinc-800 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 truncate group-hover:text-indigo-600 transition-colors">{task.title}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                        {task.mode === 'fixed' ? task.start_time : `${task.duration_minutes}m`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 dark:bg-zinc-900/50 rounded-[32px] p-10 text-center border-2 border-dashed border-slate-200 dark:border-zinc-800/50">
              <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <LayoutGrid className="w-8 h-8 text-slate-300 dark:text-zinc-700" />
              </div>
              <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium">No active routine for today</p>
              <button onClick={() => setActiveTab('routines')} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all">+ Create One</button>
            </div>
          )}
        </section>

        {/* Habits Preview */}
        <section className="space-y-4 pb-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Daily Habits</h3>
            </div>
            <button onClick={() => setActiveTab('habits')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              Track <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {topHabits.map((habit) => (
              <motion.div 
                key={habit.id} 
                whileHover={{ x: 4 }}
                className="flex items-center justify-between p-5 bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-100/50 dark:border-zinc-800/50 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 dark:text-zinc-200 tracking-tight">{habit.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{habit.currentStreak} day streak</p>
                  </div>
                </div>
                <button className="w-10 h-10 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-500 transition-all group active:scale-90">
                  <CheckCircle2 className="w-6 h-6 text-transparent group-hover:text-emerald-500 transition-colors" />
                </button>
              </motion.div>
            ))}
            {habits.length === 0 && (
              <p className="text-center text-slate-400 dark:text-zinc-500 text-sm py-8 font-medium">Start tracking your first habit!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-slate-100/50 dark:border-zinc-800/50 shadow-sm flex flex-col gap-4 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/50">
          {icon}
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-zinc-800/50 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-slate-300 dark:text-zinc-700" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-[0.15em] mt-1">{label}</p>
      </div>
    </div>
  );
}
