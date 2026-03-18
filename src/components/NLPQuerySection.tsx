import React, { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

interface ChartInfo {
  type: string;
  x?: string;
  y?: string;
}

interface NLPResponse {
  success: boolean;
  query: string;
  analysis: string;
  pandas_code: string;
  execution_error?: string | null;
  chart: ChartInfo;
  result: Record<string, any>[] | null;
}

interface Props {
  filename: string;
  onQueryComplete?: (query: string, response: NLPResponse) => void;
}

const NLPQuerySection: React.FC<Props> = ({ filename, onQueryComplete }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<NLPResponse | null>(null);
  const [error, setError] = useState<string>("");

  // ✅ NEW: Sanitize filename once (ensures correct file always used)
  const [safeFilename, setSafeFilename] = useState("");

  useEffect(() => {
    if (filename) {
      const clean = filename.replace(/^cleaned_/, "").trim();
      setSafeFilename(clean);
      console.log("🧩 Final filename used:", clean);
    }
  }, [filename]);


  const handleQuery = async () => {
    if (!query) {
      alert("Please enter a query");
      return;
    }

    if (!safeFilename) {
      alert("No valid filename found. Please clean a dataset first.");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      console.log("🚀 Sending NLP query with:", {
        query,
        filename: safeFilename,
      });

      const res = await axios.post("http://127.0.0.1:5000/nlp_query", {
        query,
        filename: safeFilename,
      });

      setResponse(res.data);
      if (onQueryComplete) onQueryComplete(query, res.data);
    } catch (err: any) {
      console.error("❌ Error while querying backend:", err);
      let errorMsg = "❌ Failed to get response from backend.";

      if (err.response) {
        // Server responded with a status code out of 2xx range
        errorMsg += ` Server responded with ${err.response.status}: ${err.response.data?.error || err.response.statusText
          }`;
      } else if (err.request) {
        // Request was made but no response received
        errorMsg += " No response received. Is the Flask backend running at http://127.0.0.1:5000?";
      } else {
        // Something happened in setting up the request
        errorMsg += ` ${err.message}`;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!response?.result || !response?.chart?.type) return null;
    const { type, x, y } = response.chart;
    const data = response.result;

    switch (type) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={x} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={y} fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={x} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={y} stroke="#4f46e5" />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey={y}
                nameKey={x}
                outerRadius={100}
                fill="#4f46e5"
                label
              >
                {data.map((_, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={`hsl(${i * 45}, 70%, 60%)`}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return <p className="text-gray-400">⚠️ No valid chart type detected.</p>;
    }
  };

  return (
    <Card className="p-6 mt-6 bg-gray-900 border border-gray-700 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-100">
        💬 Ask a Question About Your Data
      </h2>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="e.g., Show average sales by region"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 bg-gray-800 text-gray-100"
        />
        <Button onClick={handleQuery} disabled={loading}>
          {loading ? "Analyzing..." : "Ask"}
        </Button>
      </div>

      {error && <p className="text-red-400">{error}</p>}

      {response && (
        <CardContent className="bg-gray-800 p-5 rounded-xl text-gray-100">
          <h3 className="text-lg font-semibold">🧠 AI Analysis</h3>
          <p className="text-gray-300 mt-2">
            {response.analysis || "No analysis provided."}
          </p>

          <h4 className="text-md font-semibold mt-4">📜 Pandas Code</h4>
          <pre className="bg-gray-900 p-3 rounded text-sm text-green-400 overflow-x-auto">
            {response.pandas_code || "N/A"}
          </pre>

          {response.execution_error && (
            <p className="text-red-400 mt-3">
              ⚠️ Execution error: {response.execution_error}
            </p>
          )}

          <h4 className="text-md font-semibold mt-5 mb-2">📊 Visualization</h4>
          {renderChart()}

          {response.result && response.result.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-semibold mb-2">📋 Retrieved Data</h4>
              <div className="overflow-x-auto bg-gray-900 rounded-lg p-2 max-h-60 overflow-y-auto">
                <table className="min-w-full text-sm text-left text-gray-300">
                  <thead className="text-xs text-gray-400 uppercase bg-gray-800">
                    <tr>
                      {Object.keys(response.result[0]).map((key) => (
                        <th key={key} className="px-4 py-2 border-b border-gray-700">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {response.result.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-800 border-b border-gray-800 last:border-0">
                        {Object.values(row).map((val: any, colIdx) => (
                          <td key={colIdx} className="px-4 py-2">
                            {typeof val === "object" ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default NLPQuerySection;
