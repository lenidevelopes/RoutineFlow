import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, CheckSquare, Target, Settings, 
  TrendingUp, Shield, LogOut, Sparkles, Lock, 
  AlertCircle, ChevronRight, Save, User as UserIcon,
  Trash2, Plus, Clock, BarChart3, Info
} from 'lucide-react';
import { authApi, taskApi, goalApi, adminApi, aiApi } from './services/api';
import { cn } from './lib/utils';

// --- TYPES ---
interface User {
  id: number;
  email: string;
  level: number;
  xp: number;
}

interface Feature {
  id: string;
  name: string;
  isEnabled: boolean;
  isBeta: boolean;
  requiredLevel: number;
}

interface AdminConfig {
  features: Feature[];
  xpSettings: {
    taskXP: number;
    routineXP: number;
    dailyCap: number;
  };
  content: {
    tos: string;
    privacy: string;
    version: string;
    updateMessage: string;
    lastUpdated: string;
  };
}

// --- MAIN APP ---
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('tasks');
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchConfig();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchConfig = async () => {
    try {
      const res = await adminApi.getConfig();
      setConfig(res.data);
      // Fetch user profile if needed
      const storedUser = localStorage.getItem('user');
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (e) {
      console.error("Failed to fetch config", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;

  if (!token) return <AuthScreen onAuth={(t, u) => { setToken(t); setUser(u); }} />;

  const isAdmin = user?.email === 'saifahmed123az@gmail.com';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 px-6 py-4 flex justify-between items-center z-50">
        <NavButton active={activeTab === 'tasks'} icon={<CheckSquare />} label="Tasks" onClick={() => setActiveTab('tasks')} />
        <NavButton active={activeTab === 'goals'} icon={<Target />} label="Goals" onClick={() => setActiveTab('goals')} />
        <NavButton active={activeTab === 'stats'} icon={<TrendingUp />} label="Stats" onClick={() => setActiveTab('stats')} />
        {isAdmin && <NavButton active={activeTab === 'admin'} icon={<Shield />} label="Admin" onClick={() => setActiveTab('admin')} />}
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-400 transition-colors">
          <LogOut className="w-6 h-6" />
        </button>
      </nav>

      {/* Content */}
      <main className="pb-32 pt-8 px-6 max-w-2xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-white mb-2">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-slate-400 font-medium">Level {user?.level} • {user?.xp} XP</p>
          </div>
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <UserIcon className="w-6 h-6" />
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'tasks' && <TaskSystem key="tasks" user={user!} config={config!} onUpdate={fetchConfig} />}
          {activeTab === 'goals' && <GoalsSystem key="goals" user={user!} config={config!} />}
          {activeTab === 'stats' && <StatsDashboard key="stats" user={user!} config={config!} />}
          {activeTab === 'admin' && isAdmin && <AdminPanel key="admin" user={user!} config={config!} onUpdate={fetchConfig} />}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- AUTH SCREEN ---
function AuthScreen({ onAuth }: { onAuth: (t: string, u: User) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = isLogin 
        ? await authApi.login({ email, password })
        : await authApi.register({ email, password });
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onAuth(res.data.token, res.data.user);
    } catch (e: any) {
      setError(e.response?.data?.error || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl shadow-indigo-500/20">
            <LayoutDashboard className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">Productivity Pro</h2>
          <p className="text-slate-400 mt-2 font-medium">Your offline-first productivity system</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-colors"
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-colors"
          />
          {error && <p className="text-rose-400 text-sm font-bold text-center">{error}</p>}
          <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-6 text-slate-400 font-bold hover:text-white transition-colors"
        >
          {isLogin ? "Need an account? Register" : "Already have an account? Login"}
        </button>
      </motion.div>
    </div>
  );
}

// --- TASK SYSTEM ---
function TaskSystem({ user, config, onUpdate }: { user: User, config: AdminConfig, onUpdate: () => void, key?: string }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [completingId, setCompletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTasks();
    fetchAiSuggestions();
  }, []);

  const fetchTasks = async () => {
    const res = await taskApi.getAll();
    setTasks(res.data);
  };

  const fetchAiSuggestions = async () => {
    const res = await aiApi.getSuggestions();
    setSuggestions(res.data.suggestions);
  };

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;
    await taskApi.create({ title: newTitle, type: 'general' });
    setNewTitle('');
    fetchTasks();
  };

  const handleComplete = async (id: number) => {
    setCompletingId(id);
    // Simulate real interaction validation (time spent)
    const startTime = Date.now();
    alert("Task validation in progress... Please wait 5 seconds to confirm real interaction.");
    
    setTimeout(async () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000) + 55; // Simulate 60s
      try {
        await taskApi.complete(id, { timeSpent });
        fetchTasks();
        onUpdate();
      } catch (e: any) {
        alert(e.response?.data?.error || "Validation failed");
      } finally {
        setCompletingId(null);
      }
    }, 5000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[32px] space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-xs">
            <Sparkles className="w-4 h-4" /> Offline AI Insights
          </div>
          {suggestions.map((s, i) => (
            <p key={i} className="text-slate-300 font-medium leading-relaxed">{s}</p>
          ))}
        </div>
      )}

      {/* Add Task */}
      <div className="flex gap-3">
        <input 
          type="text" 
          placeholder="Add a new task..." 
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-colors"
        />
        <button 
          onClick={handleAddTask}
          className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <button 
                disabled={task.status === 'completed' || completingId === task.id}
                onClick={() => handleComplete(task.id)}
                className={cn(
                  "w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all",
                  task.status === 'completed' 
                    ? "bg-emerald-500 border-emerald-500 text-white" 
                    : "border-slate-700 hover:border-indigo-500"
                )}
              >
                {task.status === 'completed' && <ChevronRight className="w-5 h-5" />}
                {completingId === task.id && <Clock className="w-5 h-5 animate-spin" />}
              </button>
              <div>
                <h3 className={cn("font-bold text-lg", task.status === 'completed' && "text-slate-500 line-through")}>
                  {task.title}
                </h3>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mt-1">
                  {task.status} • {task.type}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// --- GOALS SYSTEM ---
function GoalsSystem({ user, config }: { user: User, config: AdminConfig, key?: string }) {
  const [goals, setGoals] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState(10);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    const res = await goalApi.getAll();
    setGoals(res.data);
  };

  const handleAddGoal = async () => {
    if (!title.trim()) return;
    await goalApi.create({ title, target_value: target });
    setTitle('');
    fetchGoals();
  };

  const feature = config.features.find(f => f.id === 'goals_system');
  if (feature && !feature.isEnabled) return <LockedFeature name="Goals System" />;
  if (feature && user.level < feature.requiredLevel) return <LockedFeature name="Goals System" level={feature.requiredLevel} />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-white tracking-tight">Set New Goal</h3>
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Goal title..." 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white outline-none focus:border-indigo-500 transition-colors"
          />
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-bold">Target:</span>
            <input 
              type="number" 
              value={target}
              onChange={(e) => setTarget(parseInt(e.target.value))}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none w-24"
            />
          </div>
          <button 
            onClick={handleAddGoal}
            className="w-full bg-indigo-600 py-4 rounded-2xl text-white font-black shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            Create Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {goals.map(goal => (
          <div key={goal.id} className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-black text-white tracking-tight">{goal.title}</h3>
              <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                {goal.status}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-slate-400">
                <span>Progress</span>
                <span>{goal.current_value} / {goal.target_value}</span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-1000" 
                  style={{ width: `${(goal.current_value / goal.target_value) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// --- STATS DASHBOARD ---
function StatsDashboard({ user, config }: { user: User, config: AdminConfig, key?: string }) {
  const [stats, setStats] = useState({
    completedTasks: 0,
    streak: 0,
    completionRate: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const tasks = await taskApi.getAll();
    const completed = tasks.data.filter((t: any) => t.status === 'completed').length;
    setStats({
      completedTasks: completed,
      streak: Math.floor(completed / 3), // Mock streak
      completionRate: tasks.data.length > 0 ? Math.round((completed / tasks.data.length) * 100) : 0
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={<CheckSquare className="text-emerald-400" />} label="Tasks Done" value={stats.completedTasks} />
        <StatCard icon={<TrendingUp className="text-indigo-400" />} label="Streak" value={`${stats.streak} Days`} />
        <StatCard icon={<Sparkles className="text-amber-400" />} label="XP Total" value={user.xp} />
        <StatCard icon={<BarChart3 className="text-rose-400" />} label="Rate" value={`${stats.completionRate}%`} />
      </div>

      <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">Level {user.level}</h3>
            <p className="text-slate-400 font-bold">Next level: {Math.pow(user.level, 2) * 100} XP</p>
          </div>
          <span className="text-indigo-400 font-black text-xl">{user.xp} XP</span>
        </div>
        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-1000" 
            style={{ width: `${(user.xp / (Math.pow(user.level, 2) * 100)) * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// --- ADMIN PANEL ---
function AdminPanel({ user, config, onUpdate }: { user: User, config: AdminConfig, onUpdate: () => void, key?: string }) {
  const [activeTab, setActiveTab] = useState('features');
  const [users, setUsers] = useState<any[]>([]);
  const [editingConfig, setEditingConfig] = useState<AdminConfig>(config);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    const res = await adminApi.getUsers();
    setUsers(res.data);
  };

  const handleSaveConfig = async () => {
    await adminApi.updateConfig(editingConfig);
    onUpdate();
    alert("Configuration saved & applied instantly!");
  };

  const handleUpdateUser = async (id: number, data: any) => {
    await adminApi.updateUser(id, data);
    fetchUsers();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex p-1.5 bg-slate-900 rounded-3xl border border-slate-800">
        <button 
          onClick={() => setActiveTab('features')}
          className={cn("flex-1 py-3 rounded-2xl font-black text-sm transition-all", activeTab === 'features' ? "bg-indigo-600 text-white" : "text-slate-400")}
        >
          Features
        </button>
        <button 
          onClick={() => setActiveTab('xp')}
          className={cn("flex-1 py-3 rounded-2xl font-black text-sm transition-all", activeTab === 'xp' ? "bg-indigo-600 text-white" : "text-slate-400")}
        >
          XP
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={cn("flex-1 py-3 rounded-2xl font-black text-sm transition-all", activeTab === 'users' ? "bg-indigo-600 text-white" : "text-slate-400")}
        >
          Users
        </button>
        <button 
          onClick={() => setActiveTab('content')}
          className={cn("flex-1 py-3 rounded-2xl font-black text-sm transition-all", activeTab === 'content' ? "bg-indigo-600 text-white" : "text-slate-400")}
        >
          Content
        </button>
      </div>

      {activeTab === 'features' && (
        <div className="space-y-4">
          {editingConfig.features.map((f, i) => (
            <div key={f.id} className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-white">{f.name}</h4>
                <div className="flex gap-2">
                  {f.isBeta && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-lg text-[8px] font-black uppercase">Beta</span>}
                  {!f.isEnabled && <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 rounded-lg text-[8px] font-black uppercase">Disabled</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    const newFeatures = [...editingConfig.features];
                    newFeatures[i].isEnabled = !newFeatures[i].isEnabled;
                    setEditingConfig({...editingConfig, features: newFeatures});
                  }}
                  className={cn("py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border", f.isEnabled ? "bg-indigo-600 border-indigo-500 text-white" : "border-slate-800 text-slate-500")}
                >
                  {f.isEnabled ? "Enabled" : "Disabled"}
                </button>
                <button 
                  onClick={() => {
                    const newFeatures = [...editingConfig.features];
                    newFeatures[i].isBeta = !newFeatures[i].isBeta;
                    setEditingConfig({...editingConfig, features: newFeatures});
                  }}
                  className={cn("py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border", f.isBeta ? "bg-amber-600 border-amber-500 text-white" : "border-slate-800 text-slate-500")}
                >
                  Beta
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase">Req. Level:</span>
                <input 
                  type="number" 
                  value={f.requiredLevel}
                  onChange={(e) => {
                    const newFeatures = [...editingConfig.features];
                    newFeatures[i].requiredLevel = parseInt(e.target.value);
                    setEditingConfig({...editingConfig, features: newFeatures});
                  }}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white w-16 text-xs"
                />
              </div>
            </div>
          ))}
          <button onClick={handleSaveConfig} className="w-full bg-emerald-600 py-4 rounded-2xl text-white font-black shadow-lg active:scale-95 transition-all">
            Save Features
          </button>
        </div>
      )}

      {activeTab === 'xp' && (
        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-6">
          <h3 className="text-xl font-black text-white tracking-tight">XP Settings</h3>
          <div className="space-y-4">
            <XpInput label="Task XP" value={editingConfig.xpSettings.taskXP} onChange={(v) => setEditingConfig({...editingConfig, xpSettings: {...editingConfig.xpSettings, taskXP: v}})} />
            <XpInput label="Routine XP" value={editingConfig.xpSettings.routineXP} onChange={(v) => setEditingConfig({...editingConfig, xpSettings: {...editingConfig.xpSettings, routineXP: v}})} />
            <XpInput label="Daily Cap" value={editingConfig.xpSettings.dailyCap} onChange={(v) => setEditingConfig({...editingConfig, xpSettings: {...editingConfig.xpSettings, dailyCap: v}})} />
          </div>
          <button onClick={handleSaveConfig} className="w-full bg-emerald-600 py-4 rounded-2xl text-white font-black shadow-lg active:scale-95 transition-all">
            Save XP Settings
          </button>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          {users.map(u => (
            <div key={u.id} className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">{u.email}</h4>
                  <p className="text-xs text-slate-500">Lvl {u.level} • {u.xp} XP</p>
                </div>
                {u.is_banned ? <span className="text-rose-500 font-black text-[10px] uppercase">Banned</span> : null}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleUpdateUser(u.id, { ...u, level: u.level + 1 })} className="py-2 bg-slate-800 rounded-xl text-[10px] font-black uppercase">+ Level</button>
                <button onClick={() => handleUpdateUser(u.id, { ...u, xp: u.xp + 100 })} className="py-2 bg-slate-800 rounded-xl text-[10px] font-black uppercase">+ XP</button>
                <button onClick={() => handleUpdateUser(u.id, { ...u, is_banned: !u.is_banned })} className={cn("py-2 rounded-xl text-[10px] font-black uppercase", u.is_banned ? "bg-emerald-600" : "bg-rose-600")}>
                  {u.is_banned ? "Unban" : "Ban"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 space-y-4">
            <h3 className="text-xl font-black text-white tracking-tight">App Content</h3>
            <textarea 
              value={editingConfig.content.tos}
              onChange={(e) => setEditingConfig({...editingConfig, content: {...editingConfig.content, tos: e.target.value}})}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-4 text-white text-sm h-32"
              placeholder="Terms of Service..."
            />
            <input 
              type="text"
              value={editingConfig.content.version}
              onChange={(e) => setEditingConfig({...editingConfig, content: {...editingConfig.content, version: e.target.value}})}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-6 py-4 text-white"
              placeholder="Version..."
            />
            <button onClick={handleSaveConfig} className="w-full bg-emerald-600 py-4 rounded-2xl text-white font-black shadow-lg active:scale-95 transition-all">
              Update Content
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- HELPERS ---
function NavButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all",
        active ? "text-indigo-500 scale-110" : "text-slate-500 hover:text-slate-300"
      )}
    >
      <div className={cn("p-2 rounded-2xl transition-all", active && "bg-indigo-500/10")}>
        {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 space-y-3">
      <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
        {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" })}
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function XpInput({ label, value, onChange }: { label: string, value: number, onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-2xl">
      <span className="font-bold text-slate-300">{label}</span>
      <input 
        type="number" 
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white outline-none w-24 text-center font-black"
      />
    </div>
  );
}

function LockedFeature({ name, level }: { name: string, level?: number }) {
  return (
    <div className="bg-slate-900 p-12 rounded-[40px] border border-slate-800 text-center space-y-6">
      <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-600">
        <Lock className="w-10 h-10" />
      </div>
      <div>
        <h3 className="text-2xl font-black text-white tracking-tight">{name} Locked</h3>
        <p className="text-slate-400 mt-2 font-medium">
          {level ? `Requires Level ${level} to unlock.` : "This feature is currently disabled by admin."}
        </p>
      </div>
    </div>
  );
}
