import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Mail,
  Send,
  Inbox,
  Star,
  Trash2,
  Plus,
  Reply,
  Users,
  UserCheck,
  Shield,
  CheckCircle2,
  Clock,
  ArrowLeft,
  X,
  Check,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  RotateCcw,
  HardDrive,
  AlertTriangle,
} from 'lucide-react';
import {
  MailAttachment,
  MailMessage,
  MailRecipientType,
  RoleCode,
  Student,
  DisciplineRecord,
} from '../../types';
import {
  getMailMessages,
  saveMailMessages,
  isMessageForUser,
  MAX_MAIL_ATTACHMENT_BYTES,
  formatBytes,
} from '../../data/mailboxStore';

interface ClassroomMailboxProps {
  currentUserId: string; // 'GV' hoặc maHS (vd: 'HS01')
  currentUserName: string;
  currentUserRole: RoleCode;
  currentStudent?: Student;
  allStudents: Student[];
  teacherName?: string;
  messages?: MailMessage[];
  onUpdateMessages?: (nextMessages: MailMessage[]) => void;
  records?: DisciplineRecord[];
  onUpdateRecords?: (nextRecords: DisciplineRecord[]) => void;
  onResetCustomAvatars?: () => void;
}

type MailFolder = 'inbox' | 'sent' | 'starred' | 'trash';

const QUICK_SUBJECT_SUGGESTIONS = [
  'Báo cáo thi đua',
  'Xin phép nghỉ học',
  'Góp ý lớp học',
  'Giải trình vi phạm',
  'Trao đổi công việc',
];

