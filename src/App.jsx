import { useEffect, useState } from 'react';
import { configOk } from './firebase';
import { useGame, leaveLobby } from './hooks/useGame';
import PhaseTransition from './components/PhaseTransition';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import WritingScreen from './screens/WritingScreen';
import VotingScreen from './screens/VotingScreen';
import RevealScreen from './screens/RevealScreen';
import RoundEndScreen from './screens/RoundEndScreen';
import GameOverScreen from './screens/GameOverScreen';

const SESSION_KEY = 'partyrank-session';

function loadSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function SetupNotice() {
  return (
    <div className="screen center">
      <h1 className="logo">Party Rank 🏆</h1>
      <div className="card">
        <h2>Almost there!</h2>
        <p>
          Firebase isn't configured yet. Copy <code>.env.example</code> to{' '}
          <code>.env</code>, fill in your Firebase project values, and restart
          the dev server. Full instructions are in the README.
        </p>
      </div>
    </div>
  );
}

function GameView({ session, onLeave }) {
  const { code, pid } = session;
  const { game, now, actions } = useGame(code, pid);

  // Leaving mid-lobby frees the seat; mid-game we keep the player so the
  // round's targets and scores stay intact (they can rejoin via the link).
  const leave = () => {
    if (game?.phase === 'lobby') leaveLobby(code, pid);
    onLeave();
  };

  if (game === undefined) {
    return (
      <div className="screen center">
        <div className="spinner" />
        <p className="muted">Connecting…</p>
      </div>
    );
  }
  if (game === null || !game.players || !game.players[pid]) {
    return (
      <div className="screen center">
        <h1 className="logo">Party Rank 🏆</h1>
        <div className="card">
          <p>
            {game === null
              ? `Game ${code} doesn't exist any more.`
              : 'You are no longer part of this game.'}
          </p>
          <button className="btn primary" onClick={onLeave}>Back to start</button>
        </div>
      </div>
    );
  }

  const props = { game, pid, now, actions, code, onLeave: leave };
  let screen;
  switch (game.phase) {
    case 'lobby': screen = <LobbyScreen {...props} />; break;
    case 'writing': screen = <WritingScreen {...props} />; break;
    case 'voting': screen = <VotingScreen {...props} />; break;
    case 'reveal': screen = <RevealScreen {...props} />; break;
    case 'roundEnd': screen = <RoundEndScreen {...props} />; break;
    case 'gameOver': screen = <GameOverScreen {...props} />; break;
    default: screen = <div className="screen center"><p>Unknown phase: {game.phase}</p></div>;
  }
  return (
    <>
      <PhaseTransition game={game} />
      {screen}
    </>
  );
}

export default function App() {
  const [session, setSession] = useState(loadSession);

  useEffect(() => {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  }, [session]);

  // Keep the share link in the address bar while in a game.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (session?.code) url.searchParams.set('g', session.code);
    else url.searchParams.delete('g');
    window.history.replaceState(null, '', url);
  }, [session?.code]);

  if (!configOk) return <SetupNotice />;

  if (!session) {
    const urlCode = new URLSearchParams(window.location.search).get('g') || '';
    return <HomeScreen urlCode={urlCode.toUpperCase()} onEnter={setSession} />;
  }
  return <GameView session={session} onLeave={() => setSession(null)} />;
}
