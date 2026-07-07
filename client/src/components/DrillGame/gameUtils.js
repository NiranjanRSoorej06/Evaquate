export function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'pickup') {
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'extinguish') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(100, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'win') {
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.50, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
      osc.start();
      osc.stop(now + 0.5);
    }
  } catch (e) {
    console.warn('Audio Context failed to launch', e);
  }
}

export const CELL_SIZE = 40;

export function drawGame(canvas, refs) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const { gridRef, elementsRef, widthRef, heightRef, playerRef } = refs;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const w = widthRef.current;
  const h = heightRef.current;

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      const val = gridRef.current[r][c];
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      if (val === 1) {
        ctx.fillStyle = '#374151';
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      } else if (val === 2) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.font = '20px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🧯', c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
      } else if (val === 3) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(c * CELL_SIZE + 2, r * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      } else if (val === 4) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔥', c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
      } else if (val === 5) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
        ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        ctx.font = '22px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🚩', c * CELL_SIZE + CELL_SIZE / 2, r * CELL_SIZE + CELL_SIZE / 2);
      }
    }
  }

  const az = elementsRef.current.assembly_zone;
  if (az) {
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.fillRect(az.x * CELL_SIZE, az.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚩', az.x * CELL_SIZE + CELL_SIZE / 2, az.y * CELL_SIZE + CELL_SIZE / 2);
  }

  const px = playerRef.current.x;
  const py = playerRef.current.y;
  ctx.beginPath();
  ctx.arc(px * CELL_SIZE + CELL_SIZE / 2, py * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2.4, 0, Math.PI * 2);
  ctx.fillStyle = 'var(--color-accent-primary)';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(px * CELL_SIZE + CELL_SIZE / 3, py * CELL_SIZE + CELL_SIZE / 2.2, 3, 0, Math.PI * 2);
  ctx.arc(px * CELL_SIZE + CELL_SIZE * 2 / 3, py * CELL_SIZE + CELL_SIZE / 2.2, 3, 0, Math.PI * 2);
  ctx.fill();
}
