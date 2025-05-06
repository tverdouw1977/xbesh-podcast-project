/*
  # Create Storage Bucket for Podcast Covers
  
  1. New Storage
    - Creates the 'podcast-covers' bucket for storing podcast cover images
  
  2. Security
    - Sets public access to allow users to view podcast covers
*/

-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Create the podcast-covers bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('podcast-covers', 'podcast-covers', true)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create policy to allow authenticated users to upload
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload podcast covers'
  ) THEN
    -- Policy already exists
    RAISE NOTICE 'Policy "Authenticated users can upload podcast covers" already exists';
  ELSE
    -- Create the policy
    EXECUTE 'CREATE POLICY "Authenticated users can upload podcast covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''podcast-covers'')';
  END IF;
  
  -- Create policy to allow public access to view files
  IF EXISTS (
    SELECT 1 FROM pg_catalog.pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public users can view podcast covers'
  ) THEN
    -- Policy already exists
    RAISE NOTICE 'Policy "Public users can view podcast covers" already exists';
  ELSE
    -- Create the policy
    EXECUTE 'CREATE POLICY "Public users can view podcast covers" ON storage.objects FOR SELECT TO public USING (bucket_id = ''podcast-covers'')';
  END IF;
  
  RAISE NOTICE 'Storage bucket "podcast-covers" and policies have been created successfully';
END $$;
