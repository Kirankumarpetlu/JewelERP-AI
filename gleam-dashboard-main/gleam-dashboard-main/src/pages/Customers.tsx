import { useEffect, useState } from "react";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { Crown, Award } from "lucide-react";
import { fetchCustomers, Customer } from "@/lib/api";

const fmt = (n: number) => `\u20B9${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const formatCustomerId = (id: string) => id.slice(-8).toUpperCase();

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers()
      .then((data) => setCustomers(data.customers))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">Customers</h1>
            <p className="text-muted-foreground">Manage your customer relationships · {customers.length} customers</p>
          </div>
          {loading && <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>}
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {customers.length === 0 && !loading && (
            <div className="col-span-3 py-12 text-center text-muted-foreground">
              No customers found.
            </div>
          )}
          {customers.map((customer) => (
            <div key={customer._id} className="glass-card p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center text-primary-foreground font-semibold text-sm">
                  {customer.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{customer.name}</h3>
                    {customer.loyalty === "Gold" ? (
                      <span className="flex items-center gap-1 text-xs gold-text font-medium"><Crown className="w-3 h-3" /> Gold</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium"><Award className="w-3 h-3" /> Silver</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{customer.phone}</p>
                  <p className="text-[11px] font-mono text-muted-foreground/80 mt-1">Customer ID: {formatCustomerId(customer._id)}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/[0.04] backdrop-blur-lg rounded-lg p-2 border border-white/[0.04]">
                  <p className="text-lg font-semibold">{customer.purchases}</p>
                  <p className="text-xs text-muted-foreground">Purchases</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-sm font-semibold gold-text">{fmt(customer.total_spent)}</p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-2">
                  <p className="text-xs font-semibold">
                    {customer.last_visit === "N/A" ? "N/A" : new Date(customer.last_visit).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                  </p>
                  <p className="text-xs text-muted-foreground">Last Visit</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
}
