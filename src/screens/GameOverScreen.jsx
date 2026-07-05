import * as engine from '../game/engine';
import { Header, ShareButton } from './shared';

export default function GameOverScreen({ game, pid, code, now, actions, onLeave }) {
  const order = engine.standings(game);
  const titles = engine.computeTitles(game);
  const controller = engine.isController(game, pid, now());
  const winner = game.players[order[0]];

  return (
    <div className="screen">
      <Header code={code} game={game} pid={pid} onLeave={onLeave} />
      <h2 className="phase-title">🎉 Final standings 🎉</h2>
      <div className="card center-text winner-card">
        <p className="big-emoji">{winner.emoji}</p>
        <p><b>{winner.name}</b> wins with {winner.score || 0} points!</p>
      </div>

      <ol className="result-list leaderboard">
        {order.map((p, i) => {
          const pl = game.players[p];
          const t = titles[p];
          return (
            <li key={p} className={`final-row ${p === pid ? 'is-author' : ''}`}>
              <span className="rank-pos">{['🥇', '🥈', '🥉'][i] || i + 1}</span>
              <span className="avatar md">{pl.emoji}</span>
              <span className="final-name">
                <span className="pname">{pl.name}</span>
                <span className="title-line">{t.title} — {t.blurb}</span>
              </span>
              <span className="borda"><b>{pl.score || 0}</b></span>
            </li>
          );
        })}
      </ol>

      <div className="btn-stack">
        {controller && (
          <button className="btn primary big" onClick={actions.restart}>
            Play again (same crew) 🔄
          </button>
        )}
        <ShareButton code={code} />
        <button className="btn secondary" onClick={onLeave}>Leave game</button>
      </div>
    </div>
  );
}
