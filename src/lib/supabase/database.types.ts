// Hand-written to match supabase/migrations. Regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts

export type FamilyRole = 'owner' | 'editor' | 'viewer';
export type MemoryType = 'story' | 'photo' | 'audio' | 'video' | 'document' | 'other';
export type RelationshipType = 'parent_of' | 'spouse_of' | 'sibling_of';

type Table<Row, Insert, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export type ProfileRow = { id: string; display_name: string; created_at: string }
export type FamilyRow = { id: string; name: string; created_by: string | null; is_demo: boolean; created_at: string }
export type FamilyMembershipRow = { family_id: string; user_id: string; role: FamilyRole; created_at: string }
export type AncestorRow = {
  id: string; family_id: string; name: string; birth_year: number | null; death_year: number | null;
  biography: string | null; generation: number; created_at: string;
}
export type AncestorRelationshipRow = {
  id: string; family_id: string; from_ancestor_id: string; to_ancestor_id: string;
  relationship_type: RelationshipType; created_at: string;
}
export type MemoryRow = {
  id: string; family_id: string; ancestor_id: string; title: string; description: string | null;
  memory_date: string | null; memory_type: MemoryType; location: string | null;
  uploaded_by: string | null; created_at: string;
}
export type MediaAssetRow = {
  id: string; memory_id: string; family_id: string; storage_path: string; mime_type: string;
  file_size_bytes: number; original_filename: string; uploaded_by: string | null; created_at: string;
}
export type TimeCapsuleRow = {
  id: string; family_id: string; creator_id: string | null; message: string;
  recipient: string | null; unlock_date: string | null; created_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow, Pick<ProfileRow, 'id'> & Partial<ProfileRow>>;
      families: Table<FamilyRow, { name: string; created_by: string } & Partial<Pick<FamilyRow, 'id'>>>;
      family_memberships: Table<FamilyMembershipRow, { family_id: string; user_id: string; role?: FamilyRole }>;
      ancestors: Table<AncestorRow, { family_id: string; name: string } &
        Partial<Pick<AncestorRow, 'birth_year' | 'death_year' | 'biography' | 'generation'>>>;
      ancestor_relationships: Table<AncestorRelationshipRow, Pick<AncestorRelationshipRow,
        'family_id' | 'from_ancestor_id' | 'to_ancestor_id' | 'relationship_type'>>;
      memories: Table<MemoryRow, { family_id: string; ancestor_id: string; title: string; uploaded_by: string } &
        Partial<Pick<MemoryRow, 'description' | 'memory_date' | 'memory_type' | 'location'>>>;
      media_assets: Table<MediaAssetRow, Omit<MediaAssetRow, 'id' | 'created_at'>>;
      time_capsules: Table<TimeCapsuleRow, { family_id: string; creator_id: string; message: string } &
        Partial<Pick<TimeCapsuleRow, 'recipient' | 'unlock_date'>>>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
