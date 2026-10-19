import { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('zChat Uncaught Render Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#080a0f',
            color: '#f8fafc',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              padding: '28px',
              maxWidth: '440px',
              borderRadius: '16px',
              background: 'rgba(18, 24, 38, 0.85)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              boxShadow: '0 0 30px rgba(244, 63, 94, 0.2)',
            }}
          >
            <ShieldAlert size={40} color="#f43f5e" style={{ marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Something went wrong</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(157, 78, 221, 0.2))',
                border: '1px solid #00f0ff',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RefreshCw size={15} />
              Reload zChat
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
