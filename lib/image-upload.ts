import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function uploadQuestionImage(
  supabase: SupabaseClient,
  params: { file: File; ownerId: string },
): Promise<string> {
  const { file, ownerId } = params;

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("ຮອງຮັບສະເພາະໄຟລ໌ຮູບພາບ PNG, JPEG, WEBP ຫຼື GIF");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("ຂະໜາດໄຟລ໌ຕ້ອງບໍ່ເກີນ 5MB");
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const path = `${ownerId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("images").getPublicUrl(path);
  return data.publicUrl;
}

// Best-effort cleanup — only removes the object if the URL actually points
// at our own `images` bucket (manually-entered URLs point elsewhere and
// must be left alone).
export async function deleteQuestionImage(supabase: SupabaseClient, imageUrl: string): Promise<void> {
  const marker = "/storage/v1/object/public/images/";
  const index = imageUrl.indexOf(marker);
  if (index === -1) return;

  const path = imageUrl.slice(index + marker.length);
  await supabase.storage.from("images").remove([path]);
}
