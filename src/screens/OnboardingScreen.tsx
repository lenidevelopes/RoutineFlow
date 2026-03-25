import React, { useState } from 'react';
import { User } from '../firebase';
import { updateSettings, createTask, createRoutine } from '../services/firebaseService';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Check, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, Routine, Priority } from '../types';

interface OnboardingScreenProps {
  user: User;
  onComplete: () => void;
}

export default function OnboardingScreen({ user, onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    goals: [] as string[],
    sports: [] as string[],
    lifestyle: 'sedentary'
  });
  const [suggestions, setSuggestions] = useState<{ tasks: Task[], routines: Routine[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const goalsOptions = ['Lose Weight', 'Build Muscle', 'Better Sleep', 'Productivity', 'Mental Health'];
  const sportsOptions = ['Gym', 'Running', 'Yoga', 'Swimming', 'Cycling', 'None'];
  const lifestyleOptions = [
    { id: 'sedentary', label: 'Sedentary', desc: 'Mostly sitting' },
    { id: 'active', label: 'Active', desc: 'Moving often' },
    { id: 'athlete', label: 'Athlete', desc: 'Intense training' }
  ];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const generateSuggestions = async () => {
    setLoading(true);
    // In a real app, this would call Gemini. For now, we'll mock it based on inputs.
    const mockTasks: Task[] = [
      { userId: user.uid, title: 'Morning Hydration', completed: false, priority: 'medium', category: 'Health', tags: ['Onboarding'], checklist: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { userId: user.uid, title: '10 min Stretching', completed: false, priority: 'low', category: 'Fitness', tags: ['Onboarding'], checklist: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    ];
    
    if (formData.goals.includes('Productivity')) {
      mockTasks.push({ userId: user.uid, title: 'Daily Planning', completed: false, priority: 'high', category: 'Work', tags: ['Onboarding'], checklist: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }

    const mockRoutine: Routine = {
      userId: user.uid,
      name: 'Starter Routine',
      type: 'morning',
      tasks: [{ 
        id: 'starter-1',
        title: 'Morning Hydration', 
        mode: 'duration',
        duration_minutes: 10,
        completed: false
      }, {
        id: 'starter-2',
        title: 'Breakfast',
        mode: 'fixed',
        start_time: '08:00 AM',
        duration_minutes: 30,
        completed: false
      }],
      isActive: true,
      activeDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSuggestions({ tasks: mockTasks, routines: [mockRoutine] });
    setLoading(false);
    setStep(5);
  };

  const finalizeOnboarding = async () => {
    await updateSettings(user.uid, {
      onboardingCompleted: true,
      onboardingData: {
        age: parseInt(formData.age),
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        goals: formData.goals,
        sports: formData.sports,
        lifestyle: formData.lifestyle
      },
      level: 1,
      xp: 0,
      skills: { discipline: 1, fitness: 1, focus: 1 }
    });

    if (suggestions) {
      for (const t of suggestions.tasks) await createTask(t);
      for (const r of suggestions.routines) await createRoutine(r);
    }

    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-8">
              <div className="text-center">
                <h1 className="text-4xl font-black mb-2">Welcome!</h1>
                <p className="text-slate-500">Let's set up your profile.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Age</label>
                  <input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 25" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Weight (kg) - Optional</label>
                  <input type="number" value={formData.weight} onChange={e => setFormData({ ...formData, weight: e.target.value })} className="w-full p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. 70" />
                </div>
              </div>
              <button onClick={handleNext} disabled={!formData.age} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 disabled:opacity-50">Continue</button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black mb-2">What are your goals?</h2>
                <p className="text-slate-500">Select all that apply.</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {goalsOptions.map(goal => (
                  <button
                    key={goal}
                    onClick={() => setFormData({ ...formData, goals: formData.goals.includes(goal) ? formData.goals.filter(g => g !== goal) : [...formData.goals, goal] })}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between",
                      formData.goals.includes(goal) ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "border-slate-100 dark:border-zinc-800"
                    )}
                  >
                    <span className="font-bold">{goal}</span>
                    {formData.goals.includes(goal) && <Check className="w-5 h-5" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={handleBack} className="flex-1 py-4 bg-slate-100 dark:bg-zinc-900 rounded-2xl font-bold">Back</button>
                <button onClick={handleNext} disabled={formData.goals.length === 0} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 disabled:opacity-50">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black mb-2">Sports & Activity</h2>
                <p className="text-slate-500">What do you currently do?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {sportsOptions.map(sport => (
                  <button
                    key={sport}
                    onClick={() => setFormData({ ...formData, sports: formData.sports.includes(sport) ? formData.sports.filter(s => s !== sport) : [...formData.sports, sport] })}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all text-center",
                      formData.sports.includes(sport) ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "border-slate-100 dark:border-zinc-800"
                    )}
                  >
                    <span className="font-bold">{sport}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={handleBack} className="flex-1 py-4 bg-slate-100 dark:bg-zinc-900 rounded-2xl font-bold">Back</button>
                <button onClick={handleNext} disabled={formData.sports.length === 0} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 disabled:opacity-50">Continue</button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black mb-2">Lifestyle</h2>
                <p className="text-slate-500">Describe your daily movement.</p>
              </div>
              <div className="space-y-3">
                {lifestyleOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setFormData({ ...formData, lifestyle: opt.id })}
                    className={cn(
                      "w-full p-5 rounded-2xl border-2 transition-all text-left flex flex-col",
                      formData.lifestyle === opt.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-100 dark:border-zinc-800"
                    )}
                  >
                    <span className={cn("font-bold text-lg", formData.lifestyle === opt.id ? "text-indigo-600" : "")}>{opt.label}</span>
                    <span className="text-sm text-slate-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-4">
                <button onClick={handleBack} className="flex-1 py-4 bg-slate-100 dark:bg-zinc-900 rounded-2xl font-bold">Back</button>
                <button onClick={generateSuggestions} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
                  {loading ? "Generating..." : <><Sparkles className="w-5 h-5" /> Generate Plan</>}
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && suggestions && (
            <motion.div key="step5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black mb-2">Your Smart Setup</h2>
                <p className="text-slate-500">We've generated some suggestions for you.</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Suggested Tasks</h3>
                  {suggestions.tasks.map((t, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl flex items-center justify-between">
                      <span className="font-bold">{t.title}</span>
                      <Check className="w-5 h-5 text-emerald-500" />
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                    Please ensure these routines are safe for your current fitness level. Consult a professional if unsure.
                  </p>
                </div>
              </div>

              <button onClick={finalizeOnboarding} className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-500/30">
                Start My Journey
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
