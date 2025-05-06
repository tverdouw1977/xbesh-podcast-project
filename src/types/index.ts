export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  cover_image_url: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface Episode {
  id: string;
  podcast_id: string;
  title: string;
  description: string;
  audio_url: string;
  duration: number;
  published_at: string;
  created_at: string;
  podcast?: Podcast;
}

export interface Subscription {
  id: string;
  user_id: string;
  podcast_id: string;
  created_at: string;
  podcast?: Podcast;
}

export interface Favorite {
  id: string;
  user_id: string;
  episode_id: string;
  created_at: string;
  episode?: Episode;
}
