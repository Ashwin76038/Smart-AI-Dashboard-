import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-900 flex flex-col items-center justify-center h-64">
                    <AlertTriangle className="w-10 h-10 mb-2 text-red-600" />
                    <h2 className="text-lg font-bold">Visual Builder Crashed</h2>
                    <p className="text-sm text-red-700 mt-2 max-w-lg text-center bg-white p-2 rounded border border-red-100">
                        {this.state.error?.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-4">
                        Try refreshing the page or checking if data follows a standard tabular format.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
