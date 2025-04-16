import { create } from 'zustand';



// -- type definitions for typing game states -- 
export type GameState = 'idle' | 'countdown' | 'running' | 'finished';


export type CharState = 'pending' | 'correct' | 'incorrect';

export type CharacterProps = {
  char: string;
  state: CharState;
  isCursor: boolean;
};

export type TypingTextDisplayProps = {
  text: string;
  userInput: string;
};

export type CountdownProps = {
  count: number;
};

export type ResultsDisplayProps = {
  wpm: number;
  accuracy: number;
  incorrectChars: number;
};


// --- Constants ---
// Keep constants accessible, maybe move them to a shared constants file later
const TEXT_TO_TYPE = "Form consider interest stand year life it also under over with may do most face when world which down up do never hand mean after since little open set do run new find here plan because public use these such may that can and still think great state leave both while same program report group seem number course company high point between part turn real change feel.";
const COUNTDOWN_SECONDS = 3;

interface TypingState {
  textToType: string; // Keep the text here for reference if needed, though it's constant now
  userInput: string;
  gameState: GameState;
  countdownValue: number;
  startTime: number | null;
  endTime: number | null;

  // Actions
  setUserInput: (input: string) => void;
  startGame: () => void; // Combines setting state for countdown start
  startTyping: () => void; // Sets state when typing actually begins
  endGame: () => void; // Sets state when typing finishes
  restartGame: () => void;
  decrementCountdown: () => void;
  typeCharacter: (key: string) => void;
  backspace: () => void;
}

export const useTypingStore = create<TypingState>((set, get) => ({
  // Initial State
  textToType: TEXT_TO_TYPE,
  userInput: '',
  gameState: 'idle',
  countdownValue: COUNTDOWN_SECONDS,
  startTime: null,
  endTime: null,

  // Actions Implementation
  setUserInput: (input) => set({ userInput: input }),

  startGame: () => {
    // Reset necessary state before starting countdown
    set({
      userInput: '',
      startTime: null,
      endTime: null,
      countdownValue: COUNTDOWN_SECONDS,
      gameState: 'countdown',
    });
  },

  startTyping: () => {
    set({ gameState: 'running', startTime: Date.now() });
  },

  endGame: () => {
    set((state) => ({
      gameState: 'finished',
      endTime: state.gameState === 'running' ? Date.now() : state.endTime, // Only set endTime if currently running
    }));
  },

  restartGame: () => {
    set({
      userInput: '',
      gameState: 'idle',
      countdownValue: COUNTDOWN_SECONDS,
      startTime: null,
      endTime: null,
    });
  },

  decrementCountdown: () => {
    set((state) => ({ countdownValue: Math.max(0, state.countdownValue - 1) }));
  },

  typeCharacter: (key) => {
    set((state) => {
      if (state.gameState !== 'running' || state.userInput.length >= state.textToType.length) {
        return {}; // No change if not running or text is fully typed
      }
      const newUserInput = state.userInput + key;
      let newGameState: GameState = state.gameState; // Explicitly type newGameState
      let newEndTime = state.endTime;

      // Check if the test is finished
      if (newUserInput.length === state.textToType.length) {
        newGameState = 'finished';
        newEndTime = Date.now();
      }
      return { userInput: newUserInput, gameState: newGameState, endTime: newEndTime };
    });
  },

  backspace: () => {
    set((state) => {
      if (state.gameState !== 'running' || state.userInput.length === 0) {
        return {}; // No change if not running or input is empty
      }
      return { userInput: state.userInput.slice(0, -1) };
    });
  },
}));
