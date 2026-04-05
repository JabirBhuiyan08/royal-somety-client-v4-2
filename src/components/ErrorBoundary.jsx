// client/src/components/ErrorBoundary.jsx
import { Component } from 'react';
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(e, i) { console.error('ErrorBoundary:', e, i); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white px-6 text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-lg font-bold text-slate-800 mb-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>কিছু একটা ভুল হয়েছে</h2>
        <button onClick={() => window.location.reload()} className="btn-primary" style={{ maxWidth: 200 }}>পুনরায় চালু করুন</button>
        {import.meta.env.DEV && <pre className="mt-4 text-xs text-red-400 text-left bg-red-50 p-3 rounded-xl max-w-full overflow-auto">{this.state.error?.toString()}</pre>}
      </div>
    );
  }
}
export default ErrorBoundary;
