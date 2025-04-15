export type CharState = 'pending' | 'correct' | 'incorrect';

export type GameState = 'idle' | 'countdown' | 'running' | 'finished';

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
