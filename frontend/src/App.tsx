import TypingTestPage from './pages/TypingTestPage';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';
import LeaderboardPage from './pages/LeaderboardPage';
import LoginPage from './pages/LoginPage';
import { GoogleOAuthProvider } from '@react-oauth/google';
import SignInSuccessPage from './pages/SignInSuccessPage';

const GOOGLE_CLIENT_ID = ""


/**
 * Main Application Component.
 */
export type google_client_id = {
  clientID: string;
};
const App = () => {

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Navbar />
        
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="typing" element={<TypingTestPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="success" element={<SignInSuccessPage />} />
        </Routes>
      </BrowserRouter>


    </GoogleOAuthProvider>



  );
};

export default App; // Ensure App is the default export
