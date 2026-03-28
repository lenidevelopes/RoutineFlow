/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { subscribeAlarms, createAlarm, updateAlarm, deleteAlarm } from '../services/firebaseService';
import { Alarm } from '../types';
import { Plus, Trash2, Bell, BellOff, Clock, X, Check, AlertCircle, ChevronUp, ChevronDown, Music, Youtube, Video, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import { formatMinutesTo12h, parse12hToMinutes } from '../lib/timeUtils';

interface AlarmsScreenProps {
  user: any;
  isLocked?: boolean;
}

export default function AlarmsScreen({ user, isLocked }: AlarmsScreenProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Custom time picker state
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [newLabel, setNewLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [customType, setCustomType] = useState<'tiktok' | 'youtube' | 'mp3' | 'song_name' | 'none'>('none');
  const [customValue, setCustomValue] = useState('');

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    const unsub = subscribeAlarms(user.uid, setAlarms);
    return () => unsub();
  }, [user.uid]);

  const handleAddAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
    
    const alarm: Alarm = {
      userId: user.uid,
      time: formattedTime,
      label: newLabel || 'Alarm',
      isActive: true,
      days: selectedDays,
      createdAt: new Date().toISOString(),
      customSource: customType !== 'none' ? { type: customType, value: customValue } : undefined
    };
    await createAlarm(alarm);
    setIsAdding(false);
    setNewLabel('');
    setHour(7);
    setMinute(0);
    setPeriod('AM');
    setCustomType('none');
    setCustomValue('');
  };

  const toggleAlarm = (alarm: Alarm) => {
    updateAlarm(alarm.id!, { isActive: !alarm.isActive });
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-900 rounded-[40px] flex items-center justify-center shadow-sm border border-slate-200 dark:border-zinc-800">
          <Bell className="w-12 h-12 text-slate-300 dark:text-zinc-700" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Feature Locked</h2>
          <p className="text-slate-500 dark:text-zinc-400 font-medium max-w-xs mx-auto">
            Reach a higher level to unlock Alarms and start mastering your wake-up routine!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950">
      <Header 
        title="Alarms" 
        subtitle={`${alarms.filter(a => a.isActive).length} active`}
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
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {alarms.map((alarm) => (
              <motion.div
                key={alarm.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={cn(
                  "p-6 sm:p-8 rounded-[32px] border transition-all flex flex-col sm:flex-row sm:items-center justify-between relative overflow-hidden group gap-6",
                  alarm.isActive 
                    ? "bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 shadow-sm" 
                    : "bg-slate-100/50 dark:bg-zinc-900/30 border-transparent opacity-50 grayscale-[0.5]"
                )}
              >
                {alarm.isActive && (
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500" />
                )}
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black font-mono tracking-tighter text-slate-900 dark:text-white tabular-nums">
                      {alarm.time}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{alarm.label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {alarm.customSource && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-[9px] font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30">
                        {alarm.customSource.type === 'youtube' && <Youtube className="w-3 h-3" />}
                        {alarm.customSource.type === 'tiktok' && <Video className="w-3 h-3" />}
                        {alarm.customSource.type === 'mp3' && <Music className="w-3 h-3" />}
                        {alarm.customSource.type === 'song_name' && <Search className="w-3 h-3" />}
                        {alarm.customSource.type.replace('_', ' ')}
                      </div>
                    )}
                    {days.map(day => (
                      <div 
                        key={day} 
                        className={cn(
                          "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-[9px] sm:text-[10px] font-black transition-all border",
                          alarm.days.includes(day) 
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30" 
                            : "bg-transparent text-slate-300 dark:text-zinc-700 border-transparent"
                        )}
                      >
                        {day[0]}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 relative z-10 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent('TEST_ALARM'))}
                      className="p-3 text-slate-300 dark:text-zinc-700 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl transition-all active:scale-90"
                      title="Test Alarm"
                    >
                      <Bell className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => deleteAlarm(alarm.id!)}
                      className="p-3 text-slate-300 dark:text-zinc-700 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => toggleAlarm(alarm)}
                    className={cn(
                      "w-14 h-8 rounded-full p-1.5 transition-all duration-500",
                      alarm.isActive ? "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "bg-slate-200 dark:bg-zinc-800"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-sm",
                      alarm.isActive ? "translate-x-6" : "translate-x-0"
                    )} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {alarms.length === 0 && (
            <div className="text-center py-24 px-6">
              <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-[40px] flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100 dark:border-zinc-800">
                <BellOff className="w-10 h-10 text-slate-300 dark:text-zinc-700" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-zinc-200 mb-2">Silence is Golden</h3>
              <p className="text-slate-400 dark:text-zinc-500 font-medium">No alarms set for your current schedule.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Alarm Modal */}
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
                  <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl">
                    <Clock className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">New Alarm</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Time to wake up</p>
                  </div>
                </div>
                <button onClick={() => setIsAdding(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl transition-all active:scale-90">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleAddAlarm} className="space-y-8 overflow-y-auto max-h-[70vh] pr-2 scrollbar-hide">
                {/* Custom Time Picker */}
                <div className="flex items-center justify-center gap-4 py-4">
                  <div className="flex flex-col items-center gap-2">
                    <button type="button" onClick={() => setHour(h => h === 12 ? 1 : h + 1)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                      <ChevronUp className="w-6 h-6" />
                    </button>
                    <div className="text-5xl font-black font-mono tracking-tighter tabular-nums text-indigo-600 dark:text-indigo-400">
                      {hour.toString().padStart(2, '0')}
                    </div>
                    <button type="button" onClick={() => setHour(h => h === 1 ? 12 : h - 1)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                      <ChevronDown className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="text-4xl font-black text-slate-300">:</div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <button type="button" onClick={() => setMinute(m => (m + 5) % 60)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                      <ChevronUp className="w-6 h-6" />
                    </button>
                    <div className="text-5xl font-black font-mono tracking-tighter tabular-nums text-indigo-600 dark:text-indigo-400">
                      {minute.toString().padStart(2, '0')}
                    </div>
                    <button type="button" onClick={() => setMinute(m => (m - 5 + 60) % 60)} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                      <ChevronDown className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button 
                      type="button"
                      onClick={() => setPeriod('AM')}
                      className={cn(
                        "px-4 py-2 rounded-xl font-black text-xs transition-all",
                        period === 'AM' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                      )}
                    >
                      AM
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPeriod('PM')}
                      className={cn(
                        "px-4 py-2 rounded-xl font-black text-xs transition-all",
                        period === 'PM' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100 dark:bg-zinc-800 text-slate-400"
                      )}
                    >
                      PM
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Custom Alarm Source</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'none', label: 'Default', icon: <Bell className="w-4 h-4" /> },
                      { id: 'tiktok', label: 'TikTok', icon: <Video className="w-4 h-4" /> },
                      { id: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
                      { id: 'mp3', label: 'MP3 URL', icon: <Music className="w-4 h-4" /> },
                      { id: 'song_name', label: 'Song', icon: <Search className="w-4 h-4" /> },
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setCustomType(type.id as any)}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all",
                          customType === type.id 
                            ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400" 
                            : "bg-slate-50 dark:bg-zinc-800 border-transparent text-slate-400"
                        )}
                      >
                        {type.icon}
                        <span className="text-[9px] font-black uppercase">{type.label}</span>
                      </button>
                    ))}
                  </div>
                  
                  {customType !== 'none' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-2"
                    >
                      <input
                        type="text"
                        placeholder={
                          customType === 'song_name' ? "Enter song name..." : 
                          customType === 'mp3' ? "Enter MP3 URL..." : 
                          `Enter ${customType} link...`
                        }
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Label</label>
                  <input
                    type="text"
                    placeholder="Wake up, Gym, etc."
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="w-full p-5 bg-slate-50 dark:bg-zinc-800/50 rounded-[24px] border border-slate-100 dark:border-zinc-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-lg"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Repeat Days</label>
                  <div className="flex justify-between gap-1 sm:gap-2">
                    {days.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={cn(
                          "w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center text-[10px] sm:text-xs font-black transition-all border",
                          selectedDays.includes(day) 
                            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 border-indigo-500" 
                            : "bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-100 dark:border-zinc-800"
                        )}
                      >
                        {day[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-500/40 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Set Alarm
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
