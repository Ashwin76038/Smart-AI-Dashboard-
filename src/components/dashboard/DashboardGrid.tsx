import React, { useState } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import ChartRenderer from '@/components/charts/ChartRenderer';
import { Settings, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartData {
    id: string;
    title: string;
    rechartsSpec: any;
}

interface DashboardGridProps {
    charts: ChartData[];
    data: any[];
    onLayoutChange?: (layout: Layout[]) => void;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ charts, data, onLayoutChange }) => {
    const [layout, setLayout] = useState<Layout[]>(() =>
        charts.map((chart, index) => ({
            i: chart.id,
            x: (index % 2) * 6,
            y: Math.floor(index / 2) * 4,
            w: 6,
            h: 4,
            minW: 3,
            minH: 3,
        }))
    );

    const handleLayoutChange = (newLayout: Layout[]) => {
        setLayout(newLayout);
        onLayoutChange?.(newLayout);
    };

    return (
        <GridLayout
            className="layout"
            layout={layout}
            cols={12}
            rowHeight={100}
            width={1200}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            margin={[24, 24] as [number, number]}
            containerPadding={[0, 0] as [number, number]}
            isResizable={true}
            isDraggable={true}
        >
            {charts.map((chart) => (
                <div key={chart.id} className="chart-card relative group">
                    {/* Drag Handle */}
                    <div className="drag-handle absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10">
                        <div className="p-1.5 rounded-lg bg-muted/80 backdrop-blur-sm">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>

                    {/* Settings Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                    </Button>

                    {/* Chart Title */}
                    <h3 className="text-lg font-semibold text-foreground mb-4 px-2 pt-2">
                        {chart.title}
                    </h3>

                    {/* Chart */}
                    <div className="h-[calc(100%-60px)]">
                        <ChartRenderer
                            chartSpec={chart.rechartsSpec}
                            data={data}
                        />
                    </div>
                </div>
            ))}
        </GridLayout>
    );
};

export default DashboardGrid;
