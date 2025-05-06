import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Podcast, Episode } from '../types';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Play, Heart, Clock, Calendar } from 'lucide-react';

const PodcastDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPodcastDetails = async () => {
      try {
        // Fetch podcast details
        const { data: podcastData, error: podcastError } = await supabase
          .from('podcasts')
          .select('*, author:profiles(username, avatar_url)')
          .eq('id', id)
          .single();

        if (podcastError) throw podcastError;
        setPodcast(podcastData);

        // Fetch episodes
        const { data: episodesData, error: episodesError } = await supabase
          .from('episodes')
          .select('*')
          .eq('podcast_id', id)
          .order('published_at', { ascending: false });

        if (episodesError) throw episodesError;
        setEpisodes(episodesData || []);

        // Check if user is subscribed
        if (user) {
          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('podcast_id', id)
            .eq('user_id', user.id)
            .single();

          if (subscriptionError && subscriptionError.code !== 'PGRST116') {
            throw subscriptionError;
          }

          setIsSubscribed(!!subscriptionData);
        }
      } catch (err) {
        console.error('Error fetching podcast details:', err);
        setError('Failed to load podcast details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPodcastDetails();
    }
  }, [id, user]);

  const handleSubscribe = async () => {
    if (!user) {
      // Redirect to login
      return;
    }

    try {
      if (isSubscribed) {
        // Unsubscribe
        await supabase
          .from('subscriptions')
          .delete()
          .eq('podcast_id', id)
          .eq('user_id', user.id);
        
        setIsSubscribed(false);
      } else {
        // Subscribe
        await supabase
          .from('subscriptions')
          .insert({
            podcast_id: id,
            user_id: user.id,
          });
        
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Error updating subscription:', err);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Podcast not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3 lg:w-1/4">
            <img
              src={podcast.cover_image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
              alt={podcast.title}
              className="w-full aspect-square object-cover"
            />
          </div>
          <div className="p-6 md:w-2/3 lg:w-3/4">
            <h1 className="text-3xl font-bold">{podcast.title}</h1>
            <p className="text-gray-600 mt-2">
              By {podcast.author?.username || 'Unknown'}
            </p>
            <div className="mt-4">
              <p className="text-gray-700">{podcast.description}</p>
            </div>
            <div className="mt-6">
              {user ? (
                <Button
                  onClick={handleSubscribe}
                  variant={isSubscribed ? 'secondary' : 'primary'}
                >
                  {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                </Button>
              ) : (
                <Link to="/login">
                  <Button>Login to Subscribe</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Episodes</h2>
        
        {episodes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">No episodes available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {episodes.map((episode) => (
              <div
                key={episode.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold">{episode.title}</h3>
                      <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                        <span className="flex items-center">
                          <Clock size={16} className="mr-1" />
                          {formatDuration(episode.duration)}
                        </span>
                        <span className="flex items-center">
                          <Calendar size={16} className="mr-1" />
                          {formatDate(episode.published_at)}
                        </span>
                      </div>
                      <p className="mt-3 text-gray-700">{episode.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Link to={`/episodes/${episode.id}`}>
                        <Button size="sm" className="flex items-center">
                          <Play size={16} className="mr-1" />
                          Play
                        </Button>
                      </Link>
                      {user && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-red-500"
                        >
                          <Heart size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastDetail;
