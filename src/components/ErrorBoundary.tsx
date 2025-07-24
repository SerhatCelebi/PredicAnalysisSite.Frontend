import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo?: string;
}

// Basit bir React Error Boundary bileşeni
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Hata loglama servisine gönderilebilir (Sentry, LogRocket, vb.)
    console.error("Beklenmeyen bir hata yakalandı:", error, errorInfo);
    this.setState({ errorInfo: error.message });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-dark-900 text-gray-200 p-6 text-center">
          <h1 className="text-3xl font-bold text-gradient">
            Bir şeyler ters gitti
          </h1>
          <p className="max-w-md text-gray-400">
            Üzgünüz, beklenmedik bir hata oluştu. Lütfen sayfayı yenilemeyi veya
            daha sonra tekrar ziyaret etmeyi deneyin.
          </p>
          {process.env.NODE_ENV !== "production" && this.state.errorInfo && (
            <pre className="bg-dark-800 p-4 rounded-lg text-left text-red-400 text-xs overflow-auto max-w-lg w-full">
              {this.state.errorInfo}
            </pre>
          )}
          <button className="btn-primary px-6 py-3" onClick={this.handleReload}>
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
