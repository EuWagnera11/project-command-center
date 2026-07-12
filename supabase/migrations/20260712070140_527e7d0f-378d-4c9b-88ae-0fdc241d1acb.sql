
CREATE POLICY "Public read bulk-media" ON storage.objects FOR SELECT USING (bucket_id = 'bulk-media');
CREATE POLICY "Public upload bulk-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'bulk-media');
