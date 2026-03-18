/**
 * Vega-Lite Chart Renderer Component
 */
import React, { useEffect, useRef } from 'react';
import embed from 'vega-embed';

interface VegaChartProps {
    spec: any;
    data?: any[];
    title?: string;
    className?: string;
}

export const VegaChart: React.FC<VegaChartProps> = ({
    spec,
    data,
    title,
    className = ''
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && spec) {
            // Prepare spec with data
            const fullSpec = {
                ...spec,
                data: data ? { values: data } : spec.data
            };

            // Embed Vega-Lite chart
            embed(containerRef.current, fullSpec, {
                actions: {
                    export: true,
                    source: false,
                    editor: false
                },
                renderer: 'svg',
                tooltip: true
            }).catch(err => {
                console.error('Vega-Lite embed error:', err);
            });
        }
    }, [spec, data]);

    return (
        <div className={`vega-chart-wrapper ${className}`}>
            {title && (
                <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
            )}
            <div ref={containerRef} className="vega-chart-container" />
        </div>
    );
};
