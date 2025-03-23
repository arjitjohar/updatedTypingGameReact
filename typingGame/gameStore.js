import { create } from 'zustand';

const useGameStore = create((set) => ({
  currentWord: '', // The word the user needs to type
  typedWord: '', // The word typed by the user
  score: 0, // Player's score
  timer: 60, // Countdown timer in seconds
  isGameActive: false, // Whether the game is active
  pararaph: '', //the paragraph to pull the words from

  // Actions
  setCurrentWord: (word) => set({ currentWord: word }),
  setParagraph: (word) => set({pararaph: word}),
  setTypedWord: (word) => set({ typedWord: word }),
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  decrementTimer: () => set((state) => ({ timer: state.timer - 1 })),
  resetGame: () =>
    set({ currentWord: '', typedWord: '', score: 0, timer: 60, isGameActive: false, pararaph: ''}),
  startGame: () => set({ isGameActive: true }),
}));
export default useGameStore;
