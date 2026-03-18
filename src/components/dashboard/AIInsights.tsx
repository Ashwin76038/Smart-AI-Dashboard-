import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Info, Star, Lightbulb, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dashboardAPI } from '@/services/dashboardAPI';

interface AIInsightsProps {
    datasetId: string;
    isVisible: boolean;
    onClose: () => void;
}

interface InsightData {
    title: string;
    summary: string;
    insights: Array<{
        icon: string;
        title: string;
        description: string;
    }>;
    recommendations: string[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'trending-up': TrendingUp,
    'trending-down': TrendingDown,
    'alert': AlertCircle,
    'info': Info,
    'star': Star
};

const AIInsights: React.FC<AIInsightsProps> = ({ datasetId, isVisible, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [insightData, setInsightData] = useState<InsightData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchInsights = async () => {
        if (!datasetId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await dashboardAPI.getInsights(datasetId);
            if (response.success) {
                setInsightData(response.insights);
            } else {
                setError(response.error || 'Failed to generate insights');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch insights');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isVisible && !insightData && !loading) {
            fetchInsights();
        }
    }, [isVisible, datasetId]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
            <div className="glass-card w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Lightbulb className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">AI Insights</h2>
                            <p className="text-sm text-muted-foreground">Generated analysis of your data</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={fetchInsights}
                            disabled={loading}
                            className="rounded-full"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="h-12 w-12 rounded-full bg-primary/20 animate-pulse mb-4" />
                            <p className="text-muted-foreground">Analyzing your data...</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                            <p className="text-destructive">{error}</p>
                            <Button onClick={fetchInsights} className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    )}

                    {insightData && !loading && (
                        <div className="space-y-6">
                            {/* Title & Summary */}
                            <div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {insightData.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {insightData.summary}
                                </p>
                            </div>

                            {/* Key Insights */}
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                    Key Insights
                                </h4>
                                <div className="space-y-3">
                                    {insightData.insights.map((insight, index) => {
                                        const IconComponent = iconMap[insight.icon] || Info;
                                        return (
                                            <div
                                                key={index}
                                                className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border/30"
                                            >
                                                <div className="shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <IconComponent className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-foreground">{insight.title}</h5>
                                                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recommendations */}
                            {insightData.recommendations && insightData.recommendations.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                        Recommendations
                                    </h4>
                                    <ul className="space-y-2">
                                        {insightData.recommendations.map((rec, index) => (
                                            <li key={index} className="flex items-start gap-3">
                                                <span className="shrink-0 h-6 w-6 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </span>
                                                <span className="text-foreground">{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIInsights;
