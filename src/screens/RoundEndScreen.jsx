import * as engine from '../game/engine';
import { Header } from './shared';

export default function RoundEndScreen({ game, pid, code, now, actions, onLeave }) {
  const order = engine.standings(game);
  const controller = engine.isController(game, pid, now());

  return (
    <div className="screen">
      <Header code={code} game={game} pid={pid} onLeave={onLeave} />
      <h2 className="phase-title">Leaderboard after round {game.round?.num}</h2>
      <ol className="result-list leaderboard">
        {order.map((p, i) => {
          const pl = game.players[p];
          return (
            <li key={p} className={p === pid ? 'is-author' : ''}>
              <span className="rank-pos">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
              <span className="avatar md">{pl.emoji}</span>
              <span className="pname">{pl.name}</span>
              <span className="borda"><b>{pl.score || 0}</b> pts</span>
            </li>
          );
        })}
      </ol>

      {controller ? (
        <div className="btn-stack">
          <button className="btn primary big" onClick={actions.startRound}>
            Another round 🔁
          </button>
          <button className="btn secondary" onClick={actions.endGame}>
            Finish game 🏁
          </button>
        </div>
      ) : (
        <p className="muted center-text">The host decides: one more round, or final results…</p>
      )}
    </div>
  );
}
