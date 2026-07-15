const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

export function publicAudioUrl(storagePath: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/audio/${storagePath}`;
}
