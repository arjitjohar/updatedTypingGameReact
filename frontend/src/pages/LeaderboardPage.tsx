import React, { useEffect, useCallback, useRef } from 'react'; // Removed useState

/**
 * Main Application Component.
 */
const LeaderboardPage = () => {


    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 flex flex-col items-center justify-center pb-48 font-sans">
            <p className='text-5xl font-bold'> Leaderboard </p>
            <div>
                <ul className='list-decimal pt-8 pr-32 font-bold font-sans'>
                    <li>97 wpm</li>
                    <li>94 wpm</li>
                    <li>89 wpm</li>
                </ul>


            </div>


        </div>
    );
};

export default LeaderboardPage;
