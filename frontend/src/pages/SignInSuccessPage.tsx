/**
 * Sign In Success Page Component.
 * Displays a welcome message after successful Google OAuth sign-in.
 */
import { useLocation } from 'react-router-dom';

const SignInSuccessPage = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    // Assumes the backend redirects to /signinsuccess?name=... after successful authentication
    const name = queryParams.get('name'); 

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
            <div className="font-sans text-4xl text-gray-300 font-bold text-center">
                {/* Display personalized welcome message if name is present, otherwise a generic success message */}
                {name ? `Welcome, ${name}!` : 'Sign in successful!'}
            </div>
        </div>
    );
};

export default SignInSuccessPage;
