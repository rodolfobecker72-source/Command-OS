

## Analysis: Member Management Review

### What was found

**Backend (Edge Function `create-member`)**:
- Permission logic is correct: only `owner` can create members
- User creation via admin API works, profile trigger (`handle_new_user`) fires automatically
- Workspace binding uses the caller's `workspace_id` — correct
- Role validation accepts only `admin`, `vendedor`, `visualizador` — correct
- **Issue 1**: CORS headers are incomplete — missing recommended Supabase client headers, which can cause request failures
- **Issue 2**: Edge function is not declared in `supabase/config.toml` (uses default `verify_jwt = true` which works, but should be explicit for clarity)

**Frontend (`UsersPage.tsx`)**:
- Page access blocked for non-owners (line 217) — correct
- Button visibility restricted to owners (`canManage`) — correct
- Form has `required` attributes and `type="email"` / `minLength={6}` — basic validation present
- Loading state (`isCreating`) and toast feedback on success/error — present
- Modal closes and member list reloads on success — correct
- **Issue 3**: Unused `session` variable fetched on line 135 — dead code
- **Issue 4**: No confirmation dialog before removing a member — risky UX
- **Issue 5**: N+1 queries in `loadMembers` (one query per member for profile) — inefficient but functional
- **Issue 6**: No client-side validation feedback before submit (e.g., password too short shows no inline message)

### What will be corrected

1. **Fix CORS headers** in edge function to include all recommended Supabase client headers
2. **Add edge function to `config.toml`** for explicit configuration
3. **Remove unused `session` fetch** in `handleCreate`
4. **Add delete confirmation dialog** before removing a member
5. **Optimize `loadMembers`** — fetch all profiles in a single query using `user_id in (...)` instead of N+1
6. **Improve client-side validation** — add inline validation for password length and empty fields, disable submit button when form is incomplete
7. **Add email display** in member list (currently only shows name) — fetch from profiles or show from member data for better identification

### Implementation details

**Edge function (`create-member/index.ts`)**:
- Update `corsHeaders` to include `x-supabase-client-platform` and related headers
- Add `[functions.create-member]` section to `config.toml`

**Frontend (`UsersPage.tsx`)**:
- Remove line 135 (unused session fetch)
- Add `AlertDialog` for delete confirmation with member name
- Refactor `loadMembers` to batch-fetch profiles: query `profiles` with `.in('id', userIds)` 
- Add form validation: disable "Criar Membro" button when name/email/password are empty or password < 6 chars
- Show inline helper text for password requirements

