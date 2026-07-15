import { Users } from "lucide-react";
import { AvatarIcon } from "@/components/quiz/avatar-icon";
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
        <div className="flex flex-wrap gap-3">
          {players.map((p) => (
            // New rows get a fresh DOM node (existing players keep their key
            // across re-renders), so this entrance animation only plays once,
            // right when a player actually joins.
            <div
              key={p.id}
              className="animate-in zoom-in-50 fade-in slide-in-from-bottom-2 flex flex-col items-center gap-1 duration-300"
            >
              <AvatarIcon avatar={p.avatar} className="size-14 rounded-full border-2 border-secondary bg-muted" />
              <span className="max-w-16 truncate text-xs font-medium">{p.nickname}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
