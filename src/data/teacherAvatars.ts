import gv3d01 from '../assets/avatars/gv_3d_01.jpg';
import gv3d02 from '../assets/avatars/gv_3d_02.jpg';
import gv3d03 from '../assets/avatars/gv_3d_03.jpg';
import gv3d04 from '../assets/avatars/gv_3d_04.jpg';
import gv3d05 from '../assets/avatars/gv_3d_05.jpg';
import gv3d06 from '../assets/avatars/gv_3d_06.jpg';
import gv3d07 from '../assets/avatars/gv_3d_07.jpg';
import gv3d08 from '../assets/avatars/gv_3d_08.jpg';
import gv3d09 from '../assets/avatars/gv_3d_09.jpg';
import gv3d10 from '../assets/avatars/gv_3d_10.jpg';

export interface TeacherAvatarPreset {
  id: string;
  name: string;
  category: 'Trẻ trung' | 'Mẫu mực' | 'Công nghệ' | 'Nhân văn' | 'Nghệ thuật' | 'Khoa học' | 'Nữ tính';
  description: string;
  src: string;
}

export const TEACHER_AVATAR_PRESETS: TeacherAvatarPreset[] = [
  {
    id: 'gv_3d_young_modern',
    name: 'Thầy giáo 3D Trẻ trung & Thanh lịch',
    category: 'Trẻ trung',
    description: 'Phong cách 3D hoạt họa hiện đại, nụ cười tươi thân thiện, kính mắt thời trang, vest trẻ trung.',
    src: gv3d01,
  },
  {
    id: 'gv_3d_distinguished',
    name: 'Thầy giáo 3D Mẫu mực & Trí thức',
    category: 'Mẫu mực',
    description: 'Phong thái điềm đạm, uyên bác, kính mắt vuông tri thức, trang phục blazer xanh navy cao cấp.',
    src: gv3d02,
  },
  {
    id: 'gv_3d_stem_tech',
    name: 'Thầy giáo 3D Công nghệ & STEM',
    category: 'Công nghệ',
    description: 'Sáng tạo, đam mê đổi mới số, phong thái giáo viên thời đại 4.0 năng động.',
    src: gv3d03,
  },
  {
    id: 'gv_3d_humanities',
    name: 'Thầy giáo 3D Văn hóa & Nhân văn',
    category: 'Nhân văn',
    description: 'Phong cách ấm áp, chiều sâu tri thức, nụ cười hiền hậu và gần gũi với học sinh.',
    src: gv3d04,
  },
  {
    id: 'gv_3d_sports',
    name: 'Thầy giáo 3D Thể thao & Phong trào',
    category: 'Trẻ trung',
    description: 'Năng động, nhiệt huyết, truyền lửa và tràn đầy năng lượng tích cực cho tập thể lớp.',
    src: gv3d05,
  },
  {
    id: 'gv_3d_arts',
    name: 'Thầy giáo 3D Nghệ thuật & Sáng tạo',
    category: 'Nghệ thuật',
    description: 'Phong cách nghệ sĩ tài hoa, kính gọng tròn sáng tạo, áo khoác vàng cam thời thượng.',
    src: gv3d06,
  },
  {
    id: 'gv_3d_music',
    name: 'Thầy giáo 3D Âm nhạc & Biểu diễn',
    category: 'Nghệ thuật',
    description: 'Tai nghe hiện đại, nụ cười rạng rỡ, mang giai điệu vui tươi và cảm hứng vào lớp học.',
    src: gv3d07,
  },
  {
    id: 'gv_3d_math',
    name: 'Thầy giáo 3D Toán & Khoa học số',
    category: 'Khoa học',
    description: 'Kính mắt thông thái, tư duy logic sắc bén, trang nhã và hiện đại.',
    src: gv3d08,
  },
  {
    id: 'gv_3d_global',
    name: 'Thầy giáo 3D Ngoại ngữ & Hội nhập',
    category: 'Trẻ trung',
    description: 'Blazer đỏ burgundy sang trọng, huy hiệu quả địa cầu, phong cách giảng dạy toàn cầu.',
    src: gv3d09,
  },
  {
    id: 'gv_3d_female_aodai',
    name: 'Cô giáo 3D Duyên dáng Áo Dài',
    category: 'Nữ tính',
    description: 'Áo dài hồng sen thanh nhã, phong thái dịu dàng, nét vẽ 3D mềm mại và ấm áp.',
    src: gv3d10,
  },
];

export const STORAGE_KEY_TEACHER_AVATAR = 'app_teacher_avatar_10a5';

/**
 * Lấy avatar hiện tại của giáo viên (từ localStorage hoặc mặc định thầy 3D trẻ trung)
 */
export function getTeacherAvatar(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TEACHER_AVATAR);
    if (saved && saved.length > 5) return saved;
  } catch (e) {
    console.error('Error reading teacher avatar:', e);
  }
  return gv3d01; // Mặc định Thầy giáo 3D trẻ trung & hiện đại
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
