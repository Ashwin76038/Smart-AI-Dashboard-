import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ArrowRight, Activity, Info } from "lucide-react";
import AIChart from "./AIChart";

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

interface StoryCardProps {
    story: StoryNode;
    visualization?: VisualizationSpec;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, visualization }) => {
    return (
        <Card className="overflow-hidden border-0 shadow-lg bg-white/95 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-500 opacity-80" />

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                Data Story Step {story.story_step}
                            </Badge>
                            {visualization?.chart_title && (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                    {visualization.chart_title}
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="text-xl font-bold text-gray-900 leading-tight">
                            {story.headline}
                        </CardTitle>
                        <CardDescription className="text-gray-600 text-base mt-2">
                            {story.narrative}
                        </CardDescription>
                    </div>
                    <div className="p-2 bg-indigo-50 rounded-full text-indigo-600 shrink-0">
                        <Lightbulb className="w-5 h-5" />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Visualization Area */}
                {visualization?.vega_lite_spec ? (
                    <div className="w-full h-[350px] bg-gray-50/50 rounded-xl border border-gray-100 p-2 group-hover:border-indigo-100 transition-colors">
                        <AIChart spec={visualization.vega_lite_spec} className="w-full h-full" />
                    </div>
                ) : (
                    <div className="w-full h-[200px] flex items-center justify-center bg-gray-50 rounded-xl border border-dashed text-gray-400 italic">
                        Visual data not available for this insight
                    </div>
                )}

                {/* Insight Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50/50 p-4 rounded-lg space-y-2 border border-blue-100">
                        <div className="flex items-center gap-2 font-semibold text-blue-900">
                            <Activity className="w-4 h-4" />
                            Why it Matters
                        </div>
                        <p className="text-blue-800 leading-relaxed">
                            {story.why_it_matters}
                        </p>
                    </div>

                    <div className="bg-emerald-50/50 p-4 rounded-lg space-y-2 border border-emerald-100">
                        <div className="flex items-center gap-2 font-semibold text-emerald-900">
                            <ArrowRight className="w-4 h-4" />
                            Suggested Action
                        </div>
                        <p className="text-emerald-800 leading-relaxed">
                            {story.suggested_followup}
                        </p>
                    </div>
                </div>

                {/* Chart Reasoning Footnote */}
                {visualization && (
                    <div className="flex items-start gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100 mt-2">
                        <Info className="w-3 h-3 mt-0.5 shrink-0" />
                        <span>
                            Chart choice: {visualization.why_this_chart} (Rejected: {visualization.rejected_alternative})
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default StoryCard;
