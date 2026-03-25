/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, signInWithPopup, googleProvider, signOut, onAuthStateChanged, User } from './firebase';
import { subscribeSettings, updateSettings } from './services/firebaseService';
import { UserSettings } from './types';
import { Home, ListTodo, Repeat, Calendar, User as UserIcon, Settings, Plus, Sparkles, LogOut, Moon, Sun, Bell, Target, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Screens
import Dashboard from './screens/Dashboard';
import TasksScreen from './screens/TasksScreen';
import RoutinesScreen from './screens/RoutinesScreen';
import CalendarScreen from './screens/CalendarScreen';
import ProfileScreen from './screens/ProfileScreen';
import AlarmsScreen from './screens/AlarmsScreen';
import GoalsScreen from './screens/GoalsScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import AlarmManager from './components/AlarmManager';

type Tab = 'home' | 'tasks' | 'routines' | 'goals' | 'progress' | 'alarms' | 'profile';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Subscribe to user settings
        const unsubSettings = subscribeSettings(currentUser.uid, (newSettings) => {
          setSettings(newSettings);
          if (newSettings.darkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        });
        return () => unsubSettings();
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Initialize settings if they don't exist
      await updateSettings(user.uid, {
        userId: user.uid,
        darkMode: false,
        notifications: true,
        theme: 'system'
      });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-zinc-950">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-indigo-500/10 border border-slate-100 dark:border-zinc-800 text-center"
        >
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/40">
            <Repeat className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">RoutineFlow</h1>
          <p className="text-slate-500 dark:text-zinc-400 mb-8">Master your time, optimize your life.</p>
          
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl font-semibold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <Dashboard user={user} setActiveTab={setActiveTab} />;
      case 'tasks': return <TasksScreen user={user} />;
      case 'routines': return <RoutinesScreen user={user} />;
      case 'goals': return <GoalsScreen user={user} />;
      case 'progress': return <AnalyticsScreen user={user} />;
      case 'alarms': return <AlarmsScreen user={user} />;
      case 'profile': return <ProfileScreen user={user} handleLogout={handleLogout} settings={settings} />;
      default: return <Dashboard user={user} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Alarm Manager */}
      <AlarmManager user={user} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto scroll-smooth relative">
        <div className="max-w-7xl mx-auto min-h-full pb-28">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation - Glassmorphism */}
      <nav className="shrink-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-2xl border-t border-slate-200/50 dark:border-zinc-800/50 px-4 pb-safe-offset-2 pt-3 z-50 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-1">
          <NavButton icon={<Home className="w-5 h-5" />} label="Home" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <NavButton icon={<ListTodo className="w-5 h-5" />} label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <NavButton icon={<Repeat className="w-5 h-5" />} label="Routines" active={activeTab === 'routines'} onClick={() => setActiveTab('routines')} />
          <NavButton icon={<Target className="w-5 h-5" />} label="Goals" active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} />
          <NavButton icon={<TrendingUp className="w-5 h-5" />} label="Progress" active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
          <NavButton icon={<Bell className="w-5 h-5" />} label="Alarms" active={activeTab === 'alarms'} onClick={() => setActiveTab('alarms')} />
          <NavButton icon={<UserIcon className="w-5 h-5" />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>
      </nav>
    </div>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-1.5 py-1 transition-all duration-300 relative",
        active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
      )}
    >
      <div className={cn(
        "p-2 rounded-2xl transition-all duration-300",
        active ? "bg-indigo-50 dark:bg-indigo-900/30 scale-110 shadow-sm" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[9px] font-bold uppercase tracking-[0.05em] transition-all duration-300",
        active ? "opacity-100 translate-y-0" : "opacity-60 -translate-y-0.5"
      )}>
        {label}
      </span>
      {active && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -bottom-1 w-1 h-1 bg-indigo-600 dark:bg-indigo-400 rounded-full"
        />
      )}
    </button>
  );
}
