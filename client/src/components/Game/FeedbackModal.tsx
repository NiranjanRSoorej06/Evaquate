/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DrillResult } from '../../types';
import { Award, Check, AlertTriangle, Shield, RefreshCw, X, Download, Star } from 'lucide-react';

interface FeedbackModalProps {
  drillResult: DrillResult;
  onClose: () => void;
  onRestart: () => void;
}

interface AIEvaluation {
  summary: string;
  correctActions: string[];
  criticalMistakes: string[];
  tips: string[];
  grade: string;
}

export default function FeedbackModal({
  drillResult,
  onClose,
  onRestart
}: FeedbackModalProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [evaluation, setEvaluation] = useState<AIEvaluation | null>(null);

  // Load AI feedback evaluation from server on mount
  useEffect(() => {
    let active = true;

    async function fetchEvaluation() {
      try {
        setLoading(true);
        const res = await fetch('/api/evaluate-drill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ drillResult })
        });
        const data = await res.json();
        if (active && data.success) {
          setEvaluation(data.evaluation);
        }
      } catch (err) {
        console.error('Error fetching AI evaluation:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchEvaluation();

    return () => {
      active = false;
    };
  }, [drillResult]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto" id="feedback-modal-overlay">
      <div className="bg-brand-card border border-slate-800/85 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden text-white flex flex-col my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex justify-between items-center bg-brand-canvas">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <h2 className="font-semibold text-base tracking-tight text-slate-100">AI Disaster Preparedness Evaluation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800/60 rounded-xl text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-6">
          
          {/* Main Score Board */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Grade Circle */}
            <div className="bg-brand-canvas border border-slate-800/70 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-inner">
              <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">SAFETY GRADE</span>
              {loading ? (
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mt-2" />
              ) : (
                <div className={`text-4xl font-black mt-1.5 tracking-tight ${
                  evaluation?.grade.startsWith('A') ? 'text-emerald-400' :
                  evaluation?.grade.startsWith('B') ? 'text-cyan-400' :
                  evaluation?.grade.startsWith('C') ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {evaluation?.grade || 'C'}
                </div>
              )}
              <span className="text-[9px] text-slate-500 mt-2 font-mono">Based on escape rules</span>
            </div>

            {/* Preparation Score */}
            <div className="bg-brand-canvas border border-slate-800/70 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-inner">
              <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">DRILL SCORE</span>
              <div className="text-3xl font-bold mt-1.5 text-cyan-400">
                {drillResult.score} <span className="text-xs text-slate-600 font-normal">/ {drillResult.maxScore}</span>
              </div>
              <span className="text-[9px] text-slate-500 mt-2 font-mono">XP Earned: +{drillResult.score * 5}</span>
            </div>

            {/* Evacuation Time */}
            <div className="bg-brand-canvas border border-slate-800/70 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-inner">
              <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">EVACUATION TIME</span>
              <div className="text-3xl font-bold mt-1.5 text-emerald-400">
                {drillResult.timeTaken}s
              </div>
              <span className="text-[9px] text-slate-500 mt-2 font-mono">Ideal time: &lt; 90s</span>
            </div>

            {/* Survival Status */}
            <div className="bg-brand-canvas border border-slate-800/70 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-inner">
              <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">SURVIVAL STATUS</span>
              <div className={`text-[10px] font-bold mt-3 px-3 py-1 rounded-full ${
                drillResult.isSuccessful ? 'bg-emerald-950/65 text-emerald-400 border border-emerald-900/60' : 'bg-rose-950/65 text-rose-400 border border-rose-900/60'
              }`}>
                {drillResult.isSuccessful ? '✓ SAFE EVACUATION' : '❌ TRAPPED / INJURED'}
              </div>
              <span className="text-[9px] text-slate-500 mt-2 font-mono">Health Left: {drillResult.healthRemaining}%</span>
            </div>

          </div>

          {/* AI Assessment Loading Indicator */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Evaluating escape vectors & structural collision safety...</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {/* AI Professional Summary */}
              <div className="p-4.5 bg-brand-canvas border border-slate-800/70 rounded-2xl shadow-inner">
                <span className="text-[10px] text-slate-500 font-bold font-mono tracking-wider">EVALUATOR'S SUMMARY</span>
                <p className="text-sm mt-2 leading-relaxed text-slate-200 font-medium">
                  "{evaluation?.summary}"
                </p>
              </div>

              {/* Achievements & Certification stamp */}
              {drillResult.isSuccessful && (
                <div className="p-4.5 bg-gradient-to-r from-cyan-950/30 to-brand-canvas border border-cyan-900/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-600 p-2 rounded-xl text-white shadow-sm">
                      <Shield className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">Disaster Preparedness Certification</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Successfully mastered {drillResult.disasterType} protocols for high school digital twins.</p>
                    </div>
                  </div>
                  <div className="bg-emerald-600/15 text-emerald-400 border border-emerald-900/60 text-[10px] font-bold px-3.5 py-1.5 rounded-xl tracking-wider uppercase text-center md:self-auto self-start">
                    🛡️ CERTIFIED COMPLIANT
                  </div>
                </div>
              )}

              {/* Correct Actions Taken vs Critical Mistakes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Correct Actions */}
                <div className="p-4.5 bg-emerald-950/15 border border-emerald-900/30 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-xs text-emerald-400 font-mono tracking-wider mb-3 uppercase flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" /> CORRECT DECISIONS
                  </h3>
                  <ul className="flex flex-col gap-2.5">
                    {evaluation?.correctActions.map((action, i) => (
                      <li key={i} className="text-xs text-emerald-300/90 leading-relaxed flex gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                    {evaluation?.correctActions.length === 0 && (
                      <li className="text-xs text-slate-500 italic">No positive safety actions recorded.</li>
                    )}
                  </ul>
                </div>

                {/* Critical Mistakes */}
                <div className="p-4.5 bg-rose-950/15 border border-rose-900/30 rounded-2xl shadow-sm">
                  <h3 className="font-bold text-xs text-rose-400 font-mono tracking-wider mb-3 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> SAFETY DEVIATIONS
                  </h3>
                  <ul className="flex flex-col gap-2.5">
                    {evaluation?.criticalMistakes.map((mistake, i) => (
                      <li key={i} className="text-xs text-rose-300/90 leading-relaxed flex gap-2">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{mistake}</span>
                      </li>
                    ))}
                    {evaluation?.criticalMistakes.length === 0 && (
                      <li className="text-xs text-emerald-400 italic">✓ Flawless safety! No critical protocol mistakes made.</li>
                    )}
                  </ul>
                </div>

              </div>

              {/* Region-Specific Safety Tips */}
              <div className="p-4.5 bg-brand-canvas border border-slate-800/80 rounded-2xl shadow-inner">
                <h3 className="font-bold text-xs text-cyan-400 font-mono tracking-wider mb-3.5 uppercase flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-cyan-400" /> REGION-SPECIFIC SAFETY GUIDES ({drillResult.disasterType.toUpperCase()})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {evaluation?.tips.map((tip, idx) => (
                    <div key={idx} className="p-3 bg-brand-card border border-slate-850 rounded-xl text-xs leading-relaxed text-slate-300 hover:border-slate-800 transition">
                      <strong className="text-cyan-400 block mb-1 font-mono text-[10px]">Tip #{idx + 1}</strong>
                      {tip}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800/70 flex justify-between bg-brand-canvas gap-3">
          <button
            onClick={onRestart}
            className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold rounded-xl transition shadow-md shadow-cyan-950/60 flex items-center gap-2 text-white"
            id="btn-restart-drill"
          >
            <RefreshCw className="w-4 h-4" /> Restart Simulation
          </button>
          
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-brand-card hover:bg-slate-800 text-xs font-semibold rounded-xl transition border border-slate-800 hover:border-slate-700 text-slate-300"
            id="btn-close-feedback"
          >
            Return to Base
          </button>
        </div>

      </div>
    </div>
  );
}
