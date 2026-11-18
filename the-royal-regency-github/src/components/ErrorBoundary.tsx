import React from 'react';
import { Crown, RotateCcw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering issue occurred.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('Royal Regency ErrorBoundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-[#0f0818] p-6 text-[#faf6f0]">
          <div className="royal-glass max-w-md rounded-2xl p-8 text-center">
            <Crown className="mx-auto mb-4 h-10 w-10 text-[#d4af37]" />
            <h2 className="font-royal-display text-xl tracking-widest text-[#f3d9a4]">
              A Brief Pause in the Palace
            </h2>
            <p className="mt-3 text-base text-[#f4c2c2]/90">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="royal-btn mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs"
            >
              <RotateCcw className="h-4 w-4" />
              Reload The Palace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
