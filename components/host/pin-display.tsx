import { QrCode } from "lucide-react";

export function PinDisplay({ pin }: { pin: string }) {
  const groups = pin.match(/.{1,3}/g) ?? [pin];

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border bg-card px-8 py-6 shadow-sm">
      <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <QrCode className="size-4" />
        ລະຫັດເຂົ້າຫ້ອງ (Game PIN)
      </span>
      <span className="font-mono text-5xl font-extrabold tracking-[0.2em] text-primary sm:text-6xl">
        {groups.join(" ")}
      </span>
    </div>
  );
}
