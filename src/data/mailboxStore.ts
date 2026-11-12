import { MailAttachment, MailMessage, Student } from '../types';

const MAILBOX_STORAGE_KEY = 'app_mailbox_10a5_v1';

export const MAX_MAIL_ATTACHMENT_BYTES = 5 * 1024 * 1024; // 5MB

export function normalizeMailAttachments(raw: any): MailAttachment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(a => a && typeof a === 'object' && a.dataUrl)
    .map((a, idx) => ({
      id: String(a.id || `att-${idx}-${Date.now()}`),
      name: String(a.name || 'Tệp đính kèm'),
      mimeType: String(a.mimeType || 'application/octet-stream'),
      sizeBytes: Number(a.sizeBytes) || Math.round((String(a.dataUrl).length * 3) / 4),
      dataUrl: String(a.dataUrl),
      isImage:
        typeof a.isImage === 'boolean'
          ? a.isImage
          : String(a.mimeType || '').startsWith('image/') ||
            String(a.dataUrl || '').startsWith('data:image/'),
    }));
}

export function normalizeMailMessages(raw: any): MailMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      m =>
        m &&
        typeof m === 'object' &&
        m.id &&
        m.id !== 'mail-welcome-1' && // Loại bỏ vĩnh viễn thư chào mừng mặc định cũ
        m.senderId
    )
    .map(m => {
      const rawSenderName = String(m.senderName || '');
      const cleanSenderName =
        rawSenderName === 'Thầy Dương Văn Huy (GVCN)' || rawSenderName === 'Thầy Dương Văn Huy'
          ? 'Giáo viên chủ nhiệm'
          : rawSenderName;
      const rawRecipientLabel = String(m.recipientLabel || '');
      const cleanRecipientLabel =
        rawRecipientLabel === 'Thầy Dương Văn Huy (GVCN)' || rawRecipientLabel === 'Thầy Dương Văn Huy'
          ? 'Giáo viên chủ nhiệm'
          : rawRecipientLabel;

      return {
        id: String(m.id),
        senderId: String(m.senderId),
        senderName: cleanSenderName,
        senderRole: m.senderRole || 'HS',
        senderGroup: typeof m.senderGroup === 'number' ? m.senderGroup : undefined,
        senderAvatar: m.senderAvatar ? String(m.senderAvatar) : undefined,
        recipientType: m.recipientType || 'STUDENT',
        recipientIds: Array.isArray(m.recipientIds) ? m.recipientIds.map(String) : [],
        recipientLabel: cleanRecipientLabel,
        subject: String(m.subject || '(Không có tiêu đề)'),
        body: String(m.body || ''),
        createdAt: String(m.createdAt || new Date().toISOString()),
        readBy: Array.isArray(m.readBy) ? m.readBy.map(String) : [],
        starredBy: Array.isArray(m.starredBy) ? m.starredBy.map(String) : [],
        deletedBy: Array.isArray(m.deletedBy) ? m.deletedBy.map(String) : [],
        permanentlyDeletedBy: Array.isArray(m.permanentlyDeletedBy)
          ? m.permanentlyDeletedBy.map(String)
          : [],
        attachments: normalizeMailAttachments(m.attachments),
        replyToId: m.replyToId ? String(m.replyToId) : undefined,
      };
    });
}

export function getMailMessages(): MailMessage[] {
  try {
    const saved = localStorage.getItem(MAILBOX_STORAGE_KEY);
    if (!saved) {
      return [];
    }
    const parsed = JSON.parse(saved);
    const normalized = normalizeMailMessages(parsed);
    if (normalized.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
      localStorage.setItem(MAILBOX_STORAGE_KEY, JSON.stringify(normalized));
    }
    return normalized;
  } catch {
    return [];
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
  if ((msg.permanentlyDeletedBy || []).includes(userId)) {
    return false;
  }
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
    if ((msg.permanentlyDeletedBy || []).includes(userId)) return false;
    if ((msg.deletedBy || []).includes(userId)) return false;
    if (msg.senderId === userId) return false;
    if (!isMessageForUser(msg, userId, studentObj)) return false;
    return !(msg.readBy || []).includes(userId);
  }).length;
}

/**
 * Định dạng kích thước byte sang KB / MB dễ đọc
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}
