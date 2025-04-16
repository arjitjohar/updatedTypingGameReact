import React, { useEffect, useCallback, useRef } from 'react'; // Removed useState

/**
 * Main Application Component.
 */
const LandingPage = () => {


  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex flex-col items-center justify-center p-4 font-sans">
        <h1 className="text-5xl"> welcome to my website </h1>
        <h1 className='text-8xl text-white'> Arjit Johar</h1>
    </div>
  );
};

export default LandingPage;
