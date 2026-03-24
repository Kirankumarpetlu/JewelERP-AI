import { useState, useMemo, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { CheckCircle, Loader2 } from "lucide-react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { fetchPrices, createBill, findCustomerByIdentity, Customer } from "@/lib/api";
import { db } from "@/lib/firebase";

const GST_RATE = 3;

const productTypes = ["Ring", "Chain", "Necklace", "Bangle", "Earring", "Bracelet"];
const metalTypes = [
  { label: "Gold", value: "gold" as const },
  { label: "Silver", value: "silver" as const },
];
const goldPurities = [
  { label: "24K (99.9%)", value: "24K", factor: 1 },
  { label: "22K (91.6%)", value: "22K", factor: 0.916 },
  { label: "18K (75%)", value: "18K", factor: 0.75 },
];
const silverPurities = [
  { label: "999 (99.9%)", value: "999", factor: 1 },
  { label: "925 Sterling", value: "925", factor: 0.925 },
];
const formatCustomerId = (id?: string) => (id ? id.slice(-8).toUpperCase() : "");

interface EmployeeOption {
  id: string;
  name: string;
  role: string;
}

export default function POSBilling() {
  const [productType, setProductType] = useState("Ring");
  const [metalType, setMetalType] = useState<"gold" | "silver">("gold");
  const [weight, setWeight] = useState("");
  const [purity, setPurity] = useState("22K");
  const [makingCharges, setMakingCharges] = useState(12);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [goldRate, setGoldRate] = useState(7100);
  const [silverRate, setSilverRate] = useState(91);
  const [submitting, setSubmitting] = useState(false);
  const [matchedCustomer, setMatchedCustomer] = useState<Customer | null>(null);
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [billResult, setBillResult] = useState<any>(null);

  useEffect(() => {
    fetchPrices()
      .then((prices) => {
        setGoldRate(prices.gold_rate);
        setSilverRate(prices.silver_rate);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const employeesQuery = query(collection(db, "employees"), orderBy("name"));
    return onSnapshot(employeesQuery, (snapshot) => {
      setEmployees(snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          name: String(data.name || ""),
          role: String(data.role || "sales"),
        };
      }));
    });
  }, []);

  useEffect(() => {
    setPurity(metalType === "silver" ? "925" : "22K");
  }, [metalType]);

  useEffect(() => {
    const hasLookupValue = customerPhone.trim() || customerName.trim();
    if (!hasLookupValue) {
      setMatchedCustomer(null);
      setCustomerLookupLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCustomerLookupLoading(true);
      findCustomerByIdentity(customerName, customerPhone)
        .then((customer) => setMatchedCustomer(customer))
        .catch(() => setMatchedCustomer(null))
        .finally(() => setCustomerLookupLoading(false));
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [customerName, customerPhone]);

  const availablePurities = metalType === "silver" ? silverPurities : goldPurities;
  const purityData = availablePurities.find((item) => item.value === purity) || availablePurities[0];
  const weightNum = parseFloat(weight) || 0;
  const liveRate = metalType === "silver" ? silverRate : goldRate;
  const metalLabel = metalType === "silver" ? "Silver" : "Gold";
  const accentClass = metalType === "silver" ? "text-slate-200" : "gold-text";

  const calc = useMemo(() => {
    const metalValue = weightNum * liveRate * purityData.factor;
    const making = metalValue * (makingCharges / 100);
    const subtotal = metalValue + making;
    const gst = subtotal * (GST_RATE / 100);
    const total = subtotal + gst;
    return { metalValue, making, gst, total, subtotal };
  }, [weightNum, liveRate, purityData.factor, makingCharges]);

  const fmt = (n: number) => `\u20B9${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const handleSubmit = async () => {
    if (weightNum <= 0) return;
    setSubmitting(true);
    try {
      const result = await createBill({
        product: productType,
        weight: weightNum,
        purity,
        metal_type: metalType,
        employee_id: employeeId,
        making_charge: makingCharges,
        customer_name: customerName || "Walk-in Customer",
        customer_phone: customerPhone,
      });
      setBillResult(result);
    } catch {
      alert("Failed to create bill. Please ensure the backend or Firebase is reachable.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <AnimatedSection>
        <h1 className="text-3xl font-display font-bold mb-1">POS / Billing</h1>
        <p className="text-muted-foreground">
          Create invoices for jewellery sales · Live {metalLabel.toLowerCase()} rate:{" "}
          <span className={`${accentClass} font-semibold`}>{fmt(liveRate)}/g</span>
        </p>
      </AnimatedSection>

      {billResult && (
        <div className="bg-emerald-400/10 border border-emerald-400/30 rounded-xl p-5 flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-400 mb-1">Bill Created Successfully!</p>
            <div className="text-sm text-muted-foreground space-y-0.5">
              <p>Order ID: <span className="text-foreground font-mono">{billResult.order_id?.slice(-8).toUpperCase()}</span></p>
              <p>Metal: <span className="text-foreground font-medium capitalize">{billResult.metal_type || metalType}</span></p>
              {billResult.employee_id && (
                <p>Employee ID: <span className="text-foreground font-mono">{billResult.employee_id.slice(-8).toUpperCase()}</span></p>
              )}
              {billResult.customer_id && (
                <p>Customer ID: <span className="text-foreground font-mono">{formatCustomerId(billResult.customer_id)}</span></p>
              )}
              <p>Total: <span className={`${accentClass} font-bold text-base`}>{fmt(billResult.total_price)}</span></p>
            </div>
          </div>
          <button onClick={() => setBillResult(null)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatedSection delay={0.1}>
          <div className="glass-card-glow p-6 space-y-6">
            <h3 className="font-display text-xl font-semibold">Product Details</h3>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Metal</label>
              <div className="grid grid-cols-2 gap-2">
                {metalTypes.map((metal) => (
                  <button
                    key={metal.value}
                    onClick={() => setMetalType(metal.value)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                      metalType === metal.value ? "gold-gradient text-primary-foreground" : "glass-button"
                    }`}
                  >
                    {metal.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Product Type</label>
              <div className="grid grid-cols-3 gap-2">
                {productTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setProductType(type)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                      productType === type ? "gold-gradient text-primary-foreground" : "glass-button"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Assigned Employee</label>
              <select
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                className="w-full glass-input px-4 py-3 text-sm"
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Weight (grams)</label>
              <input
                type="number"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder="Enter weight in grams"
                className="w-full glass-input px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Purity</label>
              <div className="flex gap-2">
                {availablePurities.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setPurity(item.value)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                      purity === item.value ? "gold-gradient text-primary-foreground" : "glass-button"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Making Charges: {makingCharges}%</label>
              <Slider
                value={[makingCharges]}
                onValueChange={([value]) => setMakingCharges(value)}
                min={5}
                max={25}
                step={0.5}
                className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary [&_.relative>div]:bg-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Customer name"
                className="glass-input px-3 py-2.5 text-sm"
              />
              <input
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Phone"
                className="glass-input px-3 py-2.5 text-sm"
              />
            </div>

            {(customerLookupLoading || matchedCustomer) && (
              <div className="bg-white/[0.04] backdrop-blur-xl rounded-lg p-4 border border-white/[0.06] space-y-1">
                {customerLookupLoading ? (
                  <p className="text-sm text-muted-foreground animate-pulse">Checking existing customer...</p>
                ) : matchedCustomer ? (
                  <>
                    <p className="text-sm font-medium text-foreground">Existing customer found</p>
                    <p className="text-xs text-muted-foreground">
                      Customer ID: <span className="font-mono text-foreground">{formatCustomerId(matchedCustomer._id)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      This bill will update {matchedCustomer.name}&apos;s record with the latest purchases and details.
                    </p>
                  </>
                ) : null}
              </div>
            )}

            <div className="bg-white/[0.04] backdrop-blur-xl rounded-lg p-4 border border-white/[0.06]">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Live {metalLabel} Rate ({purityData.value})</span>
                <span className={`${accentClass} font-semibold`}>{fmt(liveRate * purityData.factor)}/gram</span>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="glass-card-glow p-6 space-y-6">
            <h3 className="font-display text-xl font-semibold">Invoice Preview</h3>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Metal: <span className="text-foreground font-medium">{metalLabel}</span></p>
              {employeeId && (
                <p>
                  Employee:{" "}
                  <span className="text-foreground font-medium">
                    {employees.find((employee) => employee.id === employeeId)?.name || employeeId}
                  </span>
                </p>
              )}
              <p>Product: <span className="text-foreground font-medium">{productType}</span></p>
              <p>Weight: <span className="text-foreground font-medium">{weightNum > 0 ? `${weightNum}g` : "-"}</span></p>
              <p>Purity: <span className="text-foreground font-medium">{purityData.label}</span></p>
              {customerName && <p>Customer: <span className="text-foreground font-medium">{customerName}</span></p>}
              {matchedCustomer?._id && <p>Customer ID: <span className="text-foreground font-mono">{formatCustomerId(matchedCustomer._id)}</span></p>}
            </div>

            <div className="border-t border-border/30 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{metalLabel} Value</span>
                <span>{fmt(calc.metalValue)}</span>
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
                <span className={`text-2xl font-bold ${accentClass}`}>{fmt(calc.total)}</span>
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
