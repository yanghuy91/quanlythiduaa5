import React, { useState, useMemo } from 'react';
import { 
  Gamepad2, 
  Dices, 
  Bomb, 
  Rocket, 
  Gift, 
  Zap, 
  Grid, 
  Music, 
  Sparkles, 
  Filter, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Flame, 
  Users,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Student } from '../../../types';
import { soundEffects } from '../../../utils/soundEffects';
import { WinnerModal } from './WinnerModal';

// Game Sub-components
import { WheelOfFortune } from './WheelOfFortune';
import { TimeBomb } from './TimeBomb';
import { SlotMachine } from './SlotMachine';
import { MysteryCards } from './MysteryCards';
import { TurboRace } from './TurboRace';
import { CosmicRocket } from './CosmicRocket';
import { LuckyEnvelopes } from './LuckyEnvelopes';
import { ClawMachine } from './ClawMachine';
import { SecretMatrix } from './SecretMatrix';
import { VinylDJ } from './VinylDJ';

type GameId = 
  | 'wheel' 
  | 'bomb' 
  | 'slot' 
  | 'cards' 
  | 'race' 
  | 'rocket' 
  | 'envelope' 
  | 'claw' 
  | 'matrix' 
  | 'vinyl';

interface GameInfo {
  id: GameId;
  title: string;
  badge: string;
  desc: string;
  icon: React.ReactNode;
  gradient: string;
}

const GAMES_LIST: GameInfo[] = [
  {
    id: 'wheel',
    title: 'Vòng Quay May Mắn',
    badge: 'Kinh điển',
    desc: 'Vòng quay sắc màu hồi hộp, kim chỉ đỉnh cao giải trí lớp học.',
    icon: <Dices className="w-6 h-6 text-amber-300" />,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'bomb',
    title: 'Bom Nổ Chậm / Ghế Nóng',
    badge: 'Siêu Hot 🔥',
    desc: 'Ngòi nổ đếm ngược dồn dập, tiếng tích tắc nghẹt thở đến khi nổ tung!',
    icon: <Bomb className="w-6 h-6 text-red-300" />,
    gradient: 'from-red-600 to-rose-700',
  },
  {
    id: 'slot',
    title: 'Máy Xèng Tri Thức 777',
    badge: 'Arcade',
    desc: 'Giật cần gạt cơ học, 3 guồng quay Tổ - Tên - Thử thách cực đã.',
    icon: <Sparkles className="w-6 h-6 text-yellow-300" />,
    gradient: 'from-yellow-600 to-amber-700',
  },
  {
    id: 'cards',
    title: 'Rút Thẻ Nhân Phẩm',
    badge: 'Gacha Ma Thuật',
    desc: '12 lá bài lật 3D vàng rực hé lộ gương mặt vàng của buổi học.',
    icon: <Gift className="w-6 h-6 text-purple-300" />,
    gradient: 'from-purple-600 to-indigo-700',
  },
  {
    id: 'race',
    title: 'Đua Xe F1 10A5',
    badge: 'Tốc độ',
    desc: '4 chiến mã F1 tăng tốc turbo, ai cán đích trước lên bảng.',
    icon: <Zap className="w-6 h-6 text-rose-300" />,
    gradient: 'from-rose-600 to-red-800',
  },
  {
    id: 'rocket',
    title: 'Phi Thuyền Vũ Trụ',
    badge: 'Khoa học',
    desc: 'Đếm ngược 3-2-1 phóng tên lửa quét tọa độ thiên hà chọn phi hành gia.',
    icon: <Rocket className="w-6 h-6 text-cyan-300" />,
    gradient: 'from-cyan-600 to-blue-800',
  },
  {
    id: 'envelope',
    title: 'Bao Lì Xì May Mắn',
    badge: 'Hên xui',
    desc: 'Dãy phong bao đỏ đu đưa, xé bao tung kim tuyến đón lộc bảng đen.',
    icon: <Gift className="w-6 h-6 text-amber-200" />,
    gradient: 'from-red-700 to-orange-800',
  },
  {
    id: 'claw',
    title: 'Máy Gắp Thú Arcade',
    badge: 'Dễ thương',
    desc: 'Hạ càng gắp cơ khí xuống hồ gấu bông bắt trúng capsule may mắn.',
    icon: <Gamepad2 className="w-6 h-6 text-pink-300" />,
    gradient: 'from-pink-600 to-purple-800',
  },
  {
    id: 'matrix',
    title: 'Ma Trận 42 Ô Số Thần Bí',
    badge: 'Radar Laser',
    desc: 'Bảng 42 số tương ứng 42 học sinh, chọn số hên hoặc quét laser tự động.',
    icon: <Grid className="w-6 h-6 text-emerald-300" />,
    gradient: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'vinyl',
    title: 'DJ Đĩa Than & Dừng Nhạc',
    badge: 'Âm nhạc',
    desc: 'Nhạc sàn xoay đĩa sôi động, thầy cô bấm dừng đĩa để khóa mục tiêu!',
    icon: <Music className="w-6 h-6 text-violet-300" />,
    gradient: 'from-violet-600 to-fuchsia-800',
  },
];

