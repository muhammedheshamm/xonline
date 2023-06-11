import React, {useEffect, useState} from 'react'
import './Board.css'


export default function Board(props) {
  const {game, setGame, socket } = props;
  const {playerOne, playerTwo, gameid} = game;
  const [board, setBoard] = useState(Array(9).fill(''));
  const [winningBoard, setWinningBoard] = useState(Array(9).fill(false));
  const [turn, setTurn] = useState(`${playerOne.name}'s Turn (X)`);
  const [gameisLive, setGameisLive] = useState(true);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const handleUserJoined = () => {
      setAnnouncement('');
    }
    socket.on('user-joined', handleUserJoined);

    return () => {
      socket.off('user-joined', handleUserJoined);
    }
  }, [socket]);

  useEffect(() => {
    const handleLeftGame = ({msg}) => {
      setAnnouncement(msg);
    };
    socket.on('left-game', handleLeftGame);

    return () => {
      socket.off('left-game', handleLeftGame);
    };
  }, [socket]);

  useEffect(() => {
    const handleGameUpdate = ({board, turn}) => {
      setBoard(board);
      setTurn(turn);
    };
    socket.on('updated', handleGameUpdate);

    return () => {
      socket.off('updated', handleGameUpdate);
    };
  }, [socket]);

  useEffect(() => {
    const handleScoreUpdate = (game) => {
      setGame(game);
    };
    socket.on('listen-score-updated', handleScoreUpdate);

    return () => {
      socket.off('listen-score-updated', handleScoreUpdate);
    };
  }, [socket, setGame]);

  useEffect(() => {
    const handleGameOver = ({winner, winningCombo, tie, gameisLive}) => {
      console.log('game over');
      if(winner) {
        setAnnouncement(`${winner.name} won!`);
        let updatedWinningBoard = [...winningBoard];
        winningCombo.forEach(index => {
          updatedWinningBoard[index] = true;
        });
        setWinningBoard(updatedWinningBoard);
      }
      else if(tie) {
        setAnnouncement("It's a tie!");
      }
      setGameisLive(gameisLive);
    };
    
    socket.on('listen-game-over', handleGameOver);

    return () => {
      socket.off('listen-game-over', handleGameOver);
    };
  }, [socket, winningBoard]);
  

  const toggleTurn = () => {
    let updatedTurn = ''
  
    if(turn === `${playerOne.name}'s Turn (X)`)
      updatedTurn = `${playerTwo.name}'s Turn (O)` 
    else
      updatedTurn = `${playerOne.name}'s Turn (X)`
  
    return updatedTurn
  }

  const getcurrentPlayerName = () => {
    if(socket.id === playerOne.id)
      return playerOne.name;
    else 
      return playerTwo.name;
  }

  const resetScore = () => {
    socket.emit('reset-score', {gameid});
  }

  const move = (index) => {
    if (!gameisLive || !turn.includes(getcurrentPlayerName()) || board[index] !== '' || !playerOne || !playerTwo) return;
  
    const updatedBoard = [...board]
    updatedBoard[index] = turn.includes('X') ? 'X' : 'O'
    setBoard(updatedBoard)
    let updatedTurn = toggleTurn();
    setTurn(updatedTurn)
  
    socket.emit('move', { board: updatedBoard, turn: updatedTurn, gameid });

    const {theWinner, isTie} = checkGameStatus(updatedBoard, turn);

    if(theWinner || isTie) {
      setGameisLive(false);
      socket.emit('game-over', {winner: theWinner? theWinner.winnerObj : null, winningCombo: theWinner? theWinner.winningCombo : null, tie: isTie, gameid, gameisLive: false});
      if(theWinner)
        socket.emit('update-score', {winner: theWinner.winnerObj, gameid});
    }
  };

  const checkGameStatus = (board, turn) => {
    let isTie = true;
    let Winner = null;
    const winningCombos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 4, 8], [2, 4, 6], [0, 3, 6], 
      [1, 4, 7], [2, 5, 8] 
    ];

    

    for (let combo of winningCombos) {
      const [a, b, c] = combo;
      if(turn.includes('X') && board[a] === 'X' && board[b] === 'X' && board[c] === 'X') {
        Winner = {winnerObj: playerOne, winningCombo: combo};
        isTie = false;
        break;
      }
      else if(turn.includes('O') && board[a] === 'O' && board[b] === 'O' && board[c] === 'O') {
        Winner = {winnerObj: playerTwo, winningCombo: combo};
        isTie = false;
        break;
      }
    }
    if(isTie) {
      for(let i = 0; i < board.length; i++) {
        if(board[i] === '') {
          isTie = false;
          break;
        }
      }
    }

    return {theWinner: Winner, isTie};
  }

  const leaveGame = () => {
    socket.emit('reset-game', {gameid, id: socket.id});
    socket.disconnect();
    window.location.reload();
  }

  useEffect(() => {
    const handleResetGame = (id) => {
      console.log('reset game');
      setBoard(Array(9).fill(''));
      setWinningBoard(Array(9).fill(false));
      setGameisLive(true);
      setAnnouncement('');
      if(id === playerOne.id){
        setTurn(`${playerTwo.name}'s Turn (X)`);
      } else {
        setTurn(`${playerOne.name}'s Turn (X)`);
      }
    }
    socket.on('listen-reset-game', handleResetGame);

    return () => {
      socket.off('listen-reset-game', handleResetGame);
    };
  }, [socket, playerOne, playerTwo]);

  const resetGame = () => {
    if(gameisLive) return;
    socket.emit('reset-game', {gameid});
  }

  const renderCell = (index) => (
    <div className={winningBoard[index]? 'box win' : 'box'} onClick={() => move(index)} >
      {board[index]}
    </div>
  );

  return (
    <div className="wrapper">
      <div className="names">
        { playerOne && <h1>{playerOne.name} <br /><span>{ playerOne.score }</span></h1> }
        <h1 className='vs'>vs</h1>
        { playerTwo && <h1>{playerTwo.name} <br /><span>{ playerTwo.score }</span></h1> }
      </div>
      <hr />
      
      { !announcement && <h3>{ turn.includes(getcurrentPlayerName()) ? `Your Turn ${turn.slice(-3)}` : turn }</h3>}
      { announcement && <h3>{ announcement }</h3> }
      <hr />
      <div className='options'>
        <button className="option" onClick={resetScore}>Reset score</button>
        <button className="option" onClick={resetGame}>Play again</button>
        <button className="option" onClick={leaveGame}>Leave game</button>
      </div>
      <div className="container">
        { renderCell(0) }
        { renderCell(1) }
        { renderCell(2) }
        { renderCell(3) }
        { renderCell(4) }
        { renderCell(5) }
        { renderCell(6) }
        { renderCell(7) }
        { renderCell(8) }
      </div>
  </div>
  )
}
