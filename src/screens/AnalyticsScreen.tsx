/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeSettings, subscribeTasks, subscribeRoutines, subscribeGoals } from '../services/firebaseService';
import { UserSettings, Task, Routine, Goal } from '../types';
import { Brain, Zap, Flame, Target, TrendingUp, Award, ChevronRight, Sparkles, LayoutGrid, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { cn } from '../lib/utils';
import Header from '../components/Header';

interface AnalyticsScreenProps {
  user: User;
}

export default function AnalyticsScreen({ user }: AnalyticsScreenProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const unsubSettings = subscribeSettings(user.uid, setSettings);
    const unsubTasks = subscribeTasks(user.uid, setTasks);
    const unsubRoutines = subscribeRoutines(user.uid, setRoutines);
    const unsubGoals = subscribeGoals(user.uid, setGoals);
    return () => {
      unsubSettings();
      unsubTasks();
      unsubRoutines();
      unsubGoals();
    };
  }, [user.uid]);

  if (!settings) return null;

  const level = settings?.level || 1;
  const xp = settings?.xp || 0;
  const xpToNextLevel = Math.pow(level, 2) * 100;
  const progress = xpToNextLevel > 0 ? Math.min((xp / xpToNextLevel) * 100, 100) : 0;

  const skillData = [
    { name: 'Discipline', value: settings?.skills?.discipline || 1, color: '#6366f1' },
    { name: 'Fitness', value: settings?.skills?.fitness || 1, color: '#f43f5e' },
    { name: 'Focus', value: settings?.skills?.focus || 1, color: '#10b981' },
  ];

  const taskStats = [
    { name: 'Completed', value: (tasks || []).filter(t => t?.completed).length || 0 },
    { name: 'Pending', value: (tasks || []).filter(t => !t?.completed).length || 0 },
  ];

  const motivationalMessage = () => {
    const totalTasks = (tasks || []).length;
    const completedTasks = (tasks || []).filter(t => t?.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    if (completionRate > 80) return "You're absolutely crushing it! Keep that momentum going.";
    if (completionRate > 50) return "Great progress today. A little more effort and you'll reach your peak.";
    return "Don't be discouraged. Every small step counts towards your ultimate goal.";
  };

  return (
    <div className="min-h-full">
      <Header 
        title="Progress"
        subtitle="Your journey to excellence"
        rightElement={
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
            <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-black text-indigo-600 dark:text-indigo-400">Lv. {level}</span>
          </div>
        }
      />

      <div className="p-6 space-y-8 pb-20">
        {/* Level Progress */}
        <section className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 border border-slate-100 dark:border-zinc-800 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-3xl font-black text-slate-800 dark:text-zinc-200 tracking-tighter">Level {level}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Overall Mastery</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">{xp} / {xpToNextLevel} XP</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">To Next Level</p>
              </div>
            </div>
            
            <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-8">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full shadow-lg shadow-indigo-500/20"
              />
            </div>

            <div className="p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-[32px] border border-slate-100 dark:border-zinc-700">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm">
                  <Sparkles className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-zinc-300 leading-relaxed italic">
                    "{motivationalMessage()}"
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        </section>

        {/* Skills Radar-like Grid */}
        <section className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight px-1">Skill Distribution</h3>
          <div className="grid grid-cols-3 gap-4">
            {skillData.map((skill) => (
              <div key={skill.name} className="bg-white dark:bg-zinc-900 p-5 rounded-[32px] border border-slate-100 dark:border-zinc-800 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${skill.color}15`, color: skill.color }}>
                  {skill.name === 'Discipline' ? <Award className="w-6 h-6" /> : skill.name === 'Fitness' ? <Zap className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-xl font-black text-slate-800 dark:text-zinc-200">{skill.value}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{skill.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task Completion Chart */}
          <section className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 border border-slate-100 dark:border-zinc-800 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Task Efficiency</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-xs font-bold text-slate-500">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-200" />
                <span className="text-xs font-bold text-slate-500">Pending</span>
              </div>
            </div>
          </section>

          {/* Goal Progress Chart */}
          <section className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 border border-slate-100 dark:border-zinc-800 shadow-sm space-y-6">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Goal Milestones</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={goals.slice(0, 5)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="title" hide />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="current_value" fill="#6366f1" radius={[10, 10, 10, 10]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Active Goals Progress</p>
          </section>
        </div>
      </div>
    </div>
  );
}
