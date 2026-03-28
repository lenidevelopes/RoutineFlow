/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { getUserData, createUserData, subscribeSettings, subscribeAdminConfig, getAppConfig, updateUserSettings, saveAllData, restoreAllData } from './services/firebaseService';
import { UserSettings, Routine, AdminConfig } from './types';
import { Home, ListTodo, Repeat, Calendar, User as UserIcon, Settings, Plus, Sparkles, LogOut, Moon, Sun, Bell, Target, TrendingUp, Shield, AlertCircle, Mail, Lock, Flame, FileText, ChevronRight, Menu, X } from 'lucide-react';
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
import HabitsScreen from './screens/HabitsScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import PolicyPage from './screens/PolicyPage';
import AdminPanel from './screens/AdminPanel';
import AlarmManager from './components/AlarmManager';

type Tab = 'home' | 'tasks' | 'routines' | 'habits' | 'goals' | 'progress' | 'alarms' | 'profile' | 'policy' | 'admin';

const APP_VERSION = '1.0.2';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  const isAdmin = user?.email === 'saifahmed123az@gmail.com' || user?.email === 'dabussy38@gmail.com';

  useEffect(() => {
    let unsubscribeAdmin: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await handleUserLogin(firebaseUser);
        // Only subscribe to admin config after authentication
        unsubscribeAdmin = subscribeAdminConfig(setAdminConfig);
      } else {
        setLoading(false);
        if (unsubscribeAdmin) {
          unsubscribeAdmin();
          unsubscribeAdmin = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAdmin) unsubscribeAdmin();
    };
  }, []);

  const handleUserLogin = async (firebaseUser: User) => {
    try {
      let data = await getUserData(firebaseUser.uid);
      if (!data) {
        data = await createUserData(firebaseUser.uid, firebaseUser.email || '');
      }
      setSettings(data);
      setAgreed(true); // If they logged in, they agreed

      // Theme
      if (data.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      // Version Check
      try {
        const appConfig = await getAppConfig();
        if (appConfig && appConfig.version !== APP_VERSION) {
          setUpdateMessage(appConfig.updateMessage);
          setShowUpdateModal(true);
        }
      } catch (configErr) {
        console.warn('Could not load app config:', configErr);
      }

      // Update local version
      if (data.appVersion !== APP_VERSION) {
        await updateUserSettings(firebaseUser.uid, { appVersion: APP_VERSION });
      }

      // Subscribe to settings
      subscribeSettings(firebaseUser.uid, setSettings);

    } catch (err: any) {
      console.error('Error loading user data:', err);
      if (err.message?.includes('permission-denied')) {
        setAuthError('Access denied. Please check your permissions.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!agreed) {
      alert("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google login failed:', error);
      setAuthError(error.message);
    }
  };

  const handleEmailAuth = async () => {
    if (!agreed) {
      alert("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }
    setAuthError('');
    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Email auth failed:', error);
      setAuthError(error.message);
    }
  };

  const handleLogout = () => signOut(auth);

  // Access Control
  useEffect(() => {
    if (!user) return;

    const restrictedTabs: Tab[] = ['admin'];
    if (restrictedTabs.includes(activeTab) && !isAdmin) {
      setAccessDenied(true);
      setTimeout(() => {
        setAccessDenied(false);
        setActiveTab('home');
      }, 3000);
    }
  }, [activeTab, user, isAdmin]);

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

  if (accessDenied) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-zinc-950 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
        <p className="text-slate-600 dark:text-zinc-400">We know you don’t have access to this page.</p>
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
          
          <div className="space-y-4 mb-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            {authError && <p className="text-xs text-red-500 font-bold">{authError}</p>}
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 text-left">
              <input 
                type="checkbox" 
                id="tos" 
                checked={agreed} 
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="tos" className="text-sm text-slate-600 dark:text-zinc-400">
                I agree to the <button onClick={() => setActiveTab('policy')} className="text-indigo-600 hover:underline">Terms of Service</button> and <button onClick={() => setActiveTab('policy')} className="text-indigo-600 hover:underline">Privacy Policy</button>.
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleEmailAuth}
              disabled={!agreed}
              className={cn(
                "w-full py-4 px-6 rounded-2xl font-bold transition-all active:scale-95",
                agreed ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed"
              )}
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>

            <button
              onClick={handleGoogleLogin}
              disabled={!agreed}
              className={cn(
                "w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold transition-all active:scale-95",
                agreed 
                  ? "bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-zinc-700"
                  : "bg-slate-100 dark:bg-zinc-800 text-slate-400 cursor-not-allowed"
              )}
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              Continue with Google
            </button>

            <button 
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-bold text-indigo-600 hover:underline"
            >
              {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
            </button>
          </div>
        </motion.div>
        
        {activeTab === 'policy' && (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 overflow-y-auto">
            <PolicyPage user={null} onClose={() => setActiveTab('home')} />
          </div>
        )}
      </div>
    );
  }

  const renderScreen = () => {
    // Feature Lock System
    const isFeatureLocked = (featureKey: string) => {
      if (!adminConfig) return false;
      const feature = adminConfig.features[featureKey];
      if (!feature) return false;
      if (!feature.enabled) return true;
      if (settings && settings.level < feature.requiredLevel) return true;
      return false;
    };

    switch (activeTab) {
      case 'home': return <Dashboard user={user} setActiveTab={setActiveTab} adminConfig={adminConfig} settings={settings} />;
      case 'tasks': return <TasksScreen user={user} settings={settings} isLocked={isFeatureLocked('tasks')} />;
      case 'routines': return <RoutinesScreen user={user} settings={settings} initialRoutines={routines} isLocked={isFeatureLocked('routines')} />;
      case 'habits': return <HabitsScreen user={user} isLocked={isFeatureLocked('habits')} />;
      case 'goals': return <GoalsScreen user={user} isLocked={isFeatureLocked('goals')} />;
      case 'progress': return <AnalyticsScreen user={user} />;
      case 'alarms': return <AlarmsScreen user={user} isLocked={isFeatureLocked('alarms')} />;
      case 'profile': return <ProfileScreen user={user} handleLogout={handleLogout} settings={settings} />;
      case 'admin': return <AdminPanel user={user} settings={settings} />;
      case 'policy': return <PolicyPage user={user} onClose={() => setActiveTab('home')} />;
      default: return <Dashboard user={user} setActiveTab={setActiveTab} adminConfig={adminConfig} settings={settings} />;
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Alarm Manager */}
      <AlarmManager user={user} settings={settings} routines={routines} />

      {/* Update Modal */}
      <AnimatePresence>
        {showUpdateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">New Update!</h3>
                <p className="text-slate-500 dark:text-zinc-400 font-bold">{updateMessage || `Version ${APP_VERSION} is here with new features and fixes.`}</p>
                <p className="text-xs text-indigo-600 font-black uppercase tracking-widest pt-2">Recommendation</p>
                <p className="text-xs text-slate-400 font-medium">Please backup your data in Profile &gt; Data Management before updating to ensure safety.</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    if (user && settings) {
                      await saveAllData(user.uid, { settings, routines });
                      alert('Data saved to cloud!');
                    }
                  }}
                  className="w-full py-4 bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white rounded-2xl font-black active:scale-95 transition-all"
                >
                  Save Data
                </button>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
          <NavButton icon={<Flame className="w-5 h-5" />} label="Habits" active={activeTab === 'habits'} onClick={() => setActiveTab('habits')} />
          <NavButton icon={<Target className="w-5 h-5" />} label="Goals" active={activeTab === 'goals'} onClick={() => setActiveTab('goals')} />
          <NavButton icon={<TrendingUp className="w-5 h-5" />} label="Progress" active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} />
          <NavButton icon={<Bell className="w-5 h-5" />} label="Alarms" active={activeTab === 'alarms'} onClick={() => setActiveTab('alarms')} />
          <NavButton icon={<UserIcon className="w-5 h-5" />} label="Profile" active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
          {isAdmin && (
            <NavButton icon={<Shield className="w-5 h-5" />} label="Admin" active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} />
          )}
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
