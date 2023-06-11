import React, { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Entry.css';
import io from 'socket.io-client';
import Waiting from '../Waiting/Waiting';
import Board from '../Board/Board';

const socket = io('https://xonline-api-26dy.onrender.com');

export default function Entry() {

  const [name, setName] = useState('')
  const [gameid, setGameid] = useState('')
  const [gameidError, setGameidError] = useState(false)
  const [nameError, setNameError] = useState(false)
  const [newGameid, setNewGameid] = useState('')
  const [showWaiting, setShowWaiting] = useState(false)
  const [showBoard, setShowBoard] = useState(false)
  const [game, setGame] = useState({})


  useEffect(() => {
    const handleGameError = ({ msg }) => {
      notify(msg)
    };
    socket.on('game-error', handleGameError);
  
    return () => {
      socket.off('game-error', handleGameError);
    };
  }, []);

  useEffect(() => {
    const handleGameStarted = (game) => {
      setShowWaiting(false)
      setShowBoard(true)
      setGame(game)
    };
    socket.on('game-started', handleGameStarted);

    return () => {
      socket.off('game-started', handleGameStarted);
    };
  }, []);

  const joinGame = () => {
    setGameidError(false)
    setNameError(false)
    if(name === '' || gameid === '') {
      if(name === '') setNameError(true)
      if(gameid === '') setGameidError(true)
      return
    }
    socket.emit('join-game', {gameid, name})
  }

  const createGame = () => {
    setGameidError(false)
    setNameError(false)
    if(name === '') {
      setNameError(true)
      return
    }
    const myNewGameid = generateGameid()
    setNewGameid(myNewGameid)
    socket.emit('create-game', {myNewGameid, name})
    setShowWaiting(true)
  }

  const generateGameid = () => {
    let gameid = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    for (let i = 0; i < 5; i++) {
      gameid += characters.charAt(Math.floor(Math.random() * charactersLength))
    }
    return gameid
  }

  const handleName = (e) => {
    setName(e.target.value)
  }

  const handleGameid = (e) => {
    setGameid(e.target.value)
  }

  const notify = (msg) => {
    toast.error(msg, {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  }
  

  return (
    <>
      {!showWaiting && !showBoard && <div className='entry-wrapper'>
        <div className="title">
          <h1><span>XO</span>nline</h1>
          <p>Play XO online with your friends</p>
        </div>
        <div className="entry-content">
          <div className="input-wrapper">
            <input type="text" 
              placeholder='Enter your name' 
              value={name} onChange={handleName} 
              maxLength={10}
            />
            {nameError && <p>Your name is required for the game</p>}
          </div>
          <div className="join-game">
            <div className="input-wrapper">
            <input type="text" 
              placeholder="Enter game code" 
              value={gameid} 
              onChange={handleGameid}
              maxLength={5}
            />
            {gameidError && <p>Game code is required</p>}
            </div>
            <button onClick={joinGame}>Join</button>
          </div>
          <span>OR</span>
          <button onClick={createGame}>Create New Game</button>
        </div>
      </div> }
      {showWaiting && <Waiting newGameid={newGameid} /> }
      {showBoard && <Board game={game} setGame={setGame} socket={socket} />}
      <ToastContainer limit={1} />
    </>
  )
}
