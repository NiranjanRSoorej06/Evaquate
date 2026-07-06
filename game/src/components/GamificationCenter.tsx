/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Achievement, LeaderboardEntry } from '../types';
import { Award, Shield, Zap, Flame, Users, Trophy, ChevronRight, Check } from 'lucide-react';

interface GamificationCenterProps {
  xp: number;
  score: number;
  achievements: Achievement[];
  leaderboard: LeaderboardEntry[];
}

export default function GamificationCenter({
  xp,
  score,
  achievements,
  leaderboard
}: GamificationCenterProps) {
  // Simple Level calculation based on XP
  const level = Math.floor(xp / 500) + 1;
  const currentLevelXp = xp % 500;
  const xpNeededForNextLevel = 500;
  const progressPercent = Math.min(100, (currentLevelXp / xpNeededForNextLevel) * 100);

  // Daily Practice Challenges
  const dailyChallenges = [
    { id: "dc_1", title: "Safety Seeker", description: "Practice earthquake duck & cover procedure 3 times.", progress: 3, target: 3, xp: 100, done: true },
    { id: "dc_2", title: "Crawl Low", description: "Complete any fire drill with remaining oxygen > 80%.", progress: 1, target: 1, xp: 150, done: false },
    { id: "dc_3", title: "First Responder", description: "Successfully find and treat an injured classmate NPC.", progress: 0, target: 1, xp: 200, done: false }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="gamification-container">
      
      {/* Level & XP Overview */}
      <div className="lg:col-span-12 bg-brand-card border border-slate-800/85 rounded-2xl p-5 text-white flex flex-col md:flex-row items-center gap-6 shadow-xl">
        <div className="relative w-24 h-24 bg-gradient-to-tr from-cyan-600 to-cyan-700 rounded-full flex flex-col items-center justify-center border-4 border-slate-850 shadow-md shadow-cyan-950/40 text-center shrink-0">
          <span className="text-[10px] text-cyan-200 font-bold uppercase tracking-wider">LEVEL</span>
          <span className="text-3xl font-black text-white leading-none">{level}</span>
          <span className="text-[10px] text-cyan-200 font-bold">PREPARED</span>
        </div>

        <div className="flex-1 w-full flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400 animate-pulse" /> Campus Readiness Level
            </span>
            <span className="font-mono font-bold text-slate-400">{xp} / {(level * 500)} XP</span>
          </div>
          
          {/* XP Progress Bar */}
          <div className="w-full bg-[#0A0F1D] h-3.5 rounded-full border border-slate-850/80 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-cyan-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-sleek-glow"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-slate-400 mt-1">
            <div>Current Level XP: <strong className="text-slate-300">{currentLevelXp}</strong></div>
            <div>•</div>
            <div>XP to Level {level + 1}: <strong className="text-cyan-400">{xpNeededForNextLevel - currentLevelXp}</strong></div>
            <div>•</div>
            <div>Certificates Earned: <strong className="text-slate-300">{Math.floor(xp / 1000)}</strong></div>
          </div>
        </div>
      </div>

      {/* Safety Badges & Achievements */}
      <div className="lg:col-span-8 bg-brand-card border border-slate-800/85 rounded-2xl p-5 text-white flex flex-col gap-4 shadow-lg">
        <h2 className="font-semibold text-base tracking-tight flex items-center gap-2 text-slate-100">
          <Award className="w-5 h-5 text-cyan-400" /> Drill Preparedness Achievements
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 border rounded-2xl flex items-start gap-3.5 transition-all duration-300 ${
                ach.unlocked
                  ? 'bg-brand-canvas/70 border-cyan-900/40 hover:border-cyan-500/40 shadow-inner'
                  : 'bg-brand-canvas/20 border-slate-850 opacity-50'
              }`}
            >
              <div className={`p-2.5 rounded-xl text-center ${
                ach.unlocked ? 'bg-cyan-600/15 text-cyan-400 border border-cyan-800/50 shadow-sm' : 'bg-slate-800 text-slate-500'
              }`}>
                <Shield className="w-6 h-6" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-start">
                  <h3 className={`font-bold ${ach.unlocked ? 'text-slate-100' : 'text-slate-500'}`}>
                    {ach.title}
                  </h3>
                  {ach.unlocked && (
                    <span className="text-[9px] text-cyan-400 bg-cyan-900/20 px-2 py-0.5 rounded-full font-bold font-mono tracking-wider">
                      UNLOCKED
                    </span>
                  )}
                </div>
                <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">{ach.description}</p>
                <div className="text-[10px] text-slate-500 mt-2 font-mono flex justify-between">
                  <span>Reward: +{ach.xpReward} XP</span>
                  {ach.unlockedAt && <span>{new Date(ach.unlockedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboards */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Daily Challenges */}
        <div className="bg-brand-card border border-slate-800/85 rounded-2xl p-5 text-white flex flex-col gap-3 shadow-lg">
          <h2 className="font-semibold text-base tracking-tight flex items-center gap-2 text-slate-100">
            <Flame className="w-4 h-4 text-orange-400" /> Daily Training Goals
          </h2>
          
          <div className="flex flex-col gap-2.5">
            {dailyChallenges.map((challenge) => (
              <div key={challenge.id} className="p-3 bg-brand-canvas border border-slate-850/80 rounded-xl flex items-center gap-3 text-xs shadow-inner">
                <div className={`p-1.5 rounded-lg shrink-0 ${challenge.done ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-900/40' : 'bg-slate-900 text-slate-500'}`}>
                  {challenge.done ? <Check className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold flex justify-between">
                    <span className="truncate">{challenge.title}</span>
                    <span className="text-cyan-400">+{challenge.xp} XP</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{challenge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* School & District Leaderboard */}
        <div className="bg-brand-card border border-slate-800/85 rounded-2xl p-5 text-white flex flex-col gap-3 shadow-lg">
          <h2 className="font-semibold text-base tracking-tight flex items-center gap-2 text-slate-100">
            <Trophy className="w-4 h-4 text-yellow-400" /> District Leaderboard
          </h2>

          <div className="flex flex-col gap-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`p-2.5 rounded-xl flex items-center justify-between text-xs transition-all ${
                  entry.isUser ? 'bg-cyan-950/20 border border-cyan-500/40 shadow-sm shadow-cyan-950/10' : 'bg-brand-canvas/40 hover:bg-brand-canvas/80 border border-slate-850/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`w-5 font-black text-center text-[10px] font-mono p-0.5 rounded-md ${
                    entry.rank === 1 ? 'bg-cyan-500 text-slate-950' :
                    entry.rank === 2 ? 'bg-slate-300 text-slate-950' :
                    entry.rank === 3 ? 'bg-amber-600 text-white' : 'text-slate-400 bg-slate-800/50'
                  }`}>
                    {entry.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold truncate text-slate-200">{entry.name}</div>
                    <div className="text-[9px] text-slate-400 truncate">{entry.class}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-cyan-400 font-mono text-[11px]">{entry.xp} XP</div>
                  <div className="text-[9px] text-slate-500 font-mono">{entry.drillsCompleted} drills</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
