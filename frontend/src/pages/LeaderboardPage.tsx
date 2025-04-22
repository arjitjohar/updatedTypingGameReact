import { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Import axios

// Define an interface for the leaderboard entry structure
interface LeaderboardEntry {
    UserID: string;
    Name: string; // Assumes name is included (either denormalized or fetched by backend)
    WPM: number;
    DateAchieved: string; // ISO String format
    TextID: string;
    // Add other projected fields if needed
}

/**
 * Helper to format the ISO date string
 */
const formatDate = (isoDateString: string): string => {
    try {
        return new Date(isoDateString).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (e) {
        console.error("Error formatting date:", isoDateString, e);
        return 'Invalid Date';
    }
};

/**
 * Leaderboard Page Component.
 */
const LeaderboardPage = () => {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch leaderboard data using Axios
    const fetchLeaderboard = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        // Target the backend server URL (adjust if needed)
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const leaderboardEndpoint = `${backendUrl}/api/leaderboard`;

        try {
            // Use axios.get to fetch data
            const response = await axios.get<LeaderboardEntry[]>(leaderboardEndpoint, {
                 // No 'withCredentials' needed for a public GET usually,
                 // unless your leaderboard route requires authentication.
                 // If it does, add: withCredentials: true
            });
            setLeaderboardData(response.data); // Axios puts data directly in response.data
        } catch (err) {
            console.error("Failed to fetch leaderboard:", err);
            let errorMsg = 'An unknown error occurred while fetching the leaderboard.';
            if (axios.isAxiosError(err)) { // Check if it's an Axios error
                 if (err.response) {
                    // Server responded with a status code outside the 2xx range
                    console.error('Leaderboard fetch error - Server responded:', err.response.status, err.response.data);
                    errorMsg = err.response.data?.message || `Server error ${err.response.status}`;
                } else if (err.request) {
                    // Request was made but no response received
                    console.error('Leaderboard fetch error - No response:', err.request);
                    errorMsg = 'Could not connect to the server to fetch leaderboard.';
                } else {
                    // Setup error
                    console.error('Leaderboard fetch error - Request setup:', err.message);
                    errorMsg = `Error fetching leaderboard: ${err.message}`;
                }
            } else if (err instanceof Error) {
                 errorMsg = err.message;
            }
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array ensures this useCallback doesn't change

    // Fetch data on component mount
    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]); // Include fetchLeaderboard in dependency array

    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 flex flex-col items-center pt-16 pb-12 font-sans px-4">
            <h1 className='text-5xl font-bold text-yellow-400 mb-8'> Leaderboard </h1>
            <p className='text-lg text-gray-400 mb-10'>Top 20 High Scores (WPM)</p>

            {isLoading && (
                <div className="text-xl text-yellow-400 animate-pulse">Loading leaderboard...</div>
            )}

            {error && (
                <div className="w-full max-w-2xl text-center text-red-400 bg-red-900 bg-opacity-30 border border-red-600 rounded-md p-4">
                    <p className="font-semibold">Failed to load leaderboard:</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {!isLoading && !error && leaderboardData.length === 0 && (
                <div className="text-xl text-gray-500">No scores recorded yet! Be the first!</div>
            )}

            {!isLoading && !error && leaderboardData.length > 0 && (
                <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                    <table className="min-w-full table-auto text-left">
                        <thead className="bg-gray-700 text-gray-300 uppercase text-sm leading-normal">
                            <tr>
                                <th className="py-3 px-4 text-center">Rank</th>
                                <th className="py-3 px-4">Player</th>
                                <th className="py-3 px-4 text-center">WPM</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Text ID</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-200 text-sm font-light">
                            {leaderboardData.map((entry, index) => (
                                <tr key={`${entry.UserID}-${entry.DateAchieved}`} className="border-b border-gray-700 hover:bg-gray-750 transition duration-150 ease-in-out">
                                    <td className="py-3 px-4 text-center font-semibold">{index + 1}</td>
                                    <td className="py-3 px-4">
                                        {entry.Name || 'Anonymous'} {/* Fallback name */}
                                    </td>
                                    <td className="py-3 px-4 text-center font-bold text-yellow-400 text-lg">{entry.WPM}</td>
                                    <td className="py-3 px-4 text-xs">{formatDate(entry.DateAchieved)}</td>
                                    <td className="py-3 px-4 text-xs">{entry.TextID}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

             <button
                 onClick={fetchLeaderboard} // Call fetch function directly
                 className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md transition duration-150 ease-in-out shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                 disabled={isLoading}
             >
                 {isLoading ? 'Refreshing...' : 'Refresh Leaderboard'}
             </button>

        </div>
    );
};

export default LeaderboardPage;
