import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User } from 'firebase/auth';
import { subscribeRoutines, createRoutine, updateRoutine, deleteRoutine, handleSkip } from '../services/firebaseService';
import { scheduleRoutineAlarms, cancelRoutineAlarms } from '../services/alarmService';
import { Routine, RoutineTask, RoutineType, UserSettings } from '../types';
import { completeRoutineXP } from '../services/statsService';
import { 
  Plus, Sparkles, Clock, Trash2, Edit2, ChevronRight, X, Check, 
  Loader2, AlertCircle, Play, Pause, Repeat, ArrowLeft, ArrowRight,
  LayoutGrid, Sun, BookOpen, Dumbbell, MoreHorizontal, Bell, SkipForward
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import { 
  formatMinutesTo12h, 
  parse12hToMinutes, 
  addMinutesTo12h, 
  getCurrentTime12h, 
  getDurationBetween12h,
  formatTime
} from '../lib/timeUtils';

interface RoutinesScreenProps {
  user: any;
  settings: UserSettings | null;
  initialRoutines: Routine[];
  isLocked?: boolean;
}

export default function RoutinesScreen({ user, settings, initialRoutines, isLocked }: RoutinesScreenProps) {
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

  useEffect(() => {
    setRoutines(initialRoutines);
  }, [initialRoutines]);

  const handleDelete = async (routine: Routine) => {
    if (window.confirm('Are you sure you want to delete this routine?')) {
      await cancelRoutineAlarms(routine);
      await deleteRoutine(routine.id!);
    }
  };

  const handleToggle = async (routine: Routine) => {
    const newActive = !routine.isActive;
    await updateRoutine(routine.id!, { isActive: newActive });
    if (newActive) {
      await scheduleRoutineAlarms({ ...routine, isActive: newActive });
    } else {
      await cancelRoutineAlarms(routine);
    }
  };

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-6">
        <div className="w-24 h-24 bg-slate-100 dark:bg-zinc-900 rounded-[40px] flex items-center justify-center shadow-sm border border-slate-200 dark:border-zinc-800">
          <Repeat className="w-12 h-12 text-slate-300 dark:text-zinc-700" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Feature Locked</h2>
          <p className="text-slate-500 dark:text-zinc-400 font-medium max-w-xs mx-auto">
            Reach a higher level to unlock Routines and start building your perfect day!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-32 bg-slate-50 dark:bg-zinc-950">
      <Header 
        title="Routines" 
        subtitle="Your Daily Flow"
        rightElement={
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddingManual(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm">New Routine</span>
            </button>
          </div>
        }
      />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {routines.length === 0 && !isAddingManual ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Repeat className="w-10 h-10 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">No routines yet</h3>
            <p className="text-slate-400 dark:text-zinc-500 mb-8 max-w-xs mx-auto">Build your first routine manually to start optimizing your day.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-6">
              <button 
                onClick={() => setIsAddingManual(true)}
                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Create Routine
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
                onDelete={() => handleDelete(routine)}
                onToggle={() => handleToggle(routine)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isAddingManual && (
          <ManualBuilder 
            user={user} 
            onClose={() => setIsAddingManual(false)} 
          />
        )}
        {activeRoutine && (
          <RoutineExecution 
            routine={activeRoutine} 
            user={user}
            settings={settings}
            onClose={() => setActiveRoutine(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const RoutineListItem: React.FC<{ routine: Routine, onStart: () => void, onDelete: () => void | Promise<void>, onToggle: () => void }> = ({ routine, onStart, onDelete, onToggle }) => {
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
      className={cn(
        "bg-white dark:bg-zinc-900 p-6 rounded-[32px] border transition-all flex items-center justify-between group",
        routine.isActive ? "border-slate-100 dark:border-zinc-800 shadow-sm" : "border-transparent opacity-60 grayscale"
      )}
    >
      <div className="flex items-center gap-5">
        <button 
          onClick={onToggle}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-all active:scale-95",
            routine.isActive ? "bg-slate-50 dark:bg-zinc-800" : "bg-slate-200 dark:bg-zinc-700"
          )}
        >
          {typeIcon()}
        </button>
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{routine.name}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {(routine.tasks || []).length} Tasks • {(routine.activeDays || []).length} Days
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
  const [taskEndTime, setTaskEndTime] = useState('07:15 AM');
  const [taskDuration, setTaskDuration] = useState(15);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [alarmSound, setAlarmSound] = useState('alarm.wav');
  const [alarmVibration, setAlarmVibration] = useState(true);
  const [snoozeDelay, setSnoozeDelay] = useState(10);

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    
    let duration = taskDuration;
    if (taskMode === 'fixed') {
      duration = getDurationBetween12h(taskStartTime, taskEndTime);
    }
    
    const newTask: RoutineTask = {
      id: Math.random().toString(36).substr(2, 9),
      title: taskTitle,
      mode: taskMode,
      start_time: taskMode === 'fixed' ? taskStartTime : undefined,
      end_time: taskMode === 'fixed' ? taskEndTime : undefined,
      duration_minutes: duration || 15,
      completed: false,
      alarm: {
        enabled: alarmEnabled,
        sound: alarmSound,
        vibration: alarmVibration,
        snooze_delay: snoozeDelay
      }
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
    
    const id = await createRoutine(routine);
    await scheduleRoutineAlarms({ ...routine, id });
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
                  <div className="grid grid-cols-2 gap-3">
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
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Time</label>
                      <input 
                        type="text" 
                        value={taskEndTime}
                        onChange={(e) => setTaskEndTime(e.target.value)}
                        placeholder="07:15 AM"
                        className="w-full p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 outline-none font-bold"
                      />
                    </div>
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
                <div className="space-y-4 pt-4 border-t border-indigo-100/30 dark:border-indigo-900/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Enable Alarm</span>
                    </div>
                    <button 
                      onClick={() => setAlarmEnabled(!alarmEnabled)}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        alarmEnabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-zinc-800"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                        alarmEnabled ? "right-1" : "left-1"
                      )} />
                    </button>
                  </div>

                  {alarmEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Snooze (min)</label>
                        <select 
                          value={snoozeDelay}
                          onChange={(e) => setSnoozeDelay(parseInt(e.target.value))}
                          className="w-full p-3 bg-white dark:bg-zinc-900 rounded-xl border border-indigo-100 dark:border-indigo-900/30 outline-none font-bold text-xs"
                        >
                          {[5, 6, 7, 8, 9, 10].map(m => <option key={m} value={m}>{m} min</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vibration</label>
                        <button 
                          onClick={() => setAlarmVibration(!alarmVibration)}
                          className={cn(
                            "w-full p-3 rounded-xl font-bold text-xs transition-all border",
                            alarmVibration ? "bg-indigo-600 text-white border-indigo-600" : "bg-white dark:bg-zinc-900 text-slate-400 border-indigo-50 dark:border-zinc-800"
                          )}
                        >
                          {alarmVibration ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

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
                            {t.mode === 'fixed' ? `${t.start_time} - ${t.end_time}` : `${t.duration_minutes} min`}
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

function RoutineExecution({ routine, user, settings, onClose }: { routine: Routine, user: User, settings: UserSettings | null, onClose: () => void }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentTime, setCurrentTime] = useState(getCurrentTime12h());
  const [taskStartTimes, setTaskStartTimes] = useState<string[]>(() => {
    const starts = new Array((routine.tasks || []).length).fill('');
    starts[0] = getCurrentTime12h();
    return starts;
  });
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [alarmAudio] = useState(() => new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'));
  const hasRungForThisTask = useRef(false);

  const skipsToday = settings?.skipsToday || 0;

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime12h());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentTask = useMemo(() => {
    const task = (routine.tasks || [])[currentIdx];
    if (!task) return null;

    const start = task.mode === 'fixed' ? task.start_time! : taskStartTimes[currentIdx];
    const end = task.mode === 'fixed' 
      ? (task.end_time || addMinutesTo12h(start, task.duration_minutes)) 
      : addMinutesTo12h(start, task.duration_minutes);

    return {
      ...task,
      calculatedStart: start,
      calculatedEnd: end,
      duration: getDurationBetween12h(start, end)
    };
  }, [currentIdx, routine.tasks, taskStartTimes]);

  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Handle alarm sound
  useEffect(() => {
    if (isAlarmRinging) {
      alarmAudio.loop = true;
      playPromiseRef.current = alarmAudio.play();
      playPromiseRef.current.catch(e => console.warn("Audio play failed or blocked:", e));
    } else {
      if (playPromiseRef.current !== null) {
        playPromiseRef.current.then(() => {
          alarmAudio.pause();
          alarmAudio.currentTime = 0;
        }).catch(() => {});
      } else {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
      }
    }
    return () => {
      if (playPromiseRef.current !== null) {
        playPromiseRef.current.then(() => {
          alarmAudio.pause();
        }).catch(() => {});
      } else {
        alarmAudio.pause();
      }
    };
  }, [isAlarmRinging, alarmAudio]);

  useEffect(() => {
    hasRungForThisTask.current = false;
  }, [currentIdx]);

  useEffect(() => {
    if (!currentTask) return;

    const checkTime = () => {
      const now = getCurrentTime12h();
      const nowMinutes = parse12hToMinutes(now);
      const startMinutes = parse12hToMinutes(currentTask.calculatedStart);

      if (currentTask.mode === 'fixed') {
        if (nowMinutes < startMinutes) {
          setIsWaiting(true);
          setIsAlarmRinging(false);
        } else if (nowMinutes >= startMinutes) {
          if (!hasRungForThisTask.current) {
            setIsAlarmRinging(true);
            setIsWaiting(false);
            hasRungForThisTask.current = true;
          }
        } else {
          setIsWaiting(false);
        }
      } else {
        setIsWaiting(false);
        setIsAlarmRinging(false);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [currentIdx, currentTask]);

  const progress = useMemo(() => {
    if (!currentTask) return 0;
    const nowMinutes = parse12hToMinutes(currentTime);
    const startMinutes = parse12hToMinutes(currentTask.calculatedStart);
    const endMinutes = parse12hToMinutes(currentTask.calculatedEnd);
    
    if (nowMinutes < startMinutes) return 0;
    if (nowMinutes >= endMinutes) return 100;
    
    const total = endMinutes - startMinutes;
    if (total <= 0) return 100;
    
    return ((nowMinutes - startMinutes) / total) * 100;
  }, [currentTime, currentTask]);

  const handleNext = async () => {
    setIsAlarmRinging(false);
    const now = getCurrentTime12h();
    if (currentIdx < (routine.tasks || []).length - 1) {
      const nextIdx = currentIdx + 1;
      setTaskStartTimes(prev => {
        const next = [...prev];
        next[nextIdx] = now;
        return next;
      });
      setCurrentIdx(nextIdx);
    } else {
      if (settings) {
        await completeRoutineXP(user.uid, settings);
      }
      onClose();
    }
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
      
      <button 
        onClick={() => setShowCloseConfirm(true)} 
        className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all active:scale-90 z-10"
      >
        <X className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border border-white/10 rounded-[40px] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-16 h-16 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto">
                <X className="w-8 h-8 text-rose-500" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">End Routine?</h3>
                <p className="text-slate-400 font-bold">Are you sure you want to stop this routine? Your progress will not be saved.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-rose-600 hover:bg-rose-500 rounded-2xl font-bold transition-all shadow-lg shadow-rose-500/20"
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md space-y-12 text-center relative z-10">
        <div className="space-y-4">
          <p className="text-sm font-bold text-indigo-400 uppercase tracking-[0.3em]">
            Task {currentIdx + 1} of {(routine.tasks || []).length}
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
            <span>{formatTime(currentTask.calculatedStart)} - {formatTime(currentTask.calculatedEnd)}</span>
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
              strokeDashoffset={289 * (1 - progress / 100)}
              className={cn(
                "transition-all duration-1000 stroke-[16px]",
                isWaiting ? "text-slate-700" : "text-indigo-500"
              )}
              strokeLinecap="round"
            />
          </svg>
          <div className="flex flex-col items-center">
            <div className="text-7xl font-mono font-black tracking-tighter tabular-nums">
              {currentTime}
            </div>
            <p className="text-slate-400 font-bold mt-2 uppercase tracking-widest text-xs">
              Current Time
            </p>
            {isWaiting && (
              <p className="text-indigo-400 font-bold animate-pulse mt-4">
                Waiting for start time...
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {isAlarmRinging ? (
            <button 
              onClick={() => setIsAlarmRinging(false)}
              className="w-full py-6 bg-rose-600 rounded-3xl font-black text-xl shadow-2xl shadow-rose-500/40 hover:bg-rose-500 animate-pulse transition-all active:scale-95"
            >
              Stop Alarm
            </button>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <button 
                disabled={skipsToday >= 3}
                onClick={async () => {
                  if (user) {
                    await handleSkip(user.uid);
                    handleNext();
                  }
                }}
                className="flex-1 py-6 bg-white/5 text-slate-400 rounded-3xl font-black text-xl hover:bg-white/10 transition-all active:scale-95 border border-white/10 disabled:opacity-50"
              >
                Skip ({3 - skipsToday})
              </button>
              <button 
                onClick={handleNext}
                className="flex-[2] py-6 bg-indigo-600 rounded-3xl font-black text-xl shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 transition-all active:scale-95"
              >
                {currentIdx === (routine.tasks || []).length - 1 ? 'Finish' : 'Complete Task'}
              </button>
            </div>
          )}
        </div>

        <div className="pt-12 flex justify-center gap-2">
          {(routine.tasks || []).map((_, idx) => (
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
