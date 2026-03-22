import { useState, useMemo, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, Loader2 } from "lucide-react";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { fetchPrices, createBill } from "@/lib/api";

const GST_RATE = 3;

const productTypes = ["Ring", "Chain", "Necklace", "Bangle", "Earring", "Bracelet"];
const purities = [
  { label: "24K (99.9%)", value: "24K", factor: 1 },
  { label: "22K (91.6%)", value: "22K", factor: 0.916 },
  { label: "18K (75%)", value: "18K", factor: 0.75 },
];

export default function POSBilling() {
  const [productType, setProductType] = useState("Ring");
  const [weight, setWeight] = useState("");
  const [purity, setPurity] = useState("22K");
  const [makingCharges, setMakingCharges] = useState(12);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [goldRate, setGoldRate] = useState(7100);
  const [submitting, setSubmitting] = useState(false);
  const [billResult, setBillResult] = useState<any>(null);

  // Fetch live gold price
  useEffect(() => {
    fetchPrices()
      .then(p => setGoldRate(p.gold_rate))
      .catch(() => {}); // fallback to 7100
  }, []);

  const purityData = purities.find(p => p.value === purity)!;
  const weightNum = parseFloat(weight) || 0;

  const calc = useMemo(() => {
    const goldValue = weightNum * goldRate * purityData.factor;
    const making = goldValue * (makingCharges / 100);
    const subtotal = goldValue + making;
    const gst = subtotal * (GST_RATE / 100);
    const total = subtotal + gst;
    return { goldValue, making, gst, total, subtotal };
  }, [weightNum, purityData.factor, makingCharges, goldRate]);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const handleSubmit = async () => {
    if (weightNum <= 0) return;
    setSubmitting(true);
    try {
      const result = await createBill({
        product: productType,
        weight: weightNum,
        purity,
        making_charge: makingCharges,
        customer_name: customerName || "Walk-in Customer",
        customer_phone: customerPhone,
      });
      setBillResult(result);
    } catch (err) {
      alert("Failed to create bill. Please ensure the backend is running.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <AnimatedSection>
        <h1 className="text-3xl font-display font-bold mb-1">POS / Billing</h1>
        <p className="text-muted-foreground">Create invoices for jewellery sales · Live rate: <span className="gold-text font-semibold">₹{goldRate.toLocaleString("en-IN")}/g</span></p>
      </AnimatedSection>

      {billResult && (
        <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-xl p-5 flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-400 mb-1">Bill Created Successfully!</p>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p>Order ID: <span className="text-foreground font-mono">{billResult.order_id?.slice(-8).toUpperCase()}</span></p>
              <p>Total: <span className="gold-text font-bold text-base">{fmt(billResult.total_price)}</span></p>
            </div>
          </div>
          <button onClick={() => setBillResult(null)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Product config */}
        <AnimatedSection delay={0.1}>
          <div className="glass-card-glow p-6 space-y-6">
            <h3 className="font-display text-xl font-semibold">Product Details</h3>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Product Type</label>
              <div className="grid grid-cols-3 gap-2">
                {productTypes.map(t => (
                  <button key={t} onClick={() => setProductType(t)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97] ${productType === t ? "gold-gradient text-primary-foreground" : "glass-button"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Weight (grams)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="Enter weight in grams" className="w-full glass-input px-4 py-3" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Purity</label>
              <div className="flex gap-2">
                {purities.map(p => (
                  <button key={p.value} onClick={() => setPurity(p.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97] ${purity === p.value ? "gold-gradient text-primary-foreground" : "glass-button"}`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Making Charges: {makingCharges}%</label>
              <Slider value={[makingCharges]} onValueChange={([v]) => setMakingCharges(v)} min={5} max={25} step={0.5}
                className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_.relative>div]:bg-primary" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input value={customerName} onChange={e => setCustomerName(e.target.value)}
                placeholder="Customer name (optional)" className="glass-input px-3 py-2.5 text-sm" />
              <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                placeholder="Phone (optional)" className="glass-input px-3 py-2.5 text-sm" />
            </div>

            <div className="bg-white/[0.04] backdrop-blur-xl rounded-lg p-4 border border-white/[0.06]">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Live Gold Rate (22K)</span>
                <span className="gold-text font-semibold">₹{(goldRate * 0.916).toLocaleString("en-IN", { maximumFractionDigits: 0 })}/gram</span>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Right: Invoice */}
        <AnimatedSection delay={0.15}>
          <div className="glass-card-glow p-6 space-y-6">
            <h3 className="font-display text-xl font-semibold">Invoice Preview</h3>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Product: <span className="text-foreground font-medium">{productType}</span></p>
              <p>Weight: <span className="text-foreground font-medium">{weightNum > 0 ? `${weightNum}g` : "—"}</span></p>
              <p>Purity: <span className="text-foreground font-medium">{purityData.label}</span></p>
              {customerName && <p>Customer: <span className="text-foreground font-medium">{customerName}</span></p>}
            </div>

            <div className="border-t border-border/30 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Gold Value</span>
                <span>{fmt(calc.goldValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Making Charges ({makingCharges}%)</span>
                <span>{fmt(calc.making)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{fmt(calc.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST ({GST_RATE}%)</span>
                <span>{fmt(calc.gst)}</span>
              </div>
              <div className="border-t border-border/30 pt-3 flex justify-between">
                <span className="text-lg font-display font-semibold">Total</span>
                <span className="text-2xl font-bold gold-text">{fmt(calc.total)}</span>
              </div>
            </div>

            <button
              disabled={weightNum <= 0 || submitting}
              onClick={handleSubmit}
              className="w-full py-3.5 rounded-lg gold-gradient text-primary-foreground font-semibold text-lg transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center gap-2"
            >
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : "Generate Bill"}
            </button>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
