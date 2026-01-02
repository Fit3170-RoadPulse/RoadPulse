import React from "react";
import "./ErrorBoundary.css";

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
        <div className="error-boundary-container">
          <h1 className="error-boundary-heading">Something went wrong</h1>
          <p className="error-boundary-message">Open DevTools Console for the full error.</p>
          <pre className="error-boundary-stack">
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          {this.state.errorInfo?.componentStack ? (
            <pre className="error-boundary-component-stack">
              {this.state.errorInfo.componentStack.trim()}
            </pre>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}

