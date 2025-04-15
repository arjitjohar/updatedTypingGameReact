import React, { useState, useEffect, useCallback, useRef } from 'react';
import TypingTestPage from './components/TypingTestPage';



/**
 * Main Application Component.
 */
const App: React.FC = () => {

  return (
    <div>
      <TypingTestPage />
    </div>
  );
};

export default App; // Ensure App is the default export

