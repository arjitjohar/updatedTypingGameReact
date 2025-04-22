import React, { useEffect, useCallback, useRef, useState } from 'react'; // Added useState back
import axios from 'axios'; // Import axios
import { CharacterProps, CharState, CountdownProps, ResultsDisplayProps, TypingTextDisplayProps, useTypingStore } from '../store/typingStore'; // Import the store

// --- Constants ---
// Using text from the store now, but keeping this for TypingTextDisplay if needed directly
const TEXT_TO_TYPE_FALLBACK = "Hello World"; // Fallback if store text isn't ready

// --- Helper Functions ---
/**
 * Calculates Words Per Minute (WPM).
 */
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

    const cursorClass = isCursor ? 'border-b-2 border-yellow-400 animate-pulse' : '';
    const displayChar = char === ' ' ? '\u00A0' : char; // Use non-breaking space

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
        textToType,
        userInput,
        gameState,
        countdownValue,
        startTime,
        endTime,
        startGame,
        startTyping,
        restartGame,
        decrementCountdown,
        typeCharacter,
        backspace,
        setWPM,
    } = useTypingStore();

    // Use text from store, provide fallback
    const currentText = textToType || TEXT_TO_TYPE_FALLBACK;

    // Local state for display timer
    const [displayTime, setDisplayTime] = useState<number>(0); // Use React.useState

    const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const textDisplayRef = useRef<HTMLDivElement>(null); // Ref for focus management

    // Derived state for results
    const charactersTyped = userInput.length;
    const correctCharacters = currentText.split('').reduce((acc, char, index) => {
        return acc + (index < charactersTyped && userInput[index] === char ? 1 : 0);
    }, 0);
    const incorrectCharacters = charactersTyped - correctCharacters;

    const elapsedTime = startTime && endTime ? (endTime - startTime) / 1000 :
        startTime && !endTime && gameState === 'running' ? (Date.now() - startTime) / 1000 : 0;

    const wpm = calculateWpm(correctCharacters, elapsedTime);
    const accuracy = calculateAccuracy(correctCharacters, charactersTyped);


    // --- Effects ---

    // Countdown Timer Logic & Finish Game Logic (with Axios)
    useEffect(() => {
        // --- Game Finish Logic ---
        if (gameState === 'finished' && startTime && endTime) {
            const finalWpm = calculateWpm(correctCharacters, (endTime - startTime) / 1000);
            setWPM(finalWpm); // Update the store with the final WPM

            // Prepare stats data
            const statsData = {
                wpm: finalWpm,
                dateAchieved: new Date(endTime).toISOString(),
                textId: "default_text" // Placeholder ID - consider making dynamic
            };

            // Target the backend server URL
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
            const statsEndpoint = `${backendUrl}/api/stats`;

            // Send stats to backend using Axios
            axios.post(statsEndpoint, statsData, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true // Send cookies for authentication
            })
            .then(response => {
                console.log('Stats saved successfully:', response.data?.message);
                // TODO: Optionally show user feedback about success
            })
            .catch(error => {
                let errorMsg = 'Network error or server unavailable saving stats.';
                if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.error('Failed to save stats - Server responded:', error.response.status, error.response.data);
                    errorMsg = error.response.data?.message || `Server error ${error.response.status}`;
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error('Failed to save stats - No response received:', error.request);
                    errorMsg = 'No response from server while saving stats.';
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.error('Failed to save stats - Request setup error:', error.message);
                    errorMsg = `Error saving stats: ${error.message}`;
                }
                 // TODO: Optionally show user feedback about the error (using errorMsg)
            });
        }

        // --- Countdown Logic ---
        if (gameState === 'countdown') {
            countdownIntervalRef.current = setInterval(() => {
                const currentCountdown = useTypingStore.getState().countdownValue;
                if (currentCountdown <= 1) {
                    clearInterval(countdownIntervalRef.current!);
                    startTyping();
                    textDisplayRef.current?.focus();
                } else {
                    decrementCountdown();
                }
            }, 1000);
        } else if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        // Cleanup interval
        return () => {
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }
        };
    }, [gameState, startTime, endTime, correctCharacters, setWPM, startTyping, decrementCountdown]); // Added correctCharacters dependency


    // Running Timer Logic
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
        // Cleanup interval
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [gameState, startTime, endTime]); // Added endTime dependency


    // Keyboard Event Listener
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const currentGameState = useTypingStore.getState().gameState;
        if (currentGameState !== 'running') return;

        const { key } = event;
        const currentInputLength = useTypingStore.getState().userInput.length;
        const textLength = useTypingStore.getState().textToType.length;

        if (key === ' ' || key === 'Backspace' || (key.length === 1 && currentInputLength < textLength)) {
            event.preventDefault();
        }

        if (key === 'Backspace') {
            backspace();
        } else if (key.length === 1 && currentInputLength < textLength) {
            typeCharacter(key); // Handles finishing the game internally
        }
    }, [backspace, typeCharacter]); // Dependencies are store actions

    // Attach/Detach keyboard listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown, true);
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [handleKeyDown]);


    // --- Event Handlers ---
    const handleStart = () => {
        const currentGameState = useTypingStore.getState().gameState;
        if (currentGameState === 'idle' || currentGameState === 'finished') {
            startGame();
        }
    };

    const handleRestart = () => {
        restartGame();
        setDisplayTime(0);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
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
                <TypingTextDisplay text={currentText} userInput={userInput} />

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
                Press Start to begin.
            </footer>
        </div>
    );
};

export default TypingTestPage;
