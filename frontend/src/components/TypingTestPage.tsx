import React, { useState, useEffect, useRef } from 'react';

function TypingTestPage() {
  const targetText = "this is a sample paragraph for the typing test.";
  const targetChars = targetText.split('');
  const [typedChars, setTypedChars] = useState<string[]>([]);
  const [displayedText, setDisplayedText] = useState<React.ReactNode[]>(targetChars.map((char, index) => (
    <span key={index}>{char}</span>
  )));
  const [currentScore, setCurrentScore] = useState(0);
  const textInputRef = useRef<HTMLInputElement | null>(null);
  const [isTypingFinished, setIsTypingFinished] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [startCounter, setStartCounter] = useState<number | null>(null);

  useEffect(() => {
    console.log('useEffect - Start Counter Triggered', { gameStarted, startCounter });
    if (gameStarted && startCounter === null) {
      console.log('  Setting startCounter to 3');
      setStartCounter(3);
    } else if (startCounter > 0) {
      console.log('  startCounter > 0, setting timeout');
      const timer = setTimeout(() => {
        setStartCounter((prevCounter) => {
          const newValue = prevCounter !== null ? prevCounter - 1 : null;
          console.log('  Timeout fired, setting startCounter to', newValue);
          return newValue;
        });
      }, 1000);
      return () => {
        console.log('  Clearing timeout for startCounter');
        clearTimeout(timer);
      };
    } else if (startCounter === 0) {
      console.log('  startCounter === 0, setting to null and focusing input');
      setStartCounter(null);
      if (textInputRef.current) {
        textInputRef.current.focus();
      }
    }
    // The effect should re-run when gameStarted changes or when startCounter changes.
  }, [gameStarted, startCounter]);

  
  useEffect(() => {
    console.log('useEffect - Game Finished Check', { typedCharsLength: typedChars.length, targetCharsLength: targetChars.length, isTypingFinished, gameStarted });
    if (typedChars.length === targetChars.length && !isTypingFinished && gameStarted) {
      console.log('  Typing finished! Showing alert.');
      setIsTypingFinished(true);
      alert(`Typing finished! Your final score is: ${currentScore}`);
    }
  }, [typedChars, targetChars, currentScore, isTypingFinished, gameStarted]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const key = event.key;
    console.log('handleKeyDown:', key, { gameStarted, isTypingFinished, startCounter });

    if (!gameStarted || isTypingFinished || startCounter !== null) {
      console.log('  Typing prevented.');
      event.preventDefault(); // Prevent typing if game hasn't started, is finished, or during countdown
      return;
    }

    setTypedChars((prevTypedChars) => {
      const nextTypedChars = [...prevTypedChars, key];
      console.log('  setTypedChars:', nextTypedChars);
      updateDisplayedText(nextTypedChars);
      return nextTypedChars;
    });
  };

  const updateDisplayedText = (currentTypedChars: string[]) => {
    console.log('updateDisplayedText:', currentTypedChars);
    const newDisplayedText: React.ReactNode[] = targetChars.map((char, index) => {
      if (index < currentTypedChars.length) {
        if (currentTypedChars[index] === char) {
          return <span key={index} className="text-black">{char}</span>;
        } else if (index === currentTypedChars.length - 1) {
          return <span key={index} className="text-red-500">{currentTypedChars[index]}</span>;
        } else {
          return <span key={index} className="text-black">{char}</span>;
        }
      } else {
        return <span key={index}>{char}</span>;
      }
    });
    setDisplayedText(newDisplayedText);
    console.log('  setDisplayedText:', newDisplayedText);
  };

  useEffect(() => {
    console.log('useEffect - Score Update Triggered', { gameStarted, startCounter, typedCharsLength: typedChars.length, targetCharsLength: targetChars.length });
    if (gameStarted && startCounter === null && typedChars.length > 0 && typedChars.length <= targetChars.length) {
      const lastTyped = typedChars[typedChars.length - 1];
      const expected = targetChars[typedChars.length - 1];
      console.log('  Comparing:', { lastTyped, expected });

      if (lastTyped === expected) {
        setCurrentScore((prevScore) => {
          const newScore = prevScore + 1;
          console.log('  Correct type, score incremented to:', newScore);
          return newScore;
        });
      } else {
        setCurrentScore((prevScore) => {
          const newScore = Math.max(prevScore - 1, 0);
          console.log('  Incorrect type, score decremented to:', newScore);
          return newScore;
        });
        setDisplayedText((prevDisplayedText) => {
          const updatedText = [...prevDisplayedText];
          if (typedChars.length <= targetChars.length) {
            updatedText[typedChars.length - 1] = (
              <span key={typedChars.length - 1} className="text-red-500">{lastTyped}</span>
            );
            console.log('  Updated displayedText with red incorrect char:', updatedText);
          }
          return updatedText;
        });
      }
    }
  }, [typedChars, targetChars, gameStarted, startCounter]);

  const handleStartGame = () => {
    console.log('handleStartGame triggered');
    setGameStarted(true);
  };

  return (
    <div className="flex flex-col h-screen bg-blue-gray-400 relative items-center justify-center">
      {/* High Score Box (Top Right) */}
      <div className="absolute top-4 right-4 bg-yellow-300 text-stone-900 p-4 rounded-md shadow-md">
        <h2 className="text-lg font-semibold mb-2">High Score</h2>
        <p className="text-xl font-bold text-green-400">120</p> {/* Placeholder */}
      </div>

      {/* Welcome User (Top Right) */}
      <div className="absolute top-4 right-4 mr-4 text-stone-900 font-semibold">
        Welcome, Guest
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center">
        {/* Current Score Box */}
        <div className="mb-8 bg-yellow-300 text-stone-900 p-3 rounded-md shadow-md">
          <p className="text-lg">Current Score: <span className="font-semibold text-green-400">{currentScore}</span></p>
        </div>

        {/* Displayed Text or Start Counter */}
        <div className="text-4xl text-slate-200 text-center mb-8">
          {gameStarted && startCounter !== null ? (
            <span>{startCounter}</span>
          ) : (
            displayedText
          )}
        </div>

        {/* Invisible Input */}
        <input
          type="text"
          className="opacity-0 absolute -z-10"
          ref={textInputRef}
          onKeyDown={handleKeyDown}
          autoFocus={gameStarted && startCounter === null} // Auto focus only after countdown
        />

        {/* Start Button */}
        {!gameStarted && (
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline mb-4"
            type="button"
            onClick={handleStartGame}
          >
            Start Game
          </button>
        )}

        {/* Restart Button */}
        <button
          className={`text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
            gameStarted ? 'bg-green-500 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
          }`}
          type="button"
          onClick={() => window.location.reload()}
          disabled={!gameStarted} // Disable restart until game starts
        >
          Restart
        </button>
      </div>

      {/* Optional Footer */}
      {/* <div className="bg-stone-900 text-yellow-300 p-4 text-center">
        <p>&copy; 2025 Typing Game</p>
      </div> */}
    </div>
  );
}

export default TypingTestPage;