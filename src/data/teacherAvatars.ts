import gvNam01 from '../assets/avatars/gv_nam_01.jpg';
import gvNam02 from '../assets/avatars/gv_nam_02.jpg';
import gvNam03 from '../assets/avatars/gv_nam_03.jpg';
import gvNam04 from '../assets/avatars/gv_nam_04.jpg';
import gvNam05 from '../assets/avatars/gv_nam_05.jpg';
import gv06 from '../assets/avatars/gv_06.jpg';
import gv07 from '../assets/avatars/gv_07.jpg';
import gv08 from '../assets/avatars/gv_08.jpg';
import gv09 from '../assets/avatars/gv_09.jpg';
import gv10 from '../assets/avatars/gv_10.jpg';

export interface TeacherAvatarPreset {
  id: string;
  name: string;
  category: 'Trẻ trung' | 'Trung niên' | 'Phong cách' | 'Uyên bác' | 'Nghệ thuật' | 'Khoa học' | 'Nữ tính';
  description: string;
  src: string;
}

export const TEACHER_AVATAR_PRESETS: TeacherAvatarPreset[] = [
  {
    id: 'gv_young_modern',
    name: 'Thầy giáo trẻ hiện đại',
    category: 'Trẻ trung',
    description: 'Phong thái thanh lịch, năng động, nụ cười thân thiện, phong cách thời đại số.',
    src: gvNam01,
  },
  {
    id: 'gv_middle_aged_dignified',
    name: 'Thầy giáo trung niên mẫu mực',
    category: 'Trung niên',
    description: 'Kính mắt trí thức, điềm đạm, uyên bác, trang trọng trong vest công sở.',
    src: gvNam02,
  },
  {
    id: 'gv_stem_tech',
    name: 'Thầy giáo Khoa học & STEM',
    category: 'Phong cách',
    description: 'Sáng tạo, đam mê công nghệ và nghiên cứu khoa học, tư duy đổi mới.',
    src: gvNam03,
  },
  {
    id: 'gv_humanities_scholar',
    name: 'Thầy giáo Văn học & Xã hội',
    category: 'Uyên bác',
    description: 'Phong thái nho nhã, thâm trầm, chiều sâu tri thức và lòng nhân ái.',
    src: gvNam04,
  },
  {
    id: 'gv_sports_movement',
    name: 'Thầy giáo Thể dục & Phong trào',
    category: 'Trẻ trung',
    description: 'Khỏe khoắn, nhiệt huyết, truyền lửa và tràn đầy năng lượng tích cực.',
    src: gvNam05,
  },
  {
    id: 'gv_art_creative',
    name: 'Thầy giáo Mỹ thuật & Sáng tạo',
    category: 'Nghệ thuật',
    description: 'Phong cách nghệ sĩ tài hoa, mũ beret, bảng màu sáng tạo và đầy cảm hứng.',
    src: gv06,
  },
  {
    id: 'gv_music_arts',
    name: 'Thầy giáo Âm nhạc & Biểu diễn',
    category: 'Nghệ thuật',
    description: 'Nụ cười tươi tắn, cây đàn guitar mộc, mang giai điệu vui tươi vào lớp học.',
    src: gv07,
  },
  {
    id: 'gv_math_informatics',
    name: 'Thầy giáo Toán & Tin học',
    category: 'Khoa học',
    description: 'Kính tròn thông thái, máy tính bảng công nghệ số, tư duy logic sắc bén.',
    src: gv08,
  },
  {
    id: 'gv_english_global',
    name: 'Thầy giáo Ngoại ngữ & Hội nhập',
    category: 'Trẻ trung',
    description: 'Âu phục trẻ trung, huy hiệu quả địa cầu, phong cách giảng dạy toàn cầu.',
    src: gv09,
  },
  {
    id: 'gv_female_aodai',
    name: 'Cô giáo Duyên dáng Áo Dài',
    category: 'Nữ tính',
    description: 'Áo dài truyền thống thanh nhã, nụ cười hiền hậu, mẫu mực và dịu dàng.',
    src: gv10,
  },
];

export const STORAGE_KEY_TEACHER_AVATAR = 'app_teacher_avatar_10a5';

/**
 * Lấy avatar hiện tại của giáo viên (từ localStorage hoặc mặc định thầy trung niên)
 */
export function getTeacherAvatar(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TEACHER_AVATAR);
    if (saved && saved.length > 5) return saved;
  } catch (e) {
    console.error('Error reading teacher avatar:', e);
  }
  return gvNam02; // Mặc định Thầy giáo trung niên mẫu mực
}

/**
 * Lưu avatar của giáo viên vào localStorage
 */
export function setTeacherAvatar(avatarUrl: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_TEACHER_AVATAR, avatarUrl);
  } catch (e) {
    console.error('Error saving teacher avatar:', e);
  }
}
