import React, { Component } from 'react';
import '../styles/ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.</p>
          <button className="retry-button" onClick={() => window.location.reload()}>Refresh Page</button>
          
          {process.env.NODE_ENV !== 'production' && (
            <details className="error-details">
              <summary>Error Details</summary>
              <p>{this.state.error && this.state.error.toString()}</p>
              <p className="stack-trace">
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </p>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;