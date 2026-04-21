import { downloadObjectFromSupabaseStorage } from "@/lib/storage/supabase-storage";

export async function readStoredFile(storageKey: string) {
  return downloadObjectFromSupabaseStorage(storageKey);
}
