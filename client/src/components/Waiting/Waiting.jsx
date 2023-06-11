import React, { useState } from 'react';
import './Waiting.css';

export default function Waiting(props) {
  const { newGameid } = props;
  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newGameid);
    setCopySuccess(true);
  };

  return (
    <div className='waiting-wrapper'>
      <p className='waiting-msg'>
        Waiting for other player to join...
      </p>
      <div className="load">
        <div className="one"></div>
        <div className="two"></div>
        <div className="three"></div>
      </div>
      <p className='game-id-is'>Your game ID is</p>
      <div className='game-id'>
        {newGameid}
        <button onClick={copyToClipboard}>
          {copySuccess ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}


