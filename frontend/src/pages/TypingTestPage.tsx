import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CharState, GameState } from '../type';

// --- Constants ---
const TEXT_TO_TYPE = "Form consider interest stand year life it also under over with may do most face when world which down up do never hand mean after since little open set do run new find here plan because public use these such may that can and still think great state leave both while same program report group seem number course company high point between part turn real change feel.";
const COUNTDOWN_SECONDS = 3;

// --- Types ---


interface CharacterProps {
  char: string;
  state: CharState;
  isCursor: boolean;
}

// --- Helper Functions ---
/**
 * Calculates Words Per Minute (WPM).
 * @param correctChars - Number of correctly typed characters.
 * @param incorrectChars - Number of incorrectly typed characters (often counted as errors affecting accuracy, but some WPM counts ignore them or penalize differently).
 * @param timeSeconds - Time elapsed in seconds.
 * @returns The calculated WPM.
 */
const calculateWpm = (correctChars: number, timeSeconds: number): number => {
  if (timeSeconds === 0) return 0;
  // Calculate gross WPM based on characters typed (assuming average word length of 5)
  const wordsTyped = correctChars / 5;
  const minutes = timeSeconds / 60;
  const wpm = Math.round(wordsTyped / minutes);
  return wpm > 0 ? wpm : 0; // Ensure WPM is not negative or NaN
};

/**
 * Calculates Accuracy.
 * @param correctChars - Number of correctly typed characters.
 * @param totalTyped - Total number of characters typed (correct + incorrect attempts).
 * @returns The accuracy percentage.
 */
const calculateAccuracy = (correctChars: number, totalTyped: number): number => {
  if (totalTyped === 0) return 100;
  return Math.round((correctChars / totalTyped) * 100);
};


// --- Components ---

/**
 * Renders a single character with appropriate styling based on its state.
 */
const Character: React.FC<CharacterProps> = React.memo(({ char, state, isCursor }) => {
  let colorClass = 'text-gray-500'; // Default: pending
  if (state === 'correct') {
    colorClass = 'text-green-400';
  } else if (state === 'incorrect') {
    colorClass = 'text-red-500';
  }

  // Cursor styling: subtle underline or background
  const cursorClass = isCursor ? 'border-b-2 border-yellow-400 animate-pulse' : '';
  // Handle whitespace explicitly for styling
  const displayChar = char === ' ' ? '\u00A0' : char; // Use non-breaking space for rendering

  return (
    <span className={`${colorClass} ${cursorClass} transition-colors duration-100 ease-in-out`}>
      {displayChar}
    </span>
  );
});

/**
 * Displays the text to be typed, highlighting correct/incorrect/pending characters.
 */
const TypingTextDisplay: React.FC<{ text: string; userInput: string }> = ({ text, userInput }) => {
  const chars = text.split('');
  const userInputLength = userInput.length;

  return (
    <div className="text-2xl font-mono tracking-wider leading-relaxed break-words whitespace-pre-wrap p-4 bg-gray-800 rounded-md shadow-inner">
      {chars.map((char, index) => {
        let state: CharState = 'pending';
        if (index < userInputLength) {
          state = char === userInput[index] ? 'correct' : 'incorrect';
        }
        const isCursor = index === userInputLength;
        return <Character key={`${char}-${index}`} char={char} state={state} isCursor={isCursor} />;
      })}
    </div>
  );
};

/**
 * Displays the countdown timer.
 */
const Countdown: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-80 z-10">
      <span className="text-8xl font-bold text-yellow-400 animate-ping">{count}</span>
    </div>
  );
};

/**
 * Displays the results (WPM and Accuracy).
 */
const ResultsDisplay: React.FC<{ wpm: number; accuracy: number; incorrectChars: number }> = ({ wpm, accuracy, incorrectChars }) => {
  return (
    <div className="mt-4 text-center text-xl text-gray-300 space-x-6">
      <span>WPM: <span className="font-semibold text-yellow-400">{wpm}</span></span>
      <span>Accuracy: <span className="font-semibold text-green-400">{accuracy}%</span></span>
      <span>Incorrect: <span className="font-semibold text-red-400">{incorrectChars}</span></span>
    </div>
  );
};


/**
 * Main Application Component.
 */
