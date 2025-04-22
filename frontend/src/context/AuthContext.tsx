import { createContext, useState, useEffect, useContext, PropsWithChildren } from 'react';
import axios from 'axios'; // Import axios

// Define backend URL - adjust if your backend runs elsewhere
// Ensure VITE_BACKEND_URL is set in your .env file
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'; // Provide a fallback

// Define a type for the user object for better type safety
// Adjust based on the actual structure of your user object from the backend
interface User {
    id: string;
    displayName?: string;
    emails?: { value: string }[];
    photos?: { value: string }[];
    // Add other properties you expect on the user object
}

interface AuthContextProps {
    isLoggedIn: boolean;
    user: User | null; // Use the User interface
    isLoading: boolean;
    login: () => void;
    logout: () => Promise<void>; // Make logout return a promise
}

// Define the expected response structure for /api/auth/status
interface AuthStatusResponse {
    loggedIn: boolean;
    user?: User; // User object is optional
}

// Define the expected response structure for /api/auth/logout
interface LogoutResponse {
    message: string;
}


const AuthContext = createContext<AuthContextProps | null>(null);

interface AuthProviderProps extends PropsWithChildren {}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check authentication status on initial load using Axios
    useEffect(() => {
        const checkAuthStatus = async () => {
            setIsLoading(true);
            const statusEndpoint = `${BACKEND_URL}/api/auth/status`;
            try {
                // Use axios.get to check status, sending credentials
                const response = await axios.get<AuthStatusResponse>(statusEndpoint, {
                    withCredentials: true, // Send cookies
                });

                // Update state based on response data
                setIsLoggedIn(response.data.loggedIn);
                setUser(response.data.user || null);
                console.log('Auth status checked:', response.data);

            } catch (error) {
                console.error('Error checking auth status:', error);
                 // Handle Axios errors more specifically
                 if (axios.isAxiosError(error)) {
                    console.error('Axios error details:', error.response?.data || error.message);
                 }
                // Assume logged out on error
                setIsLoggedIn(false);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []); // Empty dependency array ensures this runs only once on mount

    // Login function redirects to Google OAuth flow
    const login = () => {
        // Ensure BACKEND_URL is defined before redirecting
        if (!BACKEND_URL) {
            console.error("Backend URL is not defined. Cannot initiate login.");
            // Optionally, show an error message to the user
            return;
        }
        window.location.href = `${BACKEND_URL}/auth/google`;
    };

    // Logout function using Axios
    const logout = async (): Promise<void> => {
        const logoutEndpoint = `${BACKEND_URL}/api/auth/logout`;
        try {
            // Use axios.post for logout, sending credentials
            const response = await axios.post<LogoutResponse>(logoutEndpoint, {}, { // Send empty object as data if no body needed
                 withCredentials: true, // Send cookies
            });

            // Update state on successful logout
            setIsLoggedIn(false);
            setUser(null);
            console.log('Logout successful:', response.data.message);
            // Optionally redirect or perform other actions after logout
            // window.location.href = '/'; // Example redirect to home

        } catch (error) {
            console.error('Error during logout:', error);
            if (axios.isAxiosError(error)) {
                console.error('Axios error details during logout:', error.response?.data || error.message);
            }
            // Optionally, inform the user that logout failed
            // You might not want to change the logged-in state if logout fails server-side
            // Or you could force logout client-side anyway:
            // setIsLoggedIn(false);
            // setUser(null);
            throw error; // Re-throw error if needed for upstream handling
        }
    };

    // Context value provided to children
    const value: AuthContextProps = {
        isLoggedIn,
        user,
        isLoading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {/* Render children only when loading is complete, or show a loader */}
            {/* {!isLoading ? children : <div>Loading Authentication...</div>} */}
             {children} {/* Or keep rendering children during load */}
        </AuthContext.Provider>
    );
};

// Custom hook to consume the AuthContext
export const useAuth = (): AuthContextProps => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
