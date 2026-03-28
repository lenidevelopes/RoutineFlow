/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeRoutines, subscribeTasks } from '../services/firebaseService';
import { Routine, Task } from '../types';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval as eachDayOfIntervalFns } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Header from '../components/Header';

interface CalendarScreenProps {
  user: User;
}

export default function CalendarScreen({ user }: CalendarScreenProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const unsubRoutines = subscribeRoutines(user.uid, setRoutines);
    const unsubTasks = subscribeTasks(user.uid, setTasks);
    return () => {
      unsubRoutines();
      unsubTasks();
    };
  }, [user.uid]);

  const weekStart = startOfWeek(selectedDate);
  const weekEnd = endOfWeek(selectedDate);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const activeRoutine = routines.find(r => r.isActive);
  const dayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), selectedDate));

  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950">
      <Header 
        title={format(selectedDate, 'MMMM yyyy')}
        subtitle="Schedule & Time Blocking"
        rightElement={
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, -7))} 
              className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-90"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setSelectedDate(addDays(selectedDate, 7))} 
              className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-90"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-32">
        {/* Week View */}
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-[24px] transition-all relative group",
                  isSelected 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 scale-105 z-10" 
                    : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border border-slate-100 dark:border-zinc-800 hover:border-indigo-500/30"
                )}
              >
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em]",
                  isSelected ? "text-indigo-100" : "text-slate-400"
                )}>
                  {format(day, 'EEE')}
                </span>
                <span className={cn(
                  "text-xl font-black tracking-tighter",
                  isToday && !isSelected && "text-indigo-600 dark:text-indigo-400"
                )}>
                  {format(day, 'd')}
                </span>
                {isToday && !isSelected && (
                  <div className="absolute bottom-2 w-1 h-1 bg-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Time Blocking View */}
        <div className="bg-white dark:bg-zinc-900 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none overflow-hidden flex flex-col h-[700px]">
          <div className="p-8 border-b border-slate-50 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50 backdrop-blur-md">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-200 tracking-tight">
                {format(selectedDate, 'EEEE, MMM do')}
              </h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Daily Timeline</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Optimized</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-0 relative scrollbar-hide">
            {hours.map((hour) => (
              <div key={hour} className="flex gap-8 h-24 border-t border-slate-50 dark:border-zinc-800/50 first:border-t-0 relative">
                <div className="w-16 text-xs font-black font-mono text-slate-400 pt-4 tracking-tighter">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 relative">
                  {/* Routine Tasks for this hour */}
                  {activeRoutine?.blocks.map(block => 
                    block.tasks.map((task, idx) => {
                      const startHour = parseInt(task.start_time.split(':')[0]);
                      const startMin = parseInt(task.start_time.split(':')[1]);
                      if (startHour === hour) {
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="absolute left-0 right-0 bg-indigo-50/80 dark:bg-indigo-900/30 border-l-[6px] border-indigo-500 p-4 rounded-r-3xl z-10 shadow-sm backdrop-blur-sm group hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
                            style={{ 
                              top: `${(startMin / 60) * 100}%`, 
                              height: `${Math.max(60, (task.duration_min / 60) * 96)}px` 
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-black text-indigo-900 dark:text-indigo-100 truncate leading-tight">
                                  {task.title}
                                </p>
                                <p className="text-[10px] font-bold text-indigo-500/80 font-mono mt-1 uppercase tracking-widest">
                                  {task.start_time} - {task.end_time}
                                </p>
                              </div>
                              <div className="p-1.5 bg-white/50 dark:bg-zinc-800/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <Clock className="w-3 h-3 text-indigo-500" />
                              </div>
                            </div>
                          </motion.div>
                        );
                      }
                      return null;
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
