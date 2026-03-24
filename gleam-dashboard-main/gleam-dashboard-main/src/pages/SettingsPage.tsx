import { Store, Bell, Shield, Palette } from "lucide-react";
import AnimatedSection from "@/components/shared/AnimatedSection";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <AnimatedSection>
        <h1 className="text-3xl font-display font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">Manage your store configuration</p>
      </AnimatedSection>

      <div className="grid gap-6 max-w-2xl">
        <AnimatedSection delay={0.05}>
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Store className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Store Details</h3>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Store Name</label>
                <input defaultValue="JewelVault Premium" className="w-full glass-input px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">GST Number</label>
                <input defaultValue="27AABCU9603R1ZM" className="w-full glass-input px-4 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Default Making Charges (%)</label>
                <input type="number" defaultValue="12" className="w-full glass-input px-4 py-2.5 text-sm" />
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.1}>
          <div className="glass-card p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-display text-lg font-semibold">Notifications</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: "Low stock alerts", desc: "Get notified when stock drops below threshold" },
                { label: "Gold rate updates", desc: "Daily gold & silver rate notifications" },
                { label: "New order alerts", desc: "Instant notification on new orders" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <button className="gold-gradient text-primary-foreground px-6 py-3 rounded-lg font-medium transition-all active:scale-[0.97]">
            Save Settings
          </button>
        </AnimatedSection>
      </div>
    </div>
  );
}
