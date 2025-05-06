import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Podcast } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Upload, ArrowLeft } from 'lucide-react';

const episodeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  publishedAt: z.string().nonempty('Publication date is required'),
});

type EpisodeFormValues = z.infer<typeof episodeSchema>;

const CreateEpisode: React.FC = () => {
  const { id: podcastId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      publishedAt: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchPodcast = async () => {
      try {
        const { data, error } = await supabase
          .from('podcasts')
          .select('*')
          .eq('id', podcastId)
          .single();

        if (error) throw error;
        
        // Verify ownership
        if (data.author_id !== user.id) {
          navigate('/dashboard');
          return;
        }

        setPodcast(data);
      } catch (err) {
        console.error('Error fetching podcast:', err);
        setError('Failed to load podcast details');
      }
    };

    if (podcastId) {
      fetchPodcast();
    }

    // Create storage bucket if it doesn't exist
    const createStorageBucket = async () => {
      try {
        // Check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === 'podcast-audio');
        
        if (!bucketExists) {
          // Create the bucket
          const { error } = await supabase.storage.createBucket('podcast-audio', {
            public: true
          });
          
          if (error) {
            console.error('Error creating storage bucket:', error);
          }
        }
      } catch (err) {
        console.error('Error checking/creating storage bucket:', err);
      }
    };
    
    createStorageBucket();
  }, [podcastId, user, navigate]);

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file');
      return;
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('Audio file size should be less than 100MB');
      return;
    }

    setAudioFile(file);
    setError(null);
  };

  const onSubmit = async (data: EpisodeFormValues) => {
    if (!user || !podcast || !audioFile) {
      setError('Please upload an audio file');
      return;
    }
    
    try {
      setIsUploading(true);
      setError(null);
      
      // Upload audio file
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${podcast.id}/${fileName}`;

      console.log('Uploading audio to path:', filePath);

      // Calculate audio duration (approximate)
      const audioDuration = await getAudioDuration(audioFile);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('podcast-audio')
        .upload(filePath, audioFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(percent);
          },
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Audio upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('podcast-audio')
        .getPublicUrl(filePath);

      console.log('Audio uploaded successfully, URL:', urlData.publicUrl);

      // Create episode record
      const { error: insertError, data: episode } = await supabase
        .from('episodes')
        .insert({
          podcast_id: podcast.id,
          title: data.title,
          description: data.description,
          audio_url: urlData.publicUrl,
          duration: audioDuration,
          published_at: new Date(data.publishedAt).toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to create episode: ${insertError.message}`);
      }

      console.log('Episode created successfully:', episode);

      // Redirect to episodes page
      navigate(`/dashboard/podcasts/${podcast.id}/episodes`);
    } catch (err: any) {
      console.error('Error creating episode:', err);
      setError(err.message || 'Failed to create episode');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper function to get audio duration
  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      
      audio.onloadedmetadata = () => {
        window.URL.revokeObjectURL(audio.src);
        resolve(Math.round(audio.duration));
      };
      
      audio.onerror = () => {
        // If we can't get duration, use a default value based on file size
        // Rough estimate: 1MB ≈ 1 minute of audio at medium quality
        const sizeInMB = file.size / (1024 * 1024);
        resolve(Math.round(sizeInMB * 60));
      };
      
      audio.src = URL.createObjectURL(file);
    });
  };

  if (!podcast) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/dashboard/podcasts/${podcastId}/episodes`)}
          className="text-blue-600 hover:underline flex items-center"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Episodes
        </button>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Add New Episode</h1>
        <p className="text-gray-600 mb-8">For: {podcast.title}</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <Input
                  label="Episode Title"
                  placeholder="Episode #1: Introduction"
                  {...register('title')}
                  error={errors.title?.message}
                />

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Episode Description
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={4}
                    placeholder="What is this episode about?"
                    {...register('description')}
                  />
                  {errors.description?.message && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <Input
                  label="Publication Date"
                  type="date"
                  {...register('publishedAt')}
                  error={errors.publishedAt?.message}
                />

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Audio File
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div>
                      <label
                        htmlFor="audio-file"
                        className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                      >
                        Choose file
                      </label>
                      <input
                        id="audio-file"
                        name="audio-file"
                        type="file"
                        accept="audio/*"
                        className="sr-only"
                        onChange={handleAudioChange}
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        MP3, WAV, M4A up to 100MB
                      </p>
                    </div>
                    {audioFile && (
                      <div className="text-sm text-gray-600">
                        {audioFile.name} ({(audioFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    )}
                  </div>
                </div>

                {isUploading && (
                  <div className="space-y-1">
                    <div className="text-sm text-gray-600">
                      Uploading: {uploadProgress.toFixed(0)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/dashboard/podcasts/${podcastId}/episodes`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting || isUploading}
                  disabled={!audioFile}
                >
                  Create Episode
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEpisode;
