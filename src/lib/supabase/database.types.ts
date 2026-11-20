// Hand-written to match supabase/migrations. Regenerate with:
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts

export type FamilyRole = 'owner' | 'editor' | 'viewer';
export type MemoryType = 'story' | 'photo' | 'audio' | 'video' | 'document' | 'other';
export type RelationshipType = 'parent_of' | 'spouse_of' | 'sibling_of';
export type HistoricalOriginKind = 'original' | 'testimony' | 'reconstruction';
export type HistoricalVerificationStatus = 'verified' | 'corroborated' | 'disputed' | 'interpretive' | 'unverified';
export type ContributionType = 'written_account' | 'photograph' | 'document' | 'testimony' | 'audio';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

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
export type ArchiveReviewerRow = { user_id: string; created_at: string }
export type HistoricalLocationRow = {
  id: string; slug: string; name: string; short_description: string;
  latitude: number | null; longitude: number | null; map_x: number; map_y: number;
  event_title: string; event_date: string; image_url: string | null;
  classification: 'civilization_archive' | 'restricted_archive' | 'recovered_site';
  tags: string[]; is_published: boolean; created_at: string;
}
export type HistoricalRecordRow = {
  id: string; location_id: string; slug: string; title: string; content: string;
  event_at: string | null; record_classification: 'public_bulletin' | 'system_log' |
    'personnel_manifest' | 'photograph' | 'field_recording' | 'written_testimony' | 'interpretive_reconstruction';
  origin_kind: HistoricalOriginKind; provenance: string; tags: string[]; media_url: string | null;
  verification_status: HistoricalVerificationStatus; is_published: boolean; created_at: string;
}
export type HistoricalContributionRow = {
  id: string; location_id: string; contributor_id: string; contribution_type: ContributionType;
  title: string; description: string; event_date: string | null; moderation_status: ModerationStatus;
  reviewed_by: string | null; reviewed_at: string | null; created_at: string;
}
export type HistoricalContributionMediaRow = {
  id: string; contribution_id: string; contributor_id: string; storage_path: string; mime_type: string;
  file_size_bytes: number; original_filename: string; created_at: string;
}
export type FamilyHistoricalLinkRow = {
  id: string; family_id: string; memory_id: string; historical_location_id: string | null;
  historical_record_id: string | null; relationship_note: string | null; created_at: string;
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
      archive_reviewers: Table<ArchiveReviewerRow, Pick<ArchiveReviewerRow, 'user_id'>>;
      historical_locations: Table<HistoricalLocationRow,
        Pick<HistoricalLocationRow, 'slug' | 'name' | 'short_description' | 'map_x' | 'map_y' | 'event_title' | 'event_date'> &
        Partial<Omit<HistoricalLocationRow, 'slug' | 'name' | 'short_description' | 'map_x' | 'map_y' | 'event_title' | 'event_date' | 'created_at'>>>;
      historical_records: Table<HistoricalRecordRow,
        Pick<HistoricalRecordRow, 'location_id' | 'slug' | 'title' | 'content' | 'record_classification' | 'origin_kind' | 'provenance'> &
        Partial<Omit<HistoricalRecordRow, 'location_id' | 'slug' | 'title' | 'content' | 'record_classification' | 'origin_kind' | 'provenance' | 'created_at'>>>;
      historical_contributions: Table<HistoricalContributionRow,
        Pick<HistoricalContributionRow, 'location_id' | 'contributor_id' | 'contribution_type' | 'title' | 'description'> &
        Partial<Pick<HistoricalContributionRow, 'event_date' | 'moderation_status' | 'reviewed_by' | 'reviewed_at'>>>;
      historical_contribution_media: Table<HistoricalContributionMediaRow,
        Omit<HistoricalContributionMediaRow, 'id' | 'created_at'>>;
      family_historical_links: Table<FamilyHistoricalLinkRow,
        Pick<FamilyHistoricalLinkRow, 'family_id' | 'memory_id'> &
        Partial<Pick<FamilyHistoricalLinkRow, 'historical_location_id' | 'historical_record_id' | 'relationship_note'>>>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
