import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GamePlayer } from "@/lib/types";

export function LobbyPlayers({ players }: { players: GamePlayer[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Users className="size-4" />
        ຜູ້ເຂົ້າຮ່ວມ ({players.length})
      </div>
      {players.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          ລໍຖ້າຜູ້ຫຼິ້ນສະແກນ ຫຼື ພິມລະຫັດເຂົ້າຮ່ວມ...
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <Badge key={p.id} variant="secondary" className="px-3 py-1.5 text-sm">
              {p.nickname}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
