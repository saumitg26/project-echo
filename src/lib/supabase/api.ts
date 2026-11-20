import type { User } from '@supabase/supabase-js';
import { requireSupabase } from './client';
import type {
  AncestorRelationshipRow, AncestorRow, FamilyRole, FamilyRow, MediaAssetRow, MemoryRow, MemoryType,
  TimeCapsuleRow,
} from './database.types';

export const MEDIA_BUCKET = 'memory-media';
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // keep in sync with the bucket + media_assets check
export const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
  'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/webm': 'weba', 'audio/ogg': 'ogg',
  'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov', 'application/pdf': 'pdf',
};

function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

// ---------- Auth ----------
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const { data, error } = await requireSupabase().auth.signUp({
    email, password, options: { data: { display_name: displayName } },
  });
  if (error) throw new Error(`Sign up failed: ${error.message}`);
  return data;
}
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign in failed: ${error.message}`);
  return data;
}
export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw new Error(`Sign out failed: ${error.message}`);
}
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await requireSupabase().auth.getUser();
  if (error) return null;
  return data.user;
}
async function requireUserId(): Promise<string> {
  const { data } = await requireSupabase().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('You must be signed in.');
  return id;
}

// ---------- Families ----------
export type FamilyWithRole = FamilyRow & { role: FamilyRole };

/** Families the signed-in user belongs to (demo families are excluded; they are not memberships). */
export async function getMyFamilies(): Promise<FamilyWithRole[]> {
  const sb = requireSupabase();
  const userId = await requireUserId();
  const memberships = check(
    await sb.from('family_memberships').select('family_id, role').eq('user_id', userId), 'Fetch memberships');
  if (memberships.length === 0) return [];
  const families = check(
    await sb.from('families').select('*').in('id', memberships.map((m) => m.family_id)).order('created_at'),
    'Fetch families');
  const roleById = new Map(memberships.map((m) => [m.family_id, m.role]));
  return families.map((f) => ({ ...f, role: roleById.get(f.id)! }));
}

/** Creates a family; a DB trigger makes the creator its owner. */
export async function createFamily(name: string): Promise<FamilyRow> {
  const userId = await requireUserId();
  return check(
    await requireSupabase().from('families').insert({ name, created_by: userId }).select().single(),
    'Create family');
}

// ---------- Ancestors ----------
export async function getAncestors(familyId: string): Promise<AncestorRow[]> {
  return check(
    await requireSupabase().from('ancestors').select('*').eq('family_id', familyId)
      .order('generation').order('name'), 'Fetch ancestors');
}
export async function getAncestorRelationships(familyId: string): Promise<AncestorRelationshipRow[]> {
  return check(
    await requireSupabase().from('ancestor_relationships').select('*').eq('family_id', familyId),
    'Fetch relationships');
}

export interface CreateAncestorInput {
  familyId: string; name: string; birthYear?: number; deathYear?: number;
  biography?: string; generation?: number;
}
export async function createAncestor(input: CreateAncestorInput): Promise<AncestorRow> {
  return check(
    await requireSupabase().from('ancestors').insert({
      family_id: input.familyId, name: input.name, birth_year: input.birthYear,
      death_year: input.deathYear, biography: input.biography, generation: input.generation,
    }).select().single(), 'Create ancestor');
}

// ---------- Memories ----------
export async function getMemoriesForAncestor(ancestorId: string): Promise<MemoryRow[]> {
  return check(
    await requireSupabase().from('memories').select('*').eq('ancestor_id', ancestorId)
      .order('memory_date', { ascending: true, nullsFirst: false }).order('created_at'), 'Fetch memories');
}

export interface CreateMemoryInput {
  familyId: string; ancestorId: string; title: string; description?: string;
  memoryDate?: string; memoryType?: MemoryType; location?: string;
}
export async function createMemory(input: CreateMemoryInput): Promise<MemoryRow> {
  const userId = await requireUserId();
  return check(
    await requireSupabase().from('memories').insert({
      family_id: input.familyId, ancestor_id: input.ancestorId, title: input.title,
      description: input.description, memory_date: input.memoryDate, memory_type: input.memoryType,
      location: input.location, uploaded_by: userId,
    }).select().single(), 'Create memory');
}


export async function deleteMemory(memoryId: string): Promise<void> {
  check(await requireSupabase().from('memories').delete().eq('id', memoryId).select('id'), 'Delete memory');
}

// ---------- Media (private bucket + signed URLs) ----------
function safeExtension(file: Blob): string {
  return ALLOWED_MIME_TYPES[file.type] ?? '';
}

export interface AudioUploadContract {
  blob: Blob;
  mimeType: 'audio/mpeg' | 'audio/mp4' | 'audio/wav' | 'audio/webm' | 'audio/ogg';
  durationSeconds: number;
  transcript?: string;
  ancestorId: string;
  memoryId: string;
  uploadStatus: 'pending' | 'uploading' | 'complete' | 'failed';
}

/**
 * Uploads a file to families/{familyId}/memories/{memoryId}/{uuid}.{ext}, then records it in media_assets.
 * If the DB insert fails the uploaded object is removed so storage and DB stay consistent.
 */
export async function uploadMemoryMedia(params: {
  familyId: string; memoryId: string; file: File | Blob;
}): Promise<MediaAssetRow> {
  const { familyId, memoryId, file } = params;
  if (!(file.type in ALLOWED_MIME_TYPES)) throw new Error(`Unsupported file type: ${file.type || 'unknown'}`);
  if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) throw new Error('File must be between 1 byte and 50 MB.');

  const sb = requireSupabase();
  const userId = await requireUserId();
  const extension = safeExtension(file);
  const uniqueId = crypto.randomUUID();
  const path = `families/${familyId}/memories/${memoryId}/${uniqueId}.${extension}`;
  const originalFilename = file instanceof File ? file.name : `recording-${uniqueId}.${extension}`;

  const up = await sb.storage.from(MEDIA_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw new Error(`Upload failed: ${up.error.message}`);

  const res = await sb.from('media_assets').insert({
    memory_id: memoryId, family_id: familyId, storage_path: path, mime_type: file.type,
    file_size_bytes: file.size, original_filename: originalFilename.slice(0, 255), uploaded_by: userId,
  }).select().single();
  if (res.error) {
    await sb.storage.from(MEDIA_BUCKET).remove([path]);
    throw new Error(`Saving media record failed: ${res.error.message}`);
  }
  return res.data;
}

/**
 * Creates the metadata row and uploads its file as one UI operation. Supabase Storage and Postgres
 * cannot share a transaction, so a failed upload is compensated by deleting the new memory row.
 */
export async function createMemoryWithMedia(
  input: CreateMemoryInput,
  file: File,
): Promise<{ memory: MemoryRow; media: MediaAssetRow }> {
  const memory = await createMemory(input);
  try {
    const media = await uploadMemoryMedia({ familyId: input.familyId, memoryId: memory.id, file });
    return { memory, media };
  } catch (error) {
    try {
      await deleteMemory(memory.id);
    } catch (cleanupError) {
      const reason = error instanceof Error ? error.message : 'Unknown upload error';
      const cleanup = cleanupError instanceof Error ? cleanupError.message : 'unknown cleanup error';
      throw new Error(`${reason} The incomplete memory could not be removed (${cleanup}).`);
    }
    throw error;
  }
}

export async function getMediaForMemory(memoryId: string): Promise<MediaAssetRow[]> {
  return check(
    await requireSupabase().from('media_assets').select('*').eq('memory_id', memoryId).order('created_at'),
    'Fetch media');
}

/** Short-lived URL for one private file. Fails (no URL) if the user is not authorised. */
export async function getSignedMediaUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  const { data, error } = await requireSupabase().storage.from(MEDIA_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data) throw new Error(`Could not create signed URL: ${error?.message ?? 'not authorised'}`);
  return data.signedUrl;
}

export type MediaWithUrl = MediaAssetRow & { signedUrl: string | null };
export async function getMediaWithSignedUrls(memoryId: string, expiresInSeconds = 3600): Promise<MediaWithUrl[]> {
  const assets = await getMediaForMemory(memoryId);
  if (assets.length === 0) return [];
  const { data, error } = await requireSupabase().storage.from(MEDIA_BUCKET)
    .createSignedUrls(assets.map((a) => a.storage_path), expiresInSeconds);
  if (error) throw new Error(`Could not create signed URLs: ${error.message}`);
  const urlByPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return assets.map((a) => ({ ...a, signedUrl: urlByPath.get(a.storage_path) ?? null }));
}

/** Deletes the file first, then the row, so no orphaned private files are left behind. */
export async function deleteMediaAsset(asset: Pick<MediaAssetRow, 'id' | 'storage_path'>): Promise<void> {
  const sb = requireSupabase();
  const rm = await sb.storage.from(MEDIA_BUCKET).remove([asset.storage_path]);
  if (rm.error) throw new Error(`Delete file failed: ${rm.error.message}`);
  check(await sb.from('media_assets').delete().eq('id', asset.id).select('id'), 'Delete media record');
}

// ---------- Time capsules ----------
export interface CreateTimeCapsuleInput { familyId: string; message: string; recipient?: string; unlockDate?: string }
export async function createTimeCapsule(input: CreateTimeCapsuleInput): Promise<TimeCapsuleRow> {
  const userId = await requireUserId();
  return check(
    await requireSupabase().from('time_capsules').insert({
      family_id: input.familyId, creator_id: userId, message: input.message,
      recipient: input.recipient, unlock_date: input.unlockDate,
    }).select().single(), 'Create time capsule');
}
export async function getTimeCapsules(familyId: string): Promise<TimeCapsuleRow[]> {
  return check(
    await requireSupabase().from('time_capsules').select('*').eq('family_id', familyId)
      .order('created_at', { ascending: false }), 'Fetch time capsules');
}
