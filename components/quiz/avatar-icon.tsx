import {
  Bug,
  Cpu,
  Fingerprint,
  Ghost,
  KeyRound,
  Lock,
  Radar,
  ShieldCheck,
  Skull,
  Terminal,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const AVATAR_OPTIONS: { key: string; icon: LucideIcon }[] = [
  { key: "shield", icon: ShieldCheck },
  { key: "lock", icon: Lock },
  { key: "key", icon: KeyRound },
  { key: "bug", icon: Bug },
  { key: "terminal", icon: Terminal },
  { key: "wifi", icon: Wifi },
  { key: "cpu", icon: Cpu },
  { key: "radar", icon: Radar },
  { key: "fingerprint", icon: Fingerprint },
  { key: "ghost", icon: Ghost },
  { key: "skull", icon: Skull },
  { key: "zap", icon: Zap },
];

const AVATAR_MAP = Object.fromEntries(AVATAR_OPTIONS.map((o) => [o.key, o.icon]));

export function AvatarIcon({ avatar, className }: { avatar?: string | null; className?: string }) {
  const Icon = (avatar && AVATAR_MAP[avatar]) || ShieldCheck;
  return <Icon className={className} />;
}
