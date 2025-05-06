import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Subscription, Podcast } from '../types';

const Subscriptions: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchSubscriptions = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('*, podcast:podcasts(*)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setSubscriptions(data || []);
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
        setError('Failed to load your subscriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, [user, navigate]);

  if (loading) {
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
      <h1 className="text-3xl font-bold mb-8">Your Subscriptions</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl text-gray-600 mb-4">You haven't subscribed to any podcasts yet</h2>
          <p className="text-gray-500 mb-6">Subscribe to podcasts to keep track of your favorite content</p>
          <Link to="/" className="text-blue-600 hover:underline">
            Discover podcasts
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {subscriptions.map((subscription) => (
            <Link
              key={subscription.id}
              to={`/podcasts/${subscription.podcast_id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="aspect-square relative">
                <img
                  src={subscription.podcast?.cover_image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
                  alt={subscription.podcast?.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold line-clamp-1">{subscription.podcast?.title}</h2>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  {subscription.podcast?.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
