import { create } from 'zustand';
import axios from 'axios';

const useGameStore = create((set, get) => ({
  currentWord: '', // The word the user needs to type
  typedWord: '', // The word typed by the user
  score: 0, // Player's score
  timer: 60, // Countdown timer in seconds
  isGameActive: false, // Whether the game is active
  pararaph: '', //the paragraph to pull the words from
  isLoading: false, 
  error: false,

  // Actions
  setCurrentWord: (word) => set({ currentWord: word }),
  setParagraph: (word) => set({paragraph: word}),
  setIsLoading: (state) => set({isLoading: state}),
  setTypedWord: (word) => set({ typedWord: word }),
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  decrementTimer: () => set((state) => ({ timer: state.timer - 1 })),
  resetGame: () =>
    set({ currentWord: '', typedWord: '', score: 0, timer: 60, isGameActive: false, pararaph: '', isLoading: false}),
  startGame: () => set({ isGameActive: true }),
  endGame: () => set({isGameActive:false}),
  getParagraph: async () => {
    
    try {
      const res = await axios.get("http://localhost:3000/generate");
      set({paragraph:res.data.paragraph});
    } catch (err) {
      console.error("Error in data fetch:", err);
      set({error:true})
      set({isLoading:true});
    }
  }
}));
export default useGameStore;
