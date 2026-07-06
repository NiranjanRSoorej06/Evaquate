/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SchoolLayout, DisasterType, DrillResult, Achievement, LeaderboardEntry } from './types';
import DrillPlatform from './components/DrillPlatform';
import Dashboard from './components/Dashboard';
import GamificationCenter from './components/GamificationCenter';
import FeedbackModal from './components/FeedbackModal';
import { ShieldAlert, Compass, Layers, Trophy, AlertTriangle, HelpCircle, Shield, Info, Volume2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'drill' | 'dashboard' | 'gamification'>('drill');
  
  // Current Campus Twin Layout
  const [layout, setLayout] = useState<SchoolLayout | null>(null);

  // Active Disaster configuration
  const [activeDisaster, setActiveDisaster] = useState<DisasterType | null>(null);
  const [randomizedBlockages, setRandomizedBlockages] = useState<boolean>(true);
  const [isDrillRunning, setIsDrillRunning] = useState<boolean>(false);

  // Gamification & Records State
  const [xp, setXp] = useState<number>(350); // Start with some base XP
  const [score, setScore] = useState<number>(0);
  const [drillHistory, setDrillHistory] = useState<DrillResult[]>([]);
  const [completedDrillResult, setCompletedDrillResult] = useState<DrillResult | null>(null);

  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'ach_1', title: 'Earthquake Survivor', description: 'Evacuate successfully during active seismic tremors by seeking protective shelter under sturdy desks.', icon: 'Shield', xpReward: 250, unlocked: false },
    { id: 'ach_2', title: 'Fire Safety Expert', description: 'Crawl low under smoke clouds, locate a CO2 extinguisher, and clear corridor fires.', icon: 'Flame', xpReward: 250, unlocked: false },
    { id: 'ach_3', title: 'Campus Safety Champion', description: 'Bandage and guide injured classmates to safety assembly points during critical alerts.', icon: 'Award', xpReward: 350, unlocked: false },
    { id: 'ach_4', title: 'Chemical Rescue Hero', description: 'Escape biological chemical leaks successfully by equipping gas respirator masks.', icon: 'Users', xpReward: 300, unlocked: false }
  ]);

  // Pre-load default High School blueprint on mount
  useEffect(() => {
    async function loadDefaultPreset() {
      try {
        const response = await fetch('/api/convert-blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ presetId: 'preset_1' })
        });
        const resData = await response.json();
        if (resData.success) {
          setLayout(resData.data);
        }
      } catch (err) {
        console.error('Failed to pre-load campus twin:', err);
      }
    }
    loadDefaultPreset();
  }, []);

  // Handle triggered drills from the dashboard or scheduler
  const triggerDrill = (disaster: DisasterType, blocks: boolean) => {
    setActiveDisaster(disaster);
    setRandomizedBlockages(blocks);
    setIsDrillRunning(true);
    setActiveTab('drill'); // automatically navigate to play
  };

  // Callback when a drill finishes (Success or Failure)
  const handleDrillComplete = (result: DrillResult) => {
    setIsDrillRunning(false);
    setCompletedDrillResult(result);

    // Save history
    setDrillHistory(prev => [result, ...prev]);

    // Update global score & XP progression
    if (result.isSuccessful) {
      const xpReward = result.score * 5;
      setXp(prev => prev + xpReward);

      // Evaluate and unlock custom safety badges dynamically!
      setAchievements(prev => prev.map(ach => {
        if (ach.id === 'ach_1' && result.disasterType === 'earthquake' && !ach.unlocked) {
          setXp(x => x + ach.xpReward);
          return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        if (ach.id === 'ach_2' && result.disasterType === 'fire' && !ach.unlocked) {
          setXp(x => x + ach.xpReward);
          return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        if (ach.id === 'ach_4' && result.disasterType === 'chemical_leak' && !ach.unlocked) {
          setXp(x => x + ach.xpReward);
          return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        // Unlock safety champion if they rescued Jimmy or Principal Harris (found in actions list)
        const savedNPC = result.actions.some(act => act.action.startsWith('Rescued'));
        if (ach.id === 'ach_3' && savedNPC && !ach.unlocked) {
          setXp(x => x + ach.xpReward);
          return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        return ach;
      }));
    }
  };

  // District Leaderboard generator with reactive XP
  const leaderboard: LeaderboardEntry[] = [
    { rank: 1, name: 'James Lin (Grade 11)', class: 'Oakwood High School', score: 98, xp: 3250, drillsCompleted: 14 },
    { rank: 2, name: 'Sophia Chen (Grade 10)', class: 'Oakwood High School', score: 94, xp: 2800, drillsCompleted: 11 },
    // Reactive student placement based on current XP!
    { rank: xp > 2800 ? 2 : xp > 1150 ? 3 : 4, name: 'You (Class Participant)', class: '3D Simulation Center', score: 90, xp: xp, drillsCompleted: drillHistory.length, isUser: true },
    { rank: xp > 1150 ? 4 : 3, name: 'Oliver Smith (Grade 9)', class: 'Oakwood High School', score: 85, xp: 1150, drillsCompleted: 6 },
    { rank: 5, name: 'Emily Taylor (Grade 12)', class: 'Oakwood High School', score: 82, xp: 900, drillsCompleted: 4 }
  ].sort((a, b) => b.xp - a.xp).map((item, idx) => ({ ...item, rank: idx + 1 }));

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col font-sans text-slate-200" id="app-viewport">
      
      {/* 1. Header Navigation Bar */}
      <header className="bg-brand-card/90 backdrop-blur-md border-b border-slate-800 text-white shrink-0 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo and Brand Name */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 p-2 rounded-xl border border-cyan-400/30 shadow-md shadow-cyan-950/50">
              <ShieldAlert className="w-5.5 h-5.5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-sm md:text-base tracking-tight text-slate-100 flex items-center gap-2">
                3D Disaster Drill Platform <span className="bg-cyan-950 text-cyan-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-800/50 uppercase shadow-sm">Digital Twin</span>
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5 tracking-wider">Automated Architectural Calibration & Immersive Safety Game</p>
            </div>
          </div>

          {/* Tab Selection */}
          <nav className="flex items-center gap-1 bg-brand-canvas border border-slate-800/80 p-1 rounded-xl shadow-inner">
            <button
              onClick={() => setActiveTab('drill')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'drill'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/65'
              }`}
              id="tab-drill"
            >
              <Compass className="w-4 h-4 text-cyan-400" /> Virtual Drill
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/65'
              }`}
              id="tab-dashboard"
            >
              <Layers className="w-4 h-4 text-emerald-400" /> Calibration Console
            </button>
            <button
              onClick={() => setActiveTab('gamification')}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === 'gamification'
                  ? 'bg-cyan-600 text-white font-bold shadow-md shadow-cyan-950/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/65'
              }`}
              id="tab-gamification"
            >
              <Trophy className="w-4 h-4 text-amber-400" /> Achievement Hub
            </button>
          </nav>

          {/* Quick HUD Progress */}
          <div className="flex items-center gap-3 text-xs border border-slate-800 bg-brand-canvas p-2 rounded-xl text-slate-300 font-mono shadow-sm">
            <div>XP: <strong className="text-cyan-400 font-extrabold">{xp}</strong></div>
            <div className="w-px h-3 bg-slate-800" />
            <div>Level: <strong className="text-emerald-400 font-extrabold">{Math.floor(xp / 500) + 1}</strong></div>
          </div>

        </div>
      </header>

      {/* 2. Primary Layout Screen Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 overflow-y-auto">
        
        {/* Onboarding info bar for digital twins */}
        {!isDrillRunning && activeTab === 'drill' && (
          <div className="mb-6 p-4.5 bg-brand-card border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-white shadow-lg shadow-black/20">
            <div className="flex items-start gap-3.5">
              <div className="bg-cyan-950 p-2.5 rounded-xl border border-cyan-500/20 shrink-0 shadow-inner">
                <Info className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="text-xs">
                <h3 className="font-bold text-slate-100 text-sm">Digitized Building Twin: {layout?.schoolName || 'Oakwood High School'}</h3>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  We have loaded a structured High School preset blueprint out of the box. Go to the <strong className="text-cyan-400 font-semibold">Calibration Console</strong> to upload custom CAD drawings or fine-tune doors and escape coordinates!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-brand-canvas px-3 py-1.5 rounded-xl border border-slate-800 shrink-0 shadow-sm">
              <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Voice Announcements Enabled</span>
            </div>
          </div>
        )}

        {/* Tab Route Switching */}
        {activeTab === 'drill' && (
          layout ? (
            <DrillPlatform
              layout={layout}
              onDrillComplete={handleDrillComplete}
              disasterType={activeDisaster || 'fire'}
              randomizedBlockages={randomizedBlockages}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-20 text-center bg-brand-card rounded-2xl border border-slate-800 shadow-xl">
              <Layers className="w-12 h-12 text-cyan-500 animate-pulse mb-3.5" />
              <h3 className="text-white font-bold text-lg">Pre-loading Campus Twin Layout</h3>
              <p className="text-slate-400 text-xs mt-1 max-w-md leading-relaxed">Analyzing blueprint schematics, compiling stairwell rooms, and initializing 3D structures...</p>
            </div>
          )
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            layout={layout}
            onLayoutUpdate={setLayout}
            onTriggerDrill={triggerDrill}
            drillHistory={drillHistory}
          />
        )}

        {activeTab === 'gamification' && (
          <GamificationCenter
            xp={xp}
            score={score}
            achievements={achievements}
            leaderboard={leaderboard}
          />
        )}

      </main>

      {/* 3. AI Drill Evaluator Feedback Modal */}
      {completedDrillResult && (
        <FeedbackModal
          drillResult={completedDrillResult}
          onClose={() => setCompletedDrillResult(null)}
          onRestart={() => {
            setCompletedDrillResult(null);
            setActiveDisaster(completedDrillResult.disasterType);
            setIsDrillRunning(true);
            setActiveTab('drill');
          }}
        />
      )}

      {/* 4. Footer credits */}
      <footer className="bg-brand-canvas border-t border-slate-900/60 py-4.5 text-center text-[10px] text-slate-500 shrink-0 font-mono tracking-wider">
        © 2026 Campus Twin Disaster Preparedness platform • Powered by Google Gemini 3.5 AI & Antigravity Full-Stack Ecosystem
      </footer>

    </div>
  );
}
