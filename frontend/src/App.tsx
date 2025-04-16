import TypingTestPage from './pages/TypingTestPage';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';
import LeaderboardPage from './pages/LeaderboardPage';

/**
 * Main Application Component.
 */
const App = () => {

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage/>}/>
        <Route path="typing" element={<TypingTestPage/>}/>
        <Route path="leaderboard" element={<LeaderboardPage/>}/>
      </Routes>
    </BrowserRouter>

  );
};

export default App; // Ensure App is the default export
