import * as engine from '../game/engine';
import { Header } from './shared';

export default function RevealScreen({ game, pid, code, now, actions, onLeave }) {
  const round = game.round;
  const author = round.order[round.idx];
  const result = (round.results || {})[author];
  const controller = engine.isController(game, pid, now());
  const isLast = round.idx + 1 >= round.order.length;

  if (!result) return null;

  const authorPl = game.players[author];
  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="screen">
      <Header code={code} game={game} pid={pid} onLeave={onLeave} />
      <p className="muted center-text">Category {round.idx + 1} of {round.order.length} — results</p>
      <div className="card category-card">
        <p className="category-text">“{result.category}”</p>
        <p className="muted small center-text">
          written by {authorPl?.emoji} <b>{authorPl?.name}</b>
          {result.ballotCount === 0 && ' · no votes came in, so fate decided'}
        </p>
      </div>

      <ol className="result-list">
        {result.ranking.map((p, i) => {
          const pl = game.players[p];
          return (
            <li key={p} className={p === author ? 'is-author' : ''}>
              <span className="rank-pos">{medals[i] || i + 1}</span>
              <span className="avatar md">{pl?.emoji}</span>
              <span className="pname">{pl?.name}</span>
              <span className="borda">{(result.points || {})[p] ?? 0} pts</span>
            </li>
          );
        })}
      </ol>

      <div className={`card score-card ${result.score >= 10 ? 'hit' : result.score === 0 ? 'miss' : ''}`}>
        <p>
          {authorPl?.emoji} <b>{authorPl?.name}</b> was secretly aiming for{' '}
          <b>{engine.ordinal(result.target)}</b> and finished{' '}
          <b>{engine.ordinal(result.achieved)}</b>
        </p>
        <p className="score-big">+{result.score} pts</p>
        {result.sabotage && (
          <div className={`sabotage-reveal ${result.sabotage.success ? 'success' : 'fail'}`}>
            😈 <b>SABOTAGE!</b> {authorPl?.name} was trying to sink{' '}
            <b>{game.players[result.sabotage.targetId]?.emoji} {game.players[result.sabotage.targetId]?.name}</b> to last place —{' '}
            {result.sabotage.success ? 'and NAILED it. Points doubled!' : 'and blew it. Normal points only.'}
          </div>
        )}
      </div>

      {controller ? (
        <button className="btn primary big" onClick={actions.revealNext}>
          {isLast ? 'Show leaderboard 🏆' : 'Next category ➡️'}
        </button>
      ) : (
        <p className="muted center-text">Waiting for the host…</p>
      )}
    </div>
  );
}
