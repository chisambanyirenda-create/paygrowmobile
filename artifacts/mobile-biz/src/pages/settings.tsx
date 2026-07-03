import { Layout } from "@/components/layout";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Save, Building2, FileText, Phone, Mail, MapPin, Hash, Percent, RefreshCw } from "lucide-react";

interface BusinessSettings {
  businessName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  zraTin: string;
  taxRate: number;
  receiptFooter: string;
  currency: string;
}

const DEFAULTS: BusinessSettings = {
  businessName: "MobiTrack",
  tagline: "Your trusted phone & accessories store",
  ownerName: "A. Kamanga",
  phone: "+260 977 000000",
  email: "info@mobitrack.zm",
  address: "Cairo Road",
  city: "Lusaka, Zambia",
  zraTin: "",
  taxRate: 16,
  receiptFooter: "Thank you for your business! Returns accepted within 7 days with receipt.",
  currency: "ZMW",
};

const STORAGE_KEY = "mobitrack_settings";

function loadSettings(): BusinessSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="glass-panel rounded-2xl border-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.05] bg-black/20 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-bold text-white tracking-tight">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState<BusinessSettings>(loadSettings);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  const update = (key: keyof BusinessSettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setIsDirty(false);
      toast({ title: "Settings saved", description: "Your business profile has been updated." });
    } catch {
      toast({ title: "Error saving settings", variant: "destructive" });
    }
  };

  const reset = () => {
    if (confirm("Reset all settings to defaults?")) {
      localStorage.removeItem(STORAGE_KEY);
      setSettings({ ...DEFAULTS });
      setIsDirty(false);
      toast({ title: "Settings reset to defaults" });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto page-enter">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white relative inline-block">
              Settings
              <span className="absolute -bottom-2 left-0 h-px bg-gradient-to-r from-primary/60 to-transparent w-24"></span>
            </h2>
            <p className="text-muted-foreground mt-3 text-sm">Configure your business profile, receipts, and preferences.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-white/10 text-muted-foreground hover:text-white" onClick={reset}>
              <RefreshCw className="w-4 h-4 mr-2" /> Reset
            </Button>
            <Button
              onClick={save}
              className={`font-bold border-0 transition-all ${isDirty ? 'bg-gradient-to-r from-primary to-cyan-400 text-black shadow-[0_0_20px_-5px_hsl(var(--primary))]' : 'bg-primary/20 text-primary border border-primary/30'}`}
            >
              <Save className="w-4 h-4 mr-2" /> {isDirty ? 'Save Changes' : 'Saved'}
            </Button>
          </div>
        </div>

        {/* Business Identity */}
        <Section title="Business Identity" icon={Building2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Business Name" hint="Appears on receipts and reports">
              <Input
                value={settings.businessName}
                onChange={e => update('businessName', e.target.value)}
                className="bg-background border-white/10 font-bold"
                placeholder="Your store name"
              />
            </Field>
            <Field label="Owner / Manager Name">
              <Input
                value={settings.ownerName}
                onChange={e => update('ownerName', e.target.value)}
                className="bg-background border-white/10"
              />
            </Field>
            <Field label="Tagline" hint="Shown below business name on receipts">
              <Input
                value={settings.tagline}
                onChange={e => update('tagline', e.target.value)}
                className="bg-background border-white/10"
                placeholder="e.g. Zambia's finest mobile store"
              />
            </Field>
            <Field label="ZRA TIN" hint="Tax Identification Number for receipts">
              <Input
                value={settings.zraTin}
                onChange={e => update('zraTin', e.target.value)}
                className="bg-background border-white/10 font-mono"
                placeholder="1234567890"
              />
            </Field>
          </div>
        </Section>

        {/* Contact Details */}
        <Section title="Contact & Location" icon={MapPin}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Phone Number">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={settings.phone}
                  onChange={e => update('phone', e.target.value)}
                  className="bg-background border-white/10 pl-9 font-mono"
                  placeholder="+260 977..."
                />
              </div>
            </Field>
            <Field label="Email Address">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={settings.email}
                  onChange={e => update('email', e.target.value)}
                  className="bg-background border-white/10 pl-9"
                />
              </div>
            </Field>
            <Field label="Street Address">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={settings.address}
                  onChange={e => update('address', e.target.value)}
                  className="bg-background border-white/10 pl-9"
                />
              </div>
            </Field>
            <Field label="City / Province">
              <Input
                value={settings.city}
                onChange={e => update('city', e.target.value)}
                className="bg-background border-white/10"
              />
            </Field>
          </div>
        </Section>

        {/* Financial Settings */}
        <Section title="Financial Settings" icon={Percent}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Currency" hint="ZMW = Zambian Kwacha (K)">
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={settings.currency}
                  disabled
                  className="bg-background border-white/10 pl-9 font-mono text-muted-foreground"
                />
              </div>
            </Field>
            <Field label="VAT / Tax Rate (%)" hint="Applied to taxable sales if enabled">
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={settings.taxRate}
                  onChange={e => update('taxRate', parseFloat(e.target.value))}
                  className="bg-background border-white/10 pl-9 font-mono"
                />
              </div>
            </Field>
          </div>
        </Section>

        {/* Receipt Settings */}
        <Section title="Receipt Settings" icon={FileText}>
          <div className="space-y-5">
            <Field label="Receipt Footer Message" hint="Printed at the bottom of every receipt">
              <Textarea
                value={settings.receiptFooter}
                onChange={e => update('receiptFooter', e.target.value)}
                className="bg-background border-white/10 min-h-[80px]"
                placeholder="Thank you for shopping with us..."
              />
            </Field>

            {/* Receipt Preview */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Receipt Preview</p>
              <div className="p-5 rounded-xl border border-white/10 bg-black/30 font-mono text-xs space-y-1 max-w-[320px]">
                <p className="text-center font-bold text-white text-sm">{settings.businessName || "MobiTrack"}</p>
                <p className="text-center text-muted-foreground text-[10px]">{settings.tagline}</p>
                <p className="text-center text-muted-foreground text-[10px]">{settings.address}, {settings.city}</p>
                {settings.zraTin && <p className="text-center text-muted-foreground text-[10px]">TIN: {settings.zraTin}</p>}
                <div className="border-t border-dashed border-white/20 my-2"></div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Samsung Galaxy A15</span><span>K 2,100.00</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>USB-C Cable ×2</span><span>K 160.00</span>
                </div>
                <div className="border-t border-dashed border-white/20 my-2"></div>
                <div className="flex justify-between font-bold text-white">
                  <span>TOTAL</span><span>K 2,260.00</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[10px]">
                  <span>Payment: Cash</span><span>K 3,000.00</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-[10px]">
                  <span>Change</span><span>K 740.00</span>
                </div>
                <div className="border-t border-dashed border-white/20 my-2"></div>
                <p className="text-center text-muted-foreground text-[10px] leading-relaxed">{settings.receiptFooter}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* System Info */}
        <div className="glass-panel rounded-2xl border-0 overflow-hidden">
          <div className="p-6">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">System Information</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Version", value: "2.0.0" },
                { label: "Region", value: "Zambia" },
                { label: "Timezone", value: "CAT (UTC+2)" },
                { label: "Build", value: "Production" },
              ].map(info => (
                <div key={info.label} className="p-3 rounded-lg bg-black/30 border border-white/5">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">{info.label}</p>
                  <p className="font-mono font-bold text-white text-sm">{info.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
