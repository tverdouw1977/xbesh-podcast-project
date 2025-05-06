import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Upload } from 'lucide-react';

const podcastSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type PodcastFormValues = z.infer<typeof podcastSchema>;

const CreatePodcast: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bucketReady, setBucketReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PodcastFormValues>({
    resolver: zodResolver(podcastSchema),
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Check if the required bucket exists
  useEffect(() => {
    const checkBucketExists = async () => {
      try {
        setError(null);
        console.log('Checking if podcast-covers bucket exists...');
        
        // Check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.error('Error listing buckets:', listError);
          setError(`Error checking storage buckets: ${listError.message}`);
          return;
        }
        
        console.log('Available buckets:', buckets);
        const bucketExists = buckets?.some(bucket => bucket.name === 'podcast-covers');
        
        if (!bucketExists) {
          console.log('Bucket does not exist. Please create the "podcast-covers" bucket in the Supabase dashboard.');
          setError('Storage bucket "podcast-covers" not found. Please contact the administrator to set up storage.');
          return;
        }
        
        console.log('Bucket exists and is ready to use');
        setBucketReady(true);
      } catch (err) {
        console.error('Error checking bucket:', err);
        setError('Failed to check storage availability. Please try again later.');
      }
    };
    
    checkBucketExists();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setCoverImage(file);
    setCoverImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const onSubmit = async (data: PodcastFormValues) => {
    if (!user) return;
    
    try {
      setIsUploading(true);
      setError(null);
      let coverImageUrl = null;

      // Upload cover image if selected
      if (coverImage) {
        if (!bucketReady) {
          throw new Error('Storage is not ready. Please ensure the "podcast-covers" bucket exists in Supabase.');
        }
        
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        console.log('Uploading image to path:', filePath);

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('podcast-covers')
          .upload(filePath, coverImage, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('podcast-covers')
          .getPublicUrl(filePath);

        coverImageUrl = urlData.publicUrl;
        console.log('Image uploaded successfully, URL:', coverImageUrl);
      }

      console.log('Creating podcast record with data:', {
        title: data.title,
        description: data.description,
        cover_image_url: coverImageUrl,
        author_id: user.id,
      });

      // Create podcast record
      const { error: insertError, data: podcast } = await supabase
        .from('podcasts')
        .insert({
          title: data.title,
          description: data.description,
          cover_image_url: coverImageUrl,
          author_id: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error(`Failed to create podcast: ${insertError.message}`);
      }

      console.log('Podcast created successfully:', podcast);

      // Redirect to podcast episodes page
      navigate(`/dashboard/podcasts/${podcast.id}/episodes`);
    } catch (err: any) {
      console.error('Error creating podcast:', err);
      setError(err.message || 'Failed to create podcast');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Podcast</h1>

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
                  label="Podcast Title"
                  placeholder="My Awesome Podcast"
                  {...register('title')}
                  error={errors.title?.message}
                />

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Podcast Description
                  </label>
                  <textarea
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    rows={4}
                    placeholder="What is your podcast about?"
                    {...register('description')}
                  />
                  {errors.description?.message && (
                    <p className="text-sm text-red-500">{errors.description.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">
                    Cover Image
                  </label>
                  <div className="mt-1 flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {coverImagePreview ? (
                        <img
                          src={coverImagePreview}
                          alt="Cover preview"
                          className="h-32 w-32 object-cover rounded-md"
                        />
                      ) : (
                        <div className="h-32 w-32 rounded-md bg-gray-100 flex items-center justify-center">
                          <Upload className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="cover-image"
                        className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                      >
                        Choose file
                      </label>
                      <input
                        id="cover-image"
                        name="cover-image"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting || isUploading}
                >
                  Create Podcast
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePodcast;
