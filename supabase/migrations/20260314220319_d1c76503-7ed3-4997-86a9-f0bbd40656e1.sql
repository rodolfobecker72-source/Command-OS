
-- Create avatars storage bucket (public for read access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow workspace owners/admins to upload avatars for any member in their workspace
CREATE POLICY "Owners can upload member avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  public.get_user_role(auth.uid()) = 'owner'::public.app_role
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow owners to update any avatar
CREATE POLICY "Owners can update member avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  public.get_user_role(auth.uid()) = 'owner'::public.app_role
);

-- Allow public read access to avatars
CREATE POLICY "Public read access to avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow owners to delete any avatar
CREATE POLICY "Owners can delete member avatars"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  public.get_user_role(auth.uid()) = 'owner'::public.app_role
);
