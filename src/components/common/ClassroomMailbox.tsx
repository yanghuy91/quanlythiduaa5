import React, { useState, useMemo, useEffect } from 'react';
import {
  Mail,
  Send,
  Inbox,
  Star,
  Trash2,
  Plus,
  Search,
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
} from 'lucide-react';
import {
  MailMessage,
  MailRecipientType,
  RoleCode,
  Student,
} from '../../types';
import {
  getMailMessages,
  saveMailMessages,
  isMessageForUser,
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
}

type MailFolder = 'inbox' | 'sent' | 'starred' | 'trash';

const QUICK_SUBJECT_SUGGESTIONS = [
  'Báo cáo nề nếp / thi đua',
  'Xin phép nghỉ học / đi muộn',
  'Góp ý xây dựng lớp 10A5',
  'Phản ánh / Giải trình vi phạm',
  'Trao đổi công việc Tổ / Lớp',
  'Khen ngợi / Động viên',
];

export const ClassroomMailbox: React.FC<ClassroomMailboxProps> = ({
  currentUserId,
  currentUserName,
  currentUserRole,
  currentStudent,
  allStudents,
  teacherName = 'Thầy Dương Văn Huy (GVCN)',
  messages: externalMessages,
  onUpdateMessages,
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
  const [searchQuery, setSearchQuery] = useState('');

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
  const [replyText, setReplyText] = useState('');
  const [sendSuccessBanner, setSendSuccessBanner] = useState<string | null>(null);

  // Filter messages for current user and folder
  const userMessages = useMemo(() => {
    return allMessages
      .filter(msg => {
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
        // inbox: received messages (or self-sent broadcast)
        return isRecipient && (!isSender || msg.recipientIds.includes(currentUserId));
      })
      .filter(msg => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          msg.subject.toLowerCase().includes(q) ||
          msg.body.toLowerCase().includes(q) ||
          msg.senderName.toLowerCase().includes(q) ||
          msg.recipientLabel.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [allMessages, currentUserId, currentStudent, activeFolder, searchQuery]);

  const unreadInboxCount = useMemo(() => {
    return allMessages.filter(msg => {
      if ((msg.deletedBy || []).includes(currentUserId)) return false;
      if (msg.senderId === currentUserId) return false;
      if (!isMessageForUser(msg, currentUserId, currentStudent)) return false;
      return !(msg.readBy || []).includes(currentUserId);
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

  const handleDeleteOrRestore = (mailId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const target = allMessages.find(m => m.id === mailId);
    if (!target) return;

    const isAlreadyInTrash = (target.deletedBy || []).includes(currentUserId);
    if (isAlreadyInTrash && activeFolder === 'trash') {
      // Restore from trash
      const updated = allMessages.map(m =>
        m.id === mailId
          ? { ...m, deletedBy: (m.deletedBy || []).filter(id => id !== currentUserId) }
          : m
      );
      commitMessages(updated);
    } else {
      // Move to trash
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

  const openComposeModal = (presetRecipientType?: MailRecipientType, presetStudentId?: string, presetSubject?: string) => {
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
    setStudentSearchTerm('');
    setIsComposing(true);
  };

  const handleSendMail = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBody = composeBody.trim();
    if (!trimmedBody) return;

    let finalRecipientIds: string[] = [];
    let finalRecipientLabel = '';

    if (recipientType === 'GV') {
      finalRecipientIds = ['GV'];
      finalRecipientLabel = `${teacherName} (GVCN)`;
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
          ? `${teacherName} (GVCN)`
          : `${currentUserName}${currentStudent ? ` (Tổ ${currentStudent.to})` : ''}`,
      senderRole: currentUserRole,
      senderGroup: currentStudent?.to,
      recipientType,
      recipientIds: finalRecipientIds,
      recipientLabel: finalRecipientLabel,
      subject: composeSubject.trim() || 'Thư trao đổi lớp 10A5',
      body: trimmedBody,
      createdAt: new Date().toISOString(),
      readBy: [currentUserId],
      starredBy: [],
      deletedBy: [],
    };

    commitMessages([newMsg, ...allMessages]);
    setIsComposing(false);
    setComposeSubject('');
    setComposeBody('');
    setSendSuccessBanner(`Đã gửi thư tới "${finalRecipientLabel}" thành công!`);
    setTimeout(() => setSendSuccessBanner(null), 4000);
  };

  const handleQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMail || !replyText.trim()) return;

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
          ? `${teacherName} (GVCN)`
          : `${currentUserName}${currentStudent ? ` (Tổ ${currentStudent.to})` : ''}`,
      senderRole: currentUserRole,
      senderGroup: currentStudent?.to,
      recipientType: replyRecipientType,
      recipientIds: replyRecipientIds,
      recipientLabel: replyRecipientLabel,
      subject: baseSubj,
      body: replyText.trim(),
      createdAt: new Date().toISOString(),
      readBy: [currentUserId],
      starredBy: [],
      deletedBy: [],
      replyToId: selectedMail.id,
    };

    commitMessages([replyMsg, ...allMessages]);
    setReplyText('');
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
      if (isToday) return `Hôm nay, ${timePart}`;
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

  return (
    <div className="bg-surface rounded-2xl border border-token shadow-sm overflow-hidden">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 py-3.5 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-tight uppercase">
                Hộp Thư Lớp 10A5
              </h3>
              {unreadInboxCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-2xs">
                  {unreadInboxCount} thư mới
                </span>
              )}
            </div>
            <p className="text-[11px] text-indigo-100">
              Gửi và nhận thư trực tiếp giữa Học sinh, Ban cán sự và Giáo viên chủ nhiệm
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openComposeModal()}
          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Soạn Thư Mới</span>
        </button>
      </div>

      {/* Notification toast inside mailbox */}
      {sendSuccessBanner && (
        <div className="px-4 py-2.5 bg-emerald-600 text-white text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
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

      {/* Folder Tabs & Search Bar */}
      <div className="p-3 bg-surface-2 border-b border-token flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="grid grid-cols-4 sm:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveFolder('inbox');
              setSelectedMailId(null);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeFolder === 'inbox'
                ? 'bg-indigo-600 text-white font-black shadow-2xs'
                : 'bg-surface text-main hover:bg-surface-3 border border-token'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Hộp thư đến</span>
            {unreadInboxCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
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
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeFolder === 'sent'
                ? 'bg-indigo-600 text-white font-black shadow-2xs'
                : 'bg-surface text-main hover:bg-surface-3 border border-token'
            }`}
          >
            <Send className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Đã gửi</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFolder('starred');
              setSelectedMailId(null);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeFolder === 'starred'
                ? 'bg-amber-500 text-white font-black shadow-2xs'
                : 'bg-surface text-main hover:bg-surface-3 border border-token'
            }`}
          >
            <Star className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Quan trọng</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveFolder('trash');
              setSelectedMailId(null);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeFolder === 'trash'
                ? 'bg-rose-600 text-white font-black shadow-2xs'
                : 'bg-surface text-main hover:bg-surface-3 border border-token'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Thùng rác</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, tiêu đề, nội dung..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-surface border border-token text-xs text-main focus:outline-none focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-main text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Either Message Detail View or Message List */}
      {selectedMail ? (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-token pb-3">
            <button
              type="button"
              onClick={() => setSelectedMailId(null)}
              className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-main text-xs font-bold flex items-center gap-1.5 border border-token cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại danh sách thư</span>
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
                title="Đánh dấu quan trọng"
              >
                <Star className="w-4 h-4 fill-current" />
              </button>
              <button
                type="button"
                onClick={e => handleDeleteOrRestore(selectedMail.id, e)}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{activeFolder === 'trash' ? 'Khôi phục' : 'Xóa'}</span>
              </button>
            </div>
          </div>

          {/* Mail Subject & Metadata */}
          <div className="space-y-2">
            <h4 className="text-base sm:text-lg font-black text-main leading-snug">
              {selectedMail.subject}
            </h4>
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface-2/80 border border-token text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-muted font-semibold">Từ:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md ${
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
                <Clock className="w-3.5 h-3.5" />
                <span>{formatMailTime(selectedMail.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Mail Body */}
          <div className="p-4 rounded-2xl bg-surface border border-token text-sm text-main whitespace-pre-wrap leading-relaxed min-h-[120px] shadow-2xs">
            {selectedMail.body}
          </div>

          {/* Quick Reply Box */}
          {activeFolder !== 'trash' && (
            <form
              onSubmit={handleQuickReply}
              className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-black text-indigo-950">
                <Reply className="w-4 h-4 text-indigo-600" />
                <span>
                  Trả lời nhanh cho{' '}
                  {selectedMail.senderId === currentUserId
                    ? selectedMail.recipientLabel
                    : selectedMail.senderName}
                  :
                </span>
              </div>
              <textarea
                rows={3}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Nhập nội dung phản hồi tại đây..."
                className="w-full p-2.5 rounded-xl bg-white border border-indigo-200 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Phản Hồi</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Mail List View */
        <div className="divide-y divide-token max-h-[480px] overflow-y-auto">
          {userMessages.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <p className="text-xs sm:text-sm font-bold text-main">
                {activeFolder === 'inbox'
                  ? 'Hộp thư đến hiện đang trống'
                  : activeFolder === 'sent'
                  ? 'Chưa có thư nào đã gửi'
                  : activeFolder === 'starred'
                  ? 'Chưa có thư nào được đánh dấu quan trọng'
                  : 'Thùng rác trống'}
              </p>
              <p className="text-[11px] text-muted">
                Nhấn nút &quot;Soạn Thư Mới&quot; ở góc trên để gửi thư cho{' '}
                {currentUserId === 'GV' ? 'học sinh hoặc cả lớp' : 'Giáo viên chủ nhiệm hoặc các bạn trong lớp'}.
              </p>
            </div>
          ) : (
            userMessages.map(mail => {
              const isUnread =
                mail.senderId !== currentUserId &&
                !(mail.readBy || []).includes(currentUserId);
              const isStarred = (mail.starredBy || []).includes(currentUserId);
              const isFromTeacher = mail.senderId === 'GV';

              return (
                <div
                  key={mail.id}
                  onClick={() => handleSelectMail(mail)}
                  className={`px-3.5 py-3 flex items-start sm:items-center justify-between gap-3 transition-all cursor-pointer hover:bg-indigo-50/40 ${
                    isUnread ? 'bg-indigo-50/25' : 'bg-surface'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                    {/* Star button */}
                    <button
                      type="button"
                      onClick={e => handleToggleStar(mail.id, e)}
                      className={`mt-0.5 sm:mt-0 shrink-0 cursor-pointer ${
                        isStarred
                          ? 'text-amber-500'
                          : 'text-slate-300 hover:text-amber-400'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
                    </button>

                    {/* Unread indicator dot */}
                    <div className="w-2 shrink-0 flex items-center justify-center mt-1.5 sm:mt-0">
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 block" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
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
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mt-0.5">
                        <span
                          className={`text-xs truncate ${
                            isUnread ? 'font-black text-indigo-950' : 'font-semibold text-main'
                          }`}
                        >
                          {mail.subject}
                        </span>
                        <span className="hidden sm:inline text-muted text-xs">-</span>
                        <span className="text-[11px] text-muted truncate">
                          {mail.body.replace(/\n+/g, ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Time & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] sm:text-[11px] font-semibold text-muted whitespace-nowrap">
                      {formatMailTime(mail.createdAt)}
                    </span>
                    <button
                      type="button"
                      onClick={e => handleDeleteOrRestore(mail.id, e)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      title={activeFolder === 'trash' ? 'Khôi phục' : 'Xóa thư'}
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

      {/* COMPOSE NEW MAIL MODAL */}
      {isComposing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-surface rounded-2xl border border-token shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-300" />
                <span className="text-sm font-black">Soạn Thư Mới — Lớp 10A5</span>
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
            <form onSubmit={handleSendMail} className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* Recipient Type Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-main block">
                  1. Chọn người nhận (Gửi đến):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {currentUserId !== 'GV' && (
                    <button
                      type="button"
                      onClick={() => setRecipientType('GV')}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                        recipientType === 'GV'
                          ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-2xs'
                          : 'bg-surface-2 text-main border-token hover:bg-surface-3'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Giáo viên (GVCN)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setRecipientType('STUDENT')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      recipientType === 'STUDENT'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-2xs'
                        : 'bg-surface-2 text-main border-token hover:bg-surface-3'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Học sinh trong lớp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('GROUP')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      recipientType === 'GROUP'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-2xs'
                        : 'bg-surface-2 text-main border-token hover:bg-surface-3'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Theo Tổ (1–4)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('CADRES')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      recipientType === 'CADRES'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-2xs'
                        : 'bg-surface-2 text-main border-token hover:bg-surface-3'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Ban cán sự</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecipientType('ALL_STUDENTS')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      recipientType === 'ALL_STUDENTS'
                        ? 'bg-indigo-600 text-white border-indigo-600 font-black shadow-2xs'
                        : 'bg-surface-2 text-main border-token hover:bg-surface-3'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Cả lớp 10A5</span>
                  </button>
                </div>
              </div>

              {/* Group Picker if recipientType === 'GROUP' */}
              {recipientType === 'GROUP' && (
                <div className="p-2.5 rounded-xl bg-surface-2 border border-token flex items-center gap-2">
                  <span className="text-xs font-bold text-main">Chọn Tổ nhận thư:</span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setSelectedGroupNum(g)}
                        className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
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

              {/* Student Multi-Picker if recipientType === 'STUDENT' */}
              {recipientType === 'STUDENT' && (
                <div className="p-2.5 rounded-xl bg-surface-2 border border-token space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-main">
                      Chọn học sinh nhận thư ({selectedStudentIds.length} đã chọn):
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
                    placeholder="Gõ tên học sinh hoặc tổ để lọc nhanh..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-surface border border-token text-xs text-main focus:outline-none focus:border-indigo-500"
                  />
                  <div className="max-h-36 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1 pr-1">
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
                          className={`px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between gap-1.5 border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-black'
                              : 'bg-surface border-token text-main hover:bg-surface-3'
                          }`}
                        >
                          <span className="truncate">
                            {st.hoTen} <span className="text-[10px] text-muted">(Tổ {st.to})</span>
                          </span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Subject Input & Quick Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-main block">
                  2. Tiêu đề thư:
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={e => setComposeSubject(e.target.value)}
                  placeholder="Nhập tiêu đề thư (hoặc bấm gợi ý bên dưới)..."
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-token text-xs sm:text-sm text-main font-semibold focus:outline-none focus:border-indigo-500"
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
              <div className="space-y-1.5">
                <label className="text-xs font-black text-main block">
                  3. Nội dung thư:
                </label>
                <textarea
                  rows={5}
                  required
                  value={composeBody}
                  onChange={e => setComposeBody(e.target.value)}
                  placeholder="Nhập nội dung thư cần gửi..."
                  className="w-full p-3 rounded-xl bg-surface border border-token text-xs sm:text-sm text-main focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Submit / Cancel */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-token">
                <button
                  type="button"
                  onClick={() => setIsComposing(false)}
                  className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-main text-xs font-bold border border-token cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    !composeBody.trim() ||
                    (recipientType === 'STUDENT' && selectedStudentIds.length === 0)
                  }
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Thư Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
