

## Plan: Enhance User Management with Photo and Name Editing

### Current State
- Edit dialog only allows changing the member's **role**
- Avatar is displayed in the list but there's no upload mechanism
- No storage bucket exists for avatar images
- Profile update RLS only allows users to update their **own** profile (`auth.uid() = id`), so the owner cannot update other members' profiles directly

### What Needs to Change

**1. Database: Create `avatars` storage bucket**
- Create a public storage bucket for member photos
- Add RLS policies: authenticated users can upload to their own folder, owner/admin can upload to any folder, public read access

**2. Database: Add RLS policy for owner to update member profiles**
- Add a new UPDATE policy on `profiles` that allows workspace owners to update profiles of members in the same workspace (using `has_role` + workspace membership check)

**3. Frontend: Enhance Edit Member Dialog (`UsersPage.tsx`)**
- Add avatar preview with click-to-upload functionality (file input)
- Add editable **name** field
- Keep existing **role** selector
- On save: upload photo to `avatars/{user_id}` bucket if changed, update `profiles` table (name + photo_url), update `workspace_members` table (role)
- Show loading state during upload/save

**4. Edge function approach (alternative to RLS)**
- Since the owner needs to update OTHER users' profiles, create a small edge function `update-member-profile` that uses the service role key to update the profile, after verifying the caller is the workspace owner
- This is more secure than broadening RLS policies

### Implementation Summary

| Change | File/Resource |
|--------|--------------|
| Storage bucket `avatars` | SQL migration |
| Edge function `update-member-profile` | `supabase/functions/update-member-profile/index.ts` |
| Enhanced edit dialog with photo + name | `src/pages/users/UsersPage.tsx` |

The edit dialog will show the member's current avatar (clickable to change), a name input, and the role selector. Photo uploads go to the `avatars` bucket via direct client upload, then the edge function updates the profile record.

