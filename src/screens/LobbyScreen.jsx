import * as engine from '../game/engine';
import { Header, ShareButton } from './shared';

export default function LobbyScreen({ game, pid, code, actions, onLeave }) {
  const pids = engine.playerIds(game);
  const isHost = pid === game.hostId;
  const canStart = pids.length >= engine.MIN_PLAYERS;

  return (
    <div className="screen">
      <Header code={code} game={game} pid={pid} onLeave={onLeave} />
      <div className="card center-text">
        <p className="muted">Room code</p>
        <div className="big-code">{code}</div>
        <ShareButton code={code} />
      </div>

      <div className="card">
        <p className="muted">
          Players ({pids.length}/{engine.MAX_PLAYERS})
          {pids.length < engine.MIN_PLAYERS && ` — need at least ${engine.MIN_PLAYERS}`}
        </p>
        <ul className="player-list">
          {pids.map((p) => {
            const pl = game.players[p];
            return (
              <li key={p} className={pl.connected === false ? 'dim' : ''}>
                <span className="avatar md">{pl.emoji}</span>
                <span className="pname">{pl.name}{p === pid ? ' (you)' : ''}</span>
                {p === game.hostId && <span className="host-badge">HOST</span>}
              </li>
            );
          })}
        </ul>
      </div>

      {isHost ? (
        <button className="btn primary big" disabled={!canStart} onClick={actions.startRound}>
          {canStart ? 'Start game 🚀' : `Waiting for players…`}
        </button>
      ) : (
        <p className="muted center-text">Waiting for the host to start…</p>
      )}

      <div className="card rules">
        <p><b>How it works</b></p>
        <p>🎯 Everyone gets a secret target rank and writes a category (e.g. “most likely to survive on Mars”).</p>
        <p>🗳️ For each category, everyone else ranks the whole group.</p>
        <p>💰 The closer you land to your secret target, the more points you score. Exact hit = 10.</p>
        <p>😈 One player each round has a <b>sabotage mission</b> — double points if they sink their mark to last place.</p>
      </div>
    </div>
  );
}
