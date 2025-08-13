import React, { useState, useEffect, useRef } from "react";
import "./App.css";


const App = () => {
  const [totalNumbers, setTotalNumbers] = useState(5); 
  const [totalNumbersInput, setTotalNumbersInput] = useState("5"); 
  const [points, setPoints] = useState(0);
  const [time, setTime] = useState(0);
  const [numbers, setNumbers] = useState([]);
  const [nextNumber, setNextNumber] = useState(1);
  const [autoPlay, setAutoPlay] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameOver, setGameOver] = useState(false); 
  const [clickedNumbers, setClickedNumbers] = useState(new Set()); 
  const timeoutsRef = useRef([]); 
  const gameIdRef = useRef(0); 
  const [numberTimers, setNumberTimers] = useState({}); 
  const [activeCountdowns, setActiveCountdowns] = useState(new Set()); 

  const clearAllScheduled = () => {
    timeoutsRef.current.forEach(id => clearTimeout(id));
    timeoutsRef.current = [];
  };

  const startGame = () => {
    clearAllScheduled(); 
    gameIdRef.current += 1; 
    const total = Number(totalNumbers) || 0;
    const nums = [];

    const isOverlapping = (x, y) => {
      return nums.some(num => {
        const dx = num.x - x;
        const dy = num.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 50; 
      });
    };

    for (let i = 1; i <= total; i++) {
      let x, y;
      let attempts = 0; 
      do {
        x = Math.random() * 250;
        y = Math.random() * 250;
        attempts++;
        if (attempts > 1000) break; 
      } while (isOverlapping(x, y));

      nums.push({
        id: i,
        x,
        y,
        zIndex: total - i 
      });
    }

  setNumbers(nums);
    setPoints(0);
    setTime(0);
    setNextNumber(1);
  setGameStarted(true); 
    setGameCompleted(false);
    setGameOver(false);
    setAutoPlay(false); 
    setClickedNumbers(new Set()); 

  const initTimers = {};
  nums.forEach(n => { initTimers[n.id] = 3.0; });
  setNumberTimers(initTimers);
  setActiveCountdowns(new Set());
  };

  const handleRestart = () => {
    startGame();
  };

  
  useEffect(() => {
    if (gameStarted && !gameCompleted && !gameOver) {
      const timer = setInterval(() => {
        setTime((t) => t + 0.1);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [gameStarted, gameCompleted, gameOver]);


  useEffect(() => {
    if (activeCountdowns.size === 0 || gameOver || gameCompleted) return;
    const id = setInterval(() => {
      setNumberTimers(prev => {
        const updated = { ...prev };
        let changed = false;
        activeCountdowns.forEach(numId => {
          if (updated[numId] > 0) {
            updated[numId] = parseFloat((updated[numId] - 0.1).toFixed(1));
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 100);
    return () => clearInterval(id);
  }, [activeCountdowns, gameOver, gameCompleted]);

  
  useEffect(() => {
    if (!gameStarted || gameOver || gameCompleted) return;
    const toRemove = numbers.filter(n => activeCountdowns.has(n.id) && numberTimers[n.id] !== undefined && numberTimers[n.id] <= 0);
    if (toRemove.length === 0) return;
    toRemove.forEach(n => {
      setNumbers(prev => prev.filter(x => x.id !== n.id));
      setClickedNumbers(prev => {
        const ns = new Set(prev); ns.delete(n.id); return ns;
      });

      setPoints(p => {
        const newP = p + 1;
        if (newP === totalNumbers) {
          setGameCompleted(true);
          setAutoPlay(false);
        }
        return newP;
      });
    });
  }, [numberTimers, activeCountdowns, numbers, gameStarted, gameOver, gameCompleted, totalNumbers]);

  useEffect(() => {
    if (autoPlay && gameStarted && !gameCompleted && !gameOver) {
      const interval = setInterval(() => {
        if (nextNumber <= totalNumbers) {
          handleClick(nextNumber);
        }
      }, 300);
      return () => clearInterval(interval);
    }
  }, [autoPlay, nextNumber, totalNumbers, numbers, gameStarted, gameCompleted, gameOver]);

  const handleClick = (id) => {
    if (gameCompleted || gameOver) return;
    const currentGame = gameIdRef.current; 
    if (id === nextNumber) {
      setClickedNumbers(prev => new Set([...prev, id]));
      setActiveCountdowns(prev => new Set([...prev, id]));
      setNextNumber(n => n + 1); 
    } else {
      setGameOver(true);
      setAutoPlay(false);
    }
  };

  useEffect(() => () => { clearAllScheduled(); }, []); 

  const headingText = gameOver
    ? <span style={{ color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2em' }}>GAME OVER</span>
    : gameCompleted
    ? <span style={{ color: 'green',display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2em' }}>ALL CLEARED</span>
    : <span style={{ color: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2em' }}>LET'S PLAY</span>;

  return (
    <div className="app-container">
      <h3>{headingText}</h3>


      <div style={{ marginBottom: '10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          marginBottom: '5px',
          fontSize: '1.1em',
          fontWeight: 500
        }}>
          <span style={{ display: 'inline-block', width: 60, textAlign: 'left' }}>Points:</span>
          <input
            type="number"
            min="1"
            value={totalNumbersInput}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                setTotalNumbersInput("");
                return;
              }
              if (/^\d+$/.test(val)) {
                const num = parseInt(val, 10);
                if (num >= 1) {
                  setTotalNumbersInput(val);
                  setTotalNumbers(num);
                }
              }
            }}
            disabled={gameStarted && !gameOver && !gameCompleted}
            style={{ width: 50, marginLeft: 10 }}
          />
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          fontSize: '1.1em',
          fontWeight: 500
        }}>
          <span style={{ display: 'inline-block', width: 60, textAlign: 'left' }}>Time:</span>
          <span style={{ marginLeft: 10 }}>{time.toFixed(1)}s</span>
        </div>
      </div>

      {!gameStarted ? (
        <button onClick={startGame} disabled={!totalNumbersInput || Number(totalNumbersInput) < 1} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}> 
          Play
        </button>
      ) : (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}> {}
          <button onClick={handleRestart} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}> 
            Restart
          </button>
          <button
            onClick={() => setAutoPlay((a) => !a)}
            disabled={gameCompleted || gameOver}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Auto Play {autoPlay ? "Off" : "On"}
          </button>
        </div>
      )}

      <div className="game-board" style={gameOver ? { opacity: 0.6 } : {}}>
    {gameStarted && numbers.map((num) => (
          <div
            key={num.id}
            className={`number-circle ${clickedNumbers.has(num.id) ? 'clicked' : ''}`}
            style={{
              top: num.y,
              left: num.x,
              zIndex: totalNumbers - num.id, 
              pointerEvents: gameOver || gameCompleted ? "none" : "auto",
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            onClick={() => handleClick(num.id)}
          >
            <div style={{ 
              fontSize: '0.9em', 
              color: '#000000ff', 
              fontWeight: 'bold',
              textAlign: 'center',
              lineHeight: 1
            }}>
              {num.id}
            </div>
    {activeCountdowns.has(num.id) && numberTimers[num.id] !== undefined && (
              <div style={{ 
                fontSize: '0.45em', 
                textAlign: 'center',
                marginTop: '2px',
                lineHeight: 1
              }}>
                {numberTimers[num.id].toFixed(1)}s
              </div>
            )}
          </div>
        ))}
      </div>
  {gameStarted && !gameCompleted && !gameOver && nextNumber <= totalNumbers && (
        <div style={{ marginTop: 10, fontSize: '0.9em' }}>Next: {nextNumber}</div>
      )}
    </div>
  );
};

export default App;
