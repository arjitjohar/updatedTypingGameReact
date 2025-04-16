import React, { useEffect, useCallback, useRef } from 'react'; // Removed useState
import { CharacterProps, CharState, CountdownProps, ResultsDisplayProps, TypingTextDisplayProps, useTypingStore } from '../store/typingStore'; // Import the store

// --- Constants ---
// TEXT_TO_TYPE and COUNTDOWN_SECONDS are now managed/referenced within the store,
// but we might still need TEXT_TO_TYPE here for display logic if not selecting it from store.
// Let's keep it here for now for the TypingTextDisplay component.
const TEXT_TO_TYPE = "Form consider interest stand year life it also under over with may do most face when world which down up do never hand mean after since little open set do run new find here plan because public use these such may that can and still think great state leave both while same program report group seem number course company high point between part turn real change feel.";


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
const Character = React.memo(({ char, state, isCursor }: CharacterProps) => {
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
const TypingTextDisplay = ({ text, userInput }: TypingTextDisplayProps) => {
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
const Countdown = ({ count }: CountdownProps) => {
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
const ResultsDisplay = ({ wpm, accuracy, incorrectChars }: ResultsDisplayProps) => {
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
  // Get state and actions from the Zustand store
  const {
    textToType, // Get text from store if needed, or use the constant above
    userInput,
    gameState,
    countdownValue,
    startTime,
    endTime,
    //setUserInput, // Keep if direct setting is needed, but prefer actions
    startGame,
    startTyping,
    // endGame is handled internally by typeCharacter/backspace
    restartGame,
    decrementCountdown,
    typeCharacter,
    backspace,
  } = useTypingStore();

  // Local state only for things not in the global store (like display timer)
  const [displayTime, setDisplayTime] = React.useState<number>(0); // Use React.useState

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Countdown Timer Logic - Managed by store actions now
  useEffect(() => {
    if (gameState === 'countdown') {
      countdownIntervalRef.current = setInterval(() => {
        // Check current value from store before decrementing
        const currentCountdown = useTypingStore.getState().countdownValue;
        if (currentCountdown <= 1) {
          clearInterval(countdownIntervalRef.current!);
          startTyping(); // Action to transition to 'running' and set startTime
          textDisplayRef.current?.focus(); // Focus after countdown
        } else {
          decrementCountdown(); // Action to decrement countdown
        }
      }, 1000);
    } else if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Cleanup interval on component unmount or gameState change
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [gameState]); // Rerun effect when gameState changes


  // Running Timer Logic - Update local displayTime based on store's startTime
  useEffect(() => {
    if (gameState === 'running' && startTime) {
      timerIntervalRef.current = setInterval(() => {
        // Calculate display time based on store's startTime
        setDisplayTime((Date.now() - startTime) / 1000);
      }, 100);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      // When finishing, ensure displayTime reflects final elapsedTime
      if (gameState === 'finished' && startTime && endTime) {
        setDisplayTime((endTime - startTime) / 1000);
      } else if (gameState !== 'running') {
         // Reset display time if game stops for other reasons (e.g., restart)
         setDisplayTime(0);
      }
    }

    // Cleanup interval on component unmount or gameState change
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameState, startTime]);


  // Keyboard Event Listener - Use store actions
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Get current game state directly from store if needed, though the hook provides it
    const currentGameState = useTypingStore.getState().gameState;
    if (currentGameState !== 'running') return;

    const { key } = event;
    const currentInputLength = useTypingStore.getState().userInput.length;
    const textLength = useTypingStore.getState().textToType.length;


    // Prevent default browser behavior
    if (key === ' ' || key === 'Backspace' || (key.length === 1 && currentInputLength < textLength)) {
        event.preventDefault();
    }

    if (key === 'Backspace') {
      backspace(); // Use store action
    } else if (key.length === 1 && currentInputLength < textLength) { // Handle printable characters
      typeCharacter(key); // Use store action (handles finishing the game internally)
    }
    // No need to manually set 'finished' state or endTime here, typeCharacter handles it
  }, [backspace, typeCharacter]); // Dependencies are store actions

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
    // Get current state to check if idle or finished
    const currentGameState = useTypingStore.getState().gameState;
    if (currentGameState === 'idle' || currentGameState === 'finished') {
      startGame(); // Use store action to start the countdown sequence
    }
  };

  const handleRestart = () => {
    restartGame(); // Use store action to reset everything
    setDisplayTime(0); // Reset local display timer
     // Clear intervals manually here as well, although store actions reset state
     if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
     }
     if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
     }
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

        {/* Typing Area - Use textToType from store or constant */}
        <TypingTextDisplay text={TEXT_TO_TYPE} userInput={userInput} />

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

export default TypingTestPage;
