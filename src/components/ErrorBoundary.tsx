import { Component, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message ?? 'Unknown error' };
  }

  componentDidCatch(err: Error) {
    console.error('[ErrorBoundary]', err);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-mia-black flex flex-col items-center justify-center px-6 text-center">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full opacity-[0.04] blur-3xl"
            style={{ background: 'radial-gradient(circle, #EF4444, transparent)' }} />
        </div>

        <div className="relative z-10 max-w-sm">
          <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertTriangle size={36} className="text-red-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-white/40 mb-8 leading-relaxed">
            An unexpected error occurred. Please refresh the page to try again.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 4px 20px rgba(255,138,0,0.3)' }}
          >
            <RefreshCw size={15} />
            Refresh Page
          </button>

          <a
            href="/"
            className="block mt-4 text-sm text-white/30 hover:text-white/60 transition-colors"
          >
            or go back to Home
          </a>
        </div>
      </div>
    );
  }
}