interface CallingGamesHubProps {
  students: Student[];
  onQuickRecord?: (student: Student, type: 'Cong' | 'Tru') => void;
}

export const CallingGamesHub: React.FC<CallingGamesHubProps> = ({
  students,
  onQuickRecord,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameId | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<'all' | 1 | 2 | 3 | 4>('all');
  const [selectedGender, setSelectedGender] = useState<'all' | 'nam' | 'nu'>('all');
  const [excludeCalled, setExcludeCalled] = useState(false);
  const [calledHistory, setCalledHistory] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Winner Modal State
  const [winningStudent, setWinningStudent] = useState<Student | null>(null);
  const [winnerModalOpen, setWinnerModalOpen] = useState(false);

  // Filter candidates based on group, gender, and exclusion
  const candidates = useMemo(() => {
    return students.filter(st => {
      // Group filter
      if (selectedGroup !== 'all' && st.to !== selectedGroup) return false;

      // Gender filter (in mockData, female students usually have Thi / My / Ngoc / Duyen / Trang / Hang / Uyen / Linh / Anh etc.)
      if (selectedGender !== 'all') {
        const isNu = st.gioiTinh 
          ? st.gioiTinh === 'Nu' 
          : /Thị|Duyên|Trang|Hằng|Uyên|Linh|My|Tiên|Quỳnh|Huyền|Ánh/i.test(st.hoTen);
        if (selectedGender === 'nu' && !isNu) return false;
        if (selectedGender === 'nam' && isNu) return false;
      }

      // Exclude already called
      if (excludeCalled && calledHistory.includes(st.maHS)) return false;

      return true;
    });
  }, [students, selectedGroup, selectedGender, excludeCalled, calledHistory]);

  const handleSelectWinner = (student: Student) => {
    setWinningStudent(student);
    setWinnerModalOpen(true);
    setCalledHistory(prev => (prev.includes(student.maHS) ? prev : [student.maHS, ...prev]));
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
  };

  const handleResetHistory = () => {
    setCalledHistory([]);
  };

  const activeGameInfo = selectedGame ? GAMES_LIST.find(g => g.id === selectedGame) : null;

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 shadow-md shrink-0">
            <Gamepad2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-gray-900 tracking-wider uppercase">
                10 Trò Gọi Bảng Hot 🎯
              </span>
              <span className="text-xs text-white/80">Lớp 10A5 Đức Phổ</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
              Kho Ứng Dụng &amp; Trò Chơi Gọi Học Sinh
            </h2>
            <p className="text-xs text-white/80 mt-0.5">
              Biến giờ kiểm tra bài cũ và gọi bảng thành sân chơi sôi nổi, công bằng, gắn kết học sinh
            </p>
          </div>
        </div>

        {/* Global Sound Mute Toggle */}
        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <button
            onClick={handleToggleMute}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4 text-emerald-300" />}
            <span>{isMuted ? 'Âm thanh: Tắt' : 'Âm thanh: Bật'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-surface border border-token shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Tổ selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-muted mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Phạm vi:</span>
          </span>
          <button
            onClick={() => setSelectedGroup('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
              selectedGroup === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-2 text-muted hover:text-main'
            }`}
          >
            Cả lớp (42 HS)
          </button>
          {[1, 2, 3, 4].map(to => (
            <button
              key={to}
              onClick={() => setSelectedGroup(to as 1 | 2 | 3 | 4)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                selectedGroup === to ? 'bg-primary text-on-primary' : 'bg-surface-2 text-muted hover:text-main'
              }`}
            >
              Tổ {to}
            </button>
          ))}
        </div>

        {/* Exclusion & Candidate Count */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-muted hover:text-main select-none font-semibold">
            <input
              type="checkbox"
              checked={excludeCalled}
              onChange={e => setExcludeCalled(e.target.checked)}
              className="w-4 h-4 rounded accent-accent"
            />
            <span>Loại trừ em đã gọi ({calledHistory.length})</span>
          </label>

          {calledHistory.length > 0 && (
            <button
              onClick={handleResetHistory}
              className="text-[11px] text-muted hover:text-main flex items-center gap-1 underline cursor-pointer"
              title="Đặt lại danh sách đã gọi"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <div className="px-2.5 py-1 rounded-lg bg-accent/15 border border-accent/30 text-accent font-extrabold">
            {candidates.length} ứng viên
          </div>
        </div>
      </div>

      {/* Main Container: Game Selection Grid OR Active Game */}
      {!selectedGame ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {GAMES_LIST.map(game => (
            <div
              key={game.id}
              onClick={() => {
                setSelectedGame(game.id);
                soundEffects.tick(900);
              }}
              className="group relative p-4 rounded-3xl bg-surface border border-token hover:border-accent shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              <div className="space-y-2.5">
                {/* Header: Icon + Badge */}
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${game.gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                    {game.icon}
                  </div>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-surface-2 text-main border border-token">
                    {game.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-black text-main group-hover:text-accent transition-colors">
                    {game.title}
                  </h3>
                  <p className="text-xs text-muted line-clamp-2 mt-0.5">
                    {game.desc}
                  </p>
                </div>
              </div>

              {/* Action Link */}
              <div className="pt-3 border-t border-token/60 mt-3 flex items-center justify-between text-xs font-bold text-accent">
                <span>Vào chơi ngay</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-4 sm:p-6 rounded-3xl bg-surface border border-token shadow-md space-y-4">
          {/* Top Back Navigation Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-token">
            <button
              type="button"
              onClick={() => setSelectedGame(null)}
              className="px-3.5 py-1.5 rounded-xl bg-surface-2 hover:bg-surface border border-token text-main text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 hover:border-accent"
            >
              <span>← Quay lại 10 trò chơi</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-main">{activeGameInfo?.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/15 text-accent font-extrabold">
                {candidates.length} HS
              </span>
            </div>
          </div>

          {selectedGame === 'wheel' && (
            <WheelOfFortune
              candidates={candidates}
              onSelectWinner={handleSelectWinner}
              onBack={() => setSelectedGame(null)}
            />
          )}

          {selectedGame === 'bomb' && (
            <TimeBomb
              candidates={candidates}
              onSelectWinner={handleSelectWinner}
              onBack={() => setSelectedGame(null)}
            />
          )}

          {selectedGame === 'slot' && (
            <SlotMachine
              candidates={candidates}
              onSelectWinner={handleSelectWinner}
              onBack={() => setSelectedGame(null)}
            />
          )}

          {selectedGame === 'cards' && (
            <MysteryCards
              candidates={candidates}
              onSelectWinner={handleSelectWinner}
              onBack={() => setSelectedGame(null)}
            />
          )}

          {selectedGame === 'race' && (
            <TurboRace
              candidates={candidates}
              onSelectWinner={handleSelectWinner}
              onBack={() => setSelectedGame(null)}
            />
          )}

          {selectedGame === 'rocket' && (
            <CosmicRocket
              candidates={candidates}
              onSelectWinner={handleSelectWinner}
              onBack={() => setSelectedGame(null)}
            />
          )}

          {selectedGame === 'envelope' && (
            <LuckyEnvelopes
              candidates={candidates}
              onSelectWinner={handleSelectWinner}
              onBack={() => setSelectedGame(null)}
            />
          )}

          {selectedGame === 'claw' && (
            <ClawMachine
              candidates={candidates}
              onSelectWinner={handleSelectWinner}
              onBack={() => setSelectedGame(null)}
            />
          )}

          {selectedGame === 'matrix' && (
            <SecretMatrix
              candidates={candidates}
              onSelectWinner={handleSelectWinner}
              onBack={() => setSelectedGame(null)}
            />
          )}

          {selectedGame === 'vinyl' && (
            <VinylDJ
              candidates={candidates}
              onSelectWinner={handleSelectWinner}
              onBack={() => setSelectedGame(null)}
            />
          )}
        </div>
      )}

      {/* Winner Celebration Modal */}
      <WinnerModal
        student={winningStudent}
        isOpen={winnerModalOpen}
        gameTitle={activeGameInfo?.title || 'Trò chơi'}
        onClose={() => setWinnerModalOpen(false)}
        onPlayAgain={() => {
          setWinnerModalOpen(false);
          soundEffects.tick(1000);
        }}
        onQuickRecord={(student, type) => {
          setWinnerModalOpen(false);
          if (onQuickRecord) {
            onQuickRecord(student, type);
          }
        }}
      />
    </div>
  );
};
