import { useState, useEffect, useRef, useCallback } from 'react';
import { playSound, drawGame, CELL_SIZE } from '../gameUtils';

export function useDrillGame({ schoolId, disasterType, onFinish }) {
  const [mapData, setMapData] = useState(null);
  const [gameStatus, setGameStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [timeTaken, setTimeTaken] = useState(0);
  const [health, setHealth] = useState(100);
  const [extinguishers, setExtinguishers] = useState(0);
  const [score, setScore] = useState(0);

  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const playerRef = useRef({ x: 1, y: 1 });
  const gridRef = useRef([]);
  const elementsRef = useRef({});
  const widthRef = useRef(12);
  const heightRef = useRef(10);
  const gameRefs = { playerRef, gridRef, elementsRef, widthRef, heightRef };

  const renderGame = useCallback(() => drawGame(canvasRef.current, gameRefs), []);

  const loadMap = async () => {
    setGameStatus('loading');
    setErrorMsg('');
    try {
      const response = await fetch(`http://localhost:3001/api/student/${schoolId}/map`, { credentials: 'include' });
      if (response.status === 404) {
        setErrorMsg('Your school map layout has not been uploaded by the School Admin yet. Contact them to set it up.');
        setGameStatus('idle');
        return;
      }
      setMapData(await response.json());
      setGameStatus('idle');
    } catch {
      setErrorMsg('Failed to download school map layout.');
      setGameStatus('idle');
    }
  };

  useEffect(() => { loadMap(); }, [schoolId]);

  const triggerGameOver = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameStatus('gameover');
  };

  const triggerWin = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    playSound('win');
    const timePenalty = timeTaken;
    const healthBonus = Math.round(health / 2);
    const calculatedScore = Math.max(10, Math.min(100, 100 - timePenalty + healthBonus + score));
    setScore(calculatedScore);
    setGameStatus('won');
    onFinish(true, timeTaken, calculatedScore);
  };

  const movePlayer = (dx, dy) => {
    const nextX = playerRef.current.x + dx;
    const nextY = playerRef.current.y + dy;
    if (nextX < 0 || nextX >= widthRef.current || nextY < 0 || nextY >= heightRef.current) return;
    const cellVal = gridRef.current[nextY][nextX];
    if (cellVal === 1) return;
    if (cellVal === 4) {
      playSound('hit');
      setHealth(prev => {
        const nextH = Math.max(0, prev - 25);
        if (nextH <= 0) triggerGameOver();
        return nextH;
      });
      return;
    }
    playerRef.current = { x: nextX, y: nextY };
    if (cellVal === 2) {
      gridRef.current[nextY][nextX] = 0;
      setExtinguishers(prev => prev + 1);
      playSound('pickup');
    }
    if (cellVal === 5 || (elementsRef.current.assembly_zone?.x === nextX && elementsRef.current.assembly_zone?.y === nextY)) {
      triggerWin();
    }
    renderGame();
  };

  const useExtinguisher = () => {
    if (extinguishers <= 0) return;
    const px = playerRef.current.x;
    const py = playerRef.current.y;
    const directions = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
    for (const dir of directions) {
      const fx = px + dir.dx;
      const fy = py + dir.dy;
      if (fx >= 0 && fx < widthRef.current && fy >= 0 && fy < heightRef.current && gridRef.current[fy][fx] === 4) {
        gridRef.current[fy][fx] = 0;
        setExtinguishers(prev => prev - 1);
        setScore(prev => prev + 15);
        playSound('extinguish');
        renderGame();
        break;
      }
    }
  };

  const startGame = () => {
    if (!mapData) return;
    setTimeTaken(0);
    setHealth(100);
    setExtinguishers(0);
    setScore(0);
    setGameStatus('playing');
    gridRef.current = JSON.parse(JSON.stringify(mapData.grid));
    elementsRef.current = JSON.parse(JSON.stringify(mapData.elements));
    widthRef.current = mapData.width;
    heightRef.current = mapData.height;

    let spawned = false;
    if (mapData.rooms?.length > 0) {
      const classroom = mapData.rooms[0];
      const px = Math.floor((classroom.x1 + classroom.x2) / 2);
      const py = Math.floor((classroom.y1 + classroom.y2) / 2);
      if (px >= 0 && px < mapData.width && py >= 0 && py < mapData.height && gridRef.current[py][px] !== 1) {
        playerRef.current = { x: px, y: py };
        spawned = true;
      }
    }
    if (!spawned) {
      for (let r = 0; r < mapData.height && !spawned; r++) {
        for (let c = 0; c < mapData.width; c++) {
          if (gridRef.current[r][c] === 0) {
            playerRef.current = { x: c, y: r };
            spawned = true;
            break;
          }
        }
      }
    }
    if (disasterType === 'fire') {
      gridRef.current.forEach((row, r) => {
        row.forEach((cell, c) => {
          const isPlayer = playerRef.current.x === c && playerRef.current.y === r;
          const isAssembly = elementsRef.current.assembly_zone?.x === c && elementsRef.current.assembly_zone?.y === r;
          if (cell === 0 && !isPlayer && !isAssembly && Math.random() < 0.20) {
            gridRef.current[r][c] = 4;
          }
        });
      });
    }
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setTimeTaken(prev => prev + 1), 1000);
    setTimeout(renderGame, 50);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameStatus !== 'playing') return;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy = -1;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy = 1;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx = -1;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = 1;
      else if (e.key === ' ') { e.preventDefault(); useExtinguisher(); return; }
      if (dx !== 0 || dy !== 0) movePlayer(dx, dy);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, extinguishers]);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  return {
    mapData, gameStatus, errorMsg, timeTaken, health, extinguishers, score,
    canvasRef, widthRef, heightRef, startGame, CELL_SIZE
  };
}
