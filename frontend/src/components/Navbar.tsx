import { GoogleLogin } from '@react-oauth/google';
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
        <GoogleLogin
          onSuccess={(credentialResponse: any) => {
            console.log(credentialResponse);
            console.log("big W huge win")

          }}
          onError={() => {
            console.log('Login Failed');
          }}
        />
      </div>
    </nav>
  );
};

export default Navbar;
