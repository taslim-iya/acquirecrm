import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Something went wrong
            </h2>
            <p className="text-sm text-muted-foreground">
              {this.state.error.message || 'An unexpected error occurred while rendering this view.'}
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload
              </Button>
              <Button onClick={this.reset}>Try again</Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
