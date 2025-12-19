import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("UI crashed:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif" }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>Something went wrong</h1>
          <p style={{ color: "#4b5563" }}>Open DevTools Console for the full error.</p>
          <pre style={{ background: "#f3f4f6", padding: 12, borderRadius: 8, overflow: "auto" }}>
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          {this.state.errorInfo?.componentStack ? (
            <pre style={{ background: "#f9fafb", padding: 12, borderRadius: 8, overflow: "auto", marginTop: 12 }}>
              {this.state.errorInfo.componentStack.trim()}
            </pre>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}

