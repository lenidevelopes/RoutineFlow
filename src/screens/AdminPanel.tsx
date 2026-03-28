/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSettings, Policy, AdminConfig } from '../types';
import { 
  Shield, Users, Settings as SettingsIcon, FileText, 
  Lock, Unlock, CheckCircle, XCircle, Search, 
  TrendingUp, Activity, AlertTriangle, Save, Loader2, Sparkles,
  Ban, UserPlus, Edit3, Trash2, Repeat, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Header from '../components/Header';
import { User } from 'firebase/auth';
import { 
  getAllUsers, 
  getAdminConfig, 
  getPolicies, 
  updateAdminConfig, 
  updateUserSettings, 
  banUser, 
  updateUserLevel,
  updatePolicy
} from '../services/firebaseService';

interface AdminPanelProps {
  user: User;
  settings: UserSettings | null;
}

export default function AdminPanel({ user, settings }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'features' | 'content'>('users');
  const [users, setUsers] = useState<UserSettings[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [adminConfig, setAdminConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Users
        const userData = await getAllUsers();
        setUsers(userData);

        // Fetch Admin Config
        const config = await getAdminConfig();
        setAdminConfig(config);

        // Fetch Policies
        const policyData = await getPolicies();
        setPolicies(policyData);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpdateConfig = async (newConfig: AdminConfig) => {
    setSaving(true);
    try {
      await updateAdminConfig(newConfig);
      setAdminConfig(newConfig);
    } catch (err) {
      console.error("Error updating config:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<UserSettings>) => {
    try {
      if ('isBanned' in updates) {
        await banUser(userId, updates.isBanned!);
      } else if ('level' in updates || 'xp' in updates) {
        await updateUserLevel(userId, updates.level || 1, updates.xp || 0);
      } else {
        await updateUserSettings(userId, updates);
      }
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, ...updates } : u));
    } catch (err) {
      console.error("Error updating user:", err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.userId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full bg-slate-50 dark:bg-zinc-950 pb-32">
      <Header 
        title="Admin Panel" 
        subtitle="System Management"
        rightElement={
          <div className="w-10 h-10 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600">
            <Shield className="w-6 h-6" />
          </div>
        }
      />

      <div className="p-6 max-w-6xl mx-auto space-y-8">
        {/* Tabs */}
        <div className="flex p-1.5 bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-100 dark:border-zinc-800 shadow-sm">
          <TabButton active={activeTab === 'users'} icon={<Users className="w-4 h-4" />} label="Users" onClick={() => setActiveTab('users')} />
          <TabButton active={activeTab === 'features'} icon={<SettingsIcon className="w-4 h-4" />} label="Features" onClick={() => setActiveTab('features')} />
          <TabButton active={activeTab === 'content'} icon={<FileText className="w-4 h-4" />} label="Content" onClick={() => setActiveTab('content')} />
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by User ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800 outline-none font-bold"
                />
              </div>

              <div className="bg-white dark:bg-zinc-900 rounded-[40px] border border-slate-100 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-50 dark:border-zinc-800">
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Level</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">XP</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily XP</th>
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-zinc-800">
                      {filteredUsers.map(u => (
                        <tr key={u.userId} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xs">
                                {u.userId.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-700 dark:text-zinc-200 text-sm truncate max-w-[120px]">{u.email || u.userId}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 font-black text-indigo-600 dark:text-indigo-400">Lvl {u.level || 1}</td>
                          <td className="px-6 py-5 font-bold text-slate-500 dark:text-zinc-400">{u.xp || 0}</td>
                          <td className="px-6 py-5 font-bold text-slate-500 dark:text-zinc-400">{u.streak || 0}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleUpdateUser(u.userId, { isBanned: !u.isBanned })}
                                className={cn(
                                  "p-2 rounded-xl transition-all",
                                  u.isBanned ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-400"
                                )}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  const newLevel = prompt("Enter new level:", (u.level || 1).toString());
                                  if (newLevel) handleUpdateUser(u.userId, { level: parseInt(newLevel) });
                                }}
                                className="p-2 bg-slate-50 text-slate-400 rounded-xl"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'features' && adminConfig && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black tracking-tight">App Version Control</h3>
                  <button 
                    onClick={() => handleUpdateConfig(adminConfig)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20"
                  >
                    Save Changes
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Current Version</label>
                    <input 
                      type="text"
                      value={adminConfig.appVersion}
                      onChange={(e) => setAdminConfig({ ...adminConfig, appVersion: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-800 outline-none font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Update Message</label>
                    <input 
                      type="text"
                      value={adminConfig.updateMessage}
                      onChange={(e) => setAdminConfig({ ...adminConfig, updateMessage: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-800 outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(adminConfig.features).map(([key, feature]: [string, any]) => (
                  <FeatureCard 
                    key={key}
                    title={feature.title}
                    description={feature.description}
                    enabled={feature.enabled}
                    beta={feature.beta}
                    requiredLevel={feature.requiredLevel}
                    icon={key === 'routines' ? <Repeat className="w-6 h-6" /> : key === 'goals' ? <Target className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                    onChange={(updates) => {
                      const newConfig = {
                        ...adminConfig,
                        features: {
                          ...adminConfig.features,
                          [key]: { ...feature, ...updates }
                        }
                      };
                      setAdminConfig(newConfig);
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'content' && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {policies.map(policy => (
                <PolicyEditor key={policy.id} policy={policy} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-3 rounded-[22px] text-sm font-black transition-all",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
          : "text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

interface FeatureCardProps {
  key?: string;
  title: string;
  description: string;
  enabled: boolean;
  beta: boolean;
  requiredLevel: number;
  icon: React.ReactNode;
  onChange: (updates: any) => void;
}

function FeatureCard({ title, description, enabled, beta, requiredLevel, icon, onChange }: FeatureCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-sm space-y-6">
      <div className="flex items-start justify-between">
        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600">
          {icon}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required Lvl</p>
            <input 
              type="number"
              value={requiredLevel}
              onChange={(e) => onChange({ requiredLevel: parseInt(e.target.value) })}
              className="w-12 text-right bg-transparent font-black text-indigo-600 outline-none"
            />
          </div>
          <button 
            onClick={() => onChange({ enabled: !enabled })}
            className={cn(
              "w-14 h-8 rounded-full transition-all relative",
              enabled ? "bg-indigo-600" : "bg-slate-200 dark:bg-zinc-800"
            )}
          >
            <div className={cn(
              "absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm",
              enabled ? "right-1" : "left-1"
            )} />
          </button>
        </div>
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-black tracking-tight">{title}</h3>
          {beta && <span className="px-2 py-0.5 bg-amber-100 text-amber-600 rounded text-[8px] font-black uppercase">Beta</span>}
        </div>
        <p className="text-sm font-bold text-slate-400 leading-relaxed">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={() => onChange({ beta: !beta })}
          className={cn(
            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
            beta ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
          )}
        >
          Beta Mode
        </button>
      </div>
    </div>
  );
}

interface PolicyEditorProps {
  policy: Policy;
}

const PolicyEditor: React.FC<PolicyEditorProps> = ({ policy }) => {
  const [content, setContent] = useState(policy.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updatePolicy(policy.id, content);
    } catch (err) {
      console.error("Error saving policy:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] border border-slate-100 dark:border-zinc-800 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tight capitalize">{policy.id.replace('_', ' ')}</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Last updated: {new Date(policy.updatedAt).toLocaleDateString()}</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>
      <textarea 
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        className="w-full p-6 bg-slate-50 dark:bg-zinc-800/50 rounded-3xl border border-slate-100 dark:border-zinc-800 outline-none font-mono text-sm leading-relaxed"
      />
    </div>
  );
}
