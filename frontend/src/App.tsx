import TypingTestPage from './pages/TypingTestPage';
import { BrowserRouter, Routes, Route } from "react-router-dom";


/**
 * Main Application Component.
 */
const App = () => {

  return (
    <BrowserRouter>
    
    <Routes>
      <Route path="typing" element={<TypingTestPage/>}/>
    </Routes>


    </BrowserRouter>

  );
};

export default App; // Ensure App is the default export