export const ClassroomMailbox: React.FC<ClassroomMailboxProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  currentStudent,
  allStudents,
  teacherName = 'Giáo viên chủ nhiệm',
  messages: externalMessages,
  onUpdateMessages,
  records = [],
  onUpdateRecords,
  onResetCustomAvatars,
}) => {
  const [internalMessages, setInternalMessages] = useState<MailMessage[]>(() =>
    getMailMessages()
  );

  useEffect(() => {
    if (Array.isArray(externalMessages)) {
      setInternalMessages(externalMessages);
    }
  }, [externalMessages]);

  useEffect(() => {
    const handleStorageSync = () => {
      if (!externalMessages) {
        setInternalMessages(getMailMessages());
      }
    };
    window.addEventListener('mailbox_updated', handleStorageSync);
    return () => window.removeEventListener('mailbox_updated', handleStorageSync);
  }, [externalMessages]);

  const allMessages = externalMessages ?? internalMessages;

  const commitMessages = (next: MailMessage[]) => {
    setInternalMessages(next);
    saveMailMessages(next);
    onUpdateMessages?.(next);
  };

  const [activeFolder, setActiveFolder] = useState<MailFolder>('inbox');
  const [selectedMailId, setSelectedMailId] = useState<string | null>(null);

  // Compose modal state
  const [isComposing, setIsComposing] = useState(false);
  const [recipientType, setRecipientType] = useState<MailRecipientType>(
    currentUserId === 'GV' ? 'ALL_STUDENTS' : 'GV'
  );
  const [selectedGroupNum, setSelectedGroupNum] = useState<number>(
    currentStudent?.to || 1
  );
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<MailAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Reply state
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<MailAttachment[]>([]);
  const [sendSuccessBanner, setSendSuccessBanner] = useState<string | null>(null);

  // Firebase Storage Manager modal state (for Teacher)
  const [showStorageModal, setShowStorageModal] = useState(false);
  const [selectedCleanupTargets, setSelectedCleanupTargets] = useState<string[]>([
    'mail_images',
  ]);

  const composeFileInputRef = useRef<HTMLInputElement>(null);
  const composeImageInputRef = useRef<HTMLInputElement>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const effectiveTeacherLabel =
    teacherName &&
    teacherName !== 'Thầy Dương Văn Huy' &&
    teacherName !== 'Thầy Dương Văn Huy (GVCN)'
      ? teacherName
      : 'Giáo viên chủ nhiệm';

  // Filter messages for current user and folder
  const userMessages = useMemo(() => {
    return allMessages
      .filter(msg => {
        // Nếu người dùng đã xóa vĩnh viễn khỏi thùng rác thì không bao giờ hiện lại nữa
        if ((msg.permanentlyDeletedBy || []).includes(currentUserId)) {
          return false;
        }

        const isDeleted = (msg.deletedBy || []).includes(currentUserId);
        const isSender = msg.senderId === currentUserId;
        const isRecipient = isMessageForUser(msg, currentUserId, currentStudent);

        if (!isSender && !isRecipient) return false;

        if (activeFolder === 'trash') {
          return isDeleted;
        }
        if (isDeleted) return false;

        if (activeFolder === 'starred') {
          return (msg.starredBy || []).includes(currentUserId);
        }
        if (activeFolder === 'sent') {
          return isSender;
        }
        // inbox: received messages
        return isRecipient && (!isSender || msg.recipientIds.includes(currentUserId));
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allMessages, currentUserId, currentStudent, activeFolder]);

  const unreadInboxCount = useMemo(() => {
    return allMessages.filter(msg => {
      if ((msg.permanentlyDeletedBy || []).includes(currentUserId)) return false;
      if ((msg.deletedBy || []).includes(currentUserId)) return false;
      if (msg.senderId === currentUserId) return false;
      if (!isMessageForUser(msg, currentUserId, currentStudent)) return false;
      return !(msg.readBy || []).includes(currentUserId);
    }).length;
  }, [allMessages, currentUserId, currentStudent]);

  const trashCount = useMemo(() => {
    return allMessages.filter(msg => {
      if ((msg.permanentlyDeletedBy || []).includes(currentUserId)) return false;
      const isSender = msg.senderId === currentUserId;
      const isRecipient = isMessageForUser(msg, currentUserId, currentStudent);
      if (!isSender && !isRecipient) return false;
      return (msg.deletedBy || []).includes(currentUserId);
    }).length;
  }, [allMessages, currentUserId, currentStudent]);

  const selectedMail = useMemo(
    () => allMessages.find(m => m.id === selectedMailId) || null,
    [allMessages, selectedMailId]
  );

  // Automatically mark as read when opening a message
  const handleSelectMail = (mail: MailMessage) => {
    setSelectedMailId(mail.id);
    setReplyText('');
    setReplyAttachments([]);
    setAttachmentError(null);
    if (!(mail.readBy || []).includes(currentUserId)) {
      const updated = allMessages.map(m =>
        m.id === mail.id
          ? { ...m, readBy: Array.from(new Set([...(m.readBy || []), currentUserId])) }
          : m
      );
      commitMessages(updated);
    }
  };

  const handleToggleStar = (mailId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = allMessages.map(m => {
      if (m.id !== mailId) return m;
      const hasStar = (m.starredBy || []).includes(currentUserId);
      const nextStars = hasStar
        ? (m.starredBy || []).filter(id => id !== currentUserId)
        : [...(m.starredBy || []), currentUserId];
      return { ...m, starredBy: nextStars };
    });
    commitMessages(updated);
  };

  // Xóa vào thùng rác HOẶC Xóa vĩnh viễn khi đang ở trong Thùng rác
  const handleDeleteMail = (mailId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = allMessages.find(m => m.id === mailId);
    if (!target) return;

    const isInTrash = (target.deletedBy || []).includes(currentUserId);
    if (isInTrash || activeFolder === 'trash') {
      // Đang ở trong Thùng rác -> Xóa vĩnh viễn (không bao giờ quay lại hộp thư đến)
      let updated: MailMessage[];
      if (currentUserId === 'GV' && target.senderId === 'GV') {
        updated = allMessages.filter(m => m.id !== mailId);
      } else {
        updated = allMessages.map(m =>
          m.id === mailId
            ? {
                ...m,
                permanentlyDeletedBy: Array.from(
                  new Set([...(m.permanentlyDeletedBy || []), currentUserId])
                ),
              }
            : m
        );
      }
      commitMessages(updated);
      if (selectedMailId === mailId) {
        setSelectedMailId(null);
      }
      setSendSuccessBanner('Đã xóa vĩnh viễn thư khỏi thùng rác!');
      setTimeout(() => setSendSuccessBanner(null), 3000);
    } else {
      // Chuyển vào thùng rác
      const updated = allMessages.map(m =>
        m.id === mailId
          ? { ...m, deletedBy: Array.from(new Set([...(m.deletedBy || []), currentUserId])) }
          : m
      );
      commitMessages(updated);
      if (selectedMailId === mailId) {
        setSelectedMailId(null);
      }
    }
  };

  // Khôi phục thư từ Thùng rác (nút riêng biệt)
  const handleRestoreFromTrash = (mailId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = allMessages.map(m =>
      m.id === mailId
        ? { ...m, deletedBy: (m.deletedBy || []).filter(id => id !== currentUserId) }
        : m
    );
    commitMessages(updated);
    if (selectedMailId === mailId) {
      setSelectedMailId(null);
    }
    setSendSuccessBanner('Đã khôi phục thư khỏi thùng rác!');
    setTimeout(() => setSendSuccessBanner(null), 3000);
  };

  // Dọn sạch toàn bộ thùng rác của người dùng hiện tại
  const handleEmptyTrash = () => {
    const updated = allMessages.map(m => {
      if ((m.deletedBy || []).includes(currentUserId)) {
        return {
          ...m,
          permanentlyDeletedBy: Array.from(
            new Set([...(m.permanentlyDeletedBy || []), currentUserId])
          ),
        };
      }
      return m;
    });
    commitMessages(updated);
    setSelectedMailId(null);
    setSendSuccessBanner('Đã dọn sạch toàn bộ Thùng rác!');
    setTimeout(() => setSendSuccessBanner(null), 3000);
  };

  // Xử lý chọn file / hình ảnh đính kèm (Giới hạn 5MB)
  const handleFilesSelected = async (
    files: FileList | null,
    targetMode: 'compose' | 'reply'
  ) => {
    if (!files || files.length === 0) return;
    setAttachmentError(null);

    const existingList = targetMode === 'compose' ? composeAttachments : replyAttachments;
    const currentTotalBytes = existingList.reduce((acc, a) => acc + a.sizeBytes, 0);

    let addedBytes = 0;
    const newAttachments: MailAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_MAIL_ATTACHMENT_BYTES) {
        setAttachmentError(
          `Tệp "${file.name}" (${formatBytes(file.size)}) vượt quá giới hạn 5MB!`
        );
        continue;
      }
      if (currentTotalBytes + addedBytes + file.size > MAX_MAIL_ATTACHMENT_BYTES) {
        setAttachmentError(
          'Tổng dung lượng đính kèm trong 1 thư không được vượt quá 5MB!'
        );
        break;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Lỗi đọc file'));
        reader.readAsDataURL(file);
      });

      addedBytes += file.size;
      newAttachments.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        dataUrl,
        isImage: file.type.startsWith('image/'),
      });
    }

    if (newAttachments.length > 0) {
      if (targetMode === 'compose') {
        setComposeAttachments(prev => [...prev, ...newAttachments]);
      } else {
        setReplyAttachments(prev => [...prev, ...newAttachments]);
      }
    }
  };

  const openComposeModal = (
    presetRecipientType?: MailRecipientType,
    presetStudentId?: string,
    presetSubject?: string
  ) => {
    if (presetRecipientType) {
      setRecipientType(presetRecipientType);
    } else {
      setRecipientType(currentUserId === 'GV' ? 'ALL_STUDENTS' : 'GV');
    }
    if (presetStudentId) {
      setSelectedStudentIds([presetStudentId]);
    } else {
      setSelectedStudentIds([]);
    }
    setComposeSubject(presetSubject || '');
    setComposeBody('');
    setComposeAttachments([]);
    setAttachmentError(null);
    setStudentSearchTerm('');
    setIsComposing(true);
  };

  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBody = composeBody.trim();
    if (!trimmedBody && composeAttachments.length === 0) return;

    let finalRecipientIds: string[] = [];
    let finalRecipientLabel = '';

    if (recipientType === 'GV') {
      finalRecipientIds = ['GV'];
      finalRecipientLabel = effectiveTeacherLabel;
    } else if (recipientType === 'ALL_STUDENTS') {
      finalRecipientIds = ['ALL'];
      finalRecipientLabel = 'Cả lớp 10A5';
    } else if (recipientType === 'CADRES') {
      finalRecipientIds = ['CADRES'];
      finalRecipientLabel = 'Ban cán sự lớp 10A5';
    } else if (recipientType === 'GROUP') {
      finalRecipientIds = [`GROUP_${selectedGroupNum}`];
      finalRecipientLabel = `Tổ ${selectedGroupNum}`;
    } else if (recipientType === 'STUDENT') {
      if (selectedStudentIds.length === 0) return;
      finalRecipientIds = selectedStudentIds;
      const chosenNames = allStudents
        .filter(s => selectedStudentIds.includes(s.maHS))
        .map(s => s.hoTen);
      finalRecipientLabel =
        chosenNames.length <= 2
          ? chosenNames.join(', ')
          : `${chosenNames.slice(0, 2).join(', ')} (+${chosenNames.length - 2} bạn)`;
    }

    const newMsg: MailMessage = {
      id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: currentUserId,
      senderName:
        currentUserId === 'GV'
          ? effectiveTeacherLabel
          : `${currentUserName}${currentStudent ? ` (Tổ ${currentStudent.to})` : ''}`,
      senderRole: currentUserRole,
      senderGroup: currentStudent?.to,
      recipientType,
      recipientIds: finalRecipientIds,
      recipientLabel: finalRecipientLabel,
      subject: composeSubject.trim() || 'Thư trao đổi lớp 10A5',
      body: trimmedBody || '(Đính kèm tệp/hình ảnh)',
      createdAt: new Date().toISOString(),
      readBy: [currentUserId],
      starredBy: [],
      deletedBy: [],
      permanentlyDeletedBy: [],
      attachments: composeAttachments,
    };

    commitMessages([newMsg, ...allMessages]);
    setIsComposing(false);
    setComposeSubject('');
    setComposeBody('');
    setComposeAttachments([]);
    setSendSuccessBanner(`Đã gửi thư tới "${finalRecipientLabel}"!`);
    setTimeout(() => setSendSuccessBanner(null), 3500);
  };

  const handleQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMail || (!replyText.trim() && replyAttachments.length === 0)) return;

    const isReplyToTeacher = selectedMail.senderId === 'GV';
    const replyRecipientType: MailRecipientType = isReplyToTeacher ? 'GV' : 'STUDENT';
    const replyRecipientIds = isReplyToTeacher ? ['GV'] : [selectedMail.senderId];
    const replyRecipientLabel = selectedMail.senderName;
    const baseSubj = selectedMail.subject.startsWith('Re: ')
      ? selectedMail.subject
      : `Re: ${selectedMail.subject}`;

    const replyMsg: MailMessage = {
      id: `mail-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: currentUserId,
      senderName:
        currentUserId === 'GV'
          ? effectiveTeacherLabel
          : `${currentUserName}${currentStudent ? ` (Tổ ${currentStudent.to})` : ''}`,
      senderRole: currentUserRole,
      senderGroup: currentStudent?.to,
      recipientType: replyRecipientType,
      recipientIds: replyRecipientIds,
      recipientLabel: replyRecipientLabel,
      subject: baseSubj,
      body: replyText.trim() || '(Đính kèm tệp/hình ảnh)',
      createdAt: new Date().toISOString(),
      readBy: [currentUserId],
      starredBy: [],
      deletedBy: [],
      permanentlyDeletedBy: [],
      attachments: replyAttachments,
      replyToId: selectedMail.id,
    };

    commitMessages([replyMsg, ...allMessages]);
    setReplyText('');
    setReplyAttachments([]);
    setSendSuccessBanner(`Đã gửi phản hồi tới "${replyRecipientLabel}"!`);
    setTimeout(() => setSendSuccessBanner(null), 3500);
  };

  const formatMailTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const timePart = d.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      if (isToday) return timePart;
      return `${d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${timePart}`;
    } catch {
      return '';
    }
  };

  const filteredStudentsForPicker = useMemo(() => {
    return allStudents
      .filter(s => s.maHS !== currentUserId)
      .filter(s => {
        if (!studentSearchTerm.trim()) return true;
        const q = studentSearchTerm.toLowerCase();
        return (
          s.hoTen.toLowerCase().includes(q) ||
          s.maHS.toLowerCase().includes(q) ||
          `tổ ${s.to}`.includes(q)
        );
      });
  }, [allStudents, currentUserId, studentSearchTerm]);

  // Tính toán chi tiết dung lượng lưu trữ trên Firebase (dành cho Giáo viên)
  const storageStats = useMemo(() => {
    let mailImagesCount = 0;
    let mailImagesBytes = 0;
    let mailFilesCount = 0;
    let mailFilesBytes = 0;
    let mailTextBytes = 0;
    let trashMailCount = 0;
    let trashMailBytes = 0;

    allMessages.forEach(m => {
      const baseTextSize = new Blob([
        JSON.stringify({ ...m, attachments: undefined }),
      ]).size;
      mailTextBytes += baseTextSize;

      let msgAttachmentBytes = 0;
      (m.attachments || []).forEach(att => {
        const sz = att.sizeBytes || Math.round((att.dataUrl.length * 3) / 4);
        msgAttachmentBytes += sz;
        if (att.isImage) {
          mailImagesCount += 1;
          mailImagesBytes += sz;
        } else {
          mailFilesCount += 1;
          mailFilesBytes += sz;
        }
      });

      if ((m.deletedBy || []).length > 0) {
        trashMailCount += 1;
        trashMailBytes += baseTextSize + msgAttachmentBytes;
      }
    });

    let customAvatarCount = 0;
    let customAvatarBytes = 0;
    allStudents.forEach(s => {
      if (s.avatarUrl && s.avatarUrl.startsWith('data:image/')) {
        customAvatarCount += 1;
        customAvatarBytes += Math.round((s.avatarUrl.length * 3) / 4);
      }
    });

    const voidedRecords = (records || []).filter(r => r.trangThai === 'DaHuy');
    const voidedRecordsBytes = new Blob([JSON.stringify(voidedRecords)]).size;
    const allRecordsBytes = new Blob([JSON.stringify(records || [])]).size;
    const studentsRosterBytes = new Blob([
      JSON.stringify(allStudents.map(s => ({ ...s, avatarUrl: undefined }))),
    ]).size;

    const totalBytes =
      mailTextBytes +
      mailImagesBytes +
      mailFilesBytes +
      customAvatarBytes +
      allRecordsBytes +
      studentsRosterBytes;

    return {
      totalBytes,
      mailImagesCount,
      mailImagesBytes,
      mailFilesCount,
      mailFilesBytes,
      mailTextBytes,
      trashMailCount,
      trashMailBytes,
      allMailCount: allMessages.length,
      allMailBytes: mailTextBytes + mailImagesBytes + mailFilesBytes,
      customAvatarCount,
      customAvatarBytes,
      voidedRecordsCount: voidedRecords.length,
      voidedRecordsBytes,
    };
  }, [allMessages, allStudents, records]);

  const toggleCleanupTarget = (key: string) => {
    setSelectedCleanupTargets(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleExecuteStorageCleanup = () => {
    if (selectedCleanupTargets.length === 0) return;

    let nextMessages = [...allMessages];

    if (selectedCleanupTargets.includes('mail_all')) {
      nextMessages = [];
      setSelectedMailId(null);
    } else {
      if (selectedCleanupTargets.includes('mail_trash')) {
        nextMessages = nextMessages.filter(m => (m.deletedBy || []).length === 0);
      }
      if (selectedCleanupTargets.includes('mail_images')) {
        nextMessages = nextMessages.map(m => ({
          ...m,
          attachments: (m.attachments || []).filter(att => !att.isImage),
        }));
      }
      if (selectedCleanupTargets.includes('mail_files')) {
        nextMessages = nextMessages.map(m => ({
          ...m,
          attachments: (m.attachments || []).filter(att => att.isImage),
        }));
      }
    }

    commitMessages(nextMessages);

    if (selectedCleanupTargets.includes('voided_records') && onUpdateRecords) {
      const cleanedRecs = (records || []).filter(r => r.trangThai !== 'DaHuy');
      onUpdateRecords(cleanedRecs);
    }

    if (selectedCleanupTargets.includes('student_avatars') && onResetCustomAvatars) {
      onResetCustomAvatars();
    }

    setShowStorageModal(false);
    setSendSuccessBanner('Đã xóa dữ liệu đã chọn và giải phóng dung lượng Firebase!');
    setTimeout(() => setSendSuccessBanner(null), 4000);
  };

  return (
    <div className="bg-surface rounded-2xl border border-token shadow-xs overflow-hidden">
      {/* Notification toast inside mailbox */}
      {sendSuccessBanner && (
        <div className="px-3.5 py-2 bg-emerald-600 text-white text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{sendSuccessBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSendSuccessBanner(null)}
            className="text-emerald-100 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Thanh danh mục Hộp thư gọn gàng cho điện thoại (4 nút vừa khít, không mất chữ) */}
      <div className="p-2 bg-surface-2 border-b border-token flex items-center justify-between gap-1.5">
        <div className="grid grid-cols-4 gap-1 w-full">
          <button
            type="button"
            onClick={() => {
              setActiveFolder('inbox');
              setSelectedMailId(null);
            }}
            className={`px-1.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeFolder === 'inbox'
                ? 'bg-indigo-600 text-white font-black shadow-2xs'
                : 'bg-surface text-main hover:bg-surface-3 border border-token'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 shrink-0" />
            <span>Hộp thư đến</span>
            {unreadInboxCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                  activeFolder === 'inbox'
                    ? 'bg-white text-indigo-700'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {unreadInboxCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFolder('sent');
              setSelectedMailId(null);
            }}
            className={`px-1.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeFolder === 'sent'
                ? 'bg-indigo-600 text-white font-black shadow-2xs'
                : 'bg-surface text-main hover:bg-surface-3 border border-token'
            }`}
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span>Đã gửi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFolder('starred');
              setSelectedMailId(null);
            }}
            className={`px-1.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeFolder === 'starred'
                ? 'bg-amber-500 text-white font-black shadow-2xs'
                : 'bg-surface text-main hover:bg-surface-3 border border-token'
            }`}
          >
            <Star className="w-3.5 h-3.5 shrink-0" />
            <span>Đánh sao</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFolder('trash');
              setSelectedMailId(null);
            }}
            className={`px-1.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeFolder === 'trash'
                ? 'bg-rose-600 text-white font-black shadow-2xs'
                : 'bg-surface text-main hover:bg-surface-3 border border-token'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Thùng rác{trashCount > 0 ? ` (${trashCount})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Thanh thông báo khi đang ở trong Thùng rác */}
      {activeFolder === 'trash' && userMessages.length > 0 && !selectedMail && (
        <div className="px-3 py-2 bg-rose-50/80 border-b border-rose-200 flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-rose-800">
            Bấm biểu tượng thùng rác để xóa vĩnh viễn hoặc mũi tên để khôi phục.
          </span>
          <button
            type="button"
            onClick={handleEmptyTrash}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black shrink-0 cursor-pointer"
          >
            Dọn sạch thùng rác
          </button>
        </div>
      )}

      {/* Main Content: Either Message Detail View or Message List */}
      {selectedMail ? (
        <div className="p-3.5 sm:p-4 space-y-3.5">
          <div className="flex items-center justify-between gap-2 border-b border-token pb-2.5">
            <button
              type="button"
              onClick={() => setSelectedMailId(null)}
              className="px-2.5 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-main text-xs font-bold flex items-center gap-1 border border-token cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={e => handleToggleStar(selectedMail.id, e)}
                className={`p-1.5 rounded-lg border border-token cursor-pointer ${
                  (selectedMail.starredBy || []).includes(currentUserId)
                    ? 'bg-amber-50 text-amber-500 border-amber-300'
                    : 'bg-surface text-muted hover:text-main'
                }`}
                title="Đánh dấu sao"
              >
                <Star className="w-4 h-4 fill-current" />
              </button>

              {activeFolder === 'trash' && (
                <button
                  type="button"
                  onClick={e => handleRestoreFromTrash(selectedMail.id, e)}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Khôi phục</span>
                </button>
              )}

              <button
                type="button"
                onClick={e => handleDeleteMail(selectedMail.id, e)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{activeFolder === 'trash' ? 'Xóa vĩnh viễn' : 'Xóa'}</span>
              </button>
            </div>
          </div>

          {/* Mail Subject & Metadata */}
          <div className="space-y-2">
            <h4 className="text-sm sm:text-base font-black text-main leading-snug">
              {selectedMail.subject}
            </h4>
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-surface-2/80 border border-token text-xs">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-muted font-semibold">Từ:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                      selectedMail.senderId === 'GV'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                    }`}
                  >
                    {selectedMail.senderName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-muted font-semibold">Đến:</span>
                  <span className="font-bold text-main">{selectedMail.recipientLabel}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted font-semibold">
                <Clock className="w-3 h-3" />
                <span>{formatMailTime(selectedMail.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Mail Body */}
          <div className="p-3.5 rounded-2xl bg-surface border border-token text-xs sm:text-sm text-main whitespace-pre-wrap leading-relaxed min-h-[90px] shadow-2xs">
            {selectedMail.body}
          </div>

          {/* Attachments Display (Images & Files stored on Firebase) */}
          {Array.isArray(selectedMail.attachments) && selectedMail.attachments.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-black text-muted uppercase flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tệp &amp; Hình ảnh đính kèm ({selectedMail.attachments.length}):</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {selectedMail.attachments.map(att =>
                  att.isImage ? (
                    <div
                      key={att.id}
                      className="rounded-xl border border-token bg-surface-2 overflow-hidden flex flex-col"
                    >
                      <img
                        src={att.dataUrl}
                        alt={att.name}
                        className="w-full max-h-60 object-contain bg-slate-900/5"
                      />
                      <div className="px-3 py-1.5 flex items-center justify-between gap-2 border-t border-token text-[11px]">
                        <span className="font-bold text-main truncate">
                          {att.name} ({formatBytes(att.sizeBytes)})
                        </span>
                        <a
                          href={att.dataUrl}
                          download={att.name}
                          className="px-2 py-0.5 rounded bg-indigo-600 text-white font-bold flex items-center gap-1 shrink-0"
                        >
                          <Download className="w-3 h-3" />
                          <span>Tải</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={att.id}
                      className="p-2.5 rounded-xl border border-token bg-surface-2 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-main truncate">
                            {att.name}
                          </div>
                          <div className="text-[10px] text-muted">
                            {formatBytes(att.sizeBytes)}
                          </div>
                        </div>
                      </div>
                      <a
                        href={att.dataUrl}
                        download={att.name}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3 h-3" />
                        <span>Tải về</span>
                      </a>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Quick Reply Box */}
          {activeFolder !== 'trash' && (
            <form
              onSubmit={handleQuickReply}
              className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950 truncate">
                  <Reply className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="truncate">
                    Trả lời{' '}
                    {selectedMail.senderId === currentUserId
                      ? selectedMail.recipientLabel
                      : selectedMail.senderName}
                  </span>
                </div>

                {/* Nút chèn ảnh / file khi trả lời */}
                <button
                  type="button"
                  onClick={() => replyFileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Paperclip className="w-3 h-3" />
                  <span>Đính kèm ảnh/file (≤5MB)</span>
                </button>
                <input
                  ref={replyFileInputRef}
                  type="file"
                  multiple
                  onChange={e => {
                    handleFilesSelected(e.target.files, 'reply');
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </div>

              {attachmentError && (
                <div className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200">
                  ⚠️ {attachmentError}
                </div>
              )}

              {replyAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {replyAttachments.map(att => (
                    <div
                      key={att.id}
                      className="px-2 py-1 rounded-lg bg-white border border-indigo-200 text-[11px] flex items-center gap-1.5"
                    >
                      {att.isImage ? (
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                        {att.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ({formatBytes(att.sizeBytes)})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setReplyAttachments(prev => prev.filter(x => x.id !== att.id))
                        }
                        className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea
                rows={2}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Nhập nội dung phản hồi..."
                className="w-full p-2.5 rounded-xl bg-white border border-indigo-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!replyText.trim() && replyAttachments.length === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi phản hồi</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Mail List View */
        <div className="divide-y divide-token max-h-[380px] overflow-y-auto">
          {userMessages.length === 0 ? (
            <div className="py-10 px-4 text-center space-y-1.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-main">
                {activeFolder === 'inbox'
                  ? 'Chưa có thư nào trong Hộp thư đến'
                  : activeFolder === 'sent'
                  ? 'Chưa có thư đã gửi'
                  : activeFolder === 'starred'
                  ? 'Chưa có thư đánh dấu sao'
                  : 'Thùng rác trống'}
              </p>
            </div>
          ) : (
            userMessages.map(mail => {
              const isUnread =
                mail.senderId !== currentUserId &&
                !(mail.readBy || []).includes(currentUserId);
              const isStarred = (mail.starredBy || []).includes(currentUserId);
              const isFromTeacher = mail.senderId === 'GV';
              const attCount = (mail.attachments || []).length;

              return (
                <div
                  key={mail.id}
                  onClick={() => handleSelectMail(mail)}
                  className={`px-3 py-2.5 flex items-center justify-between gap-2 transition-all cursor-pointer hover:bg-indigo-50/40 ${
                    isUnread ? 'bg-indigo-50/25' : 'bg-surface'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {/* Star button */}
                    <button
                      type="button"
                      onClick={e => handleToggleStar(mail.id, e)}
                      className={`shrink-0 cursor-pointer ${
                        isStarred
                          ? 'text-amber-500'
                          : 'text-slate-300 hover:text-amber-400'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-current' : ''}`} />
                    </button>

                    {/* Unread dot */}
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs truncate ${
                            isUnread ? 'font-black text-slate-950' : 'font-bold text-slate-700'
                          }`}
                        >
                          {activeFolder === 'sent'
                            ? `Đến: ${mail.recipientLabel}`
                            : mail.senderName}
                        </span>
                        {isFromTeacher && activeFolder !== 'sent' && (
                          <span className="px-1.5 py-0.2 rounded bg-indigo-600 text-white text-[9px] font-black uppercase shrink-0">
                            GVCN
                          </span>
                        )}
                        {attCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center gap-0.5 shrink-0">
                            <Paperclip className="w-2.5 h-2.5" />
                            {attCount}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] truncate mt-0.5">
                        <span
                          className={
                            isUnread ? 'font-black text-indigo-950' : 'font-semibold text-main'
                          }
                        >
                          {mail.subject}
                        </span>
                        <span className="text-muted"> — {mail.body.replace(/\n+/g, ' ')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Time & Restore/Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-semibold text-muted whitespace-nowrap">
                      {formatMailTime(mail.createdAt)}
                    </span>
                    {activeFolder === 'trash' && (
                      <button
                        type="button"
                        onClick={e => handleRestoreFromTrash(mail.id, e)}
                        className="p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                        title="Khôi phục về hộp thư"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={e => handleDeleteMail(mail.id, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      title={activeFolder === 'trash' ? 'Xóa vĩnh viễn' : 'Chuyển vào thùng rác'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Thanh công cụ phía dưới: Nút Soạn thư mới (đưa xuống dưới theo yêu cầu) + Quản lý dung lượng Firebase cho GV */}
      <div className="p-2.5 bg-surface-2 border-t border-token flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => openComposeModal()}
          className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Soạn Thư Mới</span>
        </button>

        {currentUserId === 'GV' && (
          <button
            type="button"
            onClick={() => setShowStorageModal(true)}
            className="px-3 py-2 rounded-xl bg-surface hover:bg-amber-50 text-slate-800 border border-token text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              Dung lượng Firebase: <b>{formatBytes(storageStats.totalBytes)}</b> (Quản lý / Xóa)
            </span>
          </button>
        )}
      </div>

      {/* MODAL SOẠN THƯ MỚI (HỖ TRỢ ĐÍNH KÈM ẢNH / FILE LƯU FIREBASE ≤ 5MB) */}
      {isComposing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface rounded-2xl border border-token shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-2.5 bg-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-300" />
                <span className="text-xs sm:text-sm font-black">Soạn Thư Mới</span>
              </div>
              <button
                type="button"
                onClick={() => setIsComposing(false)}
                className="p-1 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendMail} className="p-3.5 sm:p-4 space-y-3 overflow-y-auto flex-1">
              {/* Recipient Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-main block">
                  1. Gửi đến:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {currentUserId !== 'GV' && (
                    <button
                      type="button"
                      onClick={() => setRecipientType('GV')}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                        recipientType === 'GV'
                          ? 'bg-indigo-600 text-white border-indigo-600 font-black'
                          : 'bg-surface-2 text-main border-token hover:bg-surface-3'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Giáo viên</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setRecipientType('STUDENT')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      recipientType === 'STUDENT'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-black'
                        : 'bg-surface-2 text-main border-token hover:bg-surface-3'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Học sinh</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('GROUP')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      recipientType === 'GROUP'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-black'
                        : 'bg-surface-2 text-main border-token hover:bg-surface-3'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Theo Tổ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('CADRES')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      recipientType === 'CADRES'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-black'
                        : 'bg-surface-2 text-main border-token hover:bg-surface-3'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Ban cán sự</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('ALL_STUDENTS')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                      recipientType === 'ALL_STUDENTS'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-black'
                        : 'bg-surface-2 text-main border-token hover:bg-surface-3'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Cả lớp</span>
                  </button>
                </div>
              </div>

              {/* Group Picker */}
              {recipientType === 'GROUP' && (
                <div className="p-2 rounded-xl bg-surface-2 border border-token flex items-center gap-2">
                  <span className="text-xs font-bold text-main">Chọn Tổ:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGroupNum(g)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black cursor-pointer ${
                          selectedGroupNum === g
                            ? 'bg-indigo-600 text-white'
                            : 'bg-surface text-main border border-token'
                        }`}
                      >
                        Tổ {g}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Student Multi-Picker */}
              {recipientType === 'STUDENT' && (
                <div className="p-2.5 rounded-xl bg-surface-2 border border-token space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-main">
                      Chọn học sinh ({selectedStudentIds.length} đã chọn):
                    </span>
                    {selectedStudentIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedStudentIds([])}
                        className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={studentSearchTerm}
                    onChange={e => setStudentSearchTerm(e.target.value)}
                    placeholder="Lọc nhanh tên học sinh..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-token text-xs text-main focus:outline-none focus:border-indigo-500"
                  />
                  <div className="max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1 pr-1">
                    {filteredStudentsForPicker.map(st => {
                      const isChecked = selectedStudentIds.includes(st.maHS);
                      return (
                        <button
                          key={st.maHS}
                          type="button"
                          onClick={() => {
                            setSelectedStudentIds(prev =>
                              prev.includes(st.maHS)
                                ? prev.filter(id => id !== st.maHS)
                                : [...prev, st.maHS]
                            );
                          }}
                          className={`px-2 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-1 border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-black'
                              : 'bg-surface border-token text-main hover:bg-surface-3'
                          }`}
                        >
                          <span className="truncate">
                            {st.hoTen} <span className="text-[10px] text-muted">(T{st.to})</span>
                          </span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subject Input & Quick Chips */}
              <div className="space-y-1">
                <label className="text-xs font-black text-main block">
                  2. Tiêu đề:
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Nhập tiêu đề thư..."
                  className="w-full px-3 py-1.5 rounded-xl bg-surface border border-token text-xs text-main font-semibold focus:outline-none focus:border-indigo-500"
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {QUICK_SUBJECT_SUGGESTIONS.map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setComposeSubject(sug)}
                      className="px-2 py-0.5 rounded-md bg-surface-2 hover:bg-indigo-50 text-[10px] font-semibold text-muted hover:text-indigo-700 border border-token cursor-pointer"
                    >
                      + {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Textarea */}
              <div className="space-y-1">
                <label className="text-xs font-black text-main block">
                  3. Nội dung thư:
                </label>
                <textarea
                  rows={4}
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Nhập nội dung thư..."
                  className="w-full p-2.5 rounded-xl bg-surface border border-token text-xs text-main focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Chèn hình ảnh hoặc file đính kèm (Lưu trên Firebase, giới hạn 5MB) */}
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-black text-main">
                    4. Đính kèm ảnh / file (Lưu Firebase, tối đa 5MB):
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => composeImageInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Chèn ảnh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => composeFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Đính kèm file</span>
                    </button>
                  </div>
                </div>

                <input
                  ref={composeImageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={e => {
                    handleFilesSelected(e.target.files, 'compose');
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <input
                  ref={composeFileInputRef}
                  type="file"
                  multiple
                  onChange={e => {
                    handleFilesSelected(e.target.files, 'compose');
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {attachmentError && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold">
                    ⚠️ {attachmentError}
                  </div>
                )}

                {composeAttachments.length > 0 && (
                  <div className="space-y-1.5 bg-surface-2 p-2.5 rounded-xl border border-token">
                    <div className="text-[11px] font-bold text-muted flex items-center justify-between">
                      <span>Đã chọn {composeAttachments.length} tệp:</span>
                      <span>
                        Tổng:{' '}
                        {formatBytes(
                          composeAttachments.reduce((s, a) => s + a.sizeBytes, 0)
                        )}{' '}
                        / 5 MB
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {composeAttachments.map(att => (
                        <div
                          key={att.id}
                          className="p-1.5 rounded-lg bg-surface border border-token flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {att.isImage ? (
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="w-8 h-8 rounded object-cover border border-token shrink-0"
                              />
                            ) : (
                              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <div className="font-bold text-main truncate text-[11px]">
                                {att.name}
                              </div>
                              <div className="text-[10px] text-muted">
                                {formatBytes(att.sizeBytes)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setComposeAttachments(prev =>
                                prev.filter(x => x.id !== att.id)
                              )
                            }
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit / Cancel */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-token">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-main text-xs font-bold border border-token cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    (!composeBody.trim() && composeAttachments.length === 0) ||
                    (recipientType === 'STUDENT' && selectedStudentIds.length === 0)
                  }
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Thư</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ DUNG LƯỢNG FIREBASE & CHỌN MỤC XÓA DỮ LIỆU (DÀNH CHO GIÁO VIÊN) */}
      {showStorageModal && currentUserId === 'GV' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface rounded-2xl border border-token shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-black uppercase">
                  Quản Lý Dung Lượng Lưu Trữ Firebase
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowStorageModal(false)}
                className="p-1 rounded-lg bg-white/15 hover:bg-white/25 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* Tổng dung lượng */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950">
                    Tổng dung lượng dữ liệu lớp trên Firebase:
                  </span>
                  <span className="text-sm font-black text-amber-900">
                    {formatBytes(storageStats.totalBytes)}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-amber-200/70 overflow-hidden">
                  <div
                    className="h-full bg-amber-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(4, (storageStats.totalBytes / (20 * 1024 * 1024)) * 100)
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] text-amber-800">
                  Tích chọn các mục bên dưới để xóa và giải phóng dung lượng trên Firebase:
                </div>
              </div>

              {/* Danh sách các mục có thể chọn để xóa */}
              <div className="space-y-2">
                {/* 1. Ảnh trong hộp thư */}
                <label className="p-2.5 rounded-xl border border-token bg-surface-2 hover:bg-surface-3 flex items-center justify-between gap-2 cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedCleanupTargets.includes('mail_images')}
                      onChange={() => toggleCleanupTarget('mail_images')}
                      className="w-4 h-4 accent-rose-600 rounded shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-main">
                        Ảnh đính kèm trong Hộp thư ({storageStats.mailImagesCount} ảnh)
                      </div>
                      <div className="text-[10px] text-muted">
                        Chỉ xóa hình ảnh đính kèm, giữ nguyên nội dung chữ của thư
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-600 shrink-0">
                    {formatBytes(storageStats.mailImagesBytes)}
                  </span>
                </label>

                {/* 2. File đính kèm trong hộp thư */}
                <label className="p-2.5 rounded-xl border border-token bg-surface-2 hover:bg-surface-3 flex items-center justify-between gap-2 cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedCleanupTargets.includes('mail_files')}
                      onChange={() => toggleCleanupTarget('mail_files')}
                      className="w-4 h-4 accent-rose-600 rounded shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-main">
                        Tệp (File) đính kèm trong Hộp thư ({storageStats.mailFilesCount} file)
                      </div>
                      <div className="text-[10px] text-muted">
                        Xóa các tệp tài liệu đính kèm trong hộp thư
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-600 shrink-0">
                    {formatBytes(storageStats.mailFilesBytes)}
                  </span>
                </label>

                {/* 3. Thư trong thùng rác */}
                <label className="p-2.5 rounded-xl border border-token bg-surface-2 hover:bg-surface-3 flex items-center justify-between gap-2 cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedCleanupTargets.includes('mail_trash')}
                      onChange={() => toggleCleanupTarget('mail_trash')}
                      className="w-4 h-4 accent-rose-600 rounded shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-main">
                        Thư đã xóa trong Thùng rác ({storageStats.trashMailCount} thư)
                      </div>
                      <div className="text-[10px] text-muted">
                        Xóa vĩnh viễn toàn bộ thư đang nằm trong thùng rác
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-600 shrink-0">
                    {formatBytes(storageStats.trashMailBytes)}
                  </span>
                </label>

                {/* 4. Toàn bộ hộp thư */}
                <label className="p-2.5 rounded-xl border border-token bg-surface-2 hover:bg-surface-3 flex items-center justify-between gap-2 cursor-pointer">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedCleanupTargets.includes('mail_all')}
                      onChange={() => toggleCleanupTarget('mail_all')}
                      className="w-4 h-4 accent-rose-600 rounded shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-main">
                        Toàn bộ thư trong Hộp thư ({storageStats.allMailCount} thư)
                      </div>
                      <div className="text-[10px] text-muted">
                        Làm trống hoàn toàn hộp thư của lớp (cả chữ và tệp)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-rose-600 shrink-0">
                    {formatBytes(storageStats.allMailBytes)}
                  </span>
                </label>

                {/* 5. Ảnh Avatar tải lên của học sinh */}
                {onResetCustomAvatars && (
                  <label className="p-2.5 rounded-xl border border-token bg-surface-2 hover:bg-surface-3 flex items-center justify-between gap-2 cursor-pointer">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedCleanupTargets.includes('student_avatars')}
                        onChange={() => toggleCleanupTarget('student_avatars')}
                        className="w-4 h-4 accent-rose-600 rounded shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-main">
                          Ảnh đại diện tải lên ({storageStats.customAvatarCount} HS)
                        </div>
                        <div className="text-[10px] text-muted">
                          Đặt lại ảnh tải lên nặng về biểu tượng mặc định nhẹ
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-600 shrink-0">
                      {formatBytes(storageStats.customAvatarBytes)}
                    </span>
                  </label>
                )}

                {/* 6. Bản ghi vi phạm đã hủy */}
                {onUpdateRecords && (
                  <label className="p-2.5 rounded-xl border border-token bg-surface-2 hover:bg-surface-3 flex items-center justify-between gap-2 cursor-pointer">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedCleanupTargets.includes('voided_records')}
                        onChange={() => toggleCleanupTarget('voided_records')}
                        className="w-4 h-4 accent-rose-600 rounded shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-black text-main">
                          Bản ghi vi phạm đã hủy ({storageStats.voidedRecordsCount} mục)
                        </div>
                        <div className="text-[10px] text-muted">
                          Dọn các lượt ghi đã hủy không còn tính điểm
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-600 shrink-0">
                      {formatBytes(storageStats.voidedRecordsBytes)}
                    </span>
                  </label>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-token">
                <button
                  type="button"
                  onClick={() => setShowStorageModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-main text-xs font-bold border border-token cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={selectedCleanupTargets.length === 0}
                  onClick={handleExecuteStorageCleanup}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa mục đã chọn ({selectedCleanupTargets.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
