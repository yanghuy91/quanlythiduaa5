import React, { useState } from 'react';
import { ArrowLeft, Sparkles, Grid, Zap, RotateCcw } from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';

interface SecretMatrixProps {
  candidates: Student[];
  onSelectWinner: (student: Student) => void;
  onBack: () => void;
}

export const SecretMatrix: React.FC<SecretMatrixProps> = ({
  candidates,
  onSelectWinner,
  onBack,
}) => {
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedIndex, setScannedIndex] = useState<number | null>(null);

  // Map 1..42 to candidates
  const handleTileClick = (num: number) => {
    if (isScanning || selectedNum !== null || candidates.length === 0) return;

    setSelectedNum(num);
    soundEffects.laser();

    // Find student with matching viTriGhe or pick by index
    const matching = candidates.find(s => s.viTriGhe === num) || candidates[(num - 1) % candidates.length];
    setTimeout(() => {
      onSelectWinner(matching);
    }, 900);
  };

  // Laser Radar Auto-Scan
  const startRadarScan = () => {
    if (isScanning || candidates.length === 0) return;

    setIsScanning(true);
    setSelectedNum(null);

    const totalSteps = 28;
    let step = 0;
    let delay = 60;

    const runStep = () => {
      const randNum = Math.floor(Math.random() * 42) + 1;
      setScannedIndex(randNum);
      soundEffects.laser();

      step++;
      if (step < totalSteps) {
        delay += 12;
        setTimeout(runStep, delay);
      } else {
        setIsScanning(false);
        setSelectedNum(randNum);
        soundEffects.fanfare();

        const matching = candidates.find(s => s.viTriGhe === randNum) || candidates[(randNum - 1) % candidates.length];
        setTimeout(() => {
          onSelectWinner(matching);
        }, 900);
      }
    };

    setTimeout(runStep, delay);
  };

  return (
    <div className="flex flex-col items-center gap-3 py-2 animate-fade-in w-full max-w-xl mx-auto text-center">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-token text-xs font-semibold text-muted hover:text-main cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Chọn trò khác</span>
        </button>

        <span className="text-xs font-bold text-emerald-500 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1">
          <Grid className="w-3.5 h-3.5" />
          <span>Ma Trận 42 Ô Số Bí Mật</span>
        </span>
      </div>

      <p className="text-xs text-muted -mt-1">
        Chọn 1 con số may mắn (1-42) theo ngày, tháng, số áo... hoặc bấm quét radar tự động!
      </p>

      {/* 42-Tile Grid (6 columns x 7 rows) */}
      <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 w-full p-3 rounded-2xl bg-surface-2 border border-token shadow-inner">
        {Array.from({ length: 42 }, (_, i) => i + 1).map(num => {
          const isSelected = selectedNum === num;
          const isScanned = scannedIndex === num;

          return (
            <button
              key={num}
              type="button"
              disabled={isScanning}
              onClick={() => handleTileClick(num)}
              className={`
                h-10 rounded-xl text-xs font-bold flex items-center justify-center transition-all cursor-pointer border select-none
                ${isSelected 
                  ? 'bg-emerald-500 text-white border-emerald-400 scale-110 shadow-lg ring-2 ring-emerald-400 z-10' 
                  : isScanned 
                    ? 'bg-amber-400 text-black border-amber-300 scale-105 shadow-md' 
                    : 'bg-surface text-main border-token hover:border-emerald-500 hover:scale-105 active:scale-95'}
              `}
            >
              #{num}
            </button>
          );
        })}
      </div>

      {/* Auto Scan Button */}
      <button
        disabled={isScanning || candidates.length === 0}
        onClick={startRadarScan}
        className={`
          px-8 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 transition-all cursor-pointer mt-1
          ${isScanning 
            ? 'bg-muted text-surface opacity-75 cursor-not-allowed scale-95' 
            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-95 hover:scale-105 active:scale-95 ring-4 ring-emerald-500/20'}
        `}
      >
        <Zap className={`w-4 h-4 ${isScanning ? 'animate-bounce' : ''}`} />
        <span>{isScanning ? 'RADAR ĐANG QUÉT TÌM Ô... ⚡' : 'QUÉT RADAR LASER TỰ ĐỘNG ⚡'}</span>
      </button>
    </div>
  );
};
