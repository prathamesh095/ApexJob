import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Button, Card } from './Shared';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleHardReset = () => {
    if (window.confirm("WARNING: This will clear your local session cache to fix the crash. Your saved records will persist if stored safely, but session state will reset. Proceed?")) {
      localStorage.removeItem('apex_auth_session');
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <Card className="max-w-md w-full p-8 border-rose-200 shadow-xl bg-white">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={32} />
              </div>
              <h1 className="text-xl font-black text-slate-900 mb-2">System Critical Error</h1>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                The application encountered an unexpected state and terminated the render loop to protect data integrity.
              </p>
              
              <div className="bg-slate-100 p-3 rounded-lg w-full mb-6 text-left">
                <p className="text-[10px] font-mono text-slate-600 break-words">
                  Error: {this.state.error?.message || "Unknown Failure"}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full">
                <Button onClick={this.handleReload} size="lg" className="w-full">
                  <RefreshCw size={16} className="mr-2" /> Reload Interface
                </Button>
                <Button onClick={this.handleHardReset} variant="ghost" size="sm" className="w-full text-rose-500 hover:bg-rose-50">
                  <Trash2 size={14} className="mr-2" /> Clear Session & Reset
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children || null;
  }
}