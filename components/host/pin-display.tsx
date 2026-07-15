"use client";

import { useEffect, useState } from "react";
import { Maximize2, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function PinDisplay({ pin }: { pin: string }) {
  const groups = pin.match(/.{1,3}/g) ?? [pin];

  // window.location is only known once mounted in the browser — computing it
  // during the initial render would render different QR content on the
  // server vs. the client and trip a hydration mismatch. NEXT_PUBLIC_APP_URL
  // lets the deployer pin the QR/join link to a fixed public URL (e.g. behind
  // a reverse proxy or tunnel) instead of whatever origin the host happens to
  // be viewing the page from.
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || window.location.origin;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoinUrl(`${base}/join/${pin}`);
  }, [pin]);

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border bg-card px-8 py-6 shadow-sm sm:flex-row sm:gap-8">
      <div className="flex flex-col items-center gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <QrCode className="size-4" />
          ລະຫັດເຂົ້າຫ້ອງ (Game PIN)
        </span>
        <span className="font-mono text-5xl font-extrabold tracking-[0.2em] text-primary sm:text-6xl">
          {groups.join(" ")}
        </span>
      </div>

      <Dialog>
        <div className="flex flex-col items-center gap-2">
          <DialogTrigger
            disabled={!joinUrl}
            className="group relative flex size-36 items-center justify-center rounded-xl border bg-white p-2 transition hover:ring-2 hover:ring-primary disabled:cursor-not-allowed"
          >
            {joinUrl ? (
              <>
                <QRCodeSVG
                  value={joinUrl}
                  size={128}
                  level="M"
                  marginSize={0}
                  fgColor="#005E26"
                  bgColor="#FFFFFF"
                />
                <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100">
                  <Maximize2 className="size-6 text-white" />
                </span>
              </>
            ) : (
              <div className="size-32 animate-pulse rounded-lg bg-muted" />
            )}
          </DialogTrigger>
          <span className="text-xs text-muted-foreground">ກົດເພື່ອຂະຫຍາຍ ແລະ ສະແກນເພື່ອເຂົ້າຮ່ວມທັນທີ</span>
        </div>

        <DialogContent
          showCloseButton
          className="flex max-w-[calc(100%-2rem)] flex-col items-center gap-6 p-8 sm:max-w-none sm:w-[min(85vw,85vh)]"
        >
          <DialogTitle className="text-xl">ສະແກນເພື່ອເຂົ້າຮ່ວມ</DialogTitle>
          {joinUrl && (
            <div className="flex w-full items-center justify-center rounded-2xl bg-white p-6">
              <QRCodeSVG
                value={joinUrl}
                size={512}
                level="M"
                marginSize={1}
                fgColor="#005E26"
                bgColor="#FFFFFF"
                className="h-auto w-full"
              />
            </div>
          )}
          <span className="font-mono text-4xl font-extrabold tracking-[0.2em] text-primary sm:text-5xl">
            {groups.join(" ")}
          </span>
        </DialogContent>
      </Dialog>
    </div>
  );
}
