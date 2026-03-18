import React, { useState } from "react";
import NLPQuerySection from "@/components/NLPQuerySection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QueryRecord {
  id: number;
  question: string;
  response: any;
}

interface Props {
  filename: string;
}

const NLPChatHistory: React.FC<Props> = ({ filename }) => {
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [activeQuery, setActiveQuery] = useState<QueryRecord | null>(null);
  const [counter, setCounter] = useState(1);

  // Called when a new NLP response comes back from NLPQuerySection
  const handleNewQuery = (q: string, res: any) => {
    const record = { id: counter, question: q, response: res };
    setCounter((c) => c + 1);
    setQueries((prev) => [record, ...prev]);
    setActiveQuery(record);
  };

  return (
    <div className="space-y-8 mt-8">
      {/* Input Section */}
      <NLPQuerySection filename={filename} onQueryComplete={handleNewQuery} />

      {/* History Section */}
      {queries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            🕑 Query History
          </h2>
          {queries.map((q) => (
            <Card
              key={q.id}
              className={`p-4 border ${
                activeQuery?.id === q.id
                  ? "border-indigo-500 bg-indigo-50/60"
                  : "border-gray-200"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-700">
                  {q.question}
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setActiveQuery(q)}
                >
                  View Result
                </Button>
              </div>

              {activeQuery?.id === q.id && q.response && (
                <div className="bg-white p-3 rounded-lg shadow-inner">
                  <p className="text-gray-700 mb-2">
                    {q.response.analysis || "No analysis"}
                  </p>
                  {q.response.chart && q.response.chart.type && (
                    <p className="text-sm text-gray-500 italic">
                      Chart Type: {q.response.chart.type}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NLPChatHistory;
