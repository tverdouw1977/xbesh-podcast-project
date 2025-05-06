import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Episode, Podcast } from '../types';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart } from 'lucide-react';
import { Howl } from 'howler';

const EpisodePlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [volume, setVolume] = useState(0.8);
  
  const playerRef = useRef<Howl | null>(null);
  const seekBarRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const fetchEpisodeDetails = async () => {
      try {
        // Fetch episode details
        const { data: episodeData, error: episodeError } = await supabase
          .from('episodes')
          .select('*')
          .eq('id', id)
          .single();

        if (episodeError) throw episodeError;
        setEpisode(episodeData);

        // Fetch podcast details
        if (episodeData?.podcast_id) {
          const { data: podcastData, error: podcastError } = await supabase
            .from('podcasts')
            .select('*, author:profiles(username, avatar_url)')
            .eq('id', episodeData.podcast_id)
            .single();

          if (podcastError) throw podcastError;
          setPodcast(podcastData);
        }

        // Check if episode is favorited
        if (user) {
          const { data: favoriteData, error: favoriteError } = await supabase
            .from('favorites')
            .select('*')
            .eq('episode_id', id)
            .eq('user_id', user.id)
            .single();

          if (favoriteError && favoriteError.code !== 'PGRST116') {
            throw favoriteError;
          }

          setIsFavorite(!!favoriteData);
        }
      } catch (err) {
        console.error('Error fetching episode details:', err);
        setError('Failed to load episode details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEpisodeDetails();
    }

    // Cleanup function
    return () => {
      if (playerRef.current) {
        playerRef.current.unload();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [id, user]);

  useEffect(() => {
    if (episode?.audio_url && !playerRef.current) {
      playerRef.current = new Howl({
        src: [episode.audio_url],
        html5: true,
        volume: volume,
        onload: () => {
          if (playerRef.current) {
            setDuration(playerRef.current.duration());
          }
        },
        onplay: () => {
          setIsPlaying(true);
          animationRef.current = requestAnimationFrame(updateSeekBar);
        },
        onpause: () => {
          setIsPlaying(false);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        },
        onstop: () => {
          setIsPlaying(false);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        },
        onend: () => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (seekBarRef.current) {
            seekBarRef.current.value = '0';
          }
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        },
      });
    }
  }, [episode, volume]);

  const updateSeekBar = () => {
    if (playerRef.current) {
      const currentTime = playerRef.current.seek();
      setCurrentTime(currentTime);
      if (seekBarRef.current) {
        seekBarRef.current.value = currentTime.toString();
      }
    }
    animationRef.current = requestAnimationFrame(updateSeekBar);
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (playerRef.current) {
      playerRef.current.seek(seekTime);
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.volume(newVolume);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFavorite = async () => {
    if (!user || !episode) return;

    try {
      if (isFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('episode_id', episode.id)
          .eq('user_id', user.id);
        
        setIsFavorite(false);
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({
            episode_id: episode.id,
            user_id: user.id,
          });
        
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Error updating favorites:', err);
    }
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

  if (error || !episode || !podcast) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Episode not found'}
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
            <h1 className="text-2xl font-bold">{episode.title}</h1>
            <p className="text-gray-600 mt-1">
              {podcast.title} • {podcast.author?.username || 'Unknown'}
            </p>
            <div className="mt-4">
              <p className="text-gray-700">{episode.description}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavorite}
                  className={`${isFavorite ? 'text-red-500' : 'text-gray-500'}`}
                >
                  <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                </Button>
              )}
            </div>
            
            <input
              ref={seekBarRef}
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              step="0.01"
              onChange={handleSeek}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            
            <div className="flex items-center justify-center space-x-4">
              <button className="p-2 rounded-full hover:bg-gray-200">
                <SkipBack size={24} />
              </button>
              
              <button
                onClick={togglePlayPause}
                className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              
              <button className="p-2 rounded-full hover:bg-gray-200">
                <SkipForward size={24} />
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Volume2 size={18} className="text-gray-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EpisodePlayer;
