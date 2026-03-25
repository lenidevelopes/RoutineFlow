/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../firebase';
import { updateSettings } from '../services/firebaseService';
import { UserSettings } from '../types';
import { LogOut, Moon, Sun, Award, Zap, Brain, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import Header from '../components/Header';

interface ProfileScreenProps {
  user: User;
  handleLogout: () => void;
  settings: UserSettings | null;
}

export default function ProfileScreen({ user, handleLogout, settings }: ProfileScreenProps) {
  const toggleDarkMode = () => {
    if (settings) {
      updateSettings(user.uid, { darkMode: !settings.darkMode });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-zinc-950">
      <Header 
        title="Profile" 
        subtitle="Performance & Settings"
        rightElement={
          <button 
            onClick={handleLogout}
            className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all active:scale-90"
          >
            <LogOut className="w-5 h-5" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-32">
        {/* Profile Header Card */}
        <section className="p-8 bg-white dark:bg-zinc-900 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500/10 to-violet-500/10" />
          
          <div className="relative mt-4">
            <div className="w-32 h-32 rounded-[48px] overflow-hidden border-4 border-white dark:border-zinc-800 shadow-2xl shadow-indigo-500/20 relative z-10">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-500/40 z-20 border-4 border-white dark:border-zinc-900">
              <Award className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-6 space-y-1">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{user.displayName}</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <span className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-xl uppercase tracking-[0.2em] border border-indigo-100 dark:border-indigo-900/30">
              Level {settings?.level || 1}
            </span>
            <span className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-xl uppercase tracking-[0.2em] border border-amber-100 dark:border-amber-900/30">
              {settings?.xp || 0} XP
            </span>
          </div>
        </section>

        {/* Skills Grid */}
        <section className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight px-1">Your Skills</h3>
          <div className="grid grid-cols-3 gap-4">
            <SkillCard label="Discipline" value={settings?.skills?.discipline || 1} icon={<Award className="w-5 h-5 text-indigo-500" />} />
            <SkillCard label="Fitness" value={settings?.skills?.fitness || 1} icon={<Zap className="w-5 h-5 text-rose-500" />} />
            <SkillCard label="Focus" value={settings?.skills?.focus || 1} icon={<Brain className="w-5 h-5 text-emerald-500" />} />
          </div>
        </section>

        {/* Settings */}
        <section className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight px-1">Settings</h3>
          <div className="bg-white dark:bg-zinc-900 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            <SettingItem
              icon={settings?.darkMode ? <Moon className="text-indigo-500" /> : <Sun className="text-amber-500" />}
              label="Dark Mode"
              onClick={toggleDarkMode}
              action={
                <div
                  className={cn(
                    "w-14 h-8 rounded-full p-1.5 transition-all duration-500",
                    settings?.darkMode ? "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "bg-slate-200"
                  )}
                >
                  <div className={cn(
                    "w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-sm",
                    settings?.darkMode ? "translate-x-6" : "translate-x-0"
                  )} />
                </div>
              }
            />
            <SettingItem
              icon={<LogOut className="text-rose-500" />}
              label="Logout"
              onClick={handleLogout}
              action={<ChevronRight className="w-5 h-5 text-slate-300" />}
            />
          </div>
        </section>

        {/* Onboarding Data Info */}
        {settings?.onboardingData && (
          <section className="space-y-4">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight px-1">Your Profile</h3>
            <div className="bg-white dark:bg-zinc-900 rounded-[40px] p-8 border border-slate-100 dark:border-zinc-800 shadow-sm space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age</p>
                  <p className="text-lg font-black text-slate-800 dark:text-zinc-200">{settings.onboardingData.age}</p>
                </div>
                {settings.onboardingData.weight && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight</p>
                    <p className="text-lg font-black text-slate-800 dark:text-zinc-200">{settings.onboardingData.weight} kg</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Goals</p>
                <div className="flex flex-wrap gap-2">
                  {settings.onboardingData.goals.map(goal => (
                    <span key={goal} className="px-3 py-1.5 bg-slate-50 dark:bg-zinc-800 rounded-xl text-[10px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-widest">{goal}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SkillCard({ label, value, icon }: { label: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-5 rounded-[32px] border border-slate-100 dark:border-zinc-800 text-center space-y-2">
      <div className="w-10 h-10 mx-auto bg-slate-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-lg font-black text-slate-800 dark:text-zinc-200">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>
    </div>
  );
}

function SettingItem({ icon, label, action, onClick }: { icon: React.ReactNode, label: string, action: React.ReactNode, onClick?: () => void }) {
  const isClickable = !!onClick;
  const Component = isClickable ? 'button' : 'div';
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between p-6 rounded-[32px] transition-all text-left",
        isClickable ? "hover:bg-slate-50 dark:hover:bg-zinc-800/50 cursor-pointer active:scale-[0.98]" : ""
      )}
    >
      <div className="flex items-center gap-5">
        <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl">{icon}</div>
        <span className="text-lg font-black text-slate-800 dark:text-zinc-200 tracking-tight">{label}</span>
      </div>
      {action}
    </Component>
  );
}
