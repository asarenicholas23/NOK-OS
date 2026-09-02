import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  /** Short name of the section being guarded, shown in the fallback. */
  label?: string;
  isDark?: boolean;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time exceptions in a subtree so one bad record can't blank the
 * whole page. Renders a compact inline fallback with a "try again" reset.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? ` · ${this.props.label}` : ""}]`, error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    const { label, isDark } = this.props;
    return (
      <div
        className={`rounded-2xl border p-6 flex flex-col items-center text-center gap-3 ${
          isDark ? "bg-[#1A1414] border-rose-500/30 text-rose-200" : "bg-rose-50 border-rose-300 text-rose-800"
        }`}
      >
        <AlertTriangle className="w-6 h-6 text-rose-500" />
        <div>
          <p className="text-sm font-bold">
            {label ? `The ${label} hit an error` : "This section hit an error"}
          </p>
          <p className="text-xs mt-1 opacity-80 font-mono break-all max-w-lg">
            {error.message || "Unknown error"}
          </p>
        </div>
        <button
          onClick={this.reset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try again
        </button>
      </div>
    );
  }
}
