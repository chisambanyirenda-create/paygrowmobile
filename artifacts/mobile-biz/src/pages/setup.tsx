import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetBusinessSettings, useSaveBusinessSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatZMW } from "@/lib/utils";
import { Smartphone, Wallet, ArrowRight, ShieldCheck } from "lucide-react";

export default function Setup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: existingSettings } = useGetBusinessSettings();
  const save = useSaveBusinessSettings();
  const [cash, setCash] = useState("");
  const [phones, setPhones] = useState("");

  useEffect(() => {
    if (existingSettings && existingSettings.currentPhoneCount > 0) {
      setPhones(String(existingSettings.currentPhoneCount));
    }
  }, [existingSettings]);

  const submit = () => {
    const openingCash = Number(cash);
    const currentPhoneCount = Number(phones);
    if (!Number.isFinite(openingCash) || openingCash < 0 || !Number.isInteger(currentPhoneCount) || currentPhoneCount < 0) {
      toast({ title: "Enter valid values", description: "Use non-negative numbers. Phone count must be a whole number.", variant: "destructive" });
      return;
    }
    save.mutate({ data: { openingCash, currentPhoneCount } }, {
      onSuccess: () => {
        toast({ title: "Real business setup saved", description: "Your calculations will now use only the information you entered." });
        navigate("/inventory");
      },
      onError: () => toast({ title: "Could not save setup", variant: "destructive" }),
    });
  };

  return (
    <main className="min-h-screen bg-[#050b16] text-white flex items-center justify-center p-5">
      <div className="w-full max-w-2xl space-y-7">
        <div className="text-center">
          <div className="mx-auto mb-5 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xs uppercase tracking-[0.28em] text-primary font-bold">Real data only</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">Let’s set up your real business</h1>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
            Start with what you actually have today. MobiTrack will not create phones, prices, sales, or profit for you.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <span className="flex items-center gap-2 text-sm font-bold text-white"><Wallet className="w-4 h-4 text-emerald-400" /> Business cash currently available</span>
            <span className="block text-xs text-muted-foreground mt-2">Cash in the business now, not the value of unsold phones.</span>
            <div className="relative mt-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">K</span>
              <Input value={cash} onChange={(e) => setCash(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className="pl-8 bg-background border-white/10 font-mono text-lg" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Preview: {formatZMW(Number(cash) || 0)}</p>
          </label>

          <label className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <span className="flex items-center gap-2 text-sm font-bold text-white"><Smartphone className="w-4 h-4 text-primary" /> Phones you currently own</span>
            <span className="block text-xs text-muted-foreground mt-2">You will add each phone separately with its real acquisition details.</span>
            <Input value={phones} onChange={(e) => setPhones(e.target.value)} type="number" min="0" step="1" placeholder="0" className="mt-4 bg-background border-white/10 font-mono text-lg" />
            <p className="text-[11px] text-muted-foreground mt-2">No phones are created automatically.</p>
          </label>
        </div>

        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-100/80">
          Existing records are preserved in this workspace. If they are demo records, use the separate reset control in Settings after reviewing them.
        </div>

        <Button onClick={submit} disabled={save.isPending} className="w-full h-12 bg-primary text-primary-foreground font-black text-base">
          {save.isPending ? "Saving…" : "Save setup and add my phones"} <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </main>
  );
}