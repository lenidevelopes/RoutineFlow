import React, { useState, useEffect, useMemo } from 'react';
import { User } from '../firebase';
import { subscribeRoutines, createRoutine, updateRoutine, deleteRoutine } from '../services/firebaseService';
import { generateRoutine } from '../services/geminiService';
import { Routine, RoutineTask, RoutineType } from '../types';
import { 
  Plus, Sparkles, Clock, Trash2, Edit2, ChevronRight, X, Check, 
  Loader2, AlertCircle, Play, Pause, Repeat, ArrowLeft, ArrowRight,
  LayoutGrid, Sun, BookOpen, Dumbbell, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import { formatMinutesTo12h, parse12hToMinutes, addMinutesTo12h } from '../lib/timeUtils';

interface RoutinesScreenProps {
  user: User;
}

export default function RoutinesScreen({ user }: RoutinesScreenProps) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isAiBuilding, setIsAiBuilding] = useState(false);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    const unsub = subscribeRoutines(user.uid, setRoutines);
    return () => unsub();
  }, [user.uid]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this routine?')) {
      await deleteRoutine(id);
    }
  };

  return (
    <div className="min-h-full pb-32 bg-slate-50 dark:bg-zinc-950">
      <Header 
        title="Routines" 
        subtitle="Your Daily Flow"
        rightElement={
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddingManual(true)}
              className="p-3 bg-white dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 rounded-2xl border border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsAiBuilding(true)}
              className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">AI Build</span>
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {routines.length === 0 && !isAiBuilding && !isAddingManual ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Repeat className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No routines yet</h3>
            <p className="text-slate-400 dark:text-zinc-500 mb-8 max-w-xs mx-auto">Build your first routine with AI or manually to start optimizing your day.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-6">
              <button 
                onClick={() => setIsAiBuilding(true)}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" /> Smart Build
              </button>
              <button 
                onClick={() => setIsAddingManual(true)}
                className="px-8 py-4 bg-white dark:bg-zinc-800 text-slate-700 dark:text-white border border-slate-200 dark:border-zinc-700 rounded-2xl font-bold"
              >
                Manual Build
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {routines.map((routine) => (
              <RoutineListItem 
                key={routine.id} 
                routine={routine} 
                onStart={() => setActiveRoutine(routine)}
                onDelete={() => handleDelete(routine.id!)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isAiBuilding && (
          <AiBuilder 
            user={user} 
            onClose={() => setIsAiBuilding(false)} 
            onSave={() => setIsAiBuilding(false)}
          />
        )}
        {isAddingManual && (
          <ManualBuilder 
            user={user} 
            onClose={() => setIsAddingManual(false)} 
          />
        )}
        {activeRoutine && (
          <RoutineExecution 
            routine={activeRoutine} 
            onClose={() => setActiveRoutine(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const RoutineListItem: React.FC<{ routine: Routine, onStart: () => void, onDelete: () => void | Promise<void> }> = ({ routine, onStart, onDelete }) => {
  const typeIcon = () => {
    switch (routine.type) {
      case 'morning': return <Sun className="w-5 h-5 text-amber-500" />;
      case 'school': return <BookOpen className="w-5 h-5 text-indigo-500" />;
      case 'evening': return <Clock className="w-5 h-5 text-slate-500" />;
      default: return <LayoutGrid className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <motion.div
      layout
      className="bg-white dark:bg-zinc-900 p-6 rounded-[32px] border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between group"
    >
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-sm">
          {typeIcon()}
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{routine.name}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {routine.tasks.length} Tasks • {routine.activeDays.length} Days
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onDelete}
          className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
        >
          <Trash2 className="w-5 h-5" />
        </button>
        <button 
          onClick={onStart}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-all"
        >
          Start <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function ManualBuilder({ user, onClose }: { user: User, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [type, setType] = useState<RoutineType>('morning');
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [activeDays, setActiveDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  
  // Task builder state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskMode, setTaskMode] = useState<'fixed' | 'duration'>('duration');
  const [taskStartTime, setTaskStartTime] = useState('07:00 AM');
  const [taskDuration, setTaskDuration] = useState(15);

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    
    const newTask: RoutineTask = {
      id: Math.random().toString(36).substr(2, 9),
      title: taskTitle,
      mode: taskMode,
      start_time: taskMode === 'fixed' ? taskStartTime : undefined,
      duration_minutes: taskDuration || 15,
      completed: false
    };
    
    setTasks([...tasks, newTask]);
    setTaskTitle('');
    setTaskMode('duration');
  };

  const handleSave = async () => {
    if (!name.trim() || tasks.length === 0) return;
    
    const routine: Routine = {
      userId: user.uid,
      name,
      type,
      activeDays,
      tasks,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await createRoutine(routine);
    onClose();
  };

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] p-8 sm:p-10 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black tracking-tight">Build Routine</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Routine Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Morning Power"
                className="w-full p-5 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl border border-slate-100 dark:border-zinc-800 outline-none font-bold text-lg"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Routine Type</label>
              <div className="grid grid-cols-2 gap-3">
                {['morning', 'school', 'evening', 'custom'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t as RoutineType)}
                    className={cn(
                      "p-4 rounded-2xl font-bold capitalize transition-all border",
                      type === t 
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" 
                        : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-100 dark:border-zinc-800"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Active Days</label>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])}
                    className={cn(
                      "w-12 h-12 rounded-2xl font-bold transition-all border",
                      activeDays.includes(day)
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-slate-50 dark:bg-zinc-800 text-slate-400 border-slate-100 dark:border-zinc-800"
                    )}
                  >
                    {day[0]}
                  </button>
                ))}
              </div>
            </div>
            <button 
              disabled={!name.trim()}
              onClick={() => setStep(2)}
              className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black text-lg shadow-xl active:scale-95 transition-all disabled:opacity-50"
            >
              Next: Add Tasks
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-[32px] border border-indigo-100/50 dark:border-indigo-900/20 space-y-5">
                <input 
                  type="text" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 outline-none font-bold"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setTaskMode('fixed')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold text-xs transition-all border",
                      taskMode === 'fixed' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-zinc-900 text-slate-400 border-indigo-50 dark:border-zinc-800"
                    )}
                  >
                    Fixed Time
                  </button>
                  <button 
                    onClick={() => setTaskMode('duration')}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-bold text-xs transition-all border",
                      taskMode === 'duration' ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-zinc-900 text-slate-400 border-indigo-50 dark:border-zinc-800"
                    )}
                  >
                    Duration
                  </button>
                </div>
                {taskMode === 'fixed' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Time</label>
                    <input 
                      type="text" 
                      value={taskStartTime}
                      onChange={(e) => setTaskStartTime(e.target.value)}
                      placeholder="07:00 AM"
                      className="w-full p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 outline-none font-bold"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration (minutes)</label>
                    <input 
                      type="number" 
                      value={taskDuration}
                      onChange={(e) => setTaskDuration(parseInt(e.target.value) || 0)}
                      className="w-full p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 outline-none font-bold"
                    />
                  </div>
                )}
                <button 
                  onClick={handleAddTask}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  Add Task
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Tasks ({tasks.length})</h4>
                <div className="space-y-2">
                  {tasks.map((t, idx) => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-zinc-200">{t.title}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {t.mode === 'fixed' ? t.start_time : `${t.duration_minutes} min`}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setTasks(tasks.filter(item => item.id !== t.id))} className="text-slate-300 hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className="flex-1 py-5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-3xl font-black text-lg active:scale-95 transition-all"
              >
                Back
              </button>
              <button 
                disabled={tasks.length === 0}
                onClick={handleSave}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50"
              >
                Save Routine
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function AiBuilder({ user, onClose, onSave }: { user: User, onClose: () => void, onSave: () => void }) {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preview, setPreview] = useState<Partial<Routine> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateRoutine(input);
      setPreview(result);
    } catch (err) {
      setError("Failed to generate. Try being more specific.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    const routine: Routine = {
      userId: user.uid,
      name: preview.name || 'AI Routine',
      type: preview.type || 'custom',
      activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      tasks: (preview.tasks || []).map(t => ({
        ...t,
        id: Math.random().toString(36).substr(2, 9),
        completed: false,
        duration_minutes: t.duration_minutes || 15
      })),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await createRoutine(routine);
    onSave();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] p-8 sm:p-10 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-indigo-500" />
            <h2 className="text-2xl font-black tracking-tight">Smart Builder</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!preview ? (
          <div className="space-y-6">
            <textarea
              autoFocus
              rows={5}
              placeholder="e.g., Wake up at 7 AM, gym for 45 mins, then breakfast and study for 2 hours..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl border border-slate-100 dark:border-zinc-800 outline-none font-medium text-lg resize-none"
            />
            {error && <p className="text-rose-500 text-sm font-bold text-center">{error}</p>}
            <button
              disabled={isGenerating || !input.trim()}
              onClick={handleGenerate}
              className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
              {isGenerating ? 'Optimizing...' : 'Generate Routine'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
              <h3 className="text-2xl font-black mb-1">{preview.name}</h3>
              <p className="text-indigo-100 text-sm font-bold uppercase tracking-widest">{preview.type} Routine</p>
            </div>
            
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preview Timeline</h4>
              <div className="space-y-3">
                {preview.tasks?.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800">
                    <div className="w-8 h-8 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 dark:text-zinc-200">{t.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {t.mode === 'fixed' ? t.start_time : `${t.duration_minutes} min`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setPreview(null)}
                className="flex-1 py-5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 rounded-3xl font-black text-lg active:scale-95 transition-all"
              >
                Edit
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-lg shadow-xl shadow-indigo-500/30 active:scale-95 transition-all"
              >
                Looks Good
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function RoutineExecution({ routine, onClose }: { routine: Routine, onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Calculate full timeline for display
  const timeline = useMemo(() => {
    let lastEndTime = "07:00 AM"; // Default fallback
    
    return routine.tasks.map((task, idx) => {
      let startTime = task.start_time;
      
      if (task.mode === 'duration' || !startTime) {
        startTime = lastEndTime;
      }
      
      const duration = task.duration_minutes || 15;
      const endTime = addMinutesTo12h(startTime, duration);
      lastEndTime = endTime;
      
      return {
        ...task,
        calculatedStart: startTime,
        calculatedEnd: endTime,
        duration
      };
    });
  }, [routine.tasks]);

  const currentTask = timeline[currentIdx];

  useEffect(() => {
    if (currentTask) {
      setTimeLeft(currentTask.duration * 60);
    }
  }, [currentIdx]);

  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isPaused, timeLeft]);

  const handleNext = () => {
    if (currentIdx < timeline.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentTask) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.15),transparent_70%)]" />
      
      <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90 z-10">
        <X className="w-6 h-6" />
      </button>

      <div className="w-full max-w-md space-y-12 text-center relative z-10">
        <div className="space-y-4">
          <p className="text-sm font-bold text-indigo-400 uppercase tracking-[0.3em]">
            Task {currentIdx + 1} of {timeline.length}
          </p>
          <motion.h2 
            key={currentIdx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black tracking-tight"
          >
            {currentTask.title}
          </motion.h2>
          <div className="flex items-center justify-center gap-3 text-slate-400 font-bold">
            <Clock className="w-4 h-4" />
            <span>{currentTask.calculatedStart} - {currentTask.calculatedEnd}</span>
          </div>
        </div>

        <div className="relative aspect-square flex items-center justify-center">
          <div className="absolute inset-0 border-[16px] border-white/5 rounded-full" />
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="46%"
              fill="none"
              stroke="currentColor"
              strokeWidth="16"
              strokeDasharray="289"
              strokeDashoffset={289 * (1 - timeLeft / (currentTask.duration * 60))}
              className="text-indigo-500 transition-all duration-1000 stroke-[16px]"
              strokeLinecap="round"
            />
          </svg>
          <div className="text-8xl font-mono font-black tracking-tighter tabular-nums">
            {formatTimer(timeLeft)}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 border border-white/10"
          >
            {isPaused ? <Play className="w-10 h-10 fill-current ml-1" /> : <Pause className="w-10 h-10 fill-current" />}
          </button>
          <button 
            onClick={handleNext}
            className="flex-1 py-6 bg-indigo-600 rounded-3xl font-black text-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 transition-all active:scale-95"
          >
            {currentIdx === timeline.length - 1 ? 'Finish' : 'Complete Task'}
          </button>
        </div>

        <div className="pt-12 flex justify-center gap-2">
          {timeline.map((_, idx) => (
            <div 
              key={idx} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                idx === currentIdx ? "w-10 bg-indigo-500" : idx < currentIdx ? "w-4 bg-indigo-500/40" : "w-2 bg-white/10"
              )} 
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
