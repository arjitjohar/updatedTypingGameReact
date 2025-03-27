import React, { useEffect, useState } from 'react';
import useGameStore from '../../gameStore';
import axios from 'axios';
const TypingGame = () => {
  const {
    currentWord,
    typedWord,
    score,
    timer,
    isGameActive,
    setCurrentWord,
    setTypedWord,
    incrementScore,
    decrementTimer,
    resetGame,
    startGame,
    paragraph,
    setIsLoading,
    getParagraph
  } = useGameStore();




  // Start the game
  const handleStart = async () => {
    resetGame();
    startGame();
  };



  // Handle typing input
  const handleInputChange = (e) => {
    const input = e.target.value;
    setTypedWord(input);

    if (input === currentWord) {
      incrementScore();
      setTypedWord('');
      setCurrentWord(generateRandomWord());
    }
  };

  useEffect( () => {
    
    getParagraph();
  },[]);
 

  // Timer countdown effect
  useEffect(() => {
    if (isGameActive && timer > 0) {
      const interval = setInterval(() => {
        decrementTimer();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isGameActive, timer]);


  return (
    <div>
      <h1>Typing Game</h1>
      <p>{paragraph || 'Loading...'}</p>
      {isGameActive ? (
        <>
          <p>Time Left: {timer}s</p>
          <p>Score: {score}</p>
          <p>Type this word:</p>
          <h2>{currentWord}</h2>
          <input
            type="text"
            value={typedWord}
            onChange={handleInputChange}
            placeholder="Start typing..."
          />
        </>
      ) : (
        <button onClick={handleStart}>Start Game</button>
      )}
      {timer === 0 && <div><p>Game Over! Your final score is {score}.</p><p><button onClick={() => resetGame()}>reset</button></p></div>}
    </div>
  );
};

export default TypingGame;
