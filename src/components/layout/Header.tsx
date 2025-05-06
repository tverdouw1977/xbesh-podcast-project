import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import { User, LogOut, Menu, Plus } from 'lucide-react';

interface HeaderProps {
  user: any | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-blue-600">
          PodcastHub
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <Link to="/" className="text-gray-700 hover:text-blue-600">
            Discover
          </Link>
          {user ? (
            <>
              <Link to="/subscriptions" className="text-gray-700 hover:text-blue-600">
                Subscriptions
              </Link>
              <Link to="/favorites" className="text-gray-700 hover:text-blue-600">
                Favorites
              </Link>
              {user.user_metadata?.is_creator && (
                <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                  Creator Dashboard
                </Link>
              )}
              <Link to="/dashboard/podcasts/new" className="inline-block">
                <Button size="sm" className="flex items-center">
                  <Plus size={16} className="mr-1" />
                  Create Podcast
                </Button>
              </Link>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600"
                >
                  <User size={20} />
                  <span>{user.user_metadata?.username || user.email}</span>
                </button>
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 py-2">
          <div className="container mx-auto px-4 space-y-2">
            <Link
              to="/"
              className="block py-2 text-gray-700 hover:text-blue-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Discover
            </Link>
            {user ? (
              <>
                <Link
                  to="/subscriptions"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Subscriptions
                </Link>
                <Link
                  to="/favorites"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Favorites
                </Link>
                {user.user_metadata?.is_creator && (
                  <Link
                    to="/dashboard"
                    className="block py-2 text-gray-700 hover:text-blue-600"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Creator Dashboard
                  </Link>
                )}
                <Link
                  to="/dashboard/podcasts/new"
                  className="block py-2 text-gray-700 hover:text-blue-600 flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Plus size={18} className="mr-2" />
                  Create Podcast
                </Link>
                <Link
                  to="/profile"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center py-2 text-gray-700 hover:text-blue-600"
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="block py-2 text-gray-700 hover:text-blue-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
