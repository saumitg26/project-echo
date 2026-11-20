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
- Bucket `memory-media` is private (50 MB, images/audio/video/PDF). Storage policies parse the family id from the path and reuse the same membership checks. No overwrites (no UPDATE policy).
- Frontend uses only the publishable key. The service-role key is used only for seeding in the dashboard SQL editor.

## Manual setup (cannot be done from code)
1. Create a Supabase project; copy Project URL + publishable key.
2. `cp .env.example .env.local` and fill both values. Ensure `.env*` (except `.env.example`) is in `.gitignore`.
3. `npm i @supabase/supabase-js`
4. `npx supabase login && npx supabase link --project-ref <ref> && npx supabase db push` (or paste the 3 migration files, in order, into the SQL editor).
5. Auth > Providers: enable Email. For a fast demo, turn off "Confirm email".
6. Fill and run `supabase/seed/demo_family.sql` in the SQL editor.
7. Run `supabase/tests/rls_verification.sql` in the SQL editor (it rolls back).
8. Manually test the HTTP path: sign up two users in the app, upload an image as user A, confirm a signed URL works for A and that user B cannot create one.

## Using it in the app
`src/lib/supabase/api.ts` exports `getMyFamilies`, `createFamily`, `getAncestors`, `getAncestorRelationships`,
`getMemoriesForAncestor`, `createMemory`, `uploadMemoryMedia`, `getMediaWithSignedUrls`, `getSignedMediaUrl`,
`deleteMediaAsset`, `createTimeCapsule`, `getTimeCapsules`, plus email auth helpers.
Demo strategy: if `isSupabaseConfigured` is false or nobody is signed in, keep rendering the existing hardcoded demo data.

## Known limits
- Time capsule `unlock_date` is enforced by the UI only; members can read the message via the API before it unlocks.
- The last owner of a family can leave it; inviting members means an owner inserting a `family_memberships` row for an existing user id (no invite UI).
- Deleting a memory/ancestor cascades DB rows but not storage objects; use `deleteMediaAsset` first.
