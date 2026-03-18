import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LayoutDashboard,
  Sparkles,
  BarChart3,
  FileText,
  LogOut,
  Loader2,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

// Components
import AutomatedDashboard from "@/components/AutomatedDashboard";
import AIChart from "@/components/AIChart";
import StoryCard from "@/components/StoryCard";
import NLPChatHistory from "@/components/NLPChatHistory";

// ------------------- Interfaces -------------------
interface StoryNode {
  story_step: number;
  headline: string;
  narrative: string;
  why_it_matters: string;
  suggested_followup: string;
  chart_id: string;
}

interface VisualizationSpec {
  chart_id: string;
  chart_title: string;
  vega_lite_spec: any;
  rejected_alternative: string;
  why_this_chart: string;
}

const DashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State from location
  const preview = (location.state as any)?.preview || [];
  const filenameFromUpload = (location.state as any)?.filename || "";
  const filename = String(filenameFromUpload).trim().replace(/^cleaned_/, "");
  const summary = (location.state as any)?.summary || null;

  // Local State
  const [viewMode, setViewMode] = useState<"dashboard" | "story" | "explore">("dashboard");
  const [story, setStory] = useState<StoryNode[]>([]);
  const [visualizations, setVisualizations] = useState<VisualizationSpec[]>([]);
  const [aiChartSpecs, setAiChartSpecs] = useState<any[]>([]); // Fallback
  const [isGeneratingChart, setIsGeneratingChart] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  // ------------------- AI Insight Generation (Story Mode) -------------------
  const fetchWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 2000): Promise<any> => {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      toast.info(`AI Service busy. Retrying... (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 1.5);
    }
  };

  const handleGenerateStory = async () => {
    if (!filename) {
      toast.error("No filename found.");
      return;
    }

    setIsGeneratingChart(true);

    try {
      const response = await fetchWithRetry(async () => {
        return await axios.post("http://127.0.0.1:5000/generate_insight_chart", { filename });
      });

      if (response.data.success) {
        setStory(response.data.story || []);
        setVisualizations(response.data.visualizations || []);
        setAiChartSpecs(response.data.specs || []);

        if (response.data.story && response.data.story.length > 0) {
          toast.success("AI Story Generated Successfully! 📖");
        } else {
          toast.info("Generated Heuristic Insights (AI Story Unavailable)");
        }
      } else {
        throw new Error(response.data.error || "Unknown error");
      }
    } catch (error: any) {
      console.error("Failed to generate story:", error);
      toast.error("AI Service failed. Showing manual tools.");
    } finally {
      setIsGeneratingChart(false);
    }
  };

  // Auto-generate story when switching to story mode if empty
  useEffect(() => {
    if (viewMode === "story" && story.length === 0 && !isGeneratingChart) {
      handleGenerateStory();
    }
  }, [viewMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 space-y-8">

      {/* ------------------- Header ------------------- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Smart Analytics</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
              {filename || "No Dataset Uploaded"}
            </p>
          </div>
        </div>

        {/* View Mode Toggles */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl shadow-inner">
          <button
            onClick={() => setViewMode("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "dashboard"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setViewMode("story")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "story"
                ? "bg-white text-purple-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
              }`}
          >
            <Sparkles className="w-4 h-4" />
            AI Story
          </button>
          <button
            onClick={() => setViewMode("explore")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === "explore"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
              }`}
          >
            <Share2 className="w-4 h-4" />
            Explorer
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/upload")}
            className="hidden md:flex bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm"
          >
            Upload New
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            title="Sign Out"
            className="text-gray-400 hover:text-red-500"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* ------------------- Content Area ------------------- */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* MODE 1: Automated Dashboard (Recharts) */}
        {viewMode === "dashboard" && (
          <AutomatedDashboard summary={summary} preview={preview} />
        )}

        {/* MODE 2: AI Storytelling (Vega-Lite) */}
        {viewMode === "story" && (
          <Card className="min-h-[600px] p-6 bg-white/80 backdrop-blur-md border border-purple-100 shadow-xl rounded-2xl relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    AI Narrative Engine
                  </h2>
                  <p className="text-gray-500">Deep dive analysis powered by Gemini 2.0</p>
                </div>
                <Button
                  onClick={handleGenerateStory}
                  disabled={isGeneratingChart}
                  className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
                >
                  {isGeneratingChart ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analyzing...</>
                  ) : (
                    "Refresh Analysis"
                  )}
                </Button>
              </div>

              {story.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {story.map((node, index) => {
                    // Primary: match by chart_id; Fallback: match by position index
                    const viz = visualizations.find(v => v.chart_id === node.chart_id) || visualizations[index];
                    return (
                      <StoryCard key={index} story={node} visualization={viz} />
                    );
                  })}
                </div>
              ) : aiChartSpecs.length > 0 ? (
                // Fallback Heuristics
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {aiChartSpecs.map((spec: any, index: number) => (
                    <Card key={index} className="p-4 border border-gray-100 shadow-sm">
                      <h3 className="font-semibold text-gray-700 mb-4">{spec.title?.text}</h3>
                      <AIChart spec={spec} className="w-full h-64" />
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                  {isGeneratingChart ? (
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600">Weaving your data story...</p>
                      <p className="text-sm">This involves complex reasoning, please wait.</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                      <p>Ready to analyze. Click "Refresh Analysis" to start.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}

        {/* MODE 3: Visual Explorer (Graphic Walker) */}
        {viewMode === "explore" && (
          <div className="h-[85vh] bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden relative">
            <iframe
              src={`http://127.0.0.1:5000/explore?filename=${filename}`}
              className="w-full h-full border-0"
              title="Visual Explorer"
              loading="lazy"
            />
          </div>
        )}

      </div>

      {/* NLP Chat (Global) */}
      <NLPChatHistory filename={filename} />

    </div>
  );
};

export default DashboardPage;
