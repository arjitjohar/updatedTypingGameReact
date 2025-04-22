import React from 'react'; // Import React if not already done implicitly
import TypingTestPage from './pages/TypingTestPage';
import { BrowserRouter, Routes, Route, Link } from "react-router-dom"; // Import Link
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar'; // Assuming Navbar handles its own links, or adjust below
import LeaderboardPage from './pages/LeaderboardPage';
import SignInSuccessPage from './pages/SignInSuccessPage';
import UserStatsPage from './pages/UserStatsPage'; // 1. Import the new page
import { AuthProvider } from './context/AuthContext';

/**
 * Main Application Component.
 */
const App = () => {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="typing" element={<TypingTestPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="/signinsuccess" element={<SignInSuccessPage />} />
          <Route path="/my-stats" element={<UserStatsPage />} />
-        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App; // Ensure App is the default export
