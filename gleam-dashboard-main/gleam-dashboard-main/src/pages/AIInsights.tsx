import { useEffect, useState } from "react";
import { TrendingUp, Package, IndianRupee, AlertTriangle, Lightbulb, Star, RefreshCw } from "lucide-react";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { fetchInsights, Insight } from "@/lib/api";

const iconMap: Record<string, React.ElementType> = {
  TrendingUp, Package, IndianRupee, AlertTriangle, Lightbulb, Star,
};
const colorMap: Record<string, { text: string; bg: string }> = {
  emerald: { text: "text-emerald-400", bg: "bg-emerald-400/10" },
  amber: { text: "text-amber-400", bg: "bg-amber-400/10" },
  primary: { text: "text-primary", bg: "bg-primary/10" },
  destructive: { text: "text-destructive", bg: "bg-destructive/10" },
  silver: { text: "text-muted-foreground", bg: "bg-muted/20" },
};

const staticFallback = [
  { icon: "TrendingUp", title: "Rings are trending this week", description: "Ring sales up 23% compared to last week. Consider featuring rings in your display.", color: "emerald" },
  { icon: "Package", title: "Increase stock for bangles", description: "Bangle inventory is running low. Wedding season approaching — expect 40% surge.", color: "amber" },
  { icon: "IndianRupee", title: "Revenue expected to grow by 15%", description: "Based on current trends and seasonal patterns, March revenue will exceed ₹50L.", color: "primary" },
  { icon: "AlertTriangle", title: "Gold prices may spike next week", description: "International market indicators suggest a 3-5% increase. Consider stocking up.", color: "destructive" },
  { icon: "Star", title: "22K purity most popular", description: "78% of customers prefer 22K gold. Adjust procurement accordingly.", color: "primary" },
  { icon: "Lightbulb", title: "Diwali prep recommendation", description: "Start Diwali collection procurement by April. Last year's demand exceeded stock by 35%.", color: "amber" },
];

export default function AIInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const load = () => {
    setLoading(true);
    fetchInsights()
      .then(d => {
        setInsights(d.insights || []);
        setUsingFallback(false);
      })
      .catch(() => {
        setInsights(staticFallback as any);
        setUsingFallback(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">AI Insights</h1>
            <p className="text-muted-foreground">
              {usingFallback ? "Showing sample insights · Start backend for live AI analysis" : "AI-powered business intelligence from your real data"}
            </p>
          </div>
          <button onClick={load} disabled={loading}
            className="glass-button flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all active:scale-[0.97]">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </AnimatedSection>

      {usingFallback && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg px-4 py-3 text-sm text-amber-400">
          ⚠ Backend is not connected. Showing sample insights. Start the FastAPI backend to see real AI analysis.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, i) => {
          const colors = colorMap[insight.color] || colorMap.primary;
          const IconComp = iconMap[insight.icon] || Lightbulb;
          return (
            <AnimatedSection key={i} delay={i * 0.06}>
              <div className="glass-card-glow p-5 flex gap-4 transition-all duration-300 hover:-translate-y-0.5">
                <div className={`w-11 h-11 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                  <IconComp className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{insight.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>
                      {insight.type}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
                </div>
              </div>
            </AnimatedSection>
          );
        })}
      </div>
    </div>
  );
}
