"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Music, Pause, Play, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/utils/supabase/client";
import { deleteSoundTrack, uploadSoundTrack } from "@/lib/audio-upload";
import type { SoundTrack } from "@/lib/types";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MusicSettings({
  quizId,
  initialBackgroundTrackId,
}: {
  quizId: string;
  initialBackgroundTrackId: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [backgroundTracks, setBackgroundTracks] = useState<SoundTrack[]>([]);
  const [countdownTracks, setCountdownTracks] = useState<SoundTrack[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(initialBackgroundTrackId);
  const [selectedCountdownIds, setSelectedCountdownIds] = useState<Set<string>>(new Set());
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [uploadingCountdown, setUploadingCountdown] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const cdFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: tracks }, { data: selections }] = await Promise.all([
        supabase
          .from("sound_tracks")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false }),
        supabase.from("quiz_countdown_tracks").select("track_id").eq("quiz_id", quizId),
      ]);

      const all = (tracks as SoundTrack[]) ?? [];
      setBackgroundTracks(all.filter((t) => t.type === "background"));
      setCountdownTracks(all.filter((t) => t.type === "countdown"));
      setSelectedCountdownIds(new Set((selections ?? []).map((s) => s.track_id as string)));
      setLoading(false);
    })();
  }, [quizId, supabase]);

  useEffect(() => {
    // Stop any preview audio if the component unmounts mid-playback.
    return () => audioRef.current?.pause();
  }, []);

  const togglePlay = (track: SoundTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current?.pause();
    const url = supabase.storage.from("audio").getPublicUrl(track.storage_path).data.publicUrl;
    const audio = new Audio(url);
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => setPlayingId(null));
    audioRef.current = audio;
    setPlayingId(track.id);
  };

  const selectBackground = async (trackId: string | null) => {
    setSelectedBackground(trackId);
    const { error } = await supabase.from("quizzes").update({ background_track_id: trackId }).eq("id", quizId);
    if (error) toast.error("ບັນທຶກບໍ່ສຳເລັດ: " + error.message);
  };

  const toggleCountdownTrack = async (trackId: string, checked: boolean) => {
    setSelectedCountdownIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(trackId);
      else next.delete(trackId);
      return next;
    });
    const { error } = checked
      ? await supabase.from("quiz_countdown_tracks").insert({ quiz_id: quizId, track_id: trackId })
      : await supabase.from("quiz_countdown_tracks").delete().eq("quiz_id", quizId).eq("track_id", trackId);
    if (error) toast.error("ບັນທຶກບໍ່ສຳເລັດ: " + error.message);
  };

  const handleUpload = async (file: File, type: "background" | "countdown") => {
    const setUploading = type === "background" ? setUploadingBackground : setUploadingCountdown;
    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("ກະລຸນາເຂົ້າສູ່ລະບົບ");

      const track = await uploadSoundTrack(supabase, {
        file,
        type,
        title: file.name.replace(/\.[^.]+$/, ""),
        ownerId: user.id,
      });

      if (type === "background") {
        setBackgroundTracks((prev) => [track, ...prev]);
        await selectBackground(track.id);
      } else {
        setCountdownTracks((prev) => [track, ...prev]);
        await toggleCountdownTrack(track.id, true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ອັບໂຫຼດບໍ່ສຳເລັດ");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (track: SoundTrack, kind: "background" | "countdown") => {
    try {
      if (playingId === track.id) {
        audioRef.current?.pause();
        setPlayingId(null);
      }
      await deleteSoundTrack(supabase, track);
      if (kind === "background") {
        setBackgroundTracks((prev) => prev.filter((t) => t.id !== track.id));
        if (selectedBackground === track.id) setSelectedBackground(null);
      } else {
        setCountdownTracks((prev) => prev.filter((t) => t.id !== track.id));
        setSelectedCountdownIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ລຶບບໍ່ສຳເລັດ");
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Music className="size-4" />
          ສຽງພື້ນຫຼັງ ແລະ ສຽງນັບຖອຍຫຼັງ
        </h2>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <Label>ສຽງພື້ນຫຼັງ (ຫ້ອງລໍຖ້າ / ອັນດັບຄະແນນ)</Label>
              <RadioGroup
                value={selectedBackground ?? "none"}
                onValueChange={(v) => selectBackground(v === "none" ? null : v)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <RadioGroupItem value="none" id="bg-none" />
                  <Label htmlFor="bg-none" className="flex-1 font-normal">
                    ບໍ່ໃຊ້ສຽງພື້ນຫຼັງ
                  </Label>
                </div>
                {backgroundTracks.map((track) => (
                  <div key={track.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                    <RadioGroupItem value={track.id} id={`bg-${track.id}`} />
                    <Button type="button" variant="ghost" size="icon-sm" onClick={() => togglePlay(track)}>
                      {playingId === track.id ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                    <Label htmlFor={`bg-${track.id}`} className="flex-1 truncate font-normal">
                      {track.title}
                    </Label>
                    <span className="text-xs text-muted-foreground">{formatDuration(track.duration_seconds)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => handleDelete(track, "background")}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </RadioGroup>
              <input
                ref={bgFileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, "background");
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={uploadingBackground}
                onClick={() => bgFileInputRef.current?.click()}
              >
                {uploadingBackground ? <Loader2 className="animate-spin" /> : <Upload />}
                ອັບໂຫຼດສຽງໃໝ່
              </Button>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <Label>ສຽງນັບຖອຍຫຼັງ (ສຸ່ມເລືອກໃນແຕ່ລະຄຳຖາມ, ຈະປັບຄວາມໄວໃຫ້ຈົບພ້ອມເວລາ)</Label>
              {countdownTracks.length === 0 && (
                <p className="text-sm text-muted-foreground">ຍັງບໍ່ມີສຽງນັບຖອຍຫຼັງ, ອັບໂຫຼດຢ່າງໜ້ອຍໜຶ່ງໄຟລ໌</p>
              )}
              {countdownTracks.map((track) => (
                <div key={track.id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <Checkbox
                    checked={selectedCountdownIds.has(track.id)}
                    onCheckedChange={(checked) => toggleCountdownTrack(track.id, checked === true)}
                  />
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => togglePlay(track)}>
                    {playingId === track.id ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </Button>
                  <span className="flex-1 truncate text-sm">{track.title}</span>
                  <span className="text-xs text-muted-foreground">{formatDuration(track.duration_seconds)}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => handleDelete(track, "countdown")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <input
                ref={cdFileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file, "countdown");
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                disabled={uploadingCountdown}
                onClick={() => cdFileInputRef.current?.click()}
              >
                {uploadingCountdown ? <Loader2 className="animate-spin" /> : <Upload />}
                ອັບໂຫຼດສຽງໃໝ່
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
