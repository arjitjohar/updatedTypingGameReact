import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-gray-900 p-4">
      <div className="container mx-auto flex justify-between text-gray-300">
        <Link to="/" className="text-4xl font-bold hover:text-gray-50">
          Landing Page
        </Link>
        <Link to="/typing" className="text-4xl font-bold hover:text-gray-50">
          Typing Test
        </Link>
        <Link to="/leaderboard" className="text-4xl font-bold hover:text-gray-50">
          Leaderboards
        </Link>
        <Link to="/login" className="text-4xl font-bold hover:text-gray-50">
          Login
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
