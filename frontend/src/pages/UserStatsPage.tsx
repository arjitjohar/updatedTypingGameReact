import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Import axios

// Define an interface for the stat entry structure (can reuse or adapt LeaderboardEntry)
interface UserStatEntry {
    UserID: string;
    Name?: string; // Name might not be on every stat record unless denormalized
    WPM: number;
    DateAchieved: string; // ISO String format
    TextID: string;
    DataType: string; // Includes STAT# prefix and timestamp
    // Add other fields if they exist on your STAT items
}

/**
 * Helper to format the ISO date string (same as leaderboard)
 */
const formatDate = (isoDateString: string): string => {
    try {
        // Extract date from DataType if DateAchieved is missing (fallback)
        let dateStrToParse = isoDateString;
        if (!dateStrToParse && typeof isoDateString === 'string' && isoDateString.startsWith('STAT#')) {
             dateStrToParse = isoDateString.substring(5); // Get part after STAT#
        }

        return new Date(dateStrToParse).toLocaleString(undefined, {
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
 * User Stats Page Component.
 */
const UserStatsPage = () => {
    const [userStats, setUserStats] = useState<UserStatEntry[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'date' | 'wpm'>('date'); // Default sort by date

    // Function to fetch user stats data using Axios
    const fetchUserStats = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const statsEndpoint = `${backendUrl}/api/user/stats`;

        try {
            // Use axios.get to fetch data, sending credentials
            const response = await axios.get<UserStatEntry[]>(statsEndpoint, {
                 withCredentials: true // IMPORTANT: Send cookies for authentication
            });
            setUserStats(response.data); // Axios puts data directly in response.data
        } catch (err) {
            console.error("Failed to fetch user stats:", err);
            let errorMsg = 'An unknown error occurred while fetching your stats.';
            if (axios.isAxiosError(err)) {
                 if (err.response) {
                    if (err.response.status === 401) {
                        errorMsg = 'Please log in to view your stats.';
                    } else {
                        errorMsg = err.response.data?.message || `Server error ${err.response.status}`;
                    }
                    console.error('User stats fetch error - Server responded:', err.response.status, err.response.data);
                } else if (err.request) {
                    console.error('User stats fetch error - No response:', err.request);
                    errorMsg = 'Could not connect to the server to fetch stats.';
                } else {
                    console.error('User stats fetch error - Request setup:', err.message);
                    errorMsg = `Error fetching stats: ${err.message}`;
                }
            } else if (err instanceof Error) {
                 errorMsg = err.message;
            }
            setError(errorMsg);
            setUserStats([]); // Clear any previous stats on error
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array

    // Fetch data on component mount
    useEffect(() => {
        fetchUserStats();
    }, [fetchUserStats]);

    // Memoized sorted stats based on the sortBy state
    const sortedStats = React.useMemo(() => {
        const statsCopy = [...userStats];
        if (sortBy === 'wpm') {
            // Sort by WPM descending
            statsCopy.sort((a, b) => (b.WPM || 0) - (a.WPM || 0));
        } else {
            // Sort by Date descending (default from backend, but good to be explicit)
            // The backend already sorts by date via DataType, but we can re-sort if needed
             statsCopy.sort((a, b) => new Date(b.DateAchieved).getTime() - new Date(a.DateAchieved).getTime());
        }
        return statsCopy;
    }, [userStats, sortBy]);


    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 flex flex-col items-center pt-16 pb-12 font-sans px-4">
            <h1 className='text-5xl font-bold text-yellow-400 mb-8'> My Stats </h1>
            <p className='text-lg text-gray-400 mb-6'>Your recorded typing test results.</p>

             {/* Sorting Controls */}
             <div className="mb-6 flex items-center space-x-4">
                 <label htmlFor="sort-select" className="text-sm font-medium text-gray-400">Sort by:</label>
                 <select
                     id="sort-select"
                     value={sortBy}
                     onChange={(e) => setSortBy(e.target.value as 'date' | 'wpm')}
                     className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 shadow"
                     disabled={isLoading}
                 >
                     <option value="date">Most Recent</option>
                     <option value="wpm">Highest WPM</option>
                 </select>
             </div>


            {isLoading && (
                <div className="text-xl text-yellow-400 animate-pulse">Loading your stats...</div>
            )}

            {error && (
                <div className="w-full max-w-2xl text-center text-red-400 bg-red-900 bg-opacity-30 border border-red-600 rounded-md p-4">
                    <p className="font-semibold">Could not load stats:</p>
                    <p className="text-sm mt-1">{error}</p>
                     {/* Optionally add a login button if error is 401 */}
                     {error.includes('log in') && (
                         <button
                             onClick={() => window.location.href = '/login'} // Adjust login path if needed
                             className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm"
                         >
                             Go to Login
                         </button>
                     )}
                </div>
            )}

            {!isLoading && !error && sortedStats.length === 0 && (
                <div className="text-xl text-gray-500">You haven't completed any tests yet!</div>
            )}

            {!isLoading && !error && sortedStats.length > 0 && (
                <div className="w-full max-w-4xl bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                    <table className="min-w-full table-auto text-left">
                        <thead className="bg-gray-700 text-gray-300 uppercase text-sm leading-normal">
                            <tr>
                                {/* Add Rank based on current sort? Optional */}
                                <th className="py-3 px-4 text-center">WPM</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Text ID</th>
                                {/* Add Accuracy, Errors etc. if available */}
                            </tr>
                        </thead>
                        <tbody className="text-gray-200 text-sm font-light">
                            {sortedStats.map((entry, index) => (
                                <tr key={entry.DataType} className="border-b border-gray-700 hover:bg-gray-750 transition duration-150 ease-in-out">
                                    <td className="py-3 px-4 text-center font-bold text-yellow-400 text-lg">{entry.WPM}</td>
                                    <td className="py-3 px-4 text-xs">{formatDate(entry.DateAchieved || entry.DataType)}</td>
                                    <td className="py-3 px-4 text-xs">{entry.TextID}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

             <button
                 onClick={fetchUserStats} // Refresh button
                 className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md transition duration-150 ease-in-out shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                 disabled={isLoading}
             >
                 {isLoading ? 'Refreshing...' : 'Refresh Stats'}
             </button>

        </div>
    );
};

export default UserStatsPage;
