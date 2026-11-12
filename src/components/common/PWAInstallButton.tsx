import React, { useState } from 'react';
import { Download, Share, PlusSquare, Smartphone, X, CheckCircle2, MoreVertical } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import logo10A5Img from '../../assets/logo_10a5_3d.png';

interface PWAInstallButtonProps {
  variant?: 'banner' | 'header';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'banner' }) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'ios' | 'android'>(isIOS ? 'ios' : 'android');

  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await promptInstall();
      if (!accepted) {
        setActiveDeviceTab('android');
        setShowGuideModal(true);
      }
      return;
    }
    setActiveDeviceTab(isIOS ? 'ios' : 'android');
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={
          variant === 'banner'
            ? 'px-2 sm:px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 border border-white text-slate-950 text-[10.5px] sm:text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer shadow-sm active:scale-95 shrink-0'
            : 'px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0'
        }
        title="Tạo ứng dụng 10A5 ngoài màn hình chính điện thoại (iPhone / Android)"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Tải App 10A5</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="bg-surface border border-token rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with 10A5 App Icon preview */}
            <div className="p-4 bg-gradient-to-r from-indigo-950 via-indigo-900 to-purple-950 text-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-lg bg-slate-900 shrink-0">
                  <img
                    src={logo10A5Img}
                    alt="10A5"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-base tracking-tight text-white">10A5</span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                      PWA App
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100/90 font-medium truncate">
                    Cài đặt ứng dụng 10A5 ra màn hình chính
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Device Switcher Tabs */}
            <div className="p-3 pb-0">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface-2 rounded-2xl border border-token">
                <button
                  type="button"
                  onClick={() => setActiveDeviceTab('ios')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeDeviceTab === 'ios'
                      ? 'bg-surface text-accent shadow-xs ring-1 ring-accent'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Máy iPhone (iOS)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDeviceTab('android')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    activeDeviceTab === 'android'
                      ? 'bg-surface text-accent shadow-xs ring-1 ring-accent'
                      : 'text-muted hover:text-main'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Máy Android</span>
                </button>
              </div>
            </div>

            {/* Instructions Content */}
            <div className="p-4 space-y-3 text-xs text-main">
              {activeDeviceTab === 'ios' ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-surface-2 border border-token flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-main">Mở bằng trình duyệt Safari trên iPhone</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        Nhấn vào biểu tượng <span className="inline-flex items-center gap-0.5 font-extrabold text-indigo-600"><Share className="w-3.5 h-3.5 inline" /> Chia sẻ</span> ở thanh công cụ phía dưới màn hình.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-2 border border-token flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-main">Chọn "Thêm vào MH chính"</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        Kéo xuống và chọn <span className="inline-flex items-center gap-0.5 font-extrabold text-indigo-600"><PlusSquare className="w-3.5 h-3.5 inline" /> Thêm vào MH chính</span> (Add to Home Screen).
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-[11px] font-bold text-emerald-900">
                      Nhấn <span className="underline">Thêm</span> ở góc phải trên cùng — biểu tượng logo <span className="font-black">10A5</span> với tên <span className="font-black">10A5</span> sẽ xuất hiện ngay trên màn hình iPhone!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {isInstallable && (
                    <button
                      type="button"
                      onClick={() => {
                        promptInstall();
                        setShowGuideModal(false);
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Cài đặt tự động App 10A5 ngay</span>
                    </button>
                  )}

                  <div className="p-3 rounded-2xl bg-surface-2 border border-token flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div>
                      <p className="font-bold text-main">Mở bằng trình duyệt Chrome trên Android</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        Nhấn vào biểu tượng menu <span className="inline-flex items-center gap-0.5 font-extrabold text-indigo-600"><MoreVertical className="w-3.5 h-3.5 inline" /> 3 chấm</span> ở góc trên bên phải trình duyệt.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-surface-2 border border-token flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-main">Chọn "Cài đặt ứng dụng" hoặc "Thêm vào Màn hình chính"</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        Xác nhận <span className="font-extrabold text-indigo-600">Cài đặt</span> để tạo app <span className="font-black">10A5</span>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-[11px] font-bold text-emerald-900">
                      Ứng dụng <span className="font-black">10A5</span> với logo của lớp sẽ xuất hiện ngoài màn hình chính điện thoại Android!
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 rounded-2xl bg-surface-2 hover:bg-slate-200 border border-token font-extrabold text-xs text-main transition-colors cursor-pointer"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
