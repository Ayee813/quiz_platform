"use client";

import { useState } from "react";
import { ChevronRight, Eye, ListOrdered, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { AdvanceGameAction, GamePhase } from "@/lib/types";

export function HostControls({
  phase,
  busy,
  onAction,
  onEnd,
}: {
  phase: GamePhase;
  busy: boolean;
  onAction: (action: AdvanceGameAction) => void;
  onEnd: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {phase === "lobby" && (
        <Button size="lg" disabled={busy} onClick={() => onAction("start")}>
          <Play />
          ເລີ່ມເກມ
        </Button>
      )}

      {phase === "question" && (
        <Button size="lg" disabled={busy} onClick={() => onAction("reveal")}>
          <Eye />
          ເປີດເຜີຍຄຳຕອບ
        </Button>
      )}

      {phase === "reveal" && (
        <>
          <Button size="lg" variant="secondary" disabled={busy} onClick={() => onAction("leaderboard")}>
            <ListOrdered />
            ສະແດງອັນດັບ
          </Button>
          <Button size="lg" disabled={busy} onClick={() => onAction("next")}>
            <ChevronRight />
            ຄຳຖາມຕໍ່ໄປ
          </Button>
        </>
      )}

      {phase === "leaderboard" && (
        <Button size="lg" disabled={busy} onClick={() => onAction("next")}>
          <ChevronRight />
          ຄຳຖາມຕໍ່ໄປ
        </Button>
      )}

      {phase !== "finished" && (
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger
            render={
              <Button size="lg" variant="destructive" disabled={busy}>
                <Square />
                ຈົບເກມ
              </Button>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>ຢືນຢັນການຈົບເກມ?</AlertDialogTitle>
              <AlertDialogDescription>
                ເກມຈະສິ້ນສຸດທັນທີ ແລະ ຜູ້ຫຼິ້ນຈະບໍ່ສາມາດຕອບຄຳຖາມຕໍ່ໄດ້ອີກ.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>ຍົກເລີກ</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmOpen(false);
                  onEnd();
                }}
              >
                ຈົບເກມ
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
