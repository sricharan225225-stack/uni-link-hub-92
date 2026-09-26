ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Notes', ADD COLUMN IF NOT EXISTS file_path text;
CREATE POLICY "signed in read study files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'study-materials');
CREATE POLICY "admin upload study files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'study-materials' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update study files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'study-materials' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete study files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'study-materials' AND public.has_role(auth.uid(), 'admin'));