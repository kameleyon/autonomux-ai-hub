-- Create a public storage bucket for AI-generated blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view blog images (public bucket)
CREATE POLICY "Public read access for blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

-- Allow authenticated users to upload blog images
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images');

-- Allow service role to manage blog images (for edge functions)
CREATE POLICY "Service role can manage blog images"
ON storage.objects FOR ALL
USING (bucket_id = 'blog-images');