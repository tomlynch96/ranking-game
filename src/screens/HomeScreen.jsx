import { useState } from 'react';
import { createGame, joinGame } from '../hooks/useGame';

const EMOJIS = [
  '🦊', '🐸', '🐙', '🦄', '🐼', '🐯', '🦁', '🐨',
  '🐷', '🐧', '🦉', '🦕', '🦀', '🐝', '🐢', '🐬',
  '🍕', '🌮', '🍩', '🎸', '🚀', '👽', '🤖', '👑',
];

export default function HomeScreen({ urlCode, onEnter }) {
  const [name, setName] = useState(localStorage.getItem('partyrank-name') || '');
  const [emoji, setEmoji] = useState(localStorage.getItem('partyrank-emoji') || EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
  const [code, setCode] = useState(urlCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ready = name.trim().length > 0;

  const go = async (fn) => {
    if (!ready || busy) return;
    setBusy(true);
    setError('');
    localStorage.setItem('partyrank-name', name.trim());
    localStorage.setItem('partyrank-emoji', emoji);
    try {
      const session = await fn();
      onEnter(session);
    } catch (e) {
      setError(e.message || 'Something went wrong — try again.');
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <h1 className="logo">Party Rank 🏆</h1>
      <p className="tagline">Invent the categories. Hit your secret rank. Trust no one.</p>

      <div className="card">
        <label className="label">Your name</label>
        <input
          className="input"
          value={name}
          maxLength={16}
          placeholder="e.g. Tom"
          onChange={(e) => setName(e.target.value)}
        />
        <label className="label">Pick an avatar</label>
        <div className="emoji-grid">
          {EMOJIS.map((e) => (
            <button
              key={e}
              className={`emoji-btn ${e === emoji ? 'selected' : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <label className="label">Join a game</label>
        <div className="join-row">
          <input
            className="input code-input"
            value={code}
            maxLength={4}
            placeholder="CODE"
            autoCapitalize="characters"
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          />
          <button
            className="btn primary"
            disabled={!ready || code.length !== 4 || busy}
            onClick={() => go(() => joinGame({ code, name: name.trim(), emoji }))}
          >
            Join
          </button>
        </div>
        <div className="divider"><span>or</span></div>
        <button
          className="btn primary big"
          disabled={!ready || busy}
          onClick={() => go(() => createGame({ name: name.trim(), emoji }))}
        >
          Create new game 🎉
        </button>
        {error && <p className="error">{error}</p>}
      </div>

      <p className="footnote">4–10 players recommended · one phone each</p>
    </div>
  );
}
