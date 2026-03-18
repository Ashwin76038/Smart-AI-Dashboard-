import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChartRenderer from "@/components/charts/ChartRenderer";
import AIChat from "@/components/dashboard/AIChat";
import AIInsights from "@/components/dashboard/AIInsights";
import { Button } from "@/components/ui/button";
import { Loader2, Home, RefreshCw, Sparkles, Download, Share2, Moon, Sun, FileText, Image, FileJson, FileSpreadsheet, X, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { dashboardAPI, DashboardConfig } from "@/services/dashboardAPI";
import { exportToPNG, exportToPDF, copyShareLink, exportToJSON, exportToCSV } from "@/utils/exportDashboard";

const AutoDashboard: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);
    const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [aiLoading, setAiLoading] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showInsights, setShowInsights] = useState(false);
    const [chartConfigs, setChartConfigs] = useState<Record<string, any>>({});

    const datasetId = (location.state as any)?.datasetId;

    // Apply dark mode
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Redirect if no dataset
    useEffect(() => {
        if (!datasetId) {
            toast.error("No dataset selected");
            navigate("/upload");
        }
    }, [datasetId, navigate]);

    // Fetch auto-generated dashboard
    const fetchDashboardData = async () => {
        if (!datasetId) return;

        try {
            setLoading(true);
            const data = await dashboardAPI.getDashboard(datasetId);
            setDashboard(data);
            console.log("✅ Dashboard loaded:", data);
        } catch (error: any) {
            console.error("Failed to load dashboard:", error);
            toast.error("Failed to load dashboard: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [datasetId]);

    // Handle AI chat messages - now supports chart modifications
    const handleAIMessage = async (message: string) => {
        if (!dashboard) {
            toast.error("Dashboard not loaded yet");
            return;
        }

        setAiLoading(true);
        try {
            const filename = dashboard.datasetName;
            const response = await dashboardAPI.nlpQuery(filename, message);

            if (response.success) {
                const intent = response.intent || 'analysis';

                if (intent === 'chart_modification' && response.modification) {
                    // Handle chart modifications
                    const mod = response.modification;
                    toast.success(`AI: ${response.analysis || 'Chart updated!'}`);

                    // Store modification for charts to pick up
                    if (mod.color_palette) {
                        setChartConfigs(prev => ({
                            ...prev,
                            globalPalette: mod.color_palette
                        }));
                    }
                    if (mod.chart_type) {
                        setChartConfigs(prev => ({
                            ...prev,
                            globalType: mod.chart_type
                        }));
                    }
                } else if (response.chart_suggestion) {
                    // AI suggested a new chart
                    toast.success(`AI: ${response.analysis}`);
                    console.log("Chart suggestion:", response.chart_suggestion);
                } else {
                    // Regular analysis
                    toast.success("AI: " + (response.analysis || "Analysis complete"));
                }

                console.log("NLP Response:", response);
            } else {
                toast.error("AI error: " + (response.error || "Unknown error"));
            }
        } catch (error: any) {
            console.error("NLP Error:", error);
            toast.error("AI error: " + error.message);
        } finally {
            setAiLoading(false);
        }
    };

    // Export handlers
    const handleExportPNG = async () => {
        setShowExportMenu(false);
        await exportToPNG('dashboard-content', `${dashboard?.datasetName || 'dashboard'}.png`);
    };

    const handleExportPDF = async () => {
        setShowExportMenu(false);
        await exportToPDF('dashboard-content', `${dashboard?.datasetName || 'dashboard'}.pdf`, {
            title: dashboard?.datasetName,
            includeHeader: true,
            includeFooter: true
        });
    };

    const handleExportJSON = () => {
        setShowExportMenu(false);
        if (dashboard?.data) {
            exportToJSON(dashboard.data, `${dashboard.datasetName || 'data'}.json`);
        }
    };

    const handleExportCSV = () => {
        setShowExportMenu(false);
        if (dashboard?.data) {
            exportToCSV(dashboard.data, `${dashboard.datasetName || 'data'}.csv`);
        }
    };

    const handleShare = async () => {
        if (datasetId) {
            await copyShareLink(datasetId);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <div className="relative mb-8">
                        <div className="w-20 h-20 rounded-full bg-primary/20 animate-pulse mx-auto" />
                        <Loader2 className="w-12 h-12 animate-spin text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-xl font-semibold text-foreground mb-2">Generating your AI dashboard...</p>
                    <p className="text-muted-foreground">Analyzing data and creating visualizations</p>
                </div>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center glass-card p-12">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                        <Home className="w-8 h-8 text-destructive" />
                    </div>
                    <p className="text-xl font-semibold text-foreground mb-4">Dashboard not found</p>
                    <Button onClick={() => navigate('/upload')} className="btn-glow">
                        <Home className="w-4 h-4 mr-2" />
                        Upload New Dataset
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold gradient-text">
                                {dashboard.datasetName}
                            </h1>
                            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <span>AI-generated dashboard</span>
                                <span className="text-border">•</span>
                                <span>{dashboard.metadata.chartCount} charts</span>
                                <span className="text-border">•</span>
                                <span>{dashboard.metadata.rowCount.toLocaleString()} rows</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                className="rounded-full"
                            >
                                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </Button>
                            <Button
                                onClick={fetchDashboardData}
                                variant="outline"
                                size="icon"
                                className="rounded-full"
                                title="Refresh dashboard"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>

                            {/* Export Menu */}
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full"
                                    onClick={() => setShowExportMenu(!showExportMenu)}
                                    title="Export dashboard"
                                >
                                    <Download className="w-4 h-4" />
                                </Button>

                                {showExportMenu && (
                                    <div className="absolute right-0 top-12 w-48 glass-card p-2 animate-slide-up z-50">
                                        <div className="flex justify-between items-center px-3 py-2 mb-1">
                                            <span className="text-sm font-semibold text-foreground">Export</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowExportMenu(false)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <button
                                            onClick={handleExportPNG}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <Image className="w-4 h-4 text-primary" />
                                            <span className="text-sm text-foreground">Export PNG</span>
                                        </button>
                                        <button
                                            onClick={handleExportPDF}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <FileText className="w-4 h-4 text-red-500" />
                                            <span className="text-sm text-foreground">Export PDF</span>
                                        </button>
                                        <button
                                            onClick={handleExportJSON}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <FileJson className="w-4 h-4 text-yellow-500" />
                                            <span className="text-sm text-foreground">Export JSON</span>
                                        </button>
                                        <button
                                            onClick={handleExportCSV}
                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                        >
                                            <FileSpreadsheet className="w-4 h-4 text-green-500" />
                                            <span className="text-sm text-foreground">Export CSV</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* AI Insights Button */}
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full"
                                onClick={() => setShowInsights(true)}
                                title="AI Insights"
                            >
                                <Lightbulb className="w-4 h-4" />
                            </Button>

                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full"
                                onClick={handleShare}
                                title="Copy share link"
                            >
                                <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                                onClick={() => navigate('/upload')}
                                className="btn-glow rounded-full bg-primary hover:bg-primary/90"
                            >
                                <Home className="w-4 h-4 mr-2" />
                                New Dataset
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main id="dashboard-content" className="container mx-auto px-6 py-8">
                {/* KPI Cards */}
                {dashboard.kpis && dashboard.kpis.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        {dashboard.kpis.map((kpi: any, index: number) => (
                            <div
                                key={kpi.id}
                                className={`kpi-card animate-slide-up stagger-${index + 1}`}
                            >
                                <p className="text-sm text-muted-foreground font-medium mb-2">{kpi.label}</p>
                                <p className="text-3xl font-bold text-foreground">
                                    {kpi.format === 'decimal'
                                        ? Number(kpi.value).toFixed(2).toLocaleString()
                                        : Number(kpi.value).toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Charts Section */}
                {dashboard.layout.sections.map((section: any) => {
                    if (section.type === 'kpi') return null;

                    return (
                        <div key={section.id} className="mb-12">
                            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                                <div className="w-1 h-6 rounded-full bg-primary" />
                                {section.title}
                            </h2>
                            <div className={`grid gap-6 ${section.gridConfig.cols === 1 ? 'grid-cols-1' :
                                section.gridConfig.cols === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                                    'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
                                }`}>
                                {section.items.map((item: any, index: number) => {
                                    const chart = dashboard.charts.find((c: any) => c.id === item.chartId);
                                    if (!chart) return null;

                                    return (
                                        <div
                                            key={chart.id}
                                            className={`chart-card min-h-[420px] animate-slide-up stagger-${(index % 4) + 1} group`}
                                        >
                                            <h3 className="text-lg font-semibold text-foreground mb-4 px-2">
                                                {chart.title}
                                            </h3>
                                            <div className="h-[350px]">
                                                <ChartRenderer
                                                    chartSpec={chart.rechartsSpec}
                                                    data={dashboard.data}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </main>

            {/* AI Chat */}
            <AIChat onSendMessage={handleAIMessage} isLoading={aiLoading} />

            {/* AI Insights Modal */}
            <AIInsights
                datasetId={dashboard.datasetName}
                isVisible={showInsights}
                onClose={() => setShowInsights(false)}
            />
        </div>
    );
};

export default AutoDashboard;
