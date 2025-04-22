import { useEffect, useCallback, useRef, useState } from 'react'; // Keep useState for displayTime
import axios from 'axios';
import {
    useTypingStore,
    TypingTextItem, // Import interface if needed elsewhere
} from '../store/typingStore'; // Adjust path as needed

// --- Define Prop Interfaces ---
type CharState = 'pending' | 'correct' | 'incorrect';

interface CountdownProps {
    count: number;
}

interface ResultsDisplayProps {
    wpm: number;
    accuracy: number;
    incorrectChars: number;
}

interface TypingTextDisplayProps {
    text: string;
    userInput: string;
}

// --- Helper Functions ---
/**
 * Calculates Words Per Minute (WPM).
 */

// Define structure for fetched text item

const calculateWpm = (correctChars: number, timeSeconds: number): number => {
    if (timeSeconds <= 0) return 0;
    const wordsTyped = correctChars / 5;
    const minutes = timeSeconds / 60;
    const wpm = Math.round(wordsTyped / minutes);
    return wpm > 0 ? wpm : 0;
};

/**
 * Calculates Accuracy.
 */
const calculateAccuracy = (correctChars: number, totalTyped: number): number => {
    if (totalTyped === 0) return 100;
    const accuracy = (correctChars / totalTyped) * 100;

    return Math.round(accuracy * 10) / 10;
};


// --- Components ---

/**
 * Displays the text to be typed, highlighting correct/incorrect/pending characters.
 */
