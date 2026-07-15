"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [pin, setPin] = useState("");

  const digitsOnly = pin.replace(/\D/g, "").slice(0, 6);
  const canJoin = digitsOnly.length === 6;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canJoin) return;
    router.push(`/join/${digitsOnly}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-secondary/30 to-transparent p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <ShieldCheck className="size-12 text-primary" />
        <h1 className="text-2xl font-extrabold sm:text-3xl">CEIT Cyber Quiz</h1>
        <p className="text-sm text-muted-foreground">
          ແບບທົດສອບຄວາມຮູ້ຄວາມປອດໄພທາງໄຊເບີແບບສົດ
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <h2 className="text-center text-base font-semibold">ພິມລະຫັດເຂົ້າຮ່ວມ (Game PIN)</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <Input
              autoFocus
              inputMode="numeric"
              placeholder="000000"
              value={digitsOnly}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              className="h-14 text-center font-mono text-3xl tracking-[0.3em]"
            />
            <Button type="submit" size="lg" disabled={!canJoin} className="h-12 text-base">
              ເຂົ້າຮ່ວມ
              <ArrowRight />
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link
        href="/admin/login"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <Lock className="size-3.5" />
        ຜູ້ດູແລລະບົບ
      </Link>
    </main>
  );
}
