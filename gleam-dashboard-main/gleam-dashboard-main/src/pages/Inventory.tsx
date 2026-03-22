import { useEffect, useState } from "react";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { fetchInventory, addProduct, deleteProduct, Product } from "@/lib/api";

const categories = ["All", "Ring", "Chain", "Necklace", "Bangle", "Earring", "Bracelet"];
const categoryEmoji: Record<string, string> = {
  Ring: "💍", Chain: "⛓️", Necklace: "📿", Bangle: "⭕", Earring: "✨", Bracelet: "🔗", default: "🏅"
};
const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Ring", weight: "", purity: "22K", stock: "", price: "" });

  const load = () => {
    setLoading(true);
    fetchInventory(category === "All" ? undefined : category, search || undefined)
      .then(d => setProducts(d.products))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [category, search]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await deleteProduct(id).catch(console.error);
    load();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProduct({
      name: form.name, category: form.category,
      weight: Number(form.weight), purity: form.purity,
      stock: Number(form.stock), price: Number(form.price),
    }).catch(console.error);
    setShowAdd(false);
    setForm({ name: "", category: "Ring", weight: "", purity: "22K", stock: "", price: "" });
    load();
  };

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-1">Inventory</h1>
            <p className="text-muted-foreground">Manage your jewellery stock · {products.length} items</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="gold-gradient text-primary-foreground px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all active:scale-[0.97] self-start"
          >
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </AnimatedSection>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card p-6 w-full max-w-md space-y-4 relative">
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-display text-xl font-semibold">Add New Product</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Product name" className="w-full glass-input px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="glass-input px-3 py-2 text-sm">
                  {categories.filter(c => c !== "All").map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={form.purity} onChange={e => setForm(f => ({ ...f, purity: e.target.value }))} className="glass-input px-3 py-2 text-sm">
                  {["24K", "22K", "18K"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input required type="number" step="0.1" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="Weight (g)" className="glass-input px-3 py-2 text-sm" />
                <input required type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="Stock" className="glass-input px-3 py-2 text-sm" />
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="Price ₹" className="glass-input px-3 py-2 text-sm" />
              </div>
              <button type="submit" className="w-full gold-gradient text-primary-foreground py-2.5 rounded-lg font-medium">Add Product</button>
            </form>
          </div>
        </div>
      )}

      <AnimatedSection delay={0.05}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full glass-input pl-10 pr-4 py-2.5 text-sm" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-[0.97] ${category === c ? "gold-gradient text-primary-foreground" : "glass-button"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.1}>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Product</th>
                  <th className="text-left py-3 px-4 font-medium">Category</th>
                  <th className="text-left py-3 px-4 font-medium">Weight</th>
                  <th className="text-left py-3 px-4 font-medium">Purity</th>
                  <th className="text-left py-3 px-4 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 font-medium">Price</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 && !loading && (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No products found. Is the backend running?</td></tr>
                )}
                {loading && (
                  <tr><td colSpan={7} className="py-12 text-center text-muted-foreground animate-pulse">Loading inventory...</td></tr>
                )}
                {!loading && products.map(p => (
                  <tr key={p._id} className="border-b border-border/20 table-row-hover">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categoryEmoji[p.category] || categoryEmoji.default}</span>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{p.category}</td>
                    <td className="py-3 px-4">{p.weight}g</td>
                    <td className="py-3 px-4">{p.purity}</td>
                    <td className="py-3 px-4">
                      <span className={p.low_stock ? "low-stock" : "in-stock"}>
                        {p.stock} {p.low_stock ? "⚠" : ""}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium">{fmt(p.price)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex gap-1 justify-end">
                        <button className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p._id)} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
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
