import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lỗi ứng dụng:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.removeItem('app_auth_session');
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
            Hệ thống Quản lý Thi đua Lớp 10A5
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '420px', marginBottom: '20px', lineHeight: '1.5' }}>
            Đã phát hiện sự cố tải phiên làm việc. Nhấn nút bên dưới để khôi phục và tiếp tục:
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)'
              }}
            >
              🔄 Tải lại trang
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 22px',
                borderRadius: '12px',
                backgroundColor: '#334155',
                color: '#f8fafc',
                fontWeight: 'bold',
                fontSize: '13px',
                border: '1px solid #475569',
                cursor: 'pointer'
              }}
            >
              🚪 Đăng xuất &amp; Đăng nhập lại
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
