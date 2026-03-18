import React, { useEffect, useState } from "react";
import { GraphicWalker } from "@kanaries/graphic-walker";
import { Loader2 } from "lucide-react";
import axios from "axios";
import "@kanaries/graphic-walker/dist/style.css";
import ErrorBoundary from "@/components/ErrorBoundary";

interface GraphicWalkerVizProps {
    filename: string;
}

const GraphicWalkerViz: React.FC<GraphicWalkerVizProps> = ({ filename }) => {
    const [data, setData] = useState<any[]>([]);
    const [fields, setFields] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!filename) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                console.log("Fetching full data for Graphic Walker...");
                const res = await axios.post("http://127.0.0.1:5000/get_full_data", {
                    filename: filename
                });

                if (res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
                    const rawData = res.data.data;

                    // 1. Sanitize Data: Replace dots in keys, ensure flat structure
                    const safeData = rawData.map((row: any) => {
                        const newRow: any = {};
                        Object.keys(row).forEach(key => {
                            const safeKey = key.replace(/\./g, '_'); // Dots break GW
                            newRow[safeKey] = row[key];
                        });
                        return newRow;
                    });

                    setData(safeData);

                    // 2. Explicit Field Generation (Prevents Inference Crashes)
                    const sample = safeData[0];
                    const generatedFields = Object.keys(sample).map(key => ({
                        fid: key,
                        name: key.replace(/_/g, ' '),
                        analyticType: typeof sample[key] === 'number' ? 'measure' : 'dimension',
                        semanticType: typeof sample[key] === 'number' ? 'quantitative' : 'nominal',
                    }));
                    setFields(generatedFields);

                    console.log("Graphic Walker Data Loaded:", safeData.length, "rows");
                } else {
                    setError("Failed to load data or dataset is empty.");
                }
            } catch (err) {
                console.error("GW Data Fetch Error:", err);
                setError("Error fetching data for Graphic Walker.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [filename]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl border border-dashed text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading Visual Builder...
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 p-4">{error}</div>;
    }

    if (!data || data.length === 0) {
        return <div className="text-gray-400 p-4">No data available for visualization.</div>;
    }

    return (
        <div className="w-full h-[800px] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative z-0">

            <ErrorBoundary>
                <GraphicWalker
                    key={filename}
                    data={data}
                    fields={fields} // explicitly provide fields
                    hideDataSourceConfig={false}
                />
            </ErrorBoundary>
        </div>
    );
};

export default GraphicWalkerViz;
