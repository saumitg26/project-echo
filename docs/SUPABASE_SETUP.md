# PROJECT ECHO: Supabase backend

## Relationship overview
```
auth.users 1─1 profiles
profiles 1─* families (created_by)              families.is_demo = fictional seed family
families 1─* family_memberships *─1 profiles    role: owner | editor | viewer
families 1─* ancestors 1─* ancestor_relationships (parent_of | spouse_of | sibling_of)
ancestors 1─* memories 1─* media_assets ──► storage object in private bucket `memory-media`
families 1─* time_capsules
```
`memories` and `media_assets` carry `family_id` too (composite FKs keep it consistent with the ancestor/memory).
Storage path: `families/{family_id}/memories/{memory_id}/{uuid}.{ext}`, and the DB rejects `storage_path` values outside that memory's folder.

## Security model
- RLS on every table. Members read their families; owners/editors write; viewers read only. No `USING (true)` on private data.
- `anon` can read ONLY rows of families where `is_demo = true` (fictional). Clients cannot create demo rows.
- Bucket `memory-media` is private (50 MB, images/audio/video/PDF). Storage policies require the path's family and memory IDs to match a real memory and require an owner/editor role. No overwrites (no UPDATE policy).
- Locked time capsules are readable only by their creator until `unlock_date`; other family members and demo viewers must wait for the date.
- Frontend uses only the publishable key. The service-role key is used only for seeding in the dashboard SQL editor.

## Hosted project setup (`nnyeoqigeerkdmwzxfdf`)
1. In your own terminal, run `npx supabase login` and complete the official browser flow. Never paste the access token into chat or a repository file.
2. Link safely: `npx supabase link --project-ref nnyeoqigeerkdmwzxfdf`. If prompted for a database password, enter it only in the terminal.
3. Inspect remote state before writing: `npx supabase migration list` and `npx supabase db push --dry-run`.
4. If the dry run contains only the four reviewed PROJECT ECHO migrations, apply them with `npx supabase db push`. Never use `db reset` on the hosted project.
5. In the Supabase dashboard, open **Project Settings → Data API** and copy the Project URL and publishable key. Copy `.env.example` to `.env.local` and fill only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never use the secret/service-role key in a `VITE_*` variable.
6. Open **Authentication → Sign In / Providers → Email** and enable email/password. For the time-limited demo, decide whether to disable email confirmation; production should normally keep it enabled.
7. Open **SQL Editor**, run `supabase/seed/demo_family.sql`, then run `supabase/tests/rls_verification.sql` (the test rolls back).
8. Test through the app with two accounts: upload as an owner/editor, confirm refresh persistence and a working signed URL, then confirm the unrelated user and a viewer cannot upload or sign the private object.

## Using it in the app
`src/lib/supabase/api.ts` exports `getMyFamilies`, `createFamily`, `getAncestors`, `createAncestor`, `getAncestorRelationships`,
`getMemoriesForAncestor`, `createMemory`, `createMemoryWithMedia`, `uploadMemoryMedia`, `getMediaWithSignedUrls`, `getSignedMediaUrl`,
`deleteMediaAsset`, `createTimeCapsule`, `getTimeCapsules`, plus email auth helpers.
Demo strategy: if `isSupabaseConfigured` is false or nobody is signed in, keep rendering the existing hardcoded demo data.

## ElevenLabs / browser recording contract
`AudioUploadContract` in `src/lib/supabase/api.ts` is the handoff shape: audio `Blob`, MIME type, duration,
transcript, ancestor ID, memory ID, and UI-owned upload status. `uploadMemoryMedia` accepts either a `File` or a
`Blob`, including browser-standard `audio/webm` and `audio/ogg`. The narration developer should create one
`memories` row, then pass that row's ID and the recorder Blob to the existing helper. Transcript and duration are
not persisted yet; coordinate a schema migration before adding either field rather than creating another bucket or
embedding unreviewed transcript data in a description.

## Verification status (Priority 1 Complete)
- **Hosted project**: `nnyeoqigeerkdmwzxfdf` (Production).
- **Migrations applied**:
  - `20261119000000_init_schema.sql`
  - `20261119000100_rls_policies.sql`
  - `20261119000200_storage.sql`
  - `20261119000300_security_hardening.sql`
- **Security test suite**: `supabase/tests/rls_verification.sql` executed against hosted instance in an atomic transaction; passed all 20 assertions and rolled back cleanly.
- **End-to-End verified workflow**:
  - Authenticated user signed up through frontend.
  - Created private family archive `Echo Test Family` (`dbb8a9f0-0cba-4dcc-95fb-563d5fb8975f`).
  - Created ancestor `Marcus Vale` (`1f793ef1-6897-400d-851a-ca1b61e07a50`).
  - Uploaded real photograph (`harbor-beacon-2044.png`, 289,155 bytes, PNG) to private bucket `memory-media`.
  - Created memory `Christmas Day` (`b406ce4b-af99-4720-ab91-41b77e996ef5`) and linked `media_assets` row.
  - Private signed URL verified for authorized user; anonymous public URL verified blocked (`NoSuchBucket`).
  - Browser reload persistence verified.
  - Fictional Voss/Vale demo archive preserved.

## Known limits
- The last owner of a family can leave it; inviting members means an owner inserting a `family_memberships` row for an existing user id (no invite UI).
- Deleting a memory/ancestor cascades DB rows but not storage objects; use `deleteMediaAsset` first.
- Immersive 3D/interactive Memory Room is implemented specifically for Mara Voss; other ancestors preserve memories and display archival cards with signed media previews.
- Audio transcript and duration fields from ElevenLabs contract (`AudioUploadContract`) require a dedicated schema migration before persisting directly in PostgreSQL.