const TypingTextDisplay = ({ text, userInput }: TypingTextDisplayProps) => {

    const chars = text.split('');
     const userInputLength = userInput.length;

     return (
         <div className="text-2xl font-mono tracking-wider leading-relaxed break-words whitespace-pre-wrap p-4 bg-gray-800 rounded-md shadow-inner min-h-[10rem]"> {/* Added min-height */}
             {chars.map((char: string, index: number) => {
                 let state: CharState = 'pending';
                 if (index < userInputLength) {
                     state = char === userInput[index] ? 'correct' : 'incorrect';
                 }
                 const isCursor = index === userInputLength;
                 // Ensure Character component is defined or imported
                 // return <Character key={`${char}-${index}`} char={char} state={state} isCursor={isCursor} />;
                 const displayChar = char === ' ' ? '\u00A0' : char;
                 let colorClass = 'text-gray-500'; // Default: pending
                 if (state === 'correct') colorClass = 'text-green-400';
                 else if (state === 'incorrect') colorClass = 'text-red-500';
                 const cursorClass = isCursor ? 'border-b-2 border-yellow-400 animate-pulse' : '';
                 return <span key={`${char}-${index}`} className={`${colorClass} ${cursorClass} transition-colors duration-100 ease-in-out`}>{displayChar}</span>;

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
    // Get ALL relevant state and actions from the Zustand store
    const {
        // Game State
        userInput,
        gameState,
        countdownValue,
        startTime,
        endTime,
        // Text State
        textToType, // The actual string to display/type
        currentTextItem, // The full text object (for TextID etc.)
        isLoadingText,
        textError,
        // Actions
        startGame, // Renamed: Starts countdown
        startTyping,
        restartGame, // Renamed: Resets game progress
        decrementCountdown,
        typeCharacter,
        backspace,
        setWPM,
        // Text Fetch Actions
        fetchTextStart,
        fetchTextSuccess,
        fetchTextError,
    } = useTypingStore();

    // Local state ONLY for things not in global store (like display timer)
    const [displayTime, setDisplayTime] = useState<number>(0);

    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const textDisplayRef = useRef<HTMLDivElement>(null); // Ref for focus management

    // --- Derived state for results (calculations remain similar) ---
    const charactersTyped = userInput.length;
    // Calculate based on the actual text being typed (from store)
    const correctCharacters = textToType.split('').reduce((acc, char, index) => {
         // Avoid calculating if text is just placeholder/error
         if (isLoadingText || textError || !currentTextItem) return acc;
         return acc + (index < charactersTyped && userInput[index] === char ? 1 : 0);
    }, 0);
    const incorrectCharacters = charactersTyped - correctCharacters;

    const elapsedTime = startTime && endTime ? (endTime - startTime) / 1000 :
        startTime && !endTime && gameState === 'running' ? (Date.now() - startTime) / 1000 : 0;

    const wpm = calculateWpm(correctCharacters, elapsedTime);
    const accuracy = calculateAccuracy(correctCharacters, charactersTyped);


    // --- Function to fetch a random text (Now uses store actions) ---
    const fetchRandomText = useCallback(async (theme: string = 'informal') => {
        fetchTextStart(); // Dispatch start action

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const textsEndpoint = `${backendUrl}/api/texts`;

        try {
            const response = await axios.get<TypingTextItem[]>(textsEndpoint, {
                params: { theme: theme, limit: 10 }
            });

            if (response.data && response.data.length > 0) {
                const randomIndex = Math.floor(Math.random() * response.data.length);
                fetchTextSuccess(response.data[randomIndex]); // Dispatch success action
                console.log("Fetched text:", response.data[randomIndex].TextID);
            } else {
                throw new Error(`No texts found for theme: ${theme}`);
            }
        } catch (error) {
            console.error("Failed to fetch typing text:", error);
            let errorMsg = 'Could not load typing text.';
             if (axios.isAxiosError(error)) {
                 errorMsg = error.response?.data?.message || error.message;
             } else if (error instanceof Error) {
                 errorMsg = error.message;
             }
            fetchTextError(errorMsg); // Dispatch error action
        }
    }, [fetchTextStart, fetchTextSuccess, fetchTextError]); // Dependencies are store actions


    // --- Event Handlers (Use store actions directly) ---
    const handleStartGame = () => {
        // Fetch text first, then the store's startGame action handles countdown logic
        if ((gameState === 'idle' || gameState === 'finished') && !isLoadingText) {
            const themes = ['formal', 'informal', 'novel', 'essay', 'scientific', 'technical'];
            const randomTheme = themes[Math.floor(Math.random() * themes.length)];
            // Fetch text. The success action in store prepares state for countdown.
            fetchRandomText(randomTheme).then(() => {
                 // Now call the store action to start the countdown
                 // It will internally check if text is ready
                 startGame();
            });
        }
    };

    const handleRestartGame = () => {
        // Reset game progress via store action
        restartGame();
        // Fetch a new text (which also resets relevant state via fetchTextStart)
        const themes = ['formal', 'informal', 'novel', 'essay', 'scientific', 'technical'];
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        fetchRandomText(randomTheme).then(() => {
            textDisplayRef.current?.focus(); // Focus after fetch attempt
        });
        // Reset local display timer
        setDisplayTime(0);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };


    // --- Effects ---

    // Initial text fetch on component mount
    useEffect(() => {
        fetchRandomText('informal'); // Fetch an initial text
        // Cleanup function not strictly needed here unless fetchRandomText returned an abort controller
    }, [fetchRandomText]); // Run once on mount


    // Countdown Timer Logic & Finish Game Logic
    useEffect(() => {
        // --- Game Finish Logic (Post stats to backend) ---
        if (gameState === 'finished' && startTime && endTime && currentTextItem) {
            const finalWpm = calculateWpm(correctCharacters, (endTime - startTime) / 1000);
            setWPM(finalWpm); // Update store WPM

            const statsData = {
                wpm: finalWpm,
                dateAchieved: new Date(endTime).toISOString(),
                textId: currentTextItem.TextID // Use ID from store's currentTextItem
            };
            // ... (Axios POST request to /api/stats remains the same) ...
             const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
             const statsEndpoint = `${backendUrl}/api/stats`;
             axios.post(statsEndpoint, statsData, {
                 headers: { 'Content-Type': 'application/json' },
                 withCredentials: true
             }).then(response => {
                 console.log('Stats saved successfully:', response.data?.message);
             }).catch(error => {
                 console.error('Failed to save stats:', error);
             });
        }

        // --- Countdown Logic ---
        if (gameState === 'countdown') {
            countdownIntervalRef.current = setInterval(() => {
                // Check current value from store before decrementing
                const currentCountdown = useTypingStore.getState().countdownValue;
                if (currentCountdown <= 1) {
                    clearInterval(countdownIntervalRef.current!);
                    startTyping(); // Action to transition to 'running'
                    textDisplayRef.current?.focus(); // Focus after countdown
                } else {
                    decrementCountdown(); // Action to decrement countdown
                }
            }, 1000);
        } else if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        // Cleanup interval
        return () => {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        };
        // Dependencies include store state and actions used
    }, [gameState, startTime, endTime, correctCharacters, currentTextItem, setWPM, startTyping, decrementCountdown]);


    // Running Timer Logic (Remains the same, uses startTime from store)
    useEffect(() => {
        if (gameState === 'running' && startTime) {
            timerIntervalRef.current = setInterval(() => {
                setDisplayTime((Date.now() - startTime) / 1000);
            }, 100);
        } else if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            if (gameState === 'finished' && startTime && endTime) {
                setDisplayTime((endTime - startTime) / 1000);
            } else if (gameState !== 'running') {
                 setDisplayTime(0);
            }
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [gameState, startTime, endTime]);


    // Keyboard Event Listener (Uses store actions and state)
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Check game state from store
        const currentGameState = useTypingStore.getState().gameState;
        // Also check if text is ready from store state
        const textReady = !useTypingStore.getState().isLoadingText && !useTypingStore.getState().textError;

        if (currentGameState !== 'running' || !textReady) return;

        const { key } = event;
        const currentInputLength = useTypingStore.getState().userInput.length;
        const textLength = useTypingStore.getState().currentTextItem?.ParagraphText.length ?? 0;

        if (key === ' ' || key === 'Backspace' || (key.length === 1 && currentInputLength < textLength)) {
            event.preventDefault();
        }

        if (key === 'Backspace') {
            backspace(); // Use store action
        } else if (key.length === 1 && currentInputLength < textLength) {
            typeCharacter(key); // Use store action
        }
    }, [backspace, typeCharacter]); // Dependencies are store actions

    // Attach/Detach keyboard listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [handleKeyDown]);


    // --- Render ---
    return (
        <div className="min-h-screen bg-gray-900 text-gray-300 flex flex-col items-center justify-center p-4 font-sans"
            ref={textDisplayRef}
            tabIndex={-1} // Make div focusable
        >
            <h1 className="text-4xl font-bold text-yellow-400 mb-8">Typing Test</h1>

            <div className="w-full max-w-4xl relative">
                 {/* Display loading/error state using store variables */}
                {isLoadingText && <div className="text-center text-yellow-400 my-4 animate-pulse">Loading new text...</div>}
                {textError && <div className="text-center text-red-500 my-4 bg-red-900 bg-opacity-30 p-2 rounded">{textError}</div>}

                {/* Countdown Overlay */}
                {gameState === 'countdown' && <Countdown count={countdownValue} />}

                {/* Typing Area - Use textToType from store */}
                {/* Conditionally render based on loading/error state */}
                {(!isLoadingText || gameState === 'countdown') && ( // Show text area even if loading during countdown
                     <TypingTextDisplay text={textToType} userInput={userInput} />
                )}


                {/* Timer Display */}
                {(gameState === 'running' || gameState === 'finished') && (
                    <div className="mt-4 text-center text-lg text-gray-400">
                        Time: {gameState === 'running' ? displayTime.toFixed(1) : elapsedTime.toFixed(1)}s
                    </div>
                )}

                {/* Results Display */}
                {gameState === 'finished' && (
                    <ResultsDisplay wpm={wpm} accuracy={accuracy} incorrectChars={incorrectCharacters} />
                )}

                {/* Controls - Use updated handlers */}
                <div className="mt-8 text-center space-x-4">
                    {(gameState === 'idle' || gameState === 'finished') && (
                        <button
                            onClick={handleStartGame}
                            disabled={isLoadingText || !!textError} // Disable if loading or error
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md transition duration-150 ease-in-out shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                             {/* Change text based on state */}
                             {gameState === 'finished' ? 'Start New Game' : (isLoadingText ? 'Loading...' : 'Start')}
                        </button>
                    )}
                    {(gameState === 'running' || gameState === 'countdown' || gameState === 'finished') && (
                        <button
                            onClick={handleRestartGame}
                            disabled={isLoadingText} // Disable while loading new text on restart
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-md transition duration-150 ease-in-out shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoadingText ? 'Loading...' : 'Restart'}
                        </button>
                    )}
                </div>
            </div>

            <footer className="mt-12 text-center text-gray-500 text-sm">
                Current state: {gameState}
            </footer>
        </div>
    );
};

export default TypingTestPage;
