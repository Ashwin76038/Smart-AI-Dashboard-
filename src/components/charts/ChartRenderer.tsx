import React, { useState } from 'react';
import {
    LineChart, Line, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Settings, X, Palette, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, ScatterChart as ScatterChartIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartConfig {
    id: string;
    title: string;
    type: 'line' | 'bar' | 'scatter' | 'pie';
    section: string;
    config: {
        xField?: string;
        yField?: string;
        nameField?: string;
        valueField?: string;
        fill?: string;
        stroke?: string;
        strokeWidth?: number;
        colors?: string[];
        isHistogram?: boolean;
        showGrid?: boolean;
        showTooltip?: boolean;
        showLegend?: boolean;
        responsive?: boolean;
        margin?: { top: number; right: number; left: number; bottom: number };
        dot?: any;
        activeDot?: any;
        curve?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
        radius?: [number, number, number, number];
        barSize?: number;
        innerRadius?: number;
        outerRadius?: number;
        paddingAngle?: number;
    };
}

interface ChartRendererProps {
    chartSpec: ChartConfig;
    data: any[];
    onSettingsChange?: (newSpec: ChartConfig) => void;
}

// Color palettes
const COLOR_PALETTES = {
    default: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9', '#f97316'],
    blue: ['#1e40af', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', '#eff6ff'],
    green: ['#166534', '#15803d', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4'],
    purple: ['#581c87', '#7c3aed', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff', '#faf5ff'],
    sunset: ['#f97316', '#ea580c', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#f59e0b', '#fbbf24'],
    ocean: ['#0891b2', '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe', '#0e7490', '#155e75']
};

const CHART_TYPES = [
    { type: 'bar', icon: BarChart3, label: 'Bar' },
    { type: 'line', icon: LineChartIcon, label: 'Line' },
    { type: 'pie', icon: PieChartIcon, label: 'Pie' },
    { type: 'scatter', icon: ScatterChartIcon, label: 'Scatter' }
];

const ChartRenderer: React.FC<ChartRendererProps> = ({ chartSpec, data, onSettingsChange }) => {
    const [showSettings, setShowSettings] = useState(false);
    const [localSpec, setLocalSpec] = useState(chartSpec);
    const { type, config } = localSpec;

    // Process data based on chart type
    const processData = () => {
        if (!data || data.length === 0) return [];

        switch (type) {
            case 'line':
            case 'bar':
                if (config.isHistogram) {
                    return createHistogramData(data, config.xField!);
                }
                return aggregateData(data, config.xField!, config.yField!);

            case 'scatter':
                return data.map(d => ({
                    x: d[config.xField!],
                    y: d[config.yField!]
                }));

            case 'pie':
                return aggregatePieData(data, config.nameField!, config.valueField!);

            default:
                return data;
        }
    };

    const aggregateData = (data: any[], xField: string, yField: string) => {
        const grouped = data.reduce((acc, row) => {
            const key = row[xField];
            if (key === undefined || key === null) return acc;

            if (!acc[key]) {
                acc[key] = { [xField]: key, [yField]: 0, count: 0 };
            }
            acc[key][yField] += Number(row[yField]) || 0;
            acc[key].count += 1;
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped).sort((a: any, b: any) => {
            const aVal = a[xField];
            const bVal = b[xField];

            if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
                return Number(aVal) - Number(bVal);
            }

            const aDate = Date.parse(String(aVal));
            const bDate = Date.parse(String(bVal));
            if (!isNaN(aDate) && !isNaN(bDate)) {
                return aDate - bDate;
            }

            return String(aVal).localeCompare(String(bVal));
        });
    };

    const aggregatePieData = (data: any[], nameField: string, valueField: string) => {
        const grouped = data.reduce((acc, row) => {
            const key = row[nameField];
            if (key === undefined || key === null) return acc;

            if (!acc[key]) {
                acc[key] = { name: key, value: 0 };
            }
            acc[key].value += Number(row[valueField]) || 0;
            return acc;
        }, {} as Record<string, any>);

        return Object.values(grouped)
            .sort((a: any, b: any) => b.value - a.value)
            .slice(0, 10);
    };

    const createHistogramData = (data: any[], field: string) => {
        const values = data.map(d => Number(d[field])).filter(v => !isNaN(v));
        if (values.length === 0) return [];

        const min = Math.min(...values);
        const max = Math.max(...values);
        const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
        const binSize = (max - min) / binCount;

        const bins = Array.from({ length: binCount }, (_, i) => ({
            range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
            count: 0,
            binStart: min + i * binSize
        }));

        values.forEach(value => {
            const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
            if (binIndex >= 0 && binIndex < bins.length) {
                bins[binIndex].count++;
            }
        });

        return bins;
    };

    const handleColorChange = (paletteName: keyof typeof COLOR_PALETTES) => {
        const newColors = COLOR_PALETTES[paletteName];
        const newSpec = {
            ...localSpec,
            config: {
                ...localSpec.config,
                colors: newColors,
                fill: newColors[0],
                stroke: newColors[0]
            }
        };
        setLocalSpec(newSpec);
        onSettingsChange?.(newSpec);
    };

    const handleTypeChange = (newType: 'line' | 'bar' | 'scatter' | 'pie') => {
        const newSpec = {
            ...localSpec,
            type: newType
        };
        setLocalSpec(newSpec);
        onSettingsChange?.(newSpec);
    };

    const processedData = processData();

    if (!processedData || processedData.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                No data available for {chartSpec.title}
            </div>
        );
    }

    const margin = config.margin || { top: 20, right: 30, left: 20, bottom: 60 };
    const colors = config.colors || COLOR_PALETTES.default;

    // Settings Panel
    const SettingsPanel = () => (
        <div className="absolute inset-0 z-20 bg-background/95 backdrop-blur-sm rounded-xl p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-foreground">Chart Settings</h4>
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Chart Type Selector */}
            <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Chart Type</p>
                <div className="flex gap-2">
                    {CHART_TYPES.map(({ type: t, icon: Icon, label }) => (
                        <Button
                            key={t}
                            variant={type === t ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleTypeChange(t as any)}
                            className="flex-1"
                        >
                            <Icon className="h-4 w-4 mr-1" />
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Color Palette Selector */}
            <div>
                <p className="text-sm text-muted-foreground mb-2">Color Palette</p>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(COLOR_PALETTES).map(([name, palette]) => (
                        <button
                            key={name}
                            onClick={() => handleColorChange(name as keyof typeof COLOR_PALETTES)}
                            className="p-2 rounded-lg border border-border hover:border-primary transition-colors"
                        >
                            <div className="flex gap-0.5 mb-1">
                                {palette.slice(0, 4).map((color, i) => (
                                    <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: color }} />
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground capitalize">{name}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    // Render appropriate chart type
    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={processedData} margin={margin}>
                            {config.showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />}
                            <XAxis dataKey={config.xField} stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                            {config.showTooltip && (
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            )}
                            {config.showLegend && <Legend verticalAlign="top" height={36} iconType="circle" />}
                            <Line type={config.curve || "monotone"} dataKey={config.yField} stroke={colors[0]} strokeWidth={config.strokeWidth || 2} dot={config.dot || { r: 4, fill: colors[0], strokeWidth: 0 }} activeDot={config.activeDot || { r: 6, strokeWidth: 0 }} animationDuration={1500} />
                        </LineChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={processedData} margin={margin}>
                            {config.showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />}
                            <XAxis dataKey={config.isHistogram ? 'range' : config.xField} stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} angle={processedData.length > 8 ? -45 : 0} textAnchor={processedData.length > 8 ? 'end' : 'middle'} interval={0} dy={10} />
                            <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                            {config.showTooltip && (
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            )}
                            {config.showLegend && <Legend verticalAlign="top" height={36} iconType="circle" />}
                            <Bar dataKey={config.isHistogram ? 'count' : config.yField} fill={colors[0]} radius={config.radius || [4, 4, 0, 0]} barSize={config.barSize || 30} animationDuration={1500} />
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'scatter':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={margin}>
                            {config.showGrid && <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border" />}
                            <XAxis dataKey="x" name={config.xField} stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="y" name={config.yField} stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                            {config.showTooltip && (
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            )}
                            <Scatter name={`${config.xField} vs ${config.yField}`} data={processedData} fill={colors[0]} animationDuration={1500} />
                        </ScatterChart>
                    </ResponsiveContainer>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart margin={margin}>
                            <Pie data={processedData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={config.innerRadius || 60} outerRadius={config.outerRadius || 80} paddingAngle={config.paddingAngle || 5} label={(entry: any) => `${entry.name}`} labelLine={false} animationDuration={1500}>
                                {processedData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            {config.showTooltip && (
                                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            )}
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                );

            default:
                return (
                    <div className="flex items-center justify-center h-full text-muted-foreground italic">
                        Unsupported chart type: {type}
                    </div>
                );
        }
    };

    return (
        <div className="relative h-full">
            {/* Settings Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(true)}
                className="absolute top-0 right-0 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>

            {/* Settings Panel */}
            {showSettings && <SettingsPanel />}

            {/* Chart */}
            {renderChart()}
        </div>
    );
};

export default ChartRenderer;
