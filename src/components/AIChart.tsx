
import React, { useEffect, useRef } from 'react';
import embed from 'vega-embed';

interface AIChartProps {
    spec: any;
    className?: string;
}

const AIChart: React.FC<AIChartProps> = ({ spec, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [error, setError] = React.useState<string | null>(null);

    useEffect(() => {
        if (containerRef.current && spec) {
            // Reset error on new spec
            setError(null);

            let finalSpec = spec;
            try {
                // Defensive copy to avoid mutating props
                finalSpec = JSON.parse(JSON.stringify(spec));
                
                // 1. Ensure $schema exists (Vega Embed needs it for guessMode sometimes)
                if (!finalSpec['$schema']) {
                    console.warn("⚠️ Spec missing $schema, injecting default Vega-Lite v5.");
                    finalSpec['$schema'] = "https://vega.github.io/schema/vega-lite/v5.json";
                }

                // 2. Ensure data.values is an array (if data exists)
                if (finalSpec.data && finalSpec.data.values && !Array.isArray(finalSpec.data.values)) {
                    console.warn("⚠️ Spec data.values is not an array, fixing...");
                    finalSpec.data.values = []; 
                }
            } catch (e) {
                console.error("Error preprocessing spec:", e);
            }

            embed(containerRef.current, finalSpec, {
                actions: { export: true, source: false, editor: false },
                mode: "vega-lite",
                renderer: "svg" // sharper rendering
            }).then((res) => {
                console.log("✅ Chart rendered successfully");
            }).catch((err) => {
                console.error("Vega Embed Error:", err);
                console.log("Failed Spec (JSON):", JSON.stringify(finalSpec, null, 2));
                setError(`Failed to render chart: ${err.message || err}`);
            });
        }
    }, [spec]);

    if (!spec) return <div className="p-4 text-gray-500 italic">No chart data available</div>;

    return (
        <div className={`w-full overflow-hidden relative ${className}`} style={{ minHeight: '320px' }}>
            {error ? (
                <div className="flex flex-col items-center justify-center h-full text-red-500 bg-red-50 rounded-lg p-4 text-center">
                    <span className="font-bold mb-1">⚠️ Chart Verification Error</span>
                    <span className="text-xs text-red-400 break-words max-w-full">{error}</span>
                    <span className="text-[10px] text-gray-400 mt-2">Check console for spec details</span>
                </div>
            ) : (
                <div ref={containerRef} className="w-full h-full flex justify-center items-center" />
            )}
        </div>
    );
};

export default AIChart;
