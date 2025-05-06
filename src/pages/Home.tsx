import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Podcast } from '../types';

const Home: React.FC = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const { data, error } = await supabase
          .from('podcasts')
          .select('*, author:profiles(username, avatar_url)')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setPodcasts(data || []);
      } catch (err) {
        console.error('Error fetching podcasts:', err);
        setError('Failed to load podcasts');
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Discover Podcasts</h1>

      {podcasts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl text-gray-600">No podcasts available yet</h2>
          <p className="mt-2 text-gray-500">Check back later or create your own!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {podcasts.map((podcast) => (
            <Link
              key={podcast.id}
              to={`/podcasts/${podcast.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="aspect-square relative">
                <img
                  src={podcast.cover_image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
                  alt={podcast.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold line-clamp-1">{podcast.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  By {podcast.author?.username || 'Unknown'}
                </p>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {podcast.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
