/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from '../firebase';
import { subscribeTasks, createTask, updateTask, deleteTask, toggleTaskCompletion } from '../services/firebaseService';
import { Task, Priority, TaskCategory } from '../types';
import { Plus, CheckCircle2, Circle, Trash2, Calendar, Flag, Search, Filter, X, ChevronDown, ChevronUp, Briefcase, User as UserIcon, Heart, DollarSign, MoreHorizontal, ListTodo as ListIcon, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import Header from '../components/Header';

interface TasksScreenProps {
  user: User;
}

export default function TasksScreen({ user }: TasksScreenProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<string>('personal');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');

  const [newTaskTags, setNewTaskTags] = useState('');

  useEffect(() => {
    const unsub = subscribeTasks(user.uid, setTasks);
    return () => unsub();
  }, [user.uid]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      userId: user.uid,
      title: newTaskTitle,
      completed: false,
      priority: newTaskPriority,
      category: isCustomCategory ? (customCategory.trim() || 'Other') : newTaskCategory,
      tags: newTaskTags.split(',').map(t => t.trim()).filter(t => t !== ''),
      checklist: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await createTask(newTask);
    setNewTaskTitle('');
    setNewTaskCategory('personal');
    setCustomCategory('');
    setIsCustomCategory(false);
    setNewTaskPriority('medium');
    setNewTaskTags('');
    setIsAdding(false);
  };

  const toggleTask = (task: Task) => {
    toggleTaskCompletion(task, user.uid);
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed;
    const matchesCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
    return matchesSearch && matchesFilter && matchesCategory;
  });

  return (
    <div className="min-h-full">
      <Header 
        title="Tasks"
        subtitle={`${filteredTasks.length} Items Found`}
        rightElement={
          <button
            onClick={() => setIsAdding(true)}
            className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-90"
          >
            <Plus className="w-6 h-6" />
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Search & Filter */}
        <div className="space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 rounded-[24px] border border-slate-100 dark:border-zinc-800 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="relative">
            <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 mask-fade-right">
              <FilterButton active={filter === 'all'} label="All" onClick={() => setFilter('all')} />
              <FilterButton active={filter === 'active'} label="Active" onClick={() => setFilter('active')} />
              <FilterButton active={filter === 'completed'} label="Completed" onClick={() => setFilter('completed')} />
              <div className="w-px h-6 bg-slate-200 dark:bg-zinc-800 mx-1 shrink-0" />
              <FilterButton active={categoryFilter === 'all'} label="Any Category" onClick={() => setCategoryFilter('all')} />
              <FilterButton active={categoryFilter === 'work'} label="Work" onClick={() => setCategoryFilter('work')} />
              <FilterButton active={categoryFilter === 'personal'} label="Personal" onClick={() => setCategoryFilter('personal')} />
              <FilterButton active={categoryFilter === 'health'} label="Health" onClick={() => setCategoryFilter('health')} />
              <FilterButton active={categoryFilter === 'finance'} label="Finance" onClick={() => setCategoryFilter('finance')} />
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <div key={task.id}>
                <TaskItem task={task} onToggle={() => toggleTask(task)} onDelete={() => deleteTask(task.id!)} />
              </div>
            ))}
          </AnimatePresence>
          {filteredTasks.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 dark:bg-zinc-900 rounded-[32px] flex items-center justify-center mx-auto mb-4">
                <LayoutGrid className="w-10 h-10 text-slate-300 dark:text-zinc-700" />
              </div>
              <p className="text-slate-400 dark:text-zinc-500 font-medium">No tasks found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl overflow-hidden relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full mt-3 sm:hidden" />
              
              <div className="flex items-center justify-between mb-8 mt-2">
                <h2 className="text-2xl font-black tracking-tight">New Task</h2>
                <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-50 dark:bg-zinc-800 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddTask} className="space-y-6 max-h-[70vh] overflow-y-auto px-1 pb-4 scrollbar-hide">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Title</p>
                  <input
                    autoFocus
                    type="text"
                    placeholder="What needs to be done?"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="w-full text-xl font-bold bg-transparent border-none outline-none placeholder:text-slate-200 dark:placeholder:text-zinc-800"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Category</p>
                  <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-2 -mx-1 px-1">
                    <CategoryOption active={!isCustomCategory && newTaskCategory === 'work'} icon={<Briefcase className="w-5 h-5" />} label="Work" onClick={() => { setNewTaskCategory('work'); setIsCustomCategory(false); }} />
                    <CategoryOption active={!isCustomCategory && newTaskCategory === 'personal'} icon={<UserIcon className="w-5 h-5" />} label="Personal" onClick={() => { setNewTaskCategory('personal'); setIsCustomCategory(false); }} />
                    <CategoryOption active={!isCustomCategory && newTaskCategory === 'health'} icon={<Heart className="w-5 h-5" />} label="Health" onClick={() => { setNewTaskCategory('health'); setIsCustomCategory(false); }} />
                    <CategoryOption active={!isCustomCategory && newTaskCategory === 'finance'} icon={<DollarSign className="w-5 h-5" />} label="Finance" onClick={() => { setNewTaskCategory('finance'); setIsCustomCategory(false); }} />
                    <CategoryOption active={isCustomCategory} icon={<MoreHorizontal className="w-5 h-5" />} label="Other" onClick={() => setIsCustomCategory(true)} />
                  </div>
                  {isCustomCategory && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <input
                        type="text"
                        placeholder="Type custom category..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Tags (comma separated)</p>
                  <input
                    type="text"
                    placeholder="e.g. urgent, home"
                    value={newTaskTags}
                    onChange={(e) => setNewTaskTags(e.target.value)}
                    className="w-full p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-100 dark:border-zinc-800 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Priority</p>
                  <div className="flex items-center gap-3">
                    <PriorityButton active={newTaskPriority === 'low'} label="Low" color="slate" onClick={() => setNewTaskPriority('low')} />
                    <PriorityButton active={newTaskPriority === 'medium'} label="Medium" color="amber" onClick={() => setNewTaskPriority('medium')} />
                    <PriorityButton active={newTaskPriority === 'high'} label="High" color="rose" onClick={() => setNewTaskPriority('high')} />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Create Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskItem({ task, onToggle, onDelete }: { task: Task, onToggle: () => void, onDelete: () => void | Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');

  const categoryIcons: Record<string, React.ReactNode> = {
    work: <Briefcase className="w-3.5 h-3.5" />,
    personal: <UserIcon className="w-3.5 h-3.5" />,
    health: <Heart className="w-3.5 h-3.5" />,
    finance: <DollarSign className="w-3.5 h-3.5" />,
    other: <MoreHorizontal className="w-3.5 h-3.5" />
  };

  const categoryColors: Record<string, string> = {
    work: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    personal: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
    health: "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400",
    finance: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    other: "bg-slate-50 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400"
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    const updatedChecklist = [...(task.checklist || []), { text: newSubtask, completed: false }];
    updateTask(task.id!, { checklist: updatedChecklist });
    setNewSubtask('');
  };

  const toggleSubtask = (index: number) => {
    const updatedChecklist = [...(task.checklist || [])];
    updatedChecklist[index].completed = !updatedChecklist[index].completed;
    updateTask(task.id!, { checklist: updatedChecklist });
  };

  const removeSubtask = (index: number) => {
    const updatedChecklist = task.checklist.filter((_, i) => i !== index);
    updateTask(task.id!, { checklist: updatedChecklist });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "group bg-white dark:bg-zinc-900 rounded-[28px] border border-slate-100/50 dark:border-zinc-800/50 shadow-sm overflow-hidden transition-all hover:shadow-md",
        task.completed && "opacity-60"
      )}
    >
      <div className="p-5 flex items-center gap-4">
        <button onClick={onToggle} className="transition-transform active:scale-90 shrink-0">
          {task.completed ? (
            <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-7 h-7 border-2 border-slate-200 dark:border-zinc-700 rounded-full hover:border-indigo-500 transition-colors" />
          )}
        </button>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              "font-black text-slate-800 dark:text-zinc-200 truncate tracking-tight",
              task.completed && "line-through text-slate-400"
            )}>
              {task.title}
            </h4>
            {task.checklist?.length > 0 && (
              <span className="shrink-0 text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                {task.checklist.filter(c => c.completed).length}/{task.checklist.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg flex items-center gap-1.5",
              categoryColors[task.category] || categoryColors.other
            )}>
              {categoryIcons[task.category] || categoryIcons.other} {task.category}
            </span>
            <span className={cn(
              "text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg",
              task.priority === 'high' ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" :
              task.priority === 'medium' ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" :
              "bg-slate-50 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
            )}>
              {task.priority}
            </span>
            {task.tags?.map(tag => (
              <span key={tag} className="text-[9px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        <button onClick={onDelete} className="p-2 text-slate-300 dark:text-zinc-700 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-16 pb-6 border-t border-slate-50 dark:border-zinc-800/50 pt-4 space-y-4"
          >
            {task.description && (
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">{task.description}</p>
            )}
            
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Subtasks</p>
              <div className="space-y-2">
                {task.checklist?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between group/sub">
                    <button 
                      onClick={() => toggleSubtask(idx)}
                      className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-zinc-400 hover:text-indigo-600 transition-colors"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                      <span className={cn(item.completed && "line-through text-slate-400 font-medium")}>{item.text}</span>
                    </button>
                    <button 
                      onClick={() => removeSubtask(idx)}
                      className="p-1 opacity-0 group-hover/sub:opacity-100 text-slate-300 hover:text-rose-500 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-4">
                <input
                  type="text"
                  placeholder="Add subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  className="flex-1 text-xs font-bold bg-slate-50 dark:bg-zinc-800/50 border-none rounded-xl px-4 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
                <button type="submit" className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 active:scale-90 transition-all">
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CategoryOption({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-3 p-4 min-w-[80px] rounded-[24px] border-2 transition-all duration-300",
        active 
          ? "bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-400 dark:text-indigo-400 shadow-lg shadow-indigo-500/10 scale-105" 
          : "bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-400 hover:border-slate-200"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-colors",
        active ? "bg-indigo-100 dark:bg-indigo-800/50" : "bg-slate-50 dark:bg-zinc-700"
      )}>
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.1em]">{label}</span>
    </button>
  );
}

function PriorityButton({ active, label, color, onClick }: { active: boolean, label: string, color: string, onClick: () => void }) {
  const colors: any = {
    slate: active ? "bg-slate-100 text-slate-700 border-slate-300 shadow-inner" : "bg-white dark:bg-zinc-800 text-slate-400 border-slate-100 dark:border-zinc-700",
    amber: active ? "bg-amber-50 text-amber-700 border-amber-300 shadow-inner" : "bg-white dark:bg-zinc-800 text-slate-400 border-slate-100 dark:border-zinc-700",
    rose: active ? "bg-rose-50 text-rose-700 border-rose-300 shadow-inner" : "bg-white dark:bg-zinc-800 text-slate-400 border-slate-100 dark:border-zinc-700",
  };
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
        colors[color],
        active && "scale-105"
      )}
    >
      {label}
    </button>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap border-2",
        active 
          ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20 scale-105" 
          : "bg-white dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-100 dark:border-zinc-800 hover:border-slate-200"
      )}
    >
      {label}
    </button>
  );
}

function ListTodo(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 16 2 2 4-4" />
      <path d="m3 6 2 2 4-4" />
      <path d="M13 6h8" />
      <path d="M13 12h8" />
      <path d="M13 18h8" />
    </svg>
  );
}
