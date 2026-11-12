import { MailMessage, Student } from '../types';

const MAILBOX_STORAGE_KEY = 'app_mailbox_10a5_v1';

export const DEFAULT_MAIL_MESSAGES: MailMessage[] = [
  {
    id: 'mail-welcome-1',
    senderId: 'GV',
    senderName: 'Thầy Dương Văn Huy (GVCN)',
    senderRole: 'GV',
    recipientType: 'ALL_STUDENTS',
    recipientIds: ['ALL'],
    recipientLabel: 'Cả lớp 10A5',
    subject: '🌟 Chào mừng tập thể lớp 10A5 đến với Hộp thư lớp học!',
    body: 'Chào các em học sinh lớp 10A5!\n\nTừ nay các em có thể sử dụng Hộp thư lớp học để:\n- Gửi ý kiến đóng góp, tâm tư, nguyện vọng hoặc xin phép trực tiếp cho Thầy (GVCN).\n- Trao đổi công việc lớp, nhắc nhở thi đua, hỗ trợ học tập giữa Ban cán sự, Tổ trưởng và các bạn trong lớp.\n\nChúc tập thể 10A5 luôn đoàn kết, nề nếp tốt và dẫn đầu phong trào thi đua!',
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    readBy: ['GV'],
    starredBy: [],
    deletedBy: [],
  },
];

export function normalizeMailMessages(raw: any): MailMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(m => m && typeof m === 'object' && m.id && m.senderId)
    .map(m => ({
      id: String(m.id),
      senderId: String(m.senderId),
      senderName: String(m.senderName || ''),
      senderRole: m.senderRole || 'HS',
      senderGroup: typeof m.senderGroup === 'number' ? m.senderGroup : undefined,
      senderAvatar: m.senderAvatar ? String(m.senderAvatar) : undefined,
      recipientType: m.recipientType || 'STUDENT',
      recipientIds: Array.isArray(m.recipientIds) ? m.recipientIds.map(String) : [],
      recipientLabel: String(m.recipientLabel || ''),
      subject: String(m.subject || '(Không có tiêu đề)'),
      body: String(m.body || ''),
      createdAt: String(m.createdAt || new Date().toISOString()),
      readBy: Array.isArray(m.readBy) ? m.readBy.map(String) : [],
      starredBy: Array.isArray(m.starredBy) ? m.starredBy.map(String) : [],
      deletedBy: Array.isArray(m.deletedBy) ? m.deletedBy.map(String) : [],
      replyToId: m.replyToId ? String(m.replyToId) : undefined,
    }));
}

export function getMailMessages(): MailMessage[] {
  try {
    const saved = localStorage.getItem(MAILBOX_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(MAILBOX_STORAGE_KEY, JSON.stringify(DEFAULT_MAIL_MESSAGES));
      return DEFAULT_MAIL_MESSAGES;
    }
    const parsed = JSON.parse(saved);
    return normalizeMailMessages(parsed);
  } catch {
    return DEFAULT_MAIL_MESSAGES;
  }
}

export function saveMailMessages(messages: MailMessage[]): void {
  try {
    const normalized = normalizeMailMessages(messages);
    localStorage.setItem(MAILBOX_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent('mailbox_updated'));
  } catch (e) {
    console.warn('[MailboxStore] Không thể lưu hộp thư:', e);
  }
}

/**
 * Kiểm tra xem 1 thư có gửi đến người dùng hiện tại (`userId` = 'GV' hoặc `maHS`) hay không
 */
export function isMessageForUser(
  msg: MailMessage,
  userId: string,
  studentObj?: Student
): boolean {
  if (userId === 'GV') {
    return msg.recipientType === 'GV' || msg.recipientIds.includes('GV');
  }
  if (msg.recipientType === 'ALL_STUDENTS' || msg.recipientIds.includes('ALL')) {
    return true;
  }
  if (msg.recipientIds.includes(userId)) {
    return true;
  }
  if (studentObj) {
    if (
      msg.recipientType === 'GROUP' &&
      msg.recipientIds.includes(`GROUP_${studentObj.to}`)
    ) {
      return true;
    }
    const isCadre = (studentObj.vaiTro || []).some(r => r !== 'HS' && r !== 'GV');
    if (
      isCadre &&
      (msg.recipientType === 'CADRES' || msg.recipientIds.includes('CADRES'))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Đếm số thư đến chưa đọc của người dùng hiện tại
 */
export function countUnreadMailForUser(
  messages: MailMessage[],
  userId: string,
  studentObj?: Student
): number {
  return (messages || []).filter(msg => {
    if ((msg.deletedBy || []).includes(userId)) return false;
    if (msg.senderId === userId) return false;
    if (!isMessageForUser(msg, userId, studentObj)) return false;
    return !(msg.readBy || []).includes(userId);
  }).length;
}
