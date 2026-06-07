import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-chattix-bg text-gray-900 p-6">
          <div className="glass rounded-3xl p-8 max-w-lg text-center shadow-xl">
            <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-sm text-gray-300 mb-6">
              The app encountered an unexpected error while rendering. Please refresh the page or try again later.
            </p>
            <pre className="text-xs text-gray-400 overflow-x-auto bg-dark-900 rounded-lg p-4">
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
