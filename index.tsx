import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Error boundary: converts a silent white screen into a readable error + reload button
interface ErrorBoundaryState {
  error: Error | null;
}

class ErrorBoundary extends React.Component {
  state: ErrorBoundaryState = { error: null };
  props: { children?: React.ReactNode };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', background: '#fef2f2', color: '#7f1d1d', minHeight: '100vh' }}>
          <h1 style={{ fontSize: 18, fontWeight: 'bold' }}>O app encontrou um erro inesperado.</h1>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8, fontSize: 11, color: '#b91c1c' }}>{this.state.error.stack}</pre>
          <button
            style={{ marginTop: 16, padding: '8px 16px', background: '#7f1d1d', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer' }}
            onClick={() => location.reload()}
          >
            Recarregar
          </button>
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
