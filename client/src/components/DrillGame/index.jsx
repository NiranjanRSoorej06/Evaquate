import { AlertTriangle } from 'lucide-react';
import { useDrillGame } from './hooks/useDrillGame';
import DrillGameIdle from './DrillGameIdle';
import DrillGamePlaying from './DrillGamePlaying';
import DrillGameWon from './DrillGameWon';
import DrillGameOver from './DrillGameOver';

export default function DrillGame({ schoolId, disasterType, onFinish }) {
  const game = useDrillGame({ schoolId, disasterType, onFinish });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
      {game.errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-fire)', borderRadius: '8px', padding: '16px', marginBottom: '20px', color: 'var(--color-fire)' }}>
          <AlertTriangle size={20} />
          <span>{game.errorMsg}</span>
        </div>
      )}
      {game.gameStatus === 'idle' && game.mapData && <DrillGameIdle onStart={game.startGame} />}
      {game.gameStatus === 'playing' && (
        <DrillGamePlaying canvasRef={game.canvasRef} widthRef={game.widthRef} heightRef={game.heightRef} cellSize={game.CELL_SIZE} health={game.health} extinguishers={game.extinguishers} timeTaken={game.timeTaken} />
      )}
      {game.gameStatus === 'won' && <DrillGameWon timeTaken={game.timeTaken} score={game.score} onRestart={game.startGame} />}
      {game.gameStatus === 'gameover' && <DrillGameOver onRestart={game.startGame} />}
    </div>
  );
}
