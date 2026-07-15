"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AVATAR_OPTIONS, AvatarIcon } from "@/components/quiz/avatar-icon";
import { createClient } from "@/utils/supabase/client";
import { joinGame } from "@/lib/functions";
import { cn } from "@/lib/utils";
import type { PlayerSession } from "@/lib/types";

export default function JoinPage({ params }: { params: Promise<{ pin: string }> }) {
  const { pin } = use(params);
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0].key);
  const [loading, setLoading] = useState(false);

  const trimmed = nickname.trim();
  const canJoin = trimmed.length >= 1 && trimmed.length <= 20 && !loading;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canJoin) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const result = await joinGame(supabase, { pin, nickname: trimmed, avatar });

      const session: PlayerSession = {
        gameId: result.gameId,
        playerId: result.playerId,
        token: result.token,
        nickname: trimmed,
        quizTitle: result.quizTitle,
      };
      localStorage.setItem(`quiz_player_${result.gameId}`, JSON.stringify(session));

      router.push(`/play/${result.gameId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ເຂົ້າຮ່ວມບໍ່ສຳເລັດ");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-secondary/40 to-background p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center gap-1 text-center">
          <span className="text-xs font-medium text-muted-foreground">ລະຫັດເກມ</span>
          <span className="font-mono text-2xl font-bold tracking-[0.2em] text-primary">{pin}</span>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                ຊື່ຫຼິ້ນ (Nickname)
              </label>
              <Input
                id="nickname"
                autoFocus
                maxLength={20}
                placeholder="ຊື່ຂອງທ່ານ..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">ເລືອກໄອຄອນ</span>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setAvatar(option.key)}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-xl border-2 bg-muted p-1 transition",
                      avatar === option.key ? "border-primary bg-secondary" : "border-transparent",
                    )}
                  >
                    <AvatarIcon avatar={option.key} className="size-full rounded-lg" />
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" disabled={!canJoin} className="h-12 text-base">
              {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
              ເຂົ້າຮ່ວມ
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
