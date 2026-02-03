import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Fix: Explicitly declare state property
  public state: ErrorBoundaryState;
  // Fix: Explicitly declare props property
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Fix: Explicitly assign props
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'monospace', color: '#7f1d1d', backgroundColor: '#fef2f2', border: '2px solid #991b1b', maxWidth: '800px', margin: '40px auto' }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px', textTransform: 'uppercase' }}>System Failure</h1>
          <p style={{ marginBottom: '16px' }}>The printing press has jammed (Application Crash).</p>
          <pre style={{ backgroundColor: 'white', padding: '16px', overflowX: 'auto', border: '1px solid #7f1d1d' }}>
            {this.state.error?.toString()}
          </pre>
          <p style={{ marginTop: '16px', fontSize: '12px' }}>Please check the console for more details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);