import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      window.location.href = '/';
    }
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070510] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-[#120b24] border border-violet-800/40 text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-900/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 inline-block mb-2">
                SHELBYONLINE
              </span>
              <h1 className="text-2xl font-black text-white">Bir Hata Oluştu</h1>
              <p className="text-xs text-slate-400 mt-2">
                Sayfa yüklenirken beklenmeyen bir durum oluştu. Lütfen sayfayı yenileyiniz veya önbelleği sıfırlayınız.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-violet-950/60 rounded-xl border border-violet-800/30 text-left">
                <p className="text-xs text-amber-300 font-mono font-bold break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sayfayı Yenile</span>
              </button>

              <button
                onClick={this.handleResetCache}
                className="flex-1 py-3 px-4 rounded-xl bg-violet-950/60 hover:bg-violet-900/80 border border-violet-700/40 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Önbelleği Temizle & Başlat</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
