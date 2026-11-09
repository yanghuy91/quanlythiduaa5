import React, { useRef, useEffect, useState } from 'react';
import { Play, RotateCcw, ArrowLeft, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';

interface WheelOfFortuneProps {
  candidates: Student[];
  onSelectWinner: (student: Student) => void;
  onBack: () => void;
}

const PALETTE = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#eab308'
];

export const WheelOfFortune: React.FC<WheelOfFortuneProps> = ({
  candidates,
  onSelectWinner,
  onBack,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const numItems = Math.max(candidates.length, 1);
  const arcSize = (2 * Math.PI) / numItems;

  // Draw the wheel on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 12;

    ctx.clearRect(0, 0, width, height);

    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    // Draw slices
    for (let i = 0; i < numItems; i++) {
      const student = candidates[i % candidates.length];
      const startAngle = i * arcSize;
      const endAngle = startAngle + arcSize;

      // Slice background
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Text label
      ctx.save();
      ctx.rotate(startAngle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = numItems > 25 ? 'bold 10px sans-serif' : 'bold 12px sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 3;

      const label = student ? `${student.tenRutGon} #${student.viTriGhe}` : `Ô ${i + 1}`;
      ctx.fillText(label, radius - 14, 4);
      ctx.restore();
    }

    ctx.restore();

    // Center Hub (Gold peg)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 24, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, 24);
    grad.addColorStop(0, '#fef08a');
    grad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Star icon in center
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10A5', centerX, centerY);

    // Pointer indicator at the top
    ctx.save();
    ctx.translate(centerX, 8);
    ctx.beginPath();
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.lineTo(0, 22);
    ctx.closePath();
    ctx.fillStyle = '#e11d48';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.restore();

  }, [currentAngle, candidates, numItems, arcSize]);

  // Spin physics animation
  const spinWheel = () => {
    if (isSpinning || candidates.length === 0) return;

    setIsSpinning(true);
    setSelectedStudent(null);

    // Random target revolutions + angle
    const extraSpins = 5 + Math.random() * 4; // 5 to 9 full spins
    const randomStopOffset = Math.random() * 2 * Math.PI;
    const totalRotation = extraSpins * 2 * Math.PI + randomStopOffset;

    const duration = 4500; // 4.5 seconds
    const startTime = performance.now();
    const initialAngle = currentAngle;
    let lastTickAngle = initialAngle;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const newAngle = initialAngle + totalRotation * easeOut;
      setCurrentAngle(newAngle);

      // Play sound tick as sectors pass
      if (Math.abs(newAngle - lastTickAngle) >= arcSize * 0.75) {
        soundEffects.tick(900);
        lastTickAngle = newAngle;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);

        // Calculate winning index at top pointer (3*PI/2)
        const normalizedAngle = (newAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        const pointerAngle = (3 * Math.PI / 2 - normalizedAngle + 2 * Math.PI) % (2 * Math.PI);
        const winningIndex = Math.floor(pointerAngle / arcSize) % candidates.length;

        const winner = candidates[winningIndex];
        setSelectedStudent(winner);
        setTimeout(() => {
          onSelectWinner(winner);
        }, 600);
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-2 animate-fade-in w-full">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Chọn trò khác</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-accent px-2.5 py-0.5 rounded-full bg-accent/15 border border-accent/30">
            {candidates.length} học sinh trong vòng quay
          </span>
        </div>
      </div>

      {/* Wheel Canvas Container */}
      <div className="relative p-2 rounded-full bg-gradient-to-tr from-accent/20 via-blue-500/10 to-purple-500/20 border-4 border-token shadow-2xl">
        <canvas
          ref={canvasRef}
          width={380}
          height={380}
          className="max-w-[320px] sm:max-w-[380px] aspect-square rounded-full shadow-inner select-none"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 mt-2">
        <button
          disabled={isSpinning || candidates.length === 0}
          onClick={spinWheel}
          className={`
            px-8 py-3.5 rounded-2xl font-black text-base shadow-xl flex items-center gap-2.5 transition-all cursor-pointer
            ${isSpinning 
              ? 'bg-muted text-surface opacity-75 cursor-not-allowed scale-95' 
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white hover:opacity-95 hover:scale-105 active:scale-95 ring-4 ring-orange-500/20'}
          `}
        >
          <Sparkles className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
          <span>{isSpinning ? 'Đang quay may mắn...' : 'QUAY NGAY 🎲'}</span>
        </button>
      </div>
    </div>
  );
};