const TypingTestPage = () => {
  const [textToType] = useState<string>(TEXT_TO_TYPE);
  const [userInput, setUserInput] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>('idle'); // 'idle', 'countdown', 'running', 'finished'
  const [countdownValue, setCountdownValue] = useState<number>(COUNTDOWN_SECONDS);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [displayTime, setDisplayTime] = useState<number>(0); // State for the continuously updated timer display

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null); // Ref for the running timer interval
  const textDisplayRef = useRef<HTMLDivElement>(null); // Ref for focus management

  // Derived state for results
  const charactersTyped = userInput.length;
  const correctCharacters = textToType.split('').reduce((acc, char, index) => {
      return acc + (index < charactersTyped && userInput[index] === char ? 1 : 0);
  }, 0);
  const incorrectCharacters = charactersTyped - correctCharacters // Simple count of mismatches

  const elapsedTime = startTime && endTime ? (endTime - startTime) / 1000 :
                      startTime && !endTime && gameState === 'running' ? (Date.now() - startTime) / 1000 : 0;

  const wpm = calculateWpm(correctCharacters, elapsedTime);
  const accuracy = calculateAccuracy(correctCharacters, charactersTyped);


  // --- Effects ---

  // Countdown Timer Logic
  useEffect(() => {
    if (gameState === 'countdown') {
      setCountdownValue(COUNTDOWN_SECONDS); // Reset countdown value
      countdownIntervalRef.current = setInterval(() => {
        setCountdownValue((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            setGameState('running');
            setStartTime(Date.now());
            // Focus the area to capture keypresses after countdown
             textDisplayRef.current?.focus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current); // Clear interval if state changes from countdown
    }

    // Cleanup interval on component unmount or gameState change
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [gameState]); // Rerun effect when gameState changes


  // Running Timer Logic
  useEffect(() => {
    if (gameState === 'running' && startTime) {
      timerIntervalRef.current = setInterval(() => {
        setDisplayTime((Date.now() - startTime) / 1000);
      }, 100); // Update display every 100ms
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current); // Clear interval if state is not 'running'
    }

    // Cleanup interval on component unmount or gameState change
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState, startTime]);


  // Keyboard Event Listener
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (gameState !== 'running') return;

    const { key } = event;
    const currentIndex = userInput.length;

    // Prevent default browser behavior for keys we handle (like space scrolling)
    if (key === ' ' || key === 'Backspace' || (key.length === 1 && currentIndex < textToType.length)) {
        event.preventDefault();
    }

    if (key === 'Backspace') {
      setUserInput((prev) => prev.slice(0, -1));
    } else if (key.length === 1 && currentIndex < textToType.length) { // Handle printable characters
      setUserInput((prev) => prev + key);
      // Check if the test is finished
      if (currentIndex + 1 === textToType.length) {
        setGameState('finished');
        setEndTime(Date.now());
      }
    }
  }, [gameState, userInput, textToType]);

  // Attach/Detach keyboard listener
  useEffect(() => {
    // Use capture phase to potentially catch keys before other elements
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [handleKeyDown]); // Re-attach if handleKeyDown changes (due to dependencies)


  // --- Event Handlers ---

  const handleStart = () => {
    if (gameState === 'idle' || gameState === 'finished') {
      handleRestart(); // Reset state before starting countdown
      setGameState('countdown');
    }
  };

  const handleRestart = () => {
    setGameState('idle');
    setUserInput('');
    setStartTime(null);
    setEndTime(null);
    setDisplayTime(0); // Reset display time
    setCountdownValue(COUNTDOWN_SECONDS);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (timerIntervalRef.current) { // Clear running timer interval as well
        clearInterval(timerIntervalRef.current);
    }
     // Focus the area to allow starting with Enter maybe? Or just prepare for typing.
     textDisplayRef.current?.focus();
  };

  // --- Render ---

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300 flex flex-col items-center justify-center p-4 font-sans"
         ref={textDisplayRef}
         tabIndex={-1} // Make div focusable
         >
      <h1 className="text-4xl font-bold text-yellow-400 mb-8">Typing Test</h1>

      <div className="w-full max-w-4xl relative">
        {/* Countdown Overlay */}
        {gameState === 'countdown' && <Countdown count={countdownValue} />}

        {/* Typing Area */}
        <TypingTextDisplay text={textToType} userInput={userInput} />

        {/* Timer Display */}
        {(gameState === 'running' || gameState === 'finished') && (
          <div className="mt-4 text-center text-lg text-gray-400">
            {/* Display continuously updated time during 'running', final time when 'finished' */}
            Time: {gameState === 'running' ? displayTime.toFixed(1) : elapsedTime.toFixed(1)}
          </div>
        )}

        {/* Results Display */}
        {gameState === 'finished' && (
           <ResultsDisplay wpm={wpm} accuracy={accuracy} incorrectChars={incorrectCharacters} />
        )}


        {/* Controls */}
        <div className="mt-8 text-center space-x-4">
          {(gameState === 'idle' || gameState === 'finished') && (
            <button
              onClick={handleStart}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md transition duration-150 ease-in-out shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Start
            </button>
          )}
          {(gameState === 'running' || gameState === 'countdown' || gameState === 'finished') && (
            <button
              onClick={handleRestart}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-md transition duration-150 ease-in-out shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            >
              Restart
            </button>
          )}
        </div>
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        Inspired by Monkeytype. Press Start to begin.
      </footer>
    </div>
  );
};

export default TypingTestPage; // Ensure App is the default export
