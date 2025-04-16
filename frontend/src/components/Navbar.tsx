import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-500 p-4">
      <div className="container mx-auto flex justify-between">
        <Link to="/" className="text-4xl font-bold">
          Landing Page
        </Link>
        <Link to="/typing" className="text-4xl font-bold">
          Typing Test
        </Link>
        <Link to="/leaderboard" className="text-4xl font-bold">
          Leaderboards
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
