import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { HostPanel } from "@/app/admin/host/[gameId]/host-panel";
import type { Game } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HostGamePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: game } = await supabase
    .from("games")
    .select("*, quizzes(title)")
    .eq("id", gameId)
    .maybeSingle();

  if (!game) notFound();

  const quizTitle = (game.quizzes as unknown as { title: string } | null)?.title ?? "";

  return <HostPanel initialGame={game as Game} quizTitle={quizTitle} />;
}
