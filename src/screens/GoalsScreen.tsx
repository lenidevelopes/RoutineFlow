/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from '../firebase';
import { subscribeGoals, createGoal, deleteGoal } from '../services/firebaseService';
import { Goal, GoalType } from '../types';
import { Plus, Target, Trophy, Trash2, X, CheckCircle2, LayoutGrid, Flame, Zap, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Header from '../components/Header';

interface GoalsScreenProps {
  user: User;
}

export default function GoalsScreen({ user }: GoalsScreenProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalType, setNewGoalType] = useState<GoalType>('tasks_completed');
  const [newGoalTarget, setNewGoalTarget] = useState(10);

  useEffect(() => {
    const unsub = subscribeGoals(user.uid, setGoals);
    return () => unsub();
  }, [user.uid]);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: Goal = {
      userId: user.uid,
      title: newGoalTitle,
      type: newGoalType,
      target_value: newGoalTarget,
      current_value: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await createGoal(newGoal);
    setNewGoalTitle('');
    setNewGoalType('tasks_completed');
    setNewGoalTarget(10);
    setIsAdding(false);
  };

  return (
    <div className="min-h-full">
      <Header 
        title="Goals"
        subtitle="Track your long-term progress"
        rightElement={
          <button
            onClick={() => setIsAdding(true)}
            className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-90"
          >
            <Plus className="w-6 h-6" />
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Goals Grid */}
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onDelete={() => { deleteGoal(goal.id!); }} />
            ))}
          </AnimatePresence>
          
          {goals.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-900 rounded-[32px] flex items-center justify-center mx-auto mb-4">
                <Target className="w-10 h-10 text-slate-300 dark:text-zinc-700" />
              </div>
              <p className="text-slate-400 dark:text-zinc-500 font-medium">No goals set yet</p>
              <button 
                onClick={() => setIsAdding(true)}
                className="mt-4 text-indigo-600 font-bold text-sm hover:underline"
              >
                Set your first goal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full mt-3 sm:hidden" />
              
              <div className="flex items-center justify-between mb-8 mt-2">
                <h2 className="text-2xl font-black tracking-tight">Set Goal</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Goal Title</p>
                  <input
                    autoFocus
                    type="text"
                    placeholder="e.g. Master Productivity"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    className="w-full text-xl font-bold bg-transparent border-none outline-none placeholder:text-slate-200 dark:placeholder:text-zinc-800"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Type</p>
                  <div className="grid grid-cols-2 gap-3">
                    <TypeOption 
                      active={newGoalType === 'tasks_completed'} 
                      icon={<CheckCircle2 className="w-5 h-5" />} 
                      label="Tasks" 
                      onClick={() => setNewGoalType('tasks_completed')} 
                    />
                    <TypeOption 
                      active={newGoalType === 'routines_completed'} 
                      icon={<Zap className="w-5 h-5" />} 
                      label="Routines" 
                      onClick={() => setNewGoalType('routines_completed')} 
                    />
                    <TypeOption 
                      active={newGoalType === 'habit_streak'} 
                      icon={<Flame className="w-5 h-5" />} 
                      label="Habit Streak" 
                      onClick={() => setNewGoalType('habit_streak')} 
                    />
                    <TypeOption 
                      active={newGoalType === 'xp_earned'} 
                      icon={<Brain className="w-5 h-5" />} 
                      label="XP Earned" 
                      onClick={() => setNewGoalType('xp_earned')} 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Target Value</p>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="1"
                      max={newGoalType === 'xp_earned' ? 5000 : 100}
                      step={newGoalType === 'xp_earned' ? 100 : 1}
                      value={newGoalTarget}
                      onChange={(e) => setNewGoalTarget(parseInt(e.target.value))}
                      className="flex-1 accent-indigo-600"
                    />
                    <span className="w-16 text-center font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 py-2 rounded-xl">
                      {newGoalTarget}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Set Goal
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface GoalCardProps {
  goal: Goal;
  onDelete: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onDelete }) => {
  const progress = goal.target_value > 0 ? Math.min(100, (goal.current_value / goal.target_value) * 100) : 0;
  
  const typeIcons: Record<string, React.ReactNode> = {
    tasks_completed: <CheckCircle2 className="w-5 h-5" />,
    routines_completed: <Zap className="w-5 h-5" />,
    habit_streak: <Flame className="w-5 h-5" />,
    xp_earned: <Brain className="w-5 h-5" />,
    time_spent: <Brain className="w-5 h-5" />
  };

  const typeLabels: Record<string, string> = {
    tasks_completed: "Tasks",
    routines_completed: "Routines",
    habit_streak: "Streak",
    xp_earned: "XP",
    time_spent: "Time"
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 border border-slate-100 dark:border-zinc-800 shadow-sm group"
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            {typeIcons[goal.type]}
          </div>
          <div>
            <h3 className="font-black text-slate-800 dark:text-zinc-200 tracking-tight">{goal.title}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{typeLabels[goal.type]} Goal</p>
          </div>
        </div>
        <button onClick={onDelete} className="p-2 text-slate-300 dark:text-zinc-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-black text-slate-800 dark:text-zinc-200">
            {goal.current_value} <span className="text-sm text-slate-400 font-bold">/ {goal.target_value}</span>
          </span>
          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{Math.round(progress)}%</span>
        </div>
        
        <div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={cn(
              "h-full rounded-full",
              progress >= 100 ? "bg-emerald-500" : "bg-indigo-600"
            )}
          />
        </div>
      </div>

      {goal.status === 'completed' && (
        <div className="mt-4 flex items-center gap-2 text-emerald-500">
          <Trophy className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.1em]">Goal Achieved!</span>
        </div>
      )}
    </motion.div>
  );
}

function TypeOption({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all",
        active 
          ? "bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-400 scale-105" 
          : "bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-400"
      )}
    >
      {icon}
      <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
    </button>
  );
}
