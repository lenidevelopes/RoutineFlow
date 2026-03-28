/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Edit3, Save, X, Shield, FileText } from 'lucide-react';
import { User } from 'firebase/auth';
import { Policy } from '../types';
import { subscribePolicy, updatePolicy } from '../services/firebaseService';
import { cn } from '../lib/utils';

interface PolicyPageProps {
  user: User | null;
  onClose: () => void;
}

export default function PolicyPage({ user, onClose }: PolicyPageProps) {
  const [tos, setTos] = useState<Policy | null>(null);
  const [privacy, setPrivacy] = useState<Policy | null>(null);
  const [activeTab, setActiveTab] = useState<'tos' | 'privacy'>('tos');
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const isAdmin = user?.email === 'saifahmed123az@gmail.com';

  useEffect(() => {
    const unsubTos = subscribePolicy('tos', setTos);
    const unsubPrivacy = subscribePolicy('privacy', setPrivacy);
    return () => {
      unsubTos();
      unsubPrivacy();
    };
  }, []);

  const handleEdit = () => {
    setEditContent(activeTab === 'tos' ? tos?.content || '' : privacy?.content || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    const policy: Policy = {
      id: activeTab,
      content: editContent,
      updatedAt: new Date().toISOString(),
      updatedBy: user?.email || 'unknown'
    };
    await updatePolicy(activeTab, editContent);
    setIsEditing(false);
  };

  const currentPolicy = activeTab === 'tos' ? tos : privacy;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-black tracking-tight">Policies</h1>
        </div>
        {isAdmin && !isEditing && (
          <button 
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20"
          >
            <Edit3 className="w-4 h-4" /> Edit
          </button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="p-2 text-slate-400 hover:text-rose-500 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
            <button 
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-8">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-zinc-900 rounded-2xl">
          <button
            onClick={() => setActiveTab('tos')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
              activeTab === 'tos' ? "bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm" : "text-slate-400"
            )}
          >
            <FileText className="w-4 h-4" /> Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all",
              activeTab === 'privacy' ? "bg-white dark:bg-zinc-800 text-indigo-600 shadow-sm" : "text-slate-400"
            )}
          >
            <Shield className="w-4 h-4" /> Privacy Policy
          </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-[40px] border border-slate-100 dark:border-zinc-800 p-8 sm:p-12 shadow-sm min-h-[60vh]">
          {isEditing ? (
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full h-[50vh] bg-slate-50 dark:bg-zinc-800/50 rounded-3xl p-6 outline-none font-medium text-lg resize-none border border-slate-100 dark:border-zinc-800"
              placeholder="Write policy content here..."
            />
          ) : (
            <div className="prose dark:prose-invert max-w-none">
              <h2 className="text-3xl font-black mb-6">
                {activeTab === 'tos' ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <div className="whitespace-pre-wrap text-slate-600 dark:text-zinc-400 leading-relaxed text-lg">
                {currentPolicy?.content || 'No content yet. Please contact the administrator.'}
              </div>
              {currentPolicy && (
                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-zinc-800 text-sm text-slate-400 font-medium">
                  Last updated: {new Date(currentPolicy.updatedAt).toLocaleDateString()} by {currentPolicy.updatedBy}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
