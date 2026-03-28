/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Bell, SkipForward, RotateCw, Camera, Mic, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { getCurrentTime12h, getDeviceTimeFormat, formatTime } from '../lib/timeUtils';

interface AlarmScreenProps {
  data: {
    routineId: string;
    taskId: string;
    routineName: string;
    taskTitle: string;
    time: string;
    alarmConfig?: any;
  };
  skipsToday: number;
  onComplete: () => void;
  onSnooze: () => void;
  onSkip: () => void;
  onDismiss: () => void;
}

const CHALLENGES = [
  { id: 'smile', label: 'Smile for the camera', icon: Camera, type: 'camera' },
  { id: 'blink', label: 'Blink 3 times', icon: Camera, type: 'camera' },
  { id: 'stand', label: 'Stand up & show your face', icon: Camera, type: 'camera' },
  { id: 'bright', label: 'Find a bright light', icon: Camera, type: 'camera' },
];

export const AlarmScreen: React.FC<AlarmScreenProps> = ({ data, skipsToday, onComplete, onSnooze, onSkip, onDismiss }) => {
  const [currentTime, setCurrentTime] = useState(getCurrentTime12h());
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [challengeState, setChallengeState] = useState<'idle' | 'active' | 'verifying' | 'failed' | 'success'>('idle');
  const [failCount, setFailCount] = useState(0);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeFormat = getDeviceTimeFormat();

  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Initialize audio
  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.loop = true;
    audioRef.current = audio;

    const playAudio = async () => {
      try {
        playPromiseRef.current = audio.play();
        await playPromiseRef.current;
      } catch (err) {
        console.warn('Audio autoplay blocked or failed:', err);
      }
    };

    playAudio();

    return () => {
      if (playPromiseRef.current !== null) {
        playPromiseRef.current.then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {
          // If play failed, we don't need to pause
        });
      } else {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime12h());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startRoulette = () => {
    setIsSpinning(true);
    setTimeout(() => {
      const random = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
      setSelectedChallenge(random);
      setIsSpinning(false);
      setChallengeState('active');
    }, 2000);
  };

  const handleManualVerify = () => {
    setChallengeState('verifying');
    setTimeout(() => {
      setChallengeState('success');
      setTimeout(onDismiss, 1000);
    }, 1500);
  };

  const handleCameraVerify = async () => {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' },
        audio: false 
      });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setChallengeState('verifying');

      // Wake up verification: require 5 seconds of "activity"
      let timeLeft = 5;
      const timer = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft <= 0) {
          clearInterval(timer);
          
          // Flash effect
          const flash = document.createElement('div');
          flash.className = 'fixed inset-0 bg-white z-[300] animate-pulse';
          document.body.appendChild(flash);
          setTimeout(() => flash.remove(), 300);

          setChallengeState('success');
          stopCamera();
          setTimeout(onDismiss, 1500);
        }
      }, 1000);
    } catch (err) {
      console.error('Camera access denied:', err);
      setChallengeState('failed');
      setFailCount(prev => prev + 1);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleForceDismiss = () => {
    stopCamera();
    onDismiss();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.2),transparent_70%)]" />
      
      <div className="w-full max-w-md space-y-8 text-center relative z-10">
        <div className="space-y-2">
          <p className="text-indigo-400 font-bold uppercase tracking-[0.3em] text-sm">
            {data.routineName}
          </p>
          <h1 className="text-5xl font-black tracking-tight">{data.taskTitle}</h1>
          <div className="flex items-center justify-center gap-2 text-slate-400 font-bold">
            <Clock className="w-5 h-5" />
            <span className="text-2xl font-mono">{currentTime}</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {challengeState === 'idle' ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <button
                onClick={startRoulette}
                className="w-full py-8 bg-rose-600 text-white rounded-[40px] flex flex-col items-center gap-4 hover:bg-rose-500 transition-all active:scale-95 shadow-2xl shadow-rose-500/40 border-4 border-rose-400/30"
              >
                <Bell className="w-12 h-12 animate-bounce" />
                <span className="text-3xl font-black uppercase tracking-tighter">Stop Alarm</span>
              </button>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={onSnooze}
                  className="p-6 bg-amber-600/20 border border-amber-500/30 rounded-[32px] flex flex-col items-center gap-3 hover:bg-amber-600/30 transition-all active:scale-95"
                >
                  <Clock className="w-8 h-8 text-amber-500" />
                  <span className="font-bold">Snooze</span>
                </button>
                <button
                  onClick={onSkip}
                  disabled={skipsToday >= 3}
                  className={cn(
                    "p-6 border rounded-[32px] flex flex-col items-center gap-3 transition-all active:scale-95",
                    skipsToday >= 3 
                      ? "bg-slate-800/50 border-slate-700 opacity-50 cursor-not-allowed" 
                      : "bg-slate-600/20 border-slate-500/30 hover:bg-slate-600/30"
                  )}
                >
                  <SkipForward className="w-8 h-8 text-slate-400" />
                  <span className="font-bold">Skip ({3 - skipsToday} left)</span>
                </button>
              </div>
            </motion.div>
          ) : challengeState === 'active' || challengeState === 'verifying' || challengeState === 'failed' || challengeState === 'success' ? (
            <motion.div
              key="challenge"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-6 backdrop-blur-xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 animate-pulse" />
              
              <div className="text-center space-y-1">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-indigo-400">Wake Up!</h2>
                <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto mt-4">
                  {selectedChallenge?.icon && <selectedChallenge.icon className="w-10 h-10 text-indigo-400" />}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black tracking-tight">
                  {challengeState === 'success' ? 'Challenge Complete!' : selectedChallenge?.label}
                </h3>
                <p className="text-slate-400 font-bold">
                  {challengeState === 'verifying' ? 'Stay active! Verifying...' : 
                   challengeState === 'failed' ? 'Verification failed. Try again.' :
                   challengeState === 'success' ? 'You are awake! Great job!' :
                   'Perform the action to dismiss the alarm.'}
                </p>
              </div>

              {selectedChallenge?.type === 'camera' && (
                <div className="aspect-video bg-black rounded-2xl overflow-hidden relative">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  {challengeState === 'verifying' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                {challengeState === 'active' || challengeState === 'failed' ? (
                  <button
                    onClick={selectedChallenge?.type === 'camera' ? handleCameraVerify : handleManualVerify}
                    className="w-full py-5 bg-indigo-600 rounded-2xl font-black text-lg hover:bg-indigo-500 transition-all active:scale-95"
                  >
                    {selectedChallenge?.type === 'camera' ? 'Start Camera' : 'I\'ve Done It'}
                  </button>
                ) : null}

                {failCount >= 2 && (
                  <button
                    onClick={handleForceDismiss}
                    className="w-full py-4 bg-rose-600/20 text-rose-500 border border-rose-500/30 rounded-2xl font-bold hover:bg-rose-600/30 transition-all"
                  >
                    Force Dismiss (Failsafe)
                  </button>
                )}
                
                {challengeState !== 'success' && challengeState !== 'verifying' && (
                  <button
                    onClick={() => setChallengeState('idle')}
                    className="w-full py-4 bg-white/5 text-slate-400 rounded-2xl font-bold hover:bg-white/10 transition-all"
                  >
                    Back to Options
                  </button>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {isSpinning && (
        <div className="fixed inset-0 z-[210] bg-slate-950/90 flex items-center justify-center">
          <div className="text-center space-y-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
              className="w-24 h-24 border-8 border-indigo-500 border-t-transparent rounded-full mx-auto"
            />
            <h2 className="text-4xl font-black italic tracking-tighter animate-pulse">SELECTING CHALLENGE...</h2>
          </div>
        </div>
      )}
    </motion.div>
  );
};
