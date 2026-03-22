import { useEffect, useState } from "react";
import {
  IndianRupee, ShoppingCart, Users, TrendingUp, CircleDot, AlertTriangle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import StatCard from "@/components/shared/StatCard";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { fetchDashboard, DashboardData } from "@/lib/api";

const chartTooltipStyle = {
  contentStyle: { backgroundColor: "hsl(240 8% 12%)", border: "1px solid hsl(240 8% 18%)", borderRadius: "8px", color: "hsl(40 20% 90%)" },
  labelStyle: { color: "hsl(40 10% 55%)" },
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fallback static data while loading or if API is down
  const goldPriceData = [
    { date: "Jan", price: 5800 }, { date: "Feb", price: 5950 }, { date: "Mar", price: 6100 },
    { date: "Apr", price: 6050 }, { date: "May", price: 6200 }, { date: "Jun", price: 6350 },
    { date: "Jul", price: 6500 }, { date: "Aug", price: 6420 }, { date: "Sep", price: 6600 },
    { date: "Oct", price: 6750 }, { date: "Nov", price: 6900 }, { date: "Dec", price: data?.gold_rate || 7100 },
  ];

  const revenueTrend = data?.revenue_trend?.length
    ? data.revenue_trend.slice(-12)
    : [
        { month: "Jan", revenue: 245000 }, { month: "Feb", revenue: 312000 }, { month: "Mar", revenue: 287000 },
        { month: "Apr", revenue: 356000 }, { month: "May", revenue: 401000 }, { month: "Jun", revenue: 378000 },
        { month: "Jul", revenue: 425000 }, { month: "Aug", revenue: 398000 }, { month: "Sep", revenue: 467000 },
        { month: "Oct", revenue: 512000 }, { month: "Nov", revenue: 589000 }, { month: "Dec", revenue: 634000 },
      ];

  const ordersTrend = data?.orders_trend?.length
    ? data.orders_trend.slice(-12)
    : [
        { month: "Jan", orders: 42 }, { month: "Feb", orders: 56 }, { month: "Mar", orders: 48 },
        { month: "Apr", orders: 63 }, { month: "May", orders: 71 }, { month: "Jun", orders: 65 },
        { month: "Jul", orders: 78 }, { month: "Aug", orders: 69 }, { month: "Sep", orders: 84 },
        { month: "Oct", orders: 92 }, { month: "Nov", orders: 108 }, { month: "Dec", orders: 118 },
      ];

  const totalRevenue = data?.total_revenue ?? 4834500;
  const totalOrders = data?.total_orders ?? 894;
  const totalCustomers = data?.total_customers ?? 1247;
  const goldRate = data?.gold_rate ?? 7100;
  const silverRate = data?.silver_rate ?? 91;

  const topSelling = data?.top_selling?.length
    ? data.top_selling
    : [
        { name: "Gold Ring 22k", sold: 147, revenue: 1834500 },
        { name: "Gold Chain 24k", sold: 98, revenue: 2450000 },
        { name: "Diamond Necklace", sold: 34, revenue: 4120000 },
        { name: "Gold Bangle Set", sold: 76, revenue: 1520000 },
      ];

  const lowStock = data?.low_stock?.length
    ? data.low_stock
    : [
        { name: "22k Gold Ring - Size 8", stock: 2, category: "Rings" },
        { name: "24k Gold Chain 20g", stock: 1, category: "Chains" },
        { name: "Pearl Necklace Set", stock: 3, category: "Necklaces" },
      ];

  const recentTx = data?.recent_transactions?.length
    ? data.recent_transactions
    : [
        { id: "TXN-1847", customer: "Priya Sharma", item: "22k Gold Necklace", amount: 145000, date: "2 min ago", status: "Completed" },
        { id: "TXN-1846", customer: "Raj Mehta", item: "Diamond Ring", amount: 285000, date: "18 min ago", status: "Completed" },
        { id: "TXN-1845", customer: "Anita Patel", item: "Gold Bangle Set", amount: 78500, date: "45 min ago", status: "Completed" },
        { id: "TXN-1844", customer: "Vikram Singh", item: "24k Gold Chain", amount: 192000, date: "1 hr ago", status: "Completed" },
      ];

  return (
    <div className="space-y-8">
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back to JewelVault</p>
          </div>
          {loading && (
            <span className="text-xs text-muted-foreground animate-pulse">Loading live data...</span>
          )}
        </div>
      </AnimatedSection>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Revenue" value={fmt(totalRevenue)} icon={IndianRupee} trend="+12.5%" trendUp highlight="gold" delay={0} />
        <StatCard title="Total Orders" value={totalOrders.toLocaleString("en-IN")} icon={ShoppingCart} trend="+8.2%" trendUp delay={0.05} />
        <StatCard title="Total Customers" value={totalCustomers.toLocaleString("en-IN")} icon={Users} trend="+5.1%" trendUp delay={0.1} />
        <StatCard title="Gold Rate" value={`₹${goldRate.toLocaleString("en-IN")}/g`} icon={CircleDot} trend="+2.9%" trendUp highlight="gold" delay={0.15} />
        <StatCard title="Silver Rate" value={`₹${silverRate.toLocaleString("en-IN")}/g`} icon={CircleDot} trend="+3.4%" trendUp highlight="silver" delay={0.2} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedSection delay={0.1}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Gold Price Trend (₹/gram)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={goldPriceData}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 8% 18%)" />
                <XAxis dataKey="date" stroke="hsl(40 10% 40%)" fontSize={12} />
                <YAxis stroke="hsl(40 10% 40%)" fontSize={12} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="price" stroke="#D4AF37" fill="url(#goldGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 8% 18%)" />
                <XAxis dataKey="month" stroke="hsl(40 10% 40%)" fontSize={12} />
                <YAxis stroke="hsl(40 10% 40%)" fontSize={12} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip {...chartTooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.2}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Orders Trend</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ordersTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 8% 18%)" />
                <XAxis dataKey="month" stroke="hsl(40 10% 40%)" fontSize={12} />
                <YAxis stroke="hsl(40 10% 40%)" fontSize={12} />
                <Tooltip {...chartTooltipStyle} />
                <Line type="monotone" dataKey="orders" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Top Selling Products
            </h3>
            <div className="space-y-3">
              {topSelling.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sold} sold</p>
                  </div>
                  <span className="text-sm font-medium gold-text">{fmt(item.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>

      {/* Bottom widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedSection delay={0.1}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" /> Low Stock Alert
            </h3>
            <div className="space-y-3">
              {lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">All items are well-stocked ✅</p>
              ) : lowStock.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <span className="low-stock">{item.stock} left</span>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="glass-card p-5">
            <h3 className="font-display text-lg font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-3">
              {recentTx.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{tx.customer}</p>
                    <p className="text-xs text-muted-foreground">{tx.item} · {typeof tx.date === "string" && tx.date.includes("T") ? new Date(tx.date).toLocaleDateString("en-IN") : tx.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">{typeof tx.amount === "number" ? fmt(tx.amount) : tx.amount}</span>
                    <p className={`text-xs mt-0.5 ${tx.status === "Refunded" ? "text-destructive" : tx.status === "Processing" ? "text-amber-400" : "text-emerald-400"}`}>{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
