/*
  # Initial Schema for Podcast App
  
  1. New Tables
    - `profiles` - User profiles
    - `podcasts` - Podcast shows
    - `episodes` - Individual podcast episodes
    - `subscriptions` - User podcast subscriptions
    - `favorites` - User favorite episodes
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create podcasts table
CREATE TABLE IF NOT EXISTS podcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create episodes table
CREATE TABLE IF NOT EXISTS episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  published_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  podcast_id UUID NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, podcast_id)
);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, episode_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Podcasts policies
CREATE POLICY "Podcasts are viewable by everyone"
  ON podcasts FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own podcasts"
  ON podcasts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own podcasts"
  ON podcasts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own podcasts"
  ON podcasts FOR DELETE
  USING (auth.uid() = author_id);

-- Episodes policies
CREATE POLICY "Episodes are viewable by everyone"
  ON episodes FOR SELECT
  USING (true);

CREATE POLICY "Users can create episodes for their own podcasts"
  ON episodes FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT author_id FROM podcasts WHERE id = podcast_id
    )
  );

CREATE POLICY "Users can update episodes for their own podcasts"
  ON episodes FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT author_id FROM podcasts WHERE id = podcast_id
    )
  );

CREATE POLICY "Users can delete episodes for their own podcasts"
  ON episodes FOR DELETE
  USING (
    auth.uid() IN (
      SELECT author_id FROM podcasts WHERE id = podcast_id
    )
  );

-- Subscriptions policies
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);
