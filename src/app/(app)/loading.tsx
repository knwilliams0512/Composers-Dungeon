import { Icon } from "@/components/ui/Icon";

export default function AppLoading() {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 text-parchment-500">
      <Icon name="flame" size={30} className="animate-flicker text-gold-500" />
      <p className="text-xs uppercase tracking-[0.3em]">Lighting the torches…</p>
    </div>
  );
}
