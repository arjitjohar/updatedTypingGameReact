import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Define backend URL - adjust if your backend runs elsewhere
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null); // Consider defining a User type/interface
  const [isLoading, setIsLoading] = useState(true);

  // Check login status when the component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      try {
        // Use 'include' to send cookies with the request
        const response = await fetch(`${BACKEND_URL}/api/auth/status`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(data.loggedIn);
          setUser(data.user || null);
        } else {
          // Handle non-OK responses if necessary
          console.error('Failed to fetch auth status:', response.statusText);
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleLogin = () => {
    // Redirect the browser to the backend endpoint that starts the Google OAuth flow
    window.location.href = `${BACKEND_URL}/auth/google`;
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include', // Important to send session cookie
      });

      if (response.ok) {
        setIsLoggedIn(false);
        setUser(null);
        // Optionally redirect to home page or show a message
        console.log('Logout successful');
        // window.location.href = '/'; // Example redirect after logout
      } else {
        console.error('Logout failed:', response.statusText);
        // Handle logout failure (e.g., show an error message)
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Handle network or other errors
    }
  };

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
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleLogin}
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
