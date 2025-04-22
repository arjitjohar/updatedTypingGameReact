import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isLoggedIn, user, isLoading, login, logout } = useAuth();

  return (
    <nav className="bg-gray-900 p-4">
      <div className="container mx-auto flex justify-between items-center text-gray-300">
        {/* Left side links */}
        <div className="flex space-x-4">
          <Link to="/" className="text-xl font-bold hover:text-gray-50">
            Landing Page
          </Link>
          <Link to="/typing" className="text-xl font-bold hover:text-gray-50">
            Typing Test
          </Link>
          <Link to="/leaderboard" className="text-xl font-bold hover:text-gray-50">
            Leaderboards
          </Link>
        </div>

        {/* Right side - Auth status */}
        <div className="flex items-center space-x-4">
          {isLoading ? (
            <span className="text-gray-400">Loading...</span>
          ) : isLoggedIn && user ? (
            <>
              <span className="text-gray-50">Welcome, {user.displayName || user.emails?.[0]?.value || 'User'}!</span>
              {/* Display user avatar if available */}
              {user.photos?.[0]?.value && (
                <img src={user.photos[0].value} alt="Avatar" className="w-8 h-8 rounded-full" />
              )}
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={login}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
