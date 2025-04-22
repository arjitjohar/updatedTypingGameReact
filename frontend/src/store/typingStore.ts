import { create } from 'zustand';

// -- type definitions --
export type GameState = 'idle' | 'countdown' | 'running' | 'finished';
export type CharState = 'pending' | 'correct' | 'incorrect';

// Keep component prop types separate or in a types file if preferred
export type CharacterProps = { char: string; state: CharState; isCursor: boolean; };
export type TypingTextDisplayProps = { text: string; userInput: string; };
export type CountdownProps = { count: number; };
export type ResultsDisplayProps = { wpm: number; accuracy: number; incorrectChars: number; };

// Interface for the text item fetched from backend/DB
export interface TypingTextItem {
    Theme: string;
    TextID: string;
    ParagraphText: string;
    Difficulty?: string;
    Source?: string;
    Length?: number;
}

// --- Constants ---
const COUNTDOWN_SECONDS = 3;
const INITIAL_TEXT_FALLBACK = "Press Start to load text..."; // Default text before fetching

// --- Zustand State Interface ---
interface TypingState {
    // Core Game State
    userInput: string;
    gameState: GameState;
    countdownValue: number;
    startTime: number | null;
    endTime: number | null;
    wpm: number | null;

    // Text State (Managed by Store)
    textToType: string; // The actual paragraph text being typed
    currentTextItem: TypingTextItem | null; // Full details of the fetched text
    isLoadingText: boolean; // Loading state for text fetching
    textError: string | null; // Error message if fetching fails

    // Actions
    // setUserInput: (input: string) => void; // Can be removed if only typeCharacter/backspace modify it
    startGame: () => void; // Starts countdown (assumes text is loaded)
    startTyping: () => void; // Sets state when typing actually begins
    // endGame: () => void; // Handled internally by typeCharacter
    restartGame: () => void; // Resets game progress state
    decrementCountdown: () => void;
    typeCharacter: (key: string) => void; // Pass text length if needed, or get from state
    backspace: () => void;
    setWPM: (input: number) => void;

    // Text Fetching Actions
    fetchTextStart: () => void;
    fetchTextSuccess: (textItem: TypingTextItem) => void;
    fetchTextError: (errorMessage: string) => void;
}

export const useTypingStore = create<TypingState>((set, get) => ({
    // --- Initial State ---
    userInput: '',
    gameState: 'idle',
    countdownValue: COUNTDOWN_SECONDS,
    startTime: null,
    endTime: null,
    wpm: null,

    // Text State Initial
    textToType: INITIAL_TEXT_FALLBACK,
    currentTextItem: null,
    isLoadingText: false,
    textError: null,

    // --- Actions Implementation ---

    // setUserInput: (input) => set({ userInput: input }), // Keep if direct setting is needed

    startGame: () => {
        // Only start countdown if text is loaded and game is idle/finished
        if (get().currentTextItem && !get().isLoadingText && !get().textError && (get().gameState === 'idle' || get().gameState === 'finished')) {
            set({
                userInput: '', // Reset input
                startTime: null,
                endTime: null,
                countdownValue: COUNTDOWN_SECONDS,
                gameState: 'countdown',
                wpm: null,
            });
        } else {
             console.warn("Cannot start game: Text not ready or game already in progress.");
             // Optionally set an error state here if needed
        }
    },

    startTyping: () => {
        // Only start typing if countdown finished and text is ready
        if (get().gameState === 'countdown' && get().currentTextItem) {
            set({ gameState: 'running', startTime: Date.now() });
        }
    },

    // endGame is handled by typeCharacter

    restartGame: () => {
        // Resets game progress, but NOT the text state (fetch handles that)
        set({
            userInput: '',
            gameState: 'idle',
            countdownValue: COUNTDOWN_SECONDS,
            startTime: null,
            endTime: null,
            wpm: null,
            // Don't reset textError here, let fetch handle it
        });
    },

    decrementCountdown: () => {
        set((state) => ({ countdownValue: Math.max(0, state.countdownValue - 1) }));
    },

    typeCharacter: (key) => {
        set((state) => {
            // Use text length from the currentTextItem if available
            const currentTextLength = state.currentTextItem?.ParagraphText.length ?? 0;
            if (state.gameState !== 'running' || state.userInput.length >= currentTextLength || currentTextLength === 0) {
                return {}; // No change if not running, text fully typed, or no text loaded
            }

            const newUserInput = state.userInput + key;
            let newGameState: GameState = state.gameState;
            let newEndTime = state.endTime;

            // Check if the test is finished
            if (newUserInput.length === currentTextLength) {
                newGameState = 'finished';
                newEndTime = Date.now();
            }
            return { userInput: newUserInput, gameState: newGameState, endTime: newEndTime };
        });
    },

    backspace: () => {
        set((state) => {
            if (state.gameState !== 'running' || state.userInput.length === 0) {
                return {};
            }
            return { userInput: state.userInput.slice(0, -1) };
        });
    },

    setWPM: (newWpm) => set({ wpm: newWpm }),

    // --- Text Fetching Actions Implementation ---
    fetchTextStart: () => {
        set({
            isLoadingText: true,
            textError: null,
            currentTextItem: null, // Clear old text item
            textToType: "Loading text...", // Set placeholder text
            userInput: '', // Reset user input when fetching new text
            gameState: 'idle', // Ensure game state is idle
            startTime: null,
            endTime: null,
            wpm: null,
        });
    },

    fetchTextSuccess: (textItem) => {
        set({
            isLoadingText: false,
            textError: null,
            currentTextItem: textItem,
            textToType: textItem.ParagraphText, // Update the text to type
            gameState: 'idle', // Ready to start countdown
        });
    },

    fetchTextError: (errorMessage) => {
        set({
            isLoadingText: false,
            textError: errorMessage,
            currentTextItem: null,
            textToType: `Error: ${errorMessage}`, // Show error in text area
            gameState: 'idle', // Remain idle on error
        });
    },
}));
