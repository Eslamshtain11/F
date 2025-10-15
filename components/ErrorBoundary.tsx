import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  }

  // FIX: The render method in a React class component should be a standard method declaration, not an arrow function.
  // This ensures 'this' is correctly bound by React and resolves TypeScript errors related to accessing 'this.props'.
  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-brand-blue text-brand-light min-h-screen flex items-center justify-center font-sans p-4" dir="rtl">
            <div className="bg-brand-navy p-8 rounded-xl shadow-2xl border border-red-500/50 max-w-lg text-center">
                <h1 className="text-3xl font-bold text-red-400 mb-4">حدث خطأ غير متوقع!</h1>
                <p className="text-brand-secondary mb-6">
                    نعتذر عن الإزعاج. حدث خطأ ما في التطبيق. يمكنك محاولة إعادة تحميل الصفحة.
                </p>
                <p className="text-xs text-brand-secondary mb-6">
                    تم تسجيل تفاصيل الخطأ للمراجعة الفنية.
                </p>
                <button
                    onClick={this.handleReload}
                    className="py-3 px-6 rounded-lg bg-brand-gold text-brand-blue font-bold hover:bg-opacity-90 transition shadow-lg"
                >
                    إعادة تحميل الصفحة
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;