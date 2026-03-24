import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { fetchRevenue, fetchSalesByType, fetchTopCustomers } from "@/lib/api";

const COLORS = ["#F8FAFC", "#CBD5E1", "#94A3B8", "#64748B", "#334155", "#E2E8F0"];
const chartTooltip = {
  contentStyle: { backgroundColor: "hsl(220 14% 9%)", border: "1px solid hsl(220 10% 22%)", borderRadius: "8px", color: "hsl(0 0% 96%)" },
  labelStyle: { color: "hsl(220 8% 68%)" },
  itemStyle: { color: "hsl(0 0% 96%)" },
  wrapperStyle: { outline: "none" },
};
const fmt = (n: number) => `\u20B9${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Analytics() {
  const [salesByType, setSalesByType] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchRevenue(), fetchSalesByType(), fetchTopCustomers()])
      .then(([rev, byType, topCust]) => {
        setMonthlyRevenue((rev.monthly || []).slice(-12).map((m: any) => ({
          month: m.month, revenue: Math.round(m.revenue / 1000),
        })));
        setSalesByType((byType.sales_by_type || []).slice(0, 6));
        setTopCustomers(topCust.top_customers || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const seasonalTrends = [
    { season: "Diwali", revenue: 8500 },
    { season: "Wedding", revenue: 12400 },
    { season: "Akshaya T.", revenue: 6700 },
    { season: "Dhanteras", revenue: 9200 },
    { season: "Regular", revenue: 3800 },
  ];

  return (
    <div className="space-y-8">
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">Analytics</h1>
            <p className="text-muted-foreground">Business intelligence and trends</p>
          </div>
          {loading && <span className="text-xs text-muted-foreground animate-pulse">Loading live data...</span>}
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedSection delay={0.1}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Sales by Category</h3>
            {salesByType.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No data yet.</p>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] gap-6 items-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={salesByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={3}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={1}
                      dataKey="value"
                      label={false}
                    >
                      {salesByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...chartTooltip} formatter={(v: number) => [v, "Orders"]} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="space-y-3">
                  {salesByType.map((item, index) => {
                    const total = salesByType.reduce((sum, current) => sum + current.value, 0);
                    const percent = total ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-foreground truncate">{item.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{item.value} orders · {percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Monthly Revenue (\u20B9 thousands)</h3>
            {monthlyRevenue.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No data yet. Backend needs to be running.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 22%)" />
                  <XAxis dataKey="month" stroke="hsl(220 8% 68%)" fontSize={12} />
                  <YAxis stroke="hsl(220 8% 68%)" fontSize={12} tickFormatter={v => `\u20B9${v}k`} />
                  <Tooltip {...chartTooltip} formatter={(v: number) => [`\u20B9${v}k`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Top Customers by Spend</h3>
            <div className="space-y-3">
              {topCustomers.length === 0 && !loading && (
                <p className="text-muted-foreground text-sm">No data yet.</p>
              )}
              {topCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-xs text-white font-bold">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.orders} orders</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium gold-text">{fmt(c.spent)}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Festival / Season Trends (\u20B9 thousands)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={seasonalTrends} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 10% 22%)" />
                <XAxis type="number" stroke="hsl(220 8% 68%)" fontSize={12} />
                <YAxis type="category" dataKey="season" stroke="hsl(220 8% 68%)" fontSize={12} width={80} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="revenue" fill="#94A3B8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
