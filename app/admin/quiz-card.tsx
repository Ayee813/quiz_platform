"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Pencil, Play } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { createGame } from "@/lib/functions";
import type { Quiz } from "@/lib/types";

export function QuizCard({ quiz, questionCount }: { quiz: Quiz; questionCount: number }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    setStarting(true);
    try {
      const supabase = createClient();
      const { gameId } = await createGame(supabase, quiz.id);
      router.push(`/admin/host/${gameId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ເລີ່ມເກມບໍ່ສຳເລັດ");
      setStarting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold leading-tight">{quiz.title}</h3>
          {quiz.description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{quiz.description}</p>
          )}
        </div>
        <Badge variant={quiz.is_published ? "default" : "secondary"} className="shrink-0">
          {quiz.is_published ? "ເຜີຍແຜ່ແລ້ວ" : "ຮ່າງ"}
        </Badge>
      </CardHeader>
      <CardContent>
        <span className="text-sm text-muted-foreground">{questionCount} ຄຳຖາມ</span>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          nativeButton={false}
          render={
            <Link href={`/admin/quizzes/${quiz.id}/edit`}>
              <Pencil />
              ແກ້ໄຂ
            </Link>
          }
        />
        <Button
          size="sm"
          className="flex-1"
          disabled={starting || questionCount === 0}
          onClick={handleStart}
        >
          {starting ? <Loader2 className="animate-spin" /> : <Play />}
          ເລີ່ມເກມ
        </Button>
      </CardFooter>
    </Card>
  );
}
