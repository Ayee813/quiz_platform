import Image from "next/image";
import { cn } from "@/lib/utils";

export const AVATAR_OPTIONS: { key: string; src: string }[] = [
  { key: "shield", src: "/avatars/shield.png" },
  { key: "lock", src: "/avatars/lock.png" },
  { key: "key", src: "/avatars/key.png" },
  { key: "bug", src: "/avatars/bug.png" },
  { key: "terminal", src: "/avatars/terminal.png" },
  { key: "wifi", src: "/avatars/wifi.png" },
  { key: "cpu", src: "/avatars/cpu.png" },
  { key: "radar", src: "/avatars/radar.png" },
  { key: "fingerprint", src: "/avatars/fingerprint.png" },
  { key: "ghost", src: "/avatars/ghost.png" },
  { key: "skull", src: "/avatars/skull.png" },
  { key: "zap", src: "/avatars/zap.png" },
];

const AVATAR_MAP = Object.fromEntries(AVATAR_OPTIONS.map((o) => [o.key, o.src]));
const DEFAULT_AVATAR_SRC = AVATAR_OPTIONS[0].src;

export function AvatarIcon({ avatar, className }: { avatar?: string | null; className?: string }) {
  const src = (avatar && AVATAR_MAP[avatar]) || DEFAULT_AVATAR_SRC;
  return (
    <Image
      src={src}
      alt=""
      width={80}
      height={80}
      className={cn("size-8 rounded-full object-contain", className)}
    />
  );
}
