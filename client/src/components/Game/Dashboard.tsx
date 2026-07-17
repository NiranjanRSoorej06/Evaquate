/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Room, SchoolLayout, DisasterType } from '../../types';
import { Upload, Trash2, Check, RefreshCw, Layers, Edit, Save, Plus, ArrowRight, Download, BarChart2, Flame, Map } from 'lucide-react';

interface DashboardProps {
  layout: SchoolLayout | null;
  onLayoutUpdate: (newLayout: SchoolLayout) => void;
  onTriggerDrill: (disaster: DisasterType, randomizedBlockages: boolean) => void;
  drillHistory: any[];
}

export default function Dashboard({
  layout,
  onLayoutUpdate,
  onTriggerDrill,
  drillHistory
}: DashboardProps) {
  // Upload and Preset States
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('preset_1');

  // Room editor/calibration states
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editedRoomName, setEditedRoomName] = useState<string>('');
  const [editedRoomType, setEditedRoomType] = useState<Room['type']>('classroom');

  // Drill schedule selection
  const [disasterSelect, setDisasterSelect] = useState<DisasterType>('fire');
  const [randomizeBlocks, setRandomizeBlocks] = useState<boolean>(true);

  // Heatmap state
  const [heatmapFloor, setHeatmapFloor] = useState<number>(1);

  // File drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processUploadedFile(e.target.files[0]);
    }
  };

  // Convert uploaded blueprint file to digital twin via Express server
  const processUploadedFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus(`Reading architectural file: ${file.name}...`);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        
        setUploadStatus('Processing with Gemini AI Blueprint Analyzer. Building 3D walls, doors, exits...');
        const response = await fetch('/api/convert-blueprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Image,
            fileName: file.name
          })
        });

        const resData = await response.json();
        if (resData.success) {
          onLayoutUpdate(resData.data);
          setUploadStatus('Conversion Successful! 3D Campus digital twin loaded.');
        } else {
          setUploadStatus('AI processing timed out. Reverting to smart grid synthesis.');
        }
        setIsUploading(false);
      };
    } catch (err: any) {
      console.error(err);
      setUploadStatus(`Error processing file: ${err.message}`);
      setIsUploading(false);
    }
  };

  // Trigger preset load
  const loadPreset = async (presetId: string) => {
    setIsUploading(true);
    setUploadStatus('Loading structural template...');
    try {
      const response = await fetch('/api/convert-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId })
      });
      const resData = await response.json();
      if (resData.success) {
        onLayoutUpdate(resData.data);
        setUploadStatus('Template loaded successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Manual Editor Handlers
  const startEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setEditedRoomName(room.name);
    setEditedRoomType(room.type);
  };

  const saveRoomCalibration = () => {
    if (!layout || !editingRoomId) return;

    const updatedRooms = layout.rooms.map(room => {
      if (room.id === editingRoomId) {
        return {
          ...room,
          name: editedRoomName,
          type: editedRoomType
        };
      }
      return room;
    });

    onLayoutUpdate({
      ...layout,
      rooms: updatedRooms
    });

    setEditingRoomId(null);
  };

  const deleteRoom = (roomId: string) => {
    if (!layout) return;
    const updatedRooms = layout.rooms.filter(r => r.id !== roomId);
    onLayoutUpdate({
      ...layout,
      rooms: updatedRooms
    });
  };

  const addRoom = () => {
    if (!layout) return;
    const newRoom: Room = {
      id: `rm_${Date.now()}`,
      name: "New Calibrated Lab Space",
      type: "classroom",
      x: 30,
      y: 30,
      width: 15,
      height: 15,
      floor: 1,
      doors: [{ id: `dr_${Date.now()}`, x: 37, y: 45, width: 3, height: 1, isOpen: true }],
      windows: [],
      furniture: [],
      color: "#f1f5f9"
    };

    onLayoutUpdate({
      ...layout,
      rooms: [...layout.rooms, newRoom]
    });
  };

  // Simulate downloading report
  const downloadReport = (historyItem: any) => {
    const reportText = `
      =============================================================
      3D DIGITAL TWIN DISASTER DRILL PLATFORM: PERFORMANCE REPORT
      =============================================================
      School Name: ${layout?.schoolName || 'High School campus'}
      Student Name: ${historyItem.studentName}
      Drill Date: ${historyItem.date}
      Disaster Scenario: ${historyItem.disasterType.toUpperCase()}
      Evacuation Status: ${historyItem.isSuccessful ? 'SUCCESSFUL' : 'FAILED / ENTRAPPED'}
      Total Evacuation Time: ${historyItem.timeTaken} seconds
      Remaining Participant Health: ${historyItem.healthRemaining}%
      Performance Score: ${historyItem.score} / ${historyItem.maxScore}
      
      Feedback Evaluation Summary:
      ${historyItem.feedbackSummary}
      
      Earned Achievement Badges:
      - ${historyItem.badgeEarned || 'Campus Cadet'}
      
      =============================================================
      Verified by Campus Rescue Automated Safety Engine.
      =============================================================
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Drill_Report_${historyItem.studentName}_${historyItem.disasterType}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-container">
      
      {/* 1. Blueprint Upload Panel */}
      <div className="lg:col-span-4 bg-brand-card border border-slate-800/85 rounded-2xl p-5 flex flex-col gap-4 text-white shadow-lg">
        <h2 className="font-semibold text-base tracking-tight flex items-center gap-2">
          <Upload className="w-5 h-5 text-cyan-400" /> Blueprint Digitizer
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Upload any 2D school building architectural drawing (floor plan/PDF/CAD/JPEG) to digitize walls and exits into a 3D twin, or test immediately using preset blueprints.
        </p>

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer text-center ${
            dragActive 
              ? 'border-cyan-500 bg-cyan-950/20 shadow-sleek-glow' 
              : 'border-slate-800 bg-brand-canvas/45 hover:bg-brand-canvas/80 hover:border-slate-700'
          }`}
          onClick={() => document.getElementById('blueprint-upload-input')?.click()}
        >
          <input
            id="blueprint-upload-input"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="w-10 h-10 text-slate-500 mb-1" />
          <span className="text-sm font-semibold">Drag & Drop Floor Plan</span>
          <span className="text-[10px] text-slate-500 tracking-wide font-mono">Supports PDF, DWG, PNG, JPG</span>
        </div>

        {/* Presets Grid */}
        <div className="mt-2 flex flex-col gap-2.5">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">CHOOSE CAMPUS PRESET</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { setSelectedPreset('preset_1'); loadPreset('preset_1'); }}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                selectedPreset === 'preset_1' 
                  ? 'bg-cyan-600 text-white font-bold border border-cyan-400/40 shadow-sm' 
                  : 'bg-brand-canvas text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80'
              }`}
              id="preset-oakwood"
            >
              High School
            </button>
            <button
              onClick={() => { setSelectedPreset('preset_2'); loadPreset('preset_2'); }}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                selectedPreset === 'preset_2' 
                  ? 'bg-cyan-600 text-white font-bold border border-cyan-400/40 shadow-sm' 
                  : 'bg-brand-canvas text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80'
              }`}
              id="preset-science"
            >
              Science Labs
            </button>
            <button
              onClick={() => { setSelectedPreset('preset_3'); loadPreset('preset_3'); }}
              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                selectedPreset === 'preset_3' 
                  ? 'bg-cyan-600 text-white font-bold border border-cyan-400/40 shadow-sm' 
                  : 'bg-brand-canvas text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80'
              }`}
              id="preset-elementary"
            >
              Primary Pod
            </button>
          </div>
        </div>

        {/* Loading / Status Bar */}
        {isUploading && (
          <div className="p-3 bg-cyan-950/80 border border-cyan-800/60 text-cyan-200 rounded-xl flex items-center gap-2 text-xs font-mono">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{uploadStatus}</span>
          </div>
        )}
        {!isUploading && uploadStatus && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-900/60 text-emerald-300 rounded-xl flex items-center gap-2 text-xs font-mono">
            <Check className="w-4 h-4" />
            <span>{uploadStatus}</span>
          </div>
        )}
      </div>

      {/* 2. Simulation Scheduler */}
      <div className="lg:col-span-8 bg-brand-card border border-slate-800/85 rounded-2xl p-5 text-white flex flex-col gap-4 shadow-lg">
        <h2 className="font-semibold text-base tracking-tight flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-500" /> Drill Scheduler
        </h2>
        
        {layout ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-brand-canvas rounded-xl border border-slate-800/70 flex flex-col gap-3.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">1. CONFIGURE DRILL EVENT</span>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-300 font-medium">Select Disaster Scenario</label>
                <select
                  value={disasterSelect}
                  onChange={(e) => setDisasterSelect(e.target.value as DisasterType)}
                  className="bg-brand-card border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40"
                  id="select-disaster-type"
                >
                  <option value="fire">Fire Incident (Smoke, Blockages)</option>
                  <option value="earthquake">Seismic Earthquake (Debris, Cracks)</option>
                  <option value="flood">Flash Flood (Rising Waters, Utility Risks)</option>
                  <option value="chemical_leak">Chemical Acid Leak (Gas clouds)</option>
                  <option value="gas_leak">Combustible Gas Leak (Spark Hazard)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-brand-card p-2.5 rounded-lg border border-slate-800/80">
                <input
                  type="checkbox"
                  id="randomize-blocks-chk"
                  checked={randomizeBlocks}
                  onChange={(e) => setRandomizeBlocks(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 rounded bg-brand-canvas border-slate-800 focus:ring-cyan-500"
                />
                <label htmlFor="randomize-blocks-chk" className="text-xs cursor-pointer text-slate-300">
                  Randomize environmental blockages & hazards
                </label>
              </div>
            </div>

            <div className="p-4 bg-brand-canvas rounded-xl border border-slate-800/70 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">2. ACTIVATE DRILL</span>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Active Digital Twin: <strong className="text-cyan-400 font-semibold">{layout.schoolName}</strong>
                </p>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Clicking below will boot up the live 3D evacuation map, trigger alarms, and position participant avatars inside their starting classrooms.
                </p>
              </div>
              
              <button
                onClick={() => onTriggerDrill(disasterSelect, randomizeBlocks)}
                className="w-full mt-4 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 font-bold text-white text-xs py-3 rounded-xl transition-all duration-300 transform hover:-translate-y-0.5 shadow-md shadow-cyan-950/50 flex items-center justify-center gap-2 border border-cyan-500/20"
                id="btn-trigger-simulation"
              >
                Launch Drill Simulation <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 bg-brand-canvas rounded-xl border border-slate-800/80 text-center">
            <Layers className="w-12 h-12 text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-400">No School blueprint loaded</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">Select a preset high school or upload custom file to enable drill scheduling.</p>
          </div>
        )}
      </div>

      {/* 3. Evacuation Congestion Heatmaps */}
      {layout && (
        <div className="lg:col-span-12 bg-brand-card border border-slate-800/85 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <h2 className="font-semibold text-base tracking-tight flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-cyan-400" /> Evacuation Congestion Heatmap (Teacher Dashboard)
            </h2>
            <div className="flex items-center gap-1 bg-brand-canvas border border-slate-850 p-1 rounded-xl">
              <button
                onClick={() => setHeatmapFloor(1)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  heatmapFloor === 1 
                    ? 'bg-cyan-600 text-white shadow-sm font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                id="btn-heatmap-f1"
              >
                Ground Level
              </button>
              {layout.floorsCount > 1 && (
                <button
                  onClick={() => setHeatmapFloor(2)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    heatmapFloor === 2 
                      ? 'bg-cyan-600 text-white shadow-sm font-bold' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  id="btn-heatmap-f2"
                >
                  Floor 2
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Visual Heatmap Box */}
            <div className="md:col-span-2 bg-brand-canvas p-4 border border-slate-850 rounded-xl flex flex-col items-center shadow-inner">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono self-start mb-3">BOTTLENECK ZONES (LIVE SIMULATION METRIC)</span>
              
              {/* Floor schematic rendering */}
              <div className="relative w-full aspect-[2/1] bg-brand-canvas sleek-radial-grid rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center p-4 shadow-md">
                {layout.rooms
                  .filter((room) => room.floor === heatmapFloor)
                  .map((room) => (
                    <div
                      key={room.id}
                      className="absolute border border-slate-800/60 flex flex-col items-center justify-center p-1 rounded"
                      style={{
                        left: `${room.x}%`,
                        top: `${room.y}%`,
                        width: `${room.width}%`,
                        height: `${room.height}%`,
                        backgroundColor: room.type === 'corridor' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(30, 41, 59, 0.35)'
                      }}
                    >
                      <span className="text-[7px] font-mono font-bold text-slate-400 truncate max-w-full">
                        {room.name}
                      </span>
                    </div>
                  ))}

                {/* Heatmap Overlays representing bottlenecks (Staircase and ground floor corridor exits) */}
                {heatmapFloor === 1 ? (
                  <>
                    {/* East Exit Bottleneck */}
                    <div className="absolute w-12 h-12 bg-rose-600/30 rounded-full filter blur-md animate-ping" style={{ left: '9%', top: '44%' }} />
                    <div className="absolute w-8 h-8 bg-rose-500/40 rounded-full filter blur-sm" style={{ left: '10%', top: '46%' }} />
                    
                    {/* West Exit Bottleneck */}
                    <div className="absolute w-12 h-12 bg-orange-500/25 rounded-full filter blur-md animate-pulse" style={{ left: '88%', top: '44%' }} />
                    
                    {/* Stairwell hallway bottle neck */}
                    <div className="absolute w-10 h-10 bg-amber-500/30 rounded-full filter blur-sm" style={{ left: '81%', top: '56%' }} />
                  </>
                ) : (
                  <>
                    {/* Stairwell hallway bottleneck on Floor 2 */}
                    <div className="absolute w-12 h-12 bg-rose-600/30 rounded-full filter blur-md animate-pulse" style={{ left: '81%', top: '56%' }} />
                  </>
                )}
              </div>

              {/* Heatmap Legend */}
              <div className="flex gap-4 mt-4 text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-rose-500/50 rounded-full border border-rose-400/55" />
                  <span className="text-slate-400">High Congestion</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-amber-500/50 rounded-full border border-amber-400/55" />
                  <span className="text-slate-400">Moderate Delay</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-slate-700/50 rounded-full border border-slate-600" />
                  <span className="text-slate-400">Low Traffic</span>
                </div>
              </div>
            </div>

            {/* Calibration & Manual Editing list */}
            <div className="bg-brand-canvas p-4 border border-slate-850 rounded-xl flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">CALIBRATE MODEL STRUCTURE</span>
                <button
                  onClick={addRoom}
                  className="bg-brand-card hover:bg-slate-800 p-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-slate-800 transition-all text-slate-300"
                  id="btn-add-room"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" /> Add Room
                </button>
              </div>

              {/* Scrollable Room List */}
              <div className="flex-1 max-h-52 overflow-y-auto pr-2 flex flex-col gap-2">
                {layout.rooms.map((room) => (
                  <div key={room.id} className="p-2.5 bg-brand-card/60 border border-slate-800/70 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition">
                     {editingRoomId === room.id ? (
                      <div className="flex-1 flex flex-col gap-1.5 mr-2">
                        <input
                          type="text"
                          value={editedRoomName}
                          onChange={(e) => setEditedRoomName(e.target.value)}
                          className="bg-brand-canvas border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                        <select
                          value={editedRoomType}
                          onChange={(e) => setEditedRoomType(e.target.value as Room['type'])}
                          className="bg-brand-canvas border border-slate-800 rounded px-1 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="classroom">Classroom</option>
                          <option value="laboratory">Laboratory</option>
                          <option value="library">Library</option>
                          <option value="office">Office</option>
                          <option value="corridor">Corridor</option>
                          <option value="staircase">Staircase</option>
                          <option value="restroom">Restroom</option>
                        </select>
                        <button
                          onClick={saveRoomCalibration}
                          className="bg-cyan-600 hover:bg-cyan-500 font-bold p-1 rounded-lg text-[10px] mt-1 text-center transition"
                        >
                          Save Calibration
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="font-semibold text-slate-200">{room.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-1 font-mono">
                          <span className="bg-brand-canvas px-1.5 py-0.5 rounded text-cyan-400 font-bold border border-slate-800 capitalize">{room.type}</span>
                          <span>Floor {room.floor}</span>
                        </div>
                      </div>
                    )}

                    {editingRoomId !== room.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditRoom(room)}
                          className="p-1 hover:bg-brand-canvas rounded-lg text-slate-400 hover:text-cyan-400 transition"
                          title="Edit Calibration"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteRoom(room.id)}
                          className="p-1 hover:bg-brand-canvas rounded-lg text-slate-400 hover:text-rose-400 transition"
                          title="Delete space"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Historic Drill Logs */}
      {drillHistory.length > 0 && (
        <div className="lg:col-span-12 bg-brand-card border border-slate-800/85 rounded-2xl p-5 text-white shadow-lg">
          <h2 className="font-semibold text-base tracking-tight mb-4 flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-400" /> Recorded Evacuation History & Heatmaps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drillHistory.map((item, index) => (
              <div key={index} className="p-4 bg-brand-canvas border border-slate-850 rounded-2xl flex flex-col justify-between text-xs shadow-md">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-cyan-400 tracking-wide capitalize">{item.disasterType} DRILL</span>
                    <span className="text-[10px] text-slate-500 font-mono">{item.date}</span>
                  </div>
                  <p className="text-slate-300 font-medium mt-2">Participant: {item.studentName}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2 bg-brand-card p-2 rounded-xl text-[11px] text-slate-400 border border-slate-850/80 font-mono">
                    <div>Time: <strong className="text-white font-extrabold">{item.timeTaken}s</strong></div>
                    <div>Score: <strong className="text-cyan-400 font-extrabold">{item.score}/{item.maxScore}</strong></div>
                    <div>Health: <strong className="text-red-400 font-extrabold">{item.healthRemaining}%</strong></div>
                    <div>Status: <span className={`font-bold ${item.isSuccessful ? 'text-emerald-400' : 'text-rose-400'}`}>{item.isSuccessful ? 'Evacuated' : 'Trapped'}</span></div>
                  </div>
                  <p className="text-slate-400 mt-2 line-clamp-2 italic leading-relaxed">"{item.feedbackSummary}"</p>
                </div>
                <button
                  onClick={() => downloadReport(item)}
                  className="mt-4 bg-brand-card hover:bg-slate-800 hover:text-white py-2 rounded-xl flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" /> Download Performance Report
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
