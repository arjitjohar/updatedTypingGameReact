import TypingTestPage from './pages/TypingTestPage';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';
import LeaderboardPage from './pages/LeaderboardPage';
import SignInSuccessPage from './pages/SignInSuccessPage';
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App; // Ensure App is the default export
