/**
 * Insight Panel Component
 */
import React from 'react';
import { Card } from '@/components/ui/card';
import { Lightbulb, TrendingUp, AlertTriangle, BarChart } from 'lucide-react';

interface Insight {
    type: 'trend' | 'anomaly' | 'comparison' | 'outlier' | 'correlation' | 'summary';
    title: string;
    description: string;
    relatedChart?: string | null;
    severity: 'high' | 'medium' | 'low';
    metric?: string;
    value?: number;
}

interface InsightPanelProps {
    insights: Insight[];
    className?: string;
}

export const InsightPanel: React.FC<InsightPanelProps> = ({
    insights = [],
    className = ''
}) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'trend':
                return <TrendingUp className="w-5 h-5" />;
            case 'anomaly':
            case 'outlier':
                return <AlertTriangle className="w-5 h-5" />;
            case 'comparison':
            case 'correlation':
                return <BarChart className="w-5 h-5" />;
            default:
                return <Lightbulb className="w-5 h-5" />;
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'border-l-red-500 bg-red-50';
            case 'medium':
                return 'border-l-yellow-500 bg-yellow-50';
            default:
                return 'border-l-blue-500 bg-blue-50';
        }
    };

    if (insights.length === 0) {
        return (
            <Card className={`p-6 ${className}`}>
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-semibold text-gray-800">AI Insights</h3>
                </div>
                <p className="text-gray-500 text-sm">
                    Apply filters or generate a dashboard to see AI-powered insights.
                </p>
            </Card>
        );
    }

    return (
        <Card className={`p-6 ${className}`}>
            <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-800">AI Insights</h3>
                <span className="ml-auto text-xs text-gray-500">
                    {insights.length} insight{insights.length !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="space-y-3">
                {insights.map((insight, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-lg border-l-4 ${getSeverityColor(insight.severity)}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-gray-700">
                                {getIcon(insight.type)}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                    {insight.title}
                                </h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    {insight.description}
                                </p>
                                {insight.relatedChart && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Related to: {insight.relatedChart}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
