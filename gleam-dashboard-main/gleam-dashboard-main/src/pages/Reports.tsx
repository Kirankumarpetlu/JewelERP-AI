import { FileText, Download } from "lucide-react";
import AnimatedSection from "@/components/shared/AnimatedSection";

const reports = [
  { name: "Monthly Sales Report - March 2024", date: "2024-03-15", type: "Sales", size: "2.4 MB" },
  { name: "Inventory Audit Report", date: "2024-03-10", type: "Inventory", size: "1.8 MB" },
  { name: "Customer Analytics Q1 2024", date: "2024-03-01", type: "Analytics", size: "3.1 MB" },
  { name: "GST Filing Report - Feb 2024", date: "2024-02-28", type: "Tax", size: "890 KB" },
  { name: "Gold Purchase Ledger", date: "2024-02-25", type: "Purchase", size: "1.2 MB" },
  { name: "Profit & Loss Statement", date: "2024-02-20", type: "Financial", size: "2.7 MB" },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <AnimatedSection>
        <h1 className="text-3xl font-display font-bold mb-1">Reports</h1>
        <p className="text-muted-foreground">Generate and download business reports</p>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="grid gap-3">
          {reports.map((r, i) => (
            <div key={i} className="glass-card p-4 flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.date} · {r.type} · {r.size}</p>
                </div>
              </div>
              <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-primary transition-colors">
                <Download className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
}
