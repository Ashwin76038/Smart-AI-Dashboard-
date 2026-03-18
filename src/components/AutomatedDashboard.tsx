import React from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    AreaChart,
    Area,
    ScatterChart,
    Scatter,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ComposedChart,
    RadialBarChart,
    RadialBar,
} from "recharts";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Database, Layers, BarChart3, PieChart as PieIcon, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

interface AutomatedDashboardProps {
    summary: any;
    preview: any[];
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#06b6d4"];

const AutomatedDashboard: React.FC<AutomatedDashboardProps> = ({ summary, preview }) => {
    if (!summary) return null;

    const {
        total_rows,
        total_columns,
        numeric_columns = [],
        categorical_columns = [],
        date_columns = [],
        categorical_distribution = {},
        numeric_statistics = {},
    } = summary;

    // ---------------- Data Preparation ----------------

    // 1. Bar Chart Data (Top 5 of first Category)
    const primaryCat = categorical_columns[0];
    const secondaryCat = categorical_columns[1];
    const tertiaryCat = categorical_columns[2] || categorical_columns[0]; // Fallback

    const barData = primaryCat
        ? Object.entries(categorical_distribution[primaryCat] || {}).slice(0, 10).map(([name, value]) => ({
            name: String(name).slice(0, 15), // Truncate long names
            value,
        }))
        : [];

    // 2. Pie Chart Data
    const pieData = barData.slice(0, 6);

    // 3. Line/Area Chart Data (Time series or Index based)
    const primaryDate = date_columns[0];
    const primaryNum = numeric_columns[0];
    const secondaryNum = numeric_columns[1] || numeric_columns[0]; // Fallback

    const trendData = preview.map((row, index) => ({
        index: index + 1,
        date: primaryDate ? row[primaryDate] : `Row ${index + 1}`,
        [primaryNum]: primaryNum ? (typeof row[primaryNum] === 'number' ? row[primaryNum] : parseFloat(row[primaryNum])) : 0,
        [secondaryNum]: secondaryNum ? (typeof row[secondaryNum] === 'number' ? row[secondaryNum] : parseFloat(row[secondaryNum])) : 0,
    }));

    // 4. Scatter Data (Num 1 vs Num 2)
    const scatterData = (primaryNum) ? preview.map((row, i) => ({
        x: typeof row[primaryNum] === 'number' ? row[primaryNum] : parseFloat(row[primaryNum]) || 0,
        y: typeof row[secondaryNum] === 'number' ? row[secondaryNum] : parseFloat(row[secondaryNum]) || 0, // safe fallback to same metric if only 1 exists
        z: 1
    })) : [];

    // 5. Radar Data (Enhanced with Synthetic Metrics if needed)
    let radarData = numeric_columns.slice(0, 6).map((col: string) => ({
        subject: col,
        A: numeric_statistics[col]?.mean || 0,
        fullMark: numeric_statistics[col]?.max || 100
    }));

    // If we have fewer than 3 numeric columns, add some synthetic structural metrics for the radar to look good
    if (radarData.length < 3) {
        radarData.push({ subject: "Col Count", A: total_columns, fullMark: 20 });
        radarData.push({ subject: "Log(Rows)", A: Math.log10(total_rows), fullMark: 10 });
    }

    // 6. Horizontal Bar for Secondary Category
    const horizBarData = secondaryCat
        ? Object.entries(categorical_distribution[secondaryCat] || {}).slice(0, 8).map(([name, value]) => ({
            name: String(name).slice(0, 12),
            value,
            fill: COLORS[Math.floor(Math.random() * COLORS.length)]
        }))
        : [{ name: "N/A", value: 0 }];

    // 8. Radial Bar Data (Tertiary Category Count)
    const radialData = tertiaryCat
        ? Object.entries(categorical_distribution[tertiaryCat] || {}).slice(0, 5).map(([name, value], index) => ({
            name: String(name).slice(0, 10),
            uv: value,
            fill: COLORS[index % COLORS.length]
        }))
        : [];

    // ---------------- KPI Preparation ----------------
    const primaryStats = primaryNum ? numeric_statistics[primaryNum] : null;

    // KPI Cards Component
    const KPICard = ({ label, value, icon, color, subtext }: any) => (
        <Card className="p-6 shadow-md rounded-2xl bg-white/80 border-0 hover:shadow-lg transition-all relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color.replace('from-', 'text-').split(" ")[0]}`}>
                {React.cloneElement(icon, { size: 60 })}
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                    {icon}
                </div>
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1 relative z-10">{label}</p>
            <p className="text-2xl font-bold text-gray-800 relative z-10 truncate" title={String(value)}>{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-2 relative z-10">{subtext}</p>}
        </Card>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ---------------- 1. Extended KPI Section ---------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Total Records"
                    value={total_rows?.toLocaleString() || "0"}
                    icon={<Database className="w-6 h-6" />}
                    color="from-blue-500 to-cyan-500"
                    subtext={`${total_columns} Columns Analyzed`}
                />

                {primaryStats ? (
                    <>
                        <KPICard
                            label={`Avg ${primaryNum}`}
                            value={primaryStats.mean?.toFixed(2) || "N/A"}
                            icon={<Activity className="w-6 h-6" />}
                            color="from-emerald-500 to-teal-500"
                            subtext={`Min: ${primaryStats.min} | Max: ${primaryStats.max}`}
                        />
                        <KPICard
                            label={`Max ${primaryNum}`}
                            value={primaryStats.max?.toLocaleString() || "N/A"}
                            icon={<ArrowUpRight className="w-6 h-6" />}
                            color="from-amber-500 to-orange-500"
                            subtext="Highest recorded value"
                        />
                    </>
                ) : (
                    <KPICard
                        label="Categorical Fields"
                        value={categorical_columns.length}
                        icon={<PieIcon className="w-6 h-6" />}
                        color="from-emerald-500 to-teal-500"
                    />
                )}

                {barData.length > 0 ? (
                    <KPICard
                        label={`Top ${primaryCat}`}
                        value={barData[0].name}
                        icon={<TrendingUp className="w-6 h-6" />}
                        color="from-purple-500 to-pink-500"
                        subtext={`${barData[0].value} occurrences`}
                    />
                ) : (
                    <KPICard
                        label="Date Fields"
                        value={date_columns.length || 0}
                        icon={<Calendar className="w-6 h-6" />}
                        color="from-purple-500 to-pink-500"
                    />
                )}
            </div>

            {/* ---------------- 2. Visualization Grid ---------------- */}
            <h2 className="text-xl font-bold text-gray-800 mb-4 px-2 border-l-4 border-indigo-500">
                Data Visualizations (Updated)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Chart 1: Bar Chart (Primary Category) */}
                <Card className="shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <CardTitle className="text-lg font-bold text-gray-800">Distribution: {primaryCat}</CardTitle>
                        <CardDescription>Top occurring categories</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]}>
                                    {barData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Chart 2: Pie Chart (Primary Category) */}
                <Card className="shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <CardTitle className="text-lg font-bold text-gray-800">Segment Composition</CardTitle>
                        <CardDescription>{primaryCat} breakdown</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Chart 3: Area Chart (Trend) */}
                <Card className="shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <CardTitle className="text-lg font-bold text-gray-800">Trend Analysis: {primaryNum}</CardTitle>
                        <CardDescription>Value progression over records/time</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Area type="monotone" dataKey={primaryNum} stroke="#10b981" fillOpacity={1} fill="url(#colorPrimary)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Chart 4: Scatter Plot (Num1 vs Num2) */}
                <Card className="shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <CardTitle className="text-lg font-bold text-gray-800">Correlation Analysis</CardTitle>
                        <CardDescription>{primaryNum} vs {secondaryNum}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="x" name={primaryNum} stroke="#9ca3af" fontSize={12} />
                                <YAxis type="number" dataKey="y" name={secondaryNum} stroke="#9ca3af" fontSize={12} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Scatter name={`${primaryNum} vs ${secondaryNum}`} data={scatterData} fill="#8884d8">
                                    {scatterData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Chart 5: Radar Chart (Numeric Means) */}
                <Card className="shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <CardTitle className="text-lg font-bold text-gray-800">Metric Comparison</CardTitle>
                        <CardDescription>Structural & Value Balance</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                                <Radar name="Metrics" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.5} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Chart 6: Composed Chart (Multi-Metric) */}
                <Card className="shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <CardTitle className="text-lg font-bold text-gray-800">Multi-Metric Overview</CardTitle>
                        <CardDescription>{primaryNum} (Bar) vs {secondaryNum} (Line)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData}>
                                <CartesianGrid stroke="#f5f5f5" />
                                <XAxis dataKey="index" scale="band" />
                                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                                <YAxis yAxisId="right" orientation="right" stroke="#ff7300" />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Legend />
                                <Bar yAxisId="left" dataKey={primaryNum} barSize={20} fill="#413ea0" />
                                <Line yAxisId="right" type="monotone" dataKey={secondaryNum} stroke="#ff7300" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Chart 7: Horizontal Bar (Secondary Category) */}
                <Card className="shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <CardTitle className="text-lg font-bold text-gray-800">Secondary Distribution: {secondaryCat}</CardTitle>
                        <CardDescription>Breakdown by {secondaryCat}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={horizBarData} margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                                <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} width={100} />
                                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Bar dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.8} radius={[0, 6, 6, 0]} barSize={20}>
                                    {horizBarData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Chart 8: Radial Bar Chart (Tertiary Category) - NEW */}
                <Card className="shadow-lg border-0 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow">
                    <CardHeader className="bg-gray-50 border-b border-gray-100">
                        <CardTitle className="text-lg font-bold text-gray-800">Tertiary Segments: {tertiaryCat}</CardTitle>
                        <CardDescription>Radial view of top 5 segments</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={20} data={radialData}>
                                <RadialBar
                                    label={{ position: 'insideStart', fill: '#fff' }}
                                    background
                                    dataKey="uv"
                                />
                                <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            </RadialBarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default AutomatedDashboard;
