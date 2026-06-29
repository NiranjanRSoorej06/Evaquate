import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function DrillGame({ schoolId, disasterType, onFinish }) {
  const [mapData, setMapData] = useState(null);
  const [gameStatus, setGameStatus] = useState('idle'); // idle, loading, playing, won, gameover
  const [errorMsg, setErrorMsg] = useState('');
  
  // Game metrics
  const [timeTaken, setTimeTaken] = useState(0);
  const [health, setHealth] = useState(100);
  const [extinguishers, setExtinguishers] = useState(0);
  const [score, setScore] = useState(0);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  // Core Game State (mutable for high speed animation loop)
  const playerRef = useRef({ x: 1, y: 1 });
  const gridRef = useRef([]);
  const elementsRef = useRef({});
  const widthRef = useRef(12);
  const heightRef = useRef(10);
  const fireLocationsRef = useRef([]); // coordinates of active fire blocks
  const cellSize = 40;

  // Web Audio API helper for sound effects (synth beeps)
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'pickup') {
        // High frequency chime
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'extinguish') {
        // Noise-like puff (swoosh)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'hit') {
        // Buzz (damage)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'win') {
        // Retro win arpeggio
        const now = ctx.currentTime;
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
        osc.start();
        osc.stop(now + 0.5);
      }
    } catch (e) {
      console.warn("Audio Context failed to launch", e);
    }
  };

  const loadMap = async () => {
    setGameStatus('loading');
    setErrorMsg('');
    try {
      const response = await fetch(`http://localhost:3001/api/student/${schoolId}/map`);
      if (response.status === 404) {
        setErrorMsg('Your school map layout has not been uploaded by the School Admin yet. Contact them to set it up.');
        setGameStatus('idle');
        return;
      }
      const data = await response.json();
      setMapData(data);
      setGameStatus('idle');
    } catch (err) {
      setErrorMsg('Failed to download school map layout.');
      setGameStatus('idle');
    }
  };

  useEffect(() => {
    loadMap();
  }, [schoolId]);

  const startGame = () => {
    if (!mapData) return;

    // Reset metrics
    setTimeTaken(0);
    setHealth(100);
    setExtinguishers(0);
    setScore(0);
    setGameStatus('playing');

    // Deep copy grid map to mutable state
    gridRef.current = JSON.parse(JSON.stringify(mapData.grid));
    elementsRef.current = JSON.parse(JSON.stringify(mapData.elements));
    widthRef.current = mapData.width;
    heightRef.current = mapData.height;

    // Spawn player in the first classroom room
    let spawned = false;
    if (mapData.rooms && mapData.rooms.length > 0) {
      const classroom = mapData.rooms[0];
      // center of classroom
      const px = Math.floor((classroom.x1 + classroom.x2) / 2);
      const py = Math.floor((classroom.y1 + classroom.y2) / 2);
      // Ensure inside grid
      if (px >= 0 && px < mapData.width && py >= 0 && py < mapData.height && gridRef.current[py][px] !== 1) {
        playerRef.current = { x: px, y: py };
        spawned = true;
      }
    }

    if (!spawned) {
      // Find first empty cell
      for (let r = 0; r < mapData.height; r++) {
        for (let c = 0; c < mapData.width; c++) {
          if (gridRef.current[r][c] === 0) {
            playerRef.current = { x: c, y: r };
            spawned = true;
            break;
          }
        }
        if (spawned) break;
      }
    }

    // Set up hazard locations based on disaster type
    fireLocationsRef.current = [];
    if (disasterType === 'fire') {
      // Spawn fire in hallways / corridors
      gridRef.current.forEach((row, r) => {
        row.forEach((cell, c) => {
          // If empty cell and not player cell and not assembly cell, 25% chance of spawning fire
          const isPlayer = playerRef.current.x === c && playerRef.current.y === r;
          const isAssembly = elementsRef.current.assembly_zone?.x === c && elementsRef.current.assembly_zone?.y === r;
          if (cell === 0 && !isPlayer && !isAssembly && Math.random() < 0.20) {
            gridRef.current[r][c] = 4; // 4 will represent fire block
            fireLocationsRef.current.push({ x: c, y: r });
          }
        });
      });
    }

    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeTaken(prev => prev + 1);
    }, 1000);

    // Initial draw
    setTimeout(drawGame, 50);
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== 'playing') return;

      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy = -1;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy = 1;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx = -1;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = 1;
      else if (e.key === ' ') {
        // Spacebar to use Extinguisher on adjacent fire block
        e.preventDefault();
        useExtinguisher();
        return;
      }

      if (dx !== 0 || dy !== 0) {
        movePlayer(dx, dy);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStatus, extinguishers]);

  const movePlayer = (dx, dy) => {
    const nextX = playerRef.current.x + dx;
    const nextY = playerRef.current.y + dy;

    // Check boundary
    if (nextX < 0 || nextX >= widthRef.current || nextY < 0 || nextY >= heightRef.current) return;

    const cellVal = gridRef.current[nextY][nextX];

    // Check Wall block
    if (cellVal === 1) return;

    // Check Fire block
    if (cellVal === 4) {
      playSound('hit');
      setHealth(prev => {
        const nextH = Math.max(0, prev - 25);
        if (nextH <= 0) {
          triggerGameOver();
        }
        return nextH;
      });
      return;
    }

    // Move player
    playerRef.current = { x: nextX, y: nextY };

    // Check Fire Extinguisher pick up
    if (cellVal === 2) {
      gridRef.current[nextY][nextX] = 0; // clear extinguisher block
      setExtinguishers(prev => prev + 1);
      playSound('pickup');
    }

    // Check Assembly zone (Safe exit)
    if (cellVal === 5 || (elementsRef.current.assembly_zone?.x === nextX && elementsRef.current.assembly_zone?.y === nextY)) {
      triggerWin();
    }

    drawGame();
  };

  const useExtinguisher = () => {
    if (extinguishers <= 0) return;

    // Find if there is an adjacent fire block (up, down, left, right)
    const px = playerRef.current.x;
    const py = playerRef.current.y;
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    let extinguished = false;
    for (const dir of directions) {
      const fx = px + dir.dx;
      const fy = py + dir.dy;
      if (fx >= 0 && fx < widthRef.current && fy >= 0 && fy < heightRef.current) {
        if (gridRef.current[fy][fx] === 4) {
          gridRef.current[fy][fx] = 0; // extinguish fire
          extinguished = true;
          break;
        }
      }
    }

    if (extinguished) {
      setExtinguishers(prev => prev - 1);
      setScore(prev => prev + 15); // bonus score
      playSound('extinguish');
      drawGame();
    }
  };

  const triggerGameOver = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameStatus('gameover');
  };

  const triggerWin = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    playSound('win');
    
    // Calculate final score: Base 50 + Health remaining + Time bonus (max 100)
    const timePenalty = timeTaken; // 1 pt per sec
    const healthBonus = Math.round(health / 2); // max 50 pts
    const calculatedScore = Math.max(10, Math.min(100, 100 - timePenalty + healthBonus + score));

    setScore(calculatedScore);
    setGameStatus('won');
    onFinish(true, timeTaken, calculatedScore);
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = widthRef.current;
    const h = heightRef.current;

    // Draw Grid layout
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const val = gridRef.current[r][c];

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);

        if (val === 1) {
          // Wall
          ctx.fillStyle = '#374151';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        } else if (val === 2) {
          // Extinguisher
          ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.font = '20px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🧯', c * cellSize + cellSize/2, r * cellSize + cellSize/2);
        } else if (val === 3) {
          // Door
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(c * cellSize + 2, r * cellSize + 2, cellSize - 4, cellSize - 4);
        } else if (val === 4) {
          // Fire hazard
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.font = '22px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🔥', c * cellSize + cellSize/2, r * cellSize + cellSize/2);
        } else if (val === 5) {
          // Safe Assembly area
          ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          ctx.font = '22px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🚩', c * cellSize + cellSize/2, r * cellSize + cellSize/2);
        }
      }
    }

    // Draw Assembly Zone coordinate overlay if not explicitly marked in grid
    const az = elementsRef.current.assembly_zone;
    if (az) {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(az.x * cellSize, az.y * cellSize, cellSize, cellSize);
      ctx.font = '22px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚩', az.x * cellSize + cellSize/2, az.y * cellSize + cellSize/2);
    }

    // Draw Player Avatar
    const px = playerRef.current.x;
    const py = playerRef.current.y;
    
    // Draw outer pulsing circle
    ctx.beginPath();
    ctx.arc(px * cellSize + cellSize/2, py * cellSize + cellSize/2, cellSize/2.4, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--color-accent-primary)';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw eyes/face for fun
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(px * cellSize + cellSize/3, py * cellSize + cellSize/2.2, 3, 0, Math.PI * 2);
    ctx.arc(px * cellSize + cellSize * 2/3, py * cellSize + cellSize/2.2, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
      
      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-fire)', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: 'var(--color-fire)' }}>
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {gameStatus === 'idle' && mapData && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Gamepad2 size={48} style={{ color: 'var(--color-accent-primary)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>Prepare to Evacuate Springfield Elementary</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '24px', maxWidth: '480px' }}>
            A simulation has been mapped out based on your school plan. Learn exit locations and safely escape obstacles.
          </p>
          <button onClick={startGame} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={18} /> Launch Safety Drill
          </button>
        </div>
      )}

      {gameStatus === 'playing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', width: '100%' }}>
          
          {/* Status Bar */}
          <div style={{ display: 'flex', gap: '30px', background: 'rgba(0,0,0,0.2)', padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--glass-border)', width: '100%', maxWidth: '600px', justifyContent: 'space-between', fontSize: '14px' }}>
            <div>
              <span>Safety Health: </span>
              <strong style={{ color: health > 50 ? 'var(--color-safe)' : 'var(--color-fire)' }}>{health}%</strong>
            </div>
            <div>
              <span>Extinguishers (SPACE): </span>
              <strong style={{ color: extinguishers > 0 ? 'var(--color-safe)' : 'var(--color-text-muted)' }}>{extinguishers} 🧯</strong>
            </div>
            <div>
              <span>Time Elapsed: </span>
              <strong>{timeTaken} seconds</strong>
            </div>
          </div>

          {/* Gameplay Instructions */}
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '6px 12px', borderRadius: '4px' }}>
            🎹 Use <strong>WASD / Arrow Keys</strong> to move. Press <strong>Spacebar</strong> to use fire extinguisher when standing next to a fire (🔥). Reach the Green Flag (🚩) safe assembly area.
          </div>

          {/* The Canvas */}
          <canvas
            ref={canvasRef}
            width={widthRef.current * cellSize}
            height={heightRef.current * cellSize}
            style={{
              background: '#090d16',
              borderRadius: '8px',
              border: '2px solid var(--glass-border)',
              boxShadow: '0 8px 30px rgba(0,0,0,0.7)'
            }}
          />
        </div>
      )}

      {gameStatus === 'won' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <ShieldCheck size={52} color="var(--color-safe)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '26px', color: 'var(--color-safe)', marginBottom: '8px' }}>Safe Evacuation!</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
            You successfully navigated coordinates and reached the safe assembly point!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '300px', margin: '0 auto 30px auto', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Time Taken</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{timeTaken}s</span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block' }}>Safety Score</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-safe)' }}>{score} pts</span>
            </div>
          </div>

          <button onClick={startGame} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
            <RotateCcw size={16} /> Run Drill Again
          </button>
        </div>
      )}

      {gameStatus === 'gameover' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <AlertTriangle size={52} color="var(--color-fire)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '26px', color: 'var(--color-fire)', marginBottom: '8px' }}>Evacuation Failed</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', marginBottom: '24px' }}>
            You took too much heat damage from the fires. Keep practice to learn safer routes!
          </p>
          <button onClick={startGame} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}>
            <RotateCcw size={16} /> Retry Drill
          </button>
        </div>
      )}
    </div>
  );
}
