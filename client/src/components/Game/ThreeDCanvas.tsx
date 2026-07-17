/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Room, Hazard, Player, NPC } from '../../types';
import { RotateCw, Compass, ZoomIn, ZoomOut, Move, AlertTriangle } from 'lucide-react';

interface ThreeDCanvasProps {
  layout: {
    schoolName: string;
    floorsCount: number;
    rooms: Room[];
    assemblyArea: { x: number; y: number; radius: number; name: string };
  };
  player: Player;
  npcs: NPC[];
  hazards: Hazard[];
  activeFloor: number;
  disasterType: string | null;
  showPaths: boolean;
  onPlayerMove: (newX: number, newY: number, newFloor: number) => void;
  onInteractNPC?: (npcId: string) => void;
  onInteractItem?: (itemType: string) => void;
  isDrillRunning: boolean;
  onToggleDoor?: (roomId: string, doorId: string) => void;
}

export default function ThreeDCanvas({
  layout,
  player,
  npcs,
  hazards,
  activeFloor,
  disasterType,
  showPaths,
  onPlayerMove,
  onInteractNPC,
  onInteractItem,
  isDrillRunning,
  onToggleDoor
}: ThreeDCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 3D Camera State
  const [scale, setScale] = useState<number>(4.2); // zoom factor
  const [yaw, setYaw] = useState<number>(-0.45); // rotation angle (radians)
  const [pitch, setPitch] = useState<number>(0.55); // elevation angle (radians)
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(-20);

  // Controls overlay interaction
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const cameraStart = useRef({ yaw: 0, pitch: 0, panX: 0, panY: 0 });
  const [dragMode, setDragMode] = useState<'rotate' | 'pan'>('rotate');

  // Animation ticks
  const animationFrameId = useRef<number | null>(null);
  const tickRef = useRef<number>(0);

  // Local particles for active disaster visual effects
  const fireParticles = useRef<Array<{ x: number; y: number; z: number; size: number; age: number; maxAge: number; vx: number; vy: number; vz: number }>>([]);
  const smokeParticles = useRef<Array<{ x: number; y: number; z: number; size: number; age: number; maxAge: number; vx: number; vy: number; vz: number; alpha: number }>>([]);
  const gasParticles = useRef<Array<{ x: number; y: number; z: number; size: number; age: number; maxAge: number; vx: number; vy: number; vz: number }>>([]);
  const earthquakeCracks = useRef<Array<{ points: Array<{ x: number; y: number }> }>>([]);

  // Sirens and Web Audio Synthesis API
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmOscRef = useRef<OscillatorNode | null>(null);
  const rumbleOscRef = useRef<OscillatorNode | null>(null);
  const audioGainRef = useRef<GainNode | null>(null);

  // Resize handler
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Voice announcement controller
  const lastVoiceAnnouncement = useRef<string>('');
  const lastVoiceTime = useRef<number>(0);

  const speakAlert = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const now = Date.now();
      // Rate-limit announcements to once every 12 seconds
      if (lastVoiceAnnouncement.current !== text || now - lastVoiceTime.current > 12000) {
        window.speechSynthesis.cancel(); // Stop old speakings
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
        window.speechSynthesis.speak(utterance);
        lastVoiceAnnouncement.current = text;
        lastVoiceTime.current = now;
      }
    }
  };

  // Trigger voice announcements based on disaster scenario
  useEffect(() => {
    if (isDrillRunning && disasterType) {
      if (disasterType === 'earthquake') {
        speakAlert("Earthquake warning! Drop, Cover, and Hold on! Protect your head under sturdy classroom desks immediately.");
      } else if (disasterType === 'fire') {
        speakAlert("Emergency! Fire detected in the campus. Stay low under smoke, check doors for heat, and head to the primary soccer field assembly point.");
      } else if (disasterType === 'flood') {
        speakAlert("Flood alert. Inflow water is rising rapidly. Evacuate ground floor levels or move carefully to upper floor classrooms.");
      } else if (disasterType === 'chemical_leak') {
        speakAlert("Chemical spill hazard! Toxic gas is venting. Cover your airways with a wet towel or mask and move up-wind immediately.");
      } else if (disasterType === 'gas_leak') {
        speakAlert("Gas leak warning. Do not toggle electrical switches or start fire hazards. Evacuate through corridor doors immediately.");
      }
    } else {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isDrillRunning, disasterType]);

  // Handle Resize of canvas container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 400),
          height: Math.max(height, 350)
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Web Audio Synth for earthquake rumbles & alarms
  useEffect(() => {
    if (isDrillRunning && disasterType) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime(0.12, ctx.currentTime);
        mainGain.connect(ctx.destination);
        audioGainRef.current = mainGain;

        if (disasterType === 'earthquake') {
          // Low frequency rumble synth
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(28, ctx.currentTime);
          
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(60, ctx.currentTime);

          osc.connect(filter);
          filter.connect(mainGain);
          osc.start();
          rumbleOscRef.current = osc;
        }

        // Emergency siren oscillator
        const alarmOsc = ctx.createOscillator();
        alarmOsc.type = 'sine';
        alarmOsc.frequency.setValueAtTime(600, ctx.currentTime);
        
        // Siren sound LFO (low-frequency oscillator) modulating the pitch
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 1.8; // speed of sound sweep
        lfoGain.gain.value = 150; // depth of sweep (Hz)

        lfo.connect(lfoGain);
        lfoGain.connect(alarmOsc.frequency);
        alarmOsc.connect(mainGain);

        lfo.start();
        alarmOsc.start();
        alarmOscRef.current = alarmOsc;

      } catch (err) {
        console.warn("Web Audio Context not initialized, waiting for gesture:", err);
      }
    }

    return () => {
      // Clean up audio
      if (alarmOscRef.current) {
        try { alarmOscRef.current.stop(); } catch(e){}
      }
      if (rumbleOscRef.current) {
        try { rumbleOscRef.current.stop(); } catch(e){}
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch(e){}
      }
    };
  }, [isDrillRunning, disasterType]);

  // Create random cracks during earthquakes
  useEffect(() => {
    if (disasterType === 'earthquake') {
      const cracks: Array<{ points: Array<{ x: number; y: number }> }> = [];
      for (let i = 0; i < 6; i++) {
        let sx = Math.random() * 80 + 10;
        let sy = Math.random() * 80 + 10;
        const pts = [{ x: sx, y: sy }];
        for (let j = 0; j < 5; j++) {
          sx += (Math.random() - 0.5) * 8;
          sy += (Math.random() - 0.5) * 8;
          pts.push({ x: sx, y: sy });
        }
        cracks.push({ points: pts });
      }
      earthquakeCracks.current = cracks;
    } else {
      earthquakeCracks.current = [];
    }
  }, [disasterType]);

  // ----------------------------------------------------------------------
  // CANVAS DRAWING LOOP (3D ISOMETRIC ENGINE)
  // ----------------------------------------------------------------------

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Projected coordinates translation function
    const project = (x: number, y: number, z: number) => {
      // Scale coordinates relative to central 100x100 grid (centered at 50, 50)
      const dx = (x - 50) * scale;
      const dy = (y - 50) * scale;
      const dz = z * scale * 1.5; // Floor elevation scale

      // Yaw rotation (rotation around Z-axis)
      const rx = dx * Math.cos(yaw) - dy * Math.sin(yaw);
      const ry = dx * Math.sin(yaw) + dy * Math.cos(yaw);

      // Pitch rotation (elevation angle lookup)
      const screenX = (dimensions.width / 2) + rx + panX;
      const screenY = (dimensions.height / 2) + ry * Math.sin(pitch) - dz + panY;

      return { x: screenX, y: screenY };
    };

    const drawLoop = () => {
      tickRef.current += 1;
      const tick = tickRef.current;

      // Clear Canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw futuristic grid background
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.15)';
      ctx.lineWidth = 1;
      const gridSpacing = 40;
      for (let i = 0; i < dimensions.width; i += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, dimensions.height);
        ctx.stroke();
      }
      for (let j = 0; j < dimensions.height; j += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(dimensions.width, j);
        ctx.stroke();
      }

      // Base Playground/School Plot
      const basePoints = [
        project(0, 0, -0.05),
        project(100, 0, -0.05),
        project(100, 100, -0.05),
        project(0, 100, -0.05)
      ];
      ctx.fillStyle = 'rgba(241, 245, 249, 0.85)'; // slate floor background
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(basePoints[0].x, basePoints[0].y);
      for (let i = 1; i < basePoints.length; i++) {
        ctx.lineTo(basePoints[i].x, basePoints[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Draw Assembly Area Circle (Ground Level)
      const assX = layout.assemblyArea.x;
      const assY = layout.assemblyArea.y;
      const assRad = layout.assemblyArea.radius;

      // Draw assembly area as a glowing circle
      ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
        const ax = assX + assRad * Math.cos(angle);
        const ay = assY + assRad * Math.sin(angle);
        const pt = project(ax, ay, 0);
        if (angle === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Assembly Area signpost
      const assCenter = project(assX, assY, 0.1);
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 10px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`🚨 ASSEMBLY POINT`, assCenter.x, assCenter.y - 12);
      ctx.fillText(`"${layout.assemblyArea.name}"`, assCenter.x, assCenter.y);

      // Draw Earthquake Cracks (Seismic activity)
      if (disasterType === 'earthquake' && earthquakeCracks.current.length > 0) {
        ctx.strokeStyle = 'rgba(75, 85, 99, 0.85)';
        ctx.lineWidth = 2.5;
        earthquakeCracks.current.forEach(crack => {
          ctx.beginPath();
          crack.points.forEach((pt, idx) => {
            const screenPt = project(pt.x, pt.y, 0);
            if (idx === 0) ctx.moveTo(screenPt.x, screenPt.y);
            else ctx.lineTo(screenPt.x, screenPt.y);
          });
          ctx.stroke();
        });
      }

      // Sort rooms from back to front (based on visual depth) to handle painters algorithm overlap
      // Rooms on activeFloor and others on ground can be faded or hidden
      const sortedRooms = [...layout.rooms].sort((a, b) => {
        // First sort by floor
        if (a.floor !== b.floor) return a.floor - b.floor;
        
        // Depth-sorting on floor: project centers and compare projected Y values
        const aCenter = project(a.x + a.width/2, a.y + a.height/2, 0);
        const bCenter = project(b.x + b.width/2, b.y + b.height/2, 0);
        return aCenter.y - bCenter.y;
      });

      // RENDER ALL ROOMS & STRUCTURES
      sortedRooms.forEach((room) => {
        const isCurrentFloor = room.floor === activeFloor;
        const floorZ = (room.floor - 1) * 3; // 3 units high per floor
        const wallH = 2.2; // Wall height units

        // If rendering upper floor, draw lower floor as muted wireframe
        const isFadedLowerFloor = room.floor < activeFloor;
        const isHiddenUpperFloor = room.floor > activeFloor;

        if (isHiddenUpperFloor) return; // Do not draw upper floors

        // Room coordinates
        const x0 = room.x;
        const y0 = room.y;
        const x1 = room.x + room.width;
        const y1 = room.y + room.height;

        // Project Floor vertices
        const f0 = project(x0, y0, floorZ);
        const f1 = project(x1, y0, floorZ);
        const f2 = project(x1, y1, floorZ);
        const f3 = project(x0, y1, floorZ);

        // Project Ceiling vertices
        const c0 = project(x0, y0, floorZ + wallH);
        const c1 = project(x1, y0, floorZ + wallH);
        const c2 = project(x1, y1, floorZ + wallH);
        const c3 = project(x0, y1, floorZ + wallH);

        // Render Floor Polygon
        ctx.beginPath();
        ctx.moveTo(f0.x, f0.y);
        ctx.lineTo(f1.x, f1.y);
        ctx.lineTo(f2.x, f2.y);
        ctx.lineTo(f3.x, f3.y);
        ctx.closePath();

        if (isCurrentFloor) {
          ctx.fillStyle = room.color || 'rgba(219, 234, 254, 0.45)';
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
          ctx.lineWidth = 1.5;
        } else {
          ctx.fillStyle = 'rgba(241, 245, 249, 0.15)'; // highly transparent for ground floor
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.2)';
          ctx.lineWidth = 1;
        }
        ctx.fill();
        ctx.stroke();

        // If current floor, render interior contents (furniture, items)
        if (isCurrentFloor) {
          room.furniture.forEach((f) => {
            const fx0 = room.x + (f.x * room.width) / 100;
            const fy0 = room.y + (f.y * room.height) / 100;
            const fw = (f.width * room.width) / 100;
            const fh = (f.height * room.height) / 100;
            const fHeight = f.type === 'shelf' || f.type === 'cabinet' ? 1.4 : 0.6;

            // Project 3D bounds for furniture
            const b0 = project(fx0, fy0, floorZ);
            const b1 = project(fx0 + fw, fy0, floorZ);
            const b2 = project(fx0 + fw, fy0 + fh, floorZ);
            const b3 = project(fx0, fy0 + fh, floorZ);

            const t0 = project(fx0, fy0, floorZ + fHeight);
            const t1 = project(fx0 + fw, fy0, floorZ + fHeight);
            const t2 = project(fx0 + fw, fy0 + fh, floorZ + fHeight);
            const t3 = project(fx0, fy0 + fh, floorZ + fHeight);

            // Draw Furniture Box
            ctx.beginPath();
            ctx.moveTo(b0.x, b0.y);
            ctx.lineTo(b1.x, b1.y);
            ctx.lineTo(b2.x, b2.y);
            ctx.lineTo(b3.x, b3.y);
            ctx.closePath();
            ctx.fillStyle = f.canShelterUnder ? '#d97706' : '#854d0e'; // Sturdy brown vs dark wood
            ctx.globalAlpha = 0.65;
            ctx.fill();

            // Draw Top Tabletop
            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y);
            ctx.lineTo(t1.x, t1.y);
            ctx.lineTo(t2.x, t2.y);
            ctx.lineTo(t3.x, t3.y);
            ctx.closePath();
            ctx.fillStyle = f.canShelterUnder ? '#f59e0b' : '#a16207';
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            // Indicator for cover
            if (f.canShelterUnder && player.isDucked && Math.abs(player.x - (fx0 + fw/2)) < 5 && Math.abs(player.y - (fy0 + fh/2)) < 5) {
              const cap = project(fx0 + fw/2, fy0 + fh/2, floorZ + fHeight + 0.2);
              ctx.fillStyle = '#22c55e';
              ctx.font = 'bold 8px sans-serif';
              ctx.fillText("🛡️ SHELTERED", cap.x, cap.y);
            }
          });
        }

        // Render Walls (We draw translucent panels for back/sides walls depending on perspective)
        ctx.globalAlpha = isCurrentFloor ? 0.35 : 0.08;
        ctx.lineWidth = 1.5;

        // Draw Left Wall (x0, y0) to (x0, y1)
        ctx.beginPath();
        ctx.moveTo(f0.x, f0.y);
        ctx.lineTo(f3.x, f3.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.lineTo(c0.x, c0.y);
        ctx.closePath();
        ctx.fillStyle = room.type === 'corridor' ? '#94a3b8' : '#cbd5e1';
        ctx.fill();
        ctx.stroke();

        // Draw Back Wall (x0, y0) to (x1, y0)
        ctx.beginPath();
        ctx.moveTo(f0.x, f0.y);
        ctx.lineTo(f1.x, f1.y);
        ctx.lineTo(c1.x, c1.y);
        ctx.lineTo(c0.x, c0.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw Front Wall (with door/window cutouts if active floor)
        ctx.beginPath();
        ctx.moveTo(f3.x, f3.y);
        ctx.lineTo(f2.x, f2.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.globalAlpha = 1.0;

        // Draw Doors & Windows Cutouts
        room.doors.forEach((door) => {
          // Convert doors percentage coordinate or absolute coordinate
          const dw = 3; // door width size
          const dp0 = project(door.x - dw/2, door.y, floorZ);
          const dp1 = project(door.x + dw/2, door.y, floorZ);
          const dt0 = project(door.x - dw/2, door.y, floorZ + 1.2);
          const dt1 = project(door.x + dw/2, door.y, floorZ + 1.2);

          // Draw door frame
          ctx.strokeStyle = door.isBlocked ? '#ef4444' : '#10b981';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(dp0.x, dp0.y);
          ctx.lineTo(dt0.x, dt0.y);
          ctx.lineTo(dt1.x, dt1.y);
          ctx.lineTo(dp1.x, dp1.y);
          ctx.stroke();

          // Door leaf drawing (visualize open or closed)
          if (!door.isOpen) {
            ctx.fillStyle = door.isBlocked ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.35)';
            ctx.beginPath();
            ctx.moveTo(dp0.x, dp0.y);
            ctx.lineTo(dt0.x, dt0.y);
            ctx.lineTo(dt1.x, dt1.y);
            ctx.lineTo(dp1.x, dp1.y);
            ctx.closePath();
            ctx.fill();

            // Label
            const midDoor = project(door.x, door.y, floorZ + 0.6);
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 8px monospace';
            ctx.fillText(door.isBlocked ? "BLOCKED" : "LOCKED", midDoor.x, midDoor.y);
          } else {
            // Draw open door swung out
            const swungX = door.x + 2;
            const swungPt = project(swungX, door.y + 2, floorZ);
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(dp0.x, dp0.y);
            ctx.lineTo(swungPt.x, swungPt.y);
            ctx.stroke();
          }
        });

        // Room Floating Text Label
        if (isCurrentFloor) {
          const labelPt = project(room.x + room.width / 2, room.y + room.height / 2, floorZ + wallH + 0.3);
          
          // Draw a small high-tech tag background
          ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
          ctx.strokeStyle = room.type === 'corridor' ? '#64748b' : '#3b82f6';
          ctx.lineWidth = 1;
          const textLabel = room.name.toUpperCase();
          ctx.font = 'bold 9px monospace';
          const txtWidth = ctx.measureText(textLabel).width + 12;
          
          ctx.beginPath();
          ctx.roundRect(labelPt.x - txtWidth/2, labelPt.y - 8, txtWidth, 15, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.fillText(textLabel, labelPt.x, labelPt.y + 3);
        }
      });

      // RENDER EVACUATION PATH ARROWS
      if (showPaths && isDrillRunning) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 4;

        // Path starting from player to the nearest emergency exit / assembly area
        // We will draw glowing sequential arrows leading from the corridors to the Outside Assembly Point
        const arrowSpacing = 8;
        const speed = 0.15;
        const offset = (tick * speed) % arrowSpacing;

        // Oakwood/Presets have corridors along y: 43 to 53, running from x: 10 to 90.
        // Let's draw arrows directed towards the exits (East x: 10, West x: 90) or playground (y > 60)
        // Draw directional indicators
        for (let ax = 15; ax < 85; ax += arrowSpacing) {
          const arrowX = ax + offset;
          const corridorY = 48;
          // Left side of corridor exits east (x: 10)
          if (arrowX < 50) {
            const pt0 = project(arrowX, corridorY, (activeFloor - 1) * 3 + 0.1);
            const pt1 = project(arrowX - 4, corridorY, (activeFloor - 1) * 3 + 0.1);
            ctx.beginPath();
            ctx.moveTo(pt0.x, pt0.y);
            ctx.lineTo(pt1.x, pt1.y);
            ctx.stroke();
            // Arrowhead
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt1.x + 3, pt1.y - 3);
            ctx.lineTo(pt1.x + 3, pt1.y + 3);
            ctx.fill();
          } else {
            // Right side exits west (x: 90)
            const pt0 = project(arrowX, corridorY, (activeFloor - 1) * 3 + 0.1);
            const pt1 = project(arrowX + 4, corridorY, (activeFloor - 1) * 3 + 0.1);
            ctx.beginPath();
            ctx.moveTo(pt0.x, pt0.y);
            ctx.lineTo(pt1.x, pt1.y);
            ctx.stroke();
            // Arrowhead
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt1.x - 3, pt1.y - 3);
            ctx.lineTo(pt1.x - 3, pt1.y + 3);
            ctx.fill();
          }
        }

        // Draw exit arrows going down the stairs on upper floor
        if (activeFloor === 2) {
          const stairX = 84;
          const stairY = 56;
          const pt0 = project(stairX, stairY, 3 + 0.1);
          const pt1 = project(stairX, stairY + 5, 1.5);
          ctx.beginPath();
          ctx.moveTo(pt0.x, pt0.y);
          ctx.lineTo(pt1.x, pt1.y);
          ctx.stroke();
        }

        // Arrow from ground corridor exit to assembly area
        for (let ay = 52; ay < 90; ay += arrowSpacing) {
          const arrowY = ay + offset;
          const pt0 = project(50, arrowY, 0.05);
          const pt1 = project(50, arrowY + 4, 0.05);
          ctx.beginPath();
          ctx.moveTo(pt0.x, pt0.y);
          ctx.lineTo(pt1.x, pt1.y);
          ctx.stroke();
        }

        ctx.shadowBlur = 0; // reset
      }

      // RENDER HAZARDS VISUALS (FIRE, SMOKE, FLOOD)
      hazards.forEach((hazard) => {
        if (hazard.floor !== activeFloor) return;

        const hPt = project(hazard.x, hazard.y, (hazard.floor - 1) * 3);
        const intensity = hazard.intensity;

        if (hazard.type === 'fire') {
          // Draw animated fire glow
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 10 * intensity;
          ctx.fillStyle = `rgba(249, 115, 22, ${0.4 + Math.random() * 0.3})`;
          ctx.beginPath();
          ctx.arc(hPt.x, hPt.y, Math.max(0, hazard.radius * scale * 0.8 * intensity), 0, Math.PI * 2);
          ctx.fill();

          // Generate flame particles dynamically
          if (tick % 3 === 0 && fireParticles.current.length < 150) {
            fireParticles.current.push({
              x: hazard.x + (Math.random() - 0.5) * hazard.radius * 1.5,
              y: hazard.y + (Math.random() - 0.5) * hazard.radius * 1.5,
              z: (hazard.floor - 1) * 3,
              size: Math.random() * 5 + 4,
              age: 0,
              maxAge: Math.random() * 20 + 15,
              vx: (Math.random() - 0.5) * 0.3,
              vy: (Math.random() - 0.5) * 0.3,
              vz: Math.random() * 0.1 + 0.15
            });
          }

          // Emit smoke particles
          if (tick % 5 === 0 && smokeParticles.current.length < 120) {
            smokeParticles.current.push({
              x: hazard.x + (Math.random() - 0.5) * hazard.radius,
              y: hazard.y + (Math.random() - 0.5) * hazard.radius,
              z: (hazard.floor - 1) * 3 + 1.0,
              size: Math.random() * 8 + 6,
              age: 0,
              maxAge: Math.random() * 35 + 25,
              vx: (Math.random() - 0.5) * 0.2,
              vy: (Math.random() - 0.5) * 0.2,
              vz: Math.random() * 0.08 + 0.08,
              alpha: 0.7
            });
          }
          ctx.shadowBlur = 0;
        }

        if (hazard.type === 'chemical_gas' || hazard.type === 'smoke') {
          // Green biological/toxic cloud or smoke fog
          const colorG = hazard.type === 'chemical_gas' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(75, 85, 99, 0.2)';
          ctx.fillStyle = colorG;
          ctx.beginPath();
          ctx.arc(hPt.x, hPt.y, Math.max(0, hazard.radius * scale * 1.2), 0, Math.PI * 2);
          ctx.fill();

          if (tick % 4 === 0 && gasParticles.current.length < 100) {
            gasParticles.current.push({
              x: hazard.x + (Math.random() - 0.5) * hazard.radius * 2,
              y: hazard.y + (Math.random() - 0.5) * hazard.radius * 2,
              z: (hazard.floor - 1) * 3 + Math.random() * 1.5,
              size: Math.random() * 12 + 6,
              age: 0,
              maxAge: Math.random() * 40 + 30,
              vx: (Math.random() - 0.5) * 0.1,
              vy: (Math.random() - 0.5) * 0.1,
              vz: Math.random() * 0.02 + 0.02
            });
          }
        }

        if (hazard.type === 'water') {
          // Draw water rising level indicator
          const wPt = project(hazard.x, hazard.y, (hazard.floor - 1) * 3 + 0.3);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.25)';
          ctx.beginPath();
          ctx.arc(wPt.x, wPt.y, Math.max(0, hazard.radius * scale * 1.5), 0, Math.PI * 2);
          ctx.fill();
        }

        if (hazard.type === 'debris' || hazard.type === 'blocked_corridor') {
          // Render heavy 3D concrete rubble
          const r0 = project(hazard.x - 2, hazard.y - 2, (hazard.floor - 1) * 3);
          const r1 = project(hazard.x + 2, hazard.y - 2, (hazard.floor - 1) * 3);
          const r2 = project(hazard.x + 2, hazard.y + 2, (hazard.floor - 1) * 3);
          const r3 = project(hazard.x - 2, hazard.y + 2, (hazard.floor - 1) * 3);
          const rTop = project(hazard.x, hazard.y, (hazard.floor - 1) * 3 + 0.8);

          ctx.fillStyle = '#6b7280'; // concrete gray
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 1;
          
          // Draw pyramid style concrete block
          ctx.beginPath(); ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y); ctx.lineTo(rTop.x, rTop.y); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(r1.x, r1.y); ctx.lineTo(r2.x, r2.y); ctx.lineTo(rTop.x, rTop.y); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(r2.x, r2.y); ctx.lineTo(r3.x, r3.y); ctx.lineTo(rTop.x, rTop.y); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(r3.x, r3.y); ctx.lineTo(r0.x, r0.y); ctx.lineTo(rTop.x, rTop.y); ctx.closePath(); ctx.fill(); ctx.stroke();

          // Warning tag
          const warningPt = project(hazard.x, hazard.y, (hazard.floor - 1) * 3 + 1.2);
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 8px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText("⚠️ COLLAPSED", warningPt.x, warningPt.y);
        }
      });

      // UPDATE AND DRAW FIRE PARTICLES
      fireParticles.current = fireParticles.current.filter((p) => {
        p.age += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        const pt = project(p.x, p.y, p.z);
        const opacity = Math.max(0, 1 - p.age / p.maxAge);
        
        ctx.fillStyle = `rgba(${255 - p.age * 2}, ${140 - p.age * 4}, 20, ${opacity})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0, p.size * (1 - p.age / p.maxAge)), 0, Math.PI * 2);
        ctx.fill();
        return p.age < p.maxAge;
      });

      // UPDATE AND DRAW SMOKE PARTICLES
      smokeParticles.current = smokeParticles.current.filter((p) => {
        p.age += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        const pt = project(p.x, p.y, p.z);
        const opacity = Math.max(0, p.alpha * (1 - p.age / p.maxAge));
        
        ctx.fillStyle = `rgba(100, 116, 139, ${opacity})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0, p.size * (1 + p.age / p.maxAge * 0.5)), 0, Math.PI * 2);
        ctx.fill();
        return p.age < p.maxAge;
      });

      // UPDATE AND DRAW GAS PARTICLES
      gasParticles.current = gasParticles.current.filter((p) => {
        p.age += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        const pt = project(p.x, p.y, p.z);
        const opacity = Math.max(0, 0.45 * (1 - p.age / p.maxAge));
        
        ctx.fillStyle = `rgba(132, 204, 22, ${opacity})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, Math.max(0, p.size), 0, Math.PI * 2);
        ctx.fill();
        return p.age < p.maxAge;
      });

      // DRAW ACTIVE FLOOR ITEMS TO COLLECT
      if (isDrillRunning) {
        // We render visual icons/briefcases for collectible items
        // In oakwood: Class 102 (Lab) has Fire Extinguisher, Library has first aid, Admin has wet towel.
        const drawItem = (x: number, y: number, text: string, color: string) => {
          const pt = project(x, y, (activeFloor - 1) * 3 + 0.1);
          // Pulse scale
          const pulse = Math.sin(tick * 0.08) * 3 + 8;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(0, pulse), 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 7px Inter';
          ctx.fillText(text, pt.x, pt.y + 2.5);
        };

        // Show available supplies to pick up based on player inventories
        if (!player.hasExtinguisher && activeFloor === 1) {
          drawItem(40, 20, "🧯", "#ef4444"); // Fire Lab
        }
        if (!player.hasFirstAidKit && activeFloor === 1) {
          drawItem(75, 20, "➕", "#10b981"); // Library
        }
        if (!player.hasGasMask && activeFloor === 1) {
          drawItem(18, 65, "😷", "#eab308"); // Admin Office
        }
      }

      // RENDER NPCs (Classmates, teachers, first responders)
      npcs.forEach((npc) => {
        if (npc.floor !== activeFloor || npc.isSaved) return;

        const npcPt = project(npc.x, npc.y, (npc.floor - 1) * 3);

        // Render NPC capsule shadow
        ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
        ctx.beginPath();
        ctx.ellipse(npcPt.x, npcPt.y, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // NPC visual capsule
        const color = npc.isInjured ? '#f87171' : '#60a5fa'; // Injured classmate (red) vs normal classmate (blue)
        const npcHeadPt = project(npc.x, npc.y, (npc.floor - 1) * 3 + 0.7);

        // Draw body capsule
        ctx.fillStyle = color;
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(npcPt.x - 4, npcPt.y);
        ctx.lineTo(npcHeadPt.x - 3, npcHeadPt.y);
        ctx.arc(npcHeadPt.x, npcHeadPt.y, 3, Math.PI, 0);
        ctx.lineTo(npcPt.x + 4, npcPt.y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Float NPC details
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(npc.name, npcPt.x, npcHeadPt.y - 10);

        if (npc.isInjured) {
          // Floating rescue marker
          ctx.fillStyle = '#ef4444';
          ctx.font = '10px Inter';
          const pulse = Math.sin(tick * 0.1) * 4;
          ctx.fillText("🆘 REQ AID", npcPt.x, npcHeadPt.y - 20 + pulse);
        }
      });

      // RENDER PLAYER CHARACTER
      const pFloorZ = (player.floor - 1) * 3;
      const playerZ = player.isDucked ? 0.2 : 0.8; // flatter if ducked
      const pPt = project(player.x, player.y, pFloorZ);
      const pHeadPt = project(player.x, player.y, pFloorZ + playerZ);

      // Player shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.beginPath();
      ctx.ellipse(pPt.x, pPt.y, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden glowing player cylinder
      ctx.fillStyle = '#fbbf24'; // Amber-Gold Player
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pPt.x - 5, pPt.y);
      ctx.lineTo(pHeadPt.x - 4, pHeadPt.y);
      ctx.arc(pHeadPt.x, pHeadPt.y, 4, Math.PI, 0);
      ctx.lineTo(pPt.x + 5, pPt.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing circle aura under player
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(pPt.x, pPt.y, 12 + Math.sin(tick * 0.1) * 3, 6 + Math.sin(tick * 0.1) * 1.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Float Player's Name and Role
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`YOU (${player.name})`, pPt.x, pHeadPt.y - 12);

      // Simple earthquake shaking camera frame
      if (disasterType === 'earthquake' && isDrillRunning) {
        setPanX(prev => prev + (Math.random() - 0.5) * 1.5);
        setPanY(prev => prev + (Math.random() - 0.5) * 1.5);
      }

      animationFrameId.current = requestAnimationFrame(drawLoop);
    };

    drawLoop();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [layout, player, npcs, hazards, activeFloor, scale, yaw, pitch, panX, panY, dimensions, disasterType, showPaths, isDrillRunning]);

  // ----------------------------------------------------------------------
  // MOUSE & TOUCH CONTROLS (ROTATION, ZOOM & PAN)
  // ----------------------------------------------------------------------

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    cameraStart.current = { yaw, pitch, panX, panY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    if (dragMode === 'rotate') {
      // Rotation sensitivity
      setYaw(cameraStart.current.yaw + dx * 0.012);
      setPitch(Math.max(0.1, Math.min(Math.PI / 2 - 0.1, cameraStart.current.pitch + dy * 0.012)));
    } else {
      // Panning sensitivity
      setPanX(cameraStart.current.panX + dx);
      setPanY(cameraStart.current.panY + dy);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard Movement Event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDrillRunning) return;
      
      // Check for door interaction 'E' key
      if (e.key.toLowerCase() === 'e') {
        let doorInteracted = false;
        layout.rooms.forEach(room => {
          if (room.floor !== player.floor) return;
          room.doors.forEach(door => {
            const distance = Math.hypot(player.x - door.x, player.y - door.y);
            if (distance < 12.0) {
              if (door.isBlocked) return;
              if (onToggleDoor) {
                onToggleDoor(room.id, door.id);
                doorInteracted = true;
              }
            }
          });
        });
        if (doorInteracted) {
          e.preventDefault();
          return;
        }
      }
      
      let moveStepX = 0;
      let moveStepY = 0;
      const stepSize = 2.0;

      // Map WASD keys relative to current yaw rotation so movement is intuitive!
      // This is a premium touch: "W" always moves forward based on where the camera is facing.
      const forwardAngle = yaw;
      const cosY = Math.cos(forwardAngle);
      const sinY = Math.sin(forwardAngle);

      switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
          // Move forward relative to camera orientation
          moveStepX = sinY * stepSize;
          moveStepY = -cosY * stepSize;
          break;
        case 's':
        case 'arrowdown':
          moveStepX = -sinY * stepSize;
          moveStepY = cosY * stepSize;
          break;
        case 'a':
        case 'arrowleft':
          moveStepX = -cosY * stepSize;
          moveStepY = -sinY * stepSize;
          break;
        case 'd':
        case 'arrowright':
          moveStepX = cosY * stepSize;
          moveStepY = sinY * stepSize;
          break;
        default:
          return; // Skip other keys
      }

      e.preventDefault();

      const nextX = Math.max(2, Math.min(98, player.x + moveStepX));
      const nextY = Math.max(2, Math.min(98, player.y + moveStepY));

      // COLLISION DETECTION ENGINE WITH WALLS!
      // Check if player's coordinates fall inside any wall boundaries of current floor
      let canMove = true;

      // Oakwood High School collision rules:
      // A player can walk inside any room if they enter through a valid door coordinates.
      // If a player moves from a room coordinates to corridor coordinates without a door, block it.
      // We check if the next position crosses a boundary of any room, and if so, whether they are near a door.
      const currentRoom = findRoomAt(player.x, player.y, player.floor);
      const targetRoom = findRoomAt(nextX, nextY, player.floor);

      if (currentRoom && targetRoom && currentRoom.id !== targetRoom.id) {
        // Player is crossing a room partition! They must use a valid door
        // Check if there is an open door near the crossing
        const nearDoor = currentRoom.doors.some(door => {
          // If door coordinates are near next point
          const distance = Math.hypot(nextX - door.x, nextY - door.y);
          return distance < 6.0 && door.isOpen; // Door is open and near
        }) || targetRoom.doors.some(door => {
          const distance = Math.hypot(nextX - door.x, nextY - door.y);
          return distance < 6.0 && door.isOpen;
        });

        if (!nearDoor) {
          canMove = false; // Block movement through solid walls!
        }
      } else if (!currentRoom && targetRoom) {
        // Moving from corridor/outside into a room
        const nearDoor = targetRoom.doors.some(door => {
          const distance = Math.hypot(nextX - door.x, nextY - door.y);
          return distance < 6.0 && door.isOpen;
        });
        if (!nearDoor) {
          canMove = false;
        }
      } else if (currentRoom && !targetRoom) {
        // Moving from a room out to corridor/outside
        const nearDoor = currentRoom.doors.some(door => {
          const distance = Math.hypot(nextX - door.x, nextY - door.y);
          return distance < 6.0 && door.isOpen;
        });
        if (!nearDoor) {
          canMove = false;
        }
      }

      // If collision checker approved the movement step
      if (canMove) {
        onPlayerMove(nextX, nextY, player.floor);

        // Check if player has stepped on items to collect them
        if (!player.hasExtinguisher && activeFloor === 1 && Math.hypot(nextX - 40, nextY - 20) < 4) {
          onInteractItem?.('extinguisher');
        }
        if (!player.hasFirstAidKit && activeFloor === 1 && Math.hypot(nextX - 75, nextY - 20) < 4) {
          onInteractItem?.('first_aid_kit');
        }
        if (!player.hasGasMask && activeFloor === 1 && Math.hypot(nextX - 18, nextY - 65) < 4) {
          onInteractItem?.('gas_mask');
        }

        // Check if player is near any injured NPC to trigger rescue options
        npcs.forEach(npc => {
          if (npc.floor === player.floor && !npc.isSaved && npc.isInjured) {
            const dist = Math.hypot(nextX - npc.x, nextY - npc.y);
            if (dist < 5.0) {
              onInteractNPC?.(npc.id);
            }
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, layout, isDrillRunning, yaw, npcs]);

  // Utility to find which room is at coordinates (x, y)
  const findRoomAt = (x: number, y: number, floor: number): Room | null => {
    return layout.rooms.find(room => 
      room.floor === floor && 
      x >= room.x && 
      x <= (room.x + room.width) && 
      y >= room.y && 
      y <= (room.y + room.height)
    ) || null;
  };

  return (
    <div className="relative w-full h-full select-none flex flex-col bg-slate-950 overflow-hidden" ref={containerRef}>
      
      {/* 3D Interactive Canvas */}
      <div className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="block w-full h-full"
        />

        {/* Floating Controls HUD overlay */}
        <div className="absolute bottom-4 left-4 p-3 bg-brand-card/90 border border-slate-800/80 rounded-2xl shadow-xl flex gap-3 text-white backdrop-blur-md">
          <button
            onClick={() => setDragMode('rotate')}
            className={`p-2.5 rounded-xl flex items-center gap-1.5 text-xs transition-all ${dragMode === 'rotate' ? 'bg-cyan-600 border border-cyan-400/40 text-white font-semibold shadow-sm' : 'hover:bg-slate-800/60 text-slate-300'}`}
            title="Drag with mouse to rotate building view"
            id="btn-rotate-mode"
          >
            <Compass className="w-4 h-4 text-cyan-400" /> Rotate Camera
          </button>
          <button
            onClick={() => setDragMode('pan')}
            className={`p-2.5 rounded-xl flex items-center gap-1.5 text-xs transition-all ${dragMode === 'pan' ? 'bg-cyan-600 border border-cyan-400/40 text-white font-semibold shadow-sm' : 'hover:bg-slate-800/60 text-slate-300'}`}
            title="Drag with mouse to pan building view"
            id="btn-pan-mode"
          >
            <Move className="w-4 h-4 text-emerald-400" /> Pan Camera
          </button>
          
          <div className="w-px bg-slate-800" />
          
          <button
            onClick={() => setScale(prev => Math.min(10, prev + 0.4))}
            className="p-2 rounded-xl hover:bg-slate-800/60 transition"
            title="Zoom In"
            id="btn-zoom-in"
          >
            <ZoomIn className="w-4 h-4 text-slate-300" />
          </button>
          <button
            onClick={() => setScale(prev => Math.max(1.8, prev - 0.4))}
            className="p-2 rounded-xl hover:bg-slate-800/60 transition"
            title="Zoom Out"
            id="btn-zoom-out"
          >
            <ZoomOut className="w-4 h-4 text-slate-300" />
          </button>
          <button
            onClick={() => {
              setYaw(-0.45);
              setPitch(0.55);
              setPanX(0);
              setPanY(-20);
              setScale(4.2);
            }}
            className="p-2 px-3 rounded-xl hover:bg-slate-800/60 transition text-xs flex items-center gap-1.5 text-slate-300 hover:text-white"
            title="Reset Camera view"
            id="btn-reset-cam"
          >
            <RotateCw className="w-3.5 h-3.5" /> Reset View
          </button>
        </div>

        {/* Disaster Status HUD Bar */}
        {isDrillRunning && disasterType && (
          <div className="absolute top-4 left-4 right-4 p-4 bg-red-950/90 border-l-4 border-l-red-500 border border-red-900/50 rounded-2xl text-white shadow-xl backdrop-blur-md flex items-center gap-4 max-w-2xl mx-auto animate-pulse">
            <div className="bg-red-500 p-2.5 rounded-full">
              <AlertTriangle className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm tracking-wide text-red-100 flex items-center gap-2">
                CRITICAL WARNING: {disasterType.toUpperCase()} IN PROGRESS
              </h3>
              <p className="text-[11px] text-red-200 mt-1 leading-relaxed">
                {disasterType === 'earthquake' && "Active seismic waves shaking campus. Immediately Drop under classroom desks and Hold On!"}
                {disasterType === 'fire' && "Classrooms and hallways filling with toxic smoke. Crawl low, grab first aid supplies, and evacuate to playgrounds."}
                {disasterType === 'flood' && "High-volume flash flooding rushing bottom levels. Keep clear of electrical junctions and climb stairs."}
                {disasterType === 'chemical_leak' && "Biological chemicals venting into administrative sectors. Cover breathing passages and use escape exits."}
                {disasterType === 'gas_leak' && "Combustible gas leak spreading. Avoid sparking alarms or lights. Move quickly to safety zones."}
              </p>
            </div>
            <div className="bg-red-900/60 px-3 py-1.5 rounded-xl border border-red-700/50">
              <span className="text-[10px] font-mono font-semibold tracking-wider text-red-300">STAGE 1</span>
            </div>
          </div>
        )}

        {/* Key Movement Helpers for mobile screens */}
        {isDrillRunning && (
          <div className="absolute bottom-4 right-4 p-3 bg-brand-card/90 border border-slate-800/80 rounded-2xl text-white shadow-xl flex flex-col items-center gap-1.5 backdrop-blur-md">
            <span className="text-[9px] text-slate-500 font-bold font-mono tracking-wider">NAVIGATE TWIN</span>
            <div className="grid grid-cols-3 gap-1.5 w-28 h-20 mt-1">
              <div />
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }))}
                className="bg-brand-canvas hover:bg-slate-900 text-xs font-bold rounded-lg border border-slate-800 flex items-center justify-center p-1 transition"
                id="pad-up"
              >
                ▲
              </button>
              <div />
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))}
                className="bg-brand-canvas hover:bg-slate-900 text-xs font-bold rounded-lg border border-slate-800 flex items-center justify-center p-1 transition"
                id="pad-left"
              >
                ◀
              </button>
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))}
                className="bg-brand-canvas hover:bg-slate-900 text-xs font-bold rounded-lg border border-slate-800 flex items-center justify-center p-1 transition"
                id="pad-down"
              >
                ▼
              </button>
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))}
                className="bg-brand-canvas hover:bg-slate-900 text-xs font-bold rounded-lg border border-slate-800 flex items-center justify-center p-1 transition"
                id="pad-right"
              >
                ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
