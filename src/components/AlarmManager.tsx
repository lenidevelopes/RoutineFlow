import React, { useState, useEffect, useRef } from 'react';
import { User } from '../firebase';
import { subscribeAlarms, updateAlarm } from '../services/firebaseService';
import { Alarm } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, X, Clock, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';

interface AlarmManagerProps {
  user: User;
}

export default function AlarmManager({ user }: AlarmManagerProps) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastTriggeredRef = useRef<Record<string, number>>({}); // alarmId -> timestamp (minute)

  useEffect(() => {
    const unsub = subscribeAlarms(user.uid, setAlarms);
    return () => unsub();
  }, [user.uid]);

  useEffect(() => {
    const handleTest = (e: any) => {
      const testAlarm: Alarm = {
        id: 'test',
        userId: user.uid,
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        label: 'Test Alarm',
        isActive: true,
        days: [],
        createdAt: new Date().toISOString()
      };
      triggerAlarm(testAlarm);
    };

    window.addEventListener('TEST_ALARM', handleTest);
    return () => window.removeEventListener('TEST_ALARM', handleTest);
  }, [user.uid]);

  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' });
      const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const currentMinuteTimestamp = Math.floor(now.getTime() / 60000);

      alarms.forEach(alarm => {
        if (
          alarm.isActive &&
          alarm.time === currentTime &&
          alarm.days.includes(currentDay) &&
          lastTriggeredRef.current[alarm.id!] !== currentMinuteTimestamp
        ) {
          triggerAlarm(alarm);
          lastTriggeredRef.current[alarm.id!] = currentMinuteTimestamp;
        }
      });
    };

    const interval = setInterval(checkAlarms, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [alarms]);

  const triggerAlarm = (alarm: Alarm) => {
    setActiveAlarm(alarm);
    setIsRinging(true);
    
    // Play sound
    if (!audioRef.current) {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audioRef.current.loop = true;
    }
    audioRef.current.play().catch(e => console.error("Audio play failed:", e));
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRinging(false);
    setActiveAlarm(null);
  };

  const snoozeAlarm = () => {
    stopAlarm();
    // In a real app, we'd schedule a snooze. For now, just stop.
  };

  return (
    <AnimatePresence>
      {isRinging && activeAlarm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-600/95 backdrop-blur-xl"
        >
          <div className="w-full max-w-sm text-center space-y-12">
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.5,
                ease: "easeInOut"
              }}
              className="w-32 h-32 bg-white/20 rounded-[48px] flex items-center justify-center mx-auto shadow-2xl"
            >
              <Bell className="w-16 h-16 text-white" />
            </motion.div>

            <div className="space-y-4">
              <h2 className="text-7xl font-black text-white tracking-tighter tabular-nums">
                {activeAlarm.time}
              </h2>
              <p className="text-xl font-bold text-indigo-100 uppercase tracking-widest">
                {activeAlarm.label || 'Alarm'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-12">
              <button
                onClick={stopAlarm}
                className="w-full py-6 bg-white text-indigo-600 rounded-[32px] font-black text-xl shadow-2xl hover:bg-slate-50 transition-all active:scale-95"
              >
                STOP
              </button>
              <button
                onClick={snoozeAlarm}
                className="w-full py-5 bg-white/10 text-white rounded-[32px] font-bold text-lg hover:bg-white/20 transition-all active:scale-95 border border-white/20"
              >
                SNOOZE
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
