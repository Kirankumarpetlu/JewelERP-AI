import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { fetchOrders, Order } from "@/lib/api";

const statusStyle: Record<string, string> = {
  Completed: "text-emerald-400 bg-emerald-400/10",
  Processing: "text-amber-400 bg-amber-400/10",
  Refunded: "text-destructive bg-destructive/10",
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Orders() {
  const [filter, setFilter] = useState("All");
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchOrders(filter === "All" ? undefined : filter, 100)
      .then(data => { setOrders(data.orders); setTotal(data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">Orders</h1>
            <p className="text-muted-foreground">Track all transactions · {total} total</p>
          </div>
          {loading && <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.05}>
        <div className="flex gap-2">
          {["All", "Completed", "Processing", "Refunded"].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.97] ${
                filter === s ? "gold-gradient text-primary-foreground" : "glass-button"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Order ID</th>
                  <th className="text-left py-3 px-4 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 font-medium">Product</th>
                  <th className="text-left py-3 px-4 font-medium">Weight</th>
                  <th className="text-left py-3 px-4 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-muted-foreground">
                      No orders found. Is the backend running?
                    </td>
                  </tr>
                )}
                {orders.map(o => (
                  <tr key={o._id} className="border-b border-border/20 table-row-hover">
                    <td className="py-3 px-4 font-medium gold-text font-mono text-xs">{o._id.slice(-6).toUpperCase()}</td>
                    <td className="py-3 px-4">{o.customer_name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{o.product_name}</td>
                    <td className="py-3 px-4">{o.weight}g</td>
                    <td className="py-3 px-4 font-medium">{fmt(o.total_price)}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(o.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle[o.status] || ""}`}>{o.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
