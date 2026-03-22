import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { fetchRevenue, fetchSalesByType, fetchTopCustomers } from "@/lib/api";

const COLORS = ["#D4AF37", "#a78bfa", "#C0C0C0", "#f59e0b", "#ec4899", "#34d399"];
const chartTooltip = {
  contentStyle: { backgroundColor: "hsl(240 8% 12%)", border: "1px solid hsl(240 8% 18%)", borderRadius: "8px", color: "hsl(40 20% 90%)" },
  labelStyle: { color: "hsl(40 10% 55%)" },
};
const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

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
        setSalesByType(byType.sales_by_type || []);
        setTopCustomers(topCust.top_customers || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Static seasonal fallback always shown
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
            <p className="text-muted-foreground">Business intelligence & trends</p>
          </div>
          {loading && <span className="text-xs text-muted-foreground animate-pulse">Loading live data...</span>}
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedSection delay={0.1}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Sales by Product Type</h3>
            {salesByType.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No data yet. Backend needs to be running.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={salesByType} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {salesByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...chartTooltip} formatter={(v: number) => [v, "Orders"]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Monthly Revenue (₹ thousands)</h3>
            {monthlyRevenue.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No data yet. Backend needs to be running.</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 8% 18%)" />
                  <XAxis dataKey="month" stroke="hsl(40 10% 40%)" fontSize={12} />
                  <YAxis stroke="hsl(40 10% 40%)" fontSize={12} tickFormatter={v => `₹${v}k`} />
                  <Tooltip {...chartTooltip} formatter={(v: number) => [`₹${v}k`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
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
                    <span className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-xs text-primary-foreground font-bold">{i + 1}</span>
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
            <h3 className="font-display text-lg font-semibold mb-4">Festival / Season Trends (₹ thousands)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={seasonalTrends} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 8% 18%)" />
                <XAxis type="number" stroke="hsl(40 10% 40%)" fontSize={12} />
                <YAxis type="category" dataKey="season" stroke="hsl(40 10% 40%)" fontSize={12} width={80} />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="revenue" fill="#a78bfa" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
