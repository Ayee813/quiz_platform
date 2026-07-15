import type { SupabaseClient } from "@supabase/supabase-js";
import type { SoundTrack, SoundTrackType } from "@/lib/types";

// Reads real audio duration in the browser — the value advance-game later
// uses to compute a countdown track's playback rate against each question's
// time limit.
export function probeAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (!isFinite(audio.duration) || audio.duration <= 0) {
        reject(new Error("ບໍ່ສາມາດອ່ານຄວາມຍາວຂອງໄຟລ໌ສຽງໄດ້"));
        return;
      }
      resolve(audio.duration);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("ໄຟລ໌ສຽງບໍ່ຖືກຕ້ອງ"));
    };
  });
}

export async function uploadSoundTrack(
  supabase: SupabaseClient,
  params: { file: File; type: SoundTrackType; title: string; ownerId: string },
): Promise<SoundTrack> {
  const { file, type, title, ownerId } = params;

  const duration = await probeAudioDuration(file);

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "mp3";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("audio")
    .upload(path, file, { contentType: file.type || "audio/mpeg" });
  if (uploadError) throw new Error(uploadError.message);

  const { data, error } = await supabase
    .from("sound_tracks")
    .insert({
      owner_id: ownerId,
      type,
      title,
      storage_path: path,
      duration_seconds: duration,
    })
    .select("*")
    .single();

  if (error || !data) {
    // Roll back the upload so we don't leak orphaned storage objects.
    await supabase.storage.from("audio").remove([path]);
    throw new Error(error?.message ?? "ອັບໂຫຼດສຽງບໍ່ສຳເລັດ");
  }

  return data as SoundTrack;
}

export async function deleteSoundTrack(supabase: SupabaseClient, track: SoundTrack): Promise<void> {
  const { error } = await supabase.from("sound_tracks").delete().eq("id", track.id);
  if (error) throw new Error(error.message);
  await supabase.storage.from("audio").remove([track.storage_path]);
}
