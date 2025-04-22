import React, { useState, useEffect } from 'react';

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

    useEffect(() => {
        // Function to fetch leaderboard data
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            setError(null);
            // Target the backend server URL (adjust if needed)
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

            try {
                const response = await fetch(`${backendUrl}/api/leaderboard`);
                if (!response.ok) {
                    let errorMsg = `Error: ${response.status}`;
                    try {
                        const errData = await response.json();
                        errorMsg = errData.message || errorMsg;
                    } catch (_) { /* Ignore if response is not JSON */ }
                    throw new Error(errorMsg);
                }
                const data: LeaderboardEntry[] = await response.json();
                setLeaderboardData(data);
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard(); // Fetch data on component mount

        // Optional: Setup polling interval if you want the leaderboard to auto-refresh
        // const intervalId = setInterval(fetchLeaderboard, 60000); // Refresh every 60 seconds
        // return () => clearInterval(intervalId); // Cleanup interval on unmount

    }, []); // Empty dependency array means this runs once on mount

    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 flex flex-col items-center pt-16 pb-12 font-sans px-4">
            <h1 className='text-5xl font-bold text-yellow-400 mb-8'> Leaderboard </h1>
            <p className='text-lg text-gray-400 mb-10'>Top 20 High Scores (WPM)</p>

            {isLoading && (
                <div className="text-xl text-yellow-400">Loading leaderboard...</div>
            )}

            {error && (
                <div className="text-xl text-red-500 bg-red-100 border border-red-500 rounded-md p-4">
                    Failed to load leaderboard: {error}
                </div>
            )}

            {!isLoading && !error && leaderboardData.length === 0 && (
                <div className="text-xl text-gray-500">No scores recorded yet!</div>
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
                                        {/* Display Name (assumed to be in entry) */}
                                        {entry.Name}
                                        {/* Optionally show UserID if needed for debugging or clarity */}
                                        {/* <span className="text-xs text-gray-500 block">ID: {entry.UserID.substring(0, 8)}...</span> */}
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
                 onClick={() => { /* Maybe trigger a manual refresh? */ setIsLoading(true); setError(null); /* Call fetch function again */}}
                 className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-md transition duration-150 ease-in-out shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                 disabled={isLoading}
             >
                 {isLoading ? 'Refreshing...' : 'Refresh Leaderboard'}
             </button>

        </div>
    );
};

export default LeaderboardPage;
