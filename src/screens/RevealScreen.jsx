import { useEffect, useState } from 'react';
import * as engine from '../game/engine';
import { Header } from './shared';

// Pools indexed by |target - achieved|, capped at 3. Picked deterministically
// from the round so every phone shows the same line.
const VERDICTS = {
  0: [
    '🎯 BULLSEYE! Absolute mind control.',
    '🎯 DEAD ON. Puppet master behaviour.',
    '🧠 Exactly as planned. Terrifying.',
  ],
  1: [
    '👏 One off. Annoyingly respectable.',
    '😅 Sooo close. The group almost obeyed.',
    '🤏 One place away. Solid scheming.',
  ],
  2: [
    '😬 Two off. The group had other plans.',
    '🫠 Two away. The vision was not shared.',
    '📉 Two off target. Needs work.',
  ],
  3: [
    '💀 Not even close. Genuinely embarrassing.',
    '🤡 A masterclass in failure.',
    '🗑️ The plan never stood a chance.',
    '🙈 We all saw what they were going for. Yikes.',
  ],
};

function Confetti() {
  const bits = Array.from({ length: 26 }, (_, i) => i);
  const emo = ['🎉', '✨', '⭐', '🎊', '💥'];
  return (
    <div className="confetti" aria-hidden>
      {bits.map((i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            animationDelay: `${(i % 9) * 0.13}s`,
            fontSize: `${14 + ((i * 7) % 14)}px`,
          }}
        >
          {emo[i % emo.length]}
        </span>
      ))}
    </div>
  );
}

export default function RevealScreen({ game, pid, code, now, actions, onLeave }) {
  const round = game.round;
  const author = round.order[round.idx];
  const result = (round.results || {})[author];
  const controller = engine.isController(game, pid, now());
  const isLast = round.idx + 1 >= round.order.length;

  const n = result ? result.ranking.length : 0;
  const hasSab = Boolean(result?.sabotage);
  // Step timeline: 0 author · 1 secret target · 2..2+n-1 places (last → first)
  // · 2+n verdict · (+1 sabotage exposé) · done -> next button.
  const totalSteps = 2 + n + 1 + (hasSab ? 1 : 0);

  const [step, setStep] = useState(0);
  const catKey = `${round.num}-${round.idx}`;
  const [key, setKey] = useState(catKey);
  if (key !== catKey) {
    setKey(catKey);
    setStep(0);
  }

  useEffect(() => {
    if (step >= totalSteps) return undefined;
    const slow = step < 2 || step >= 2 + n; // linger on story beats, zip through places
    const t = setTimeout(() => setStep((s) => s + 1), slow ? 2200 : 1300);
    return () => clearTimeout(t);
  }, [step, totalSteps, n, catKey]);

  if (!result) return null;

  const authorPl = game.players[author];
  const medals = ['🥇', '🥈', '🥉'];
  const diff = Math.abs(result.target - result.achieved);
  const pool = VERDICTS[Math.min(diff, 3)];
  const verdict = pool[(round.num * 7 + round.idx * 3) % pool.length];
  const showTarget = step >= 1;
  const placeShown = (position) => step >= 2 + (n - position); // 1-indexed place
  const showVerdict = step >= 2 + n;
  const showSab = hasSab && step >= 3 + n;
  const done = step >= totalSteps;
  const celebrate = showVerdict && diff === 0;

  const skip = () => setStep((s) => Math.min(totalSteps, s + 1));

  return (
    <div className="screen reveal-screen" onClick={skip}>
      {celebrate && <Confetti />}
      <Header code={code} game={game} pid={pid} onLeave={onLeave} />
      <p className="muted center-text">
        Category {round.idx + 1} of {round.order.length} · results
        {!done && <span className="tap-hint"> · tap to hurry</span>}
      </p>

      <div className="card category-card pop">
        <p className="category-text">“{result.category}”</p>
        <p className="reveal-author">
          ✍️ This one was <b>{authorPl?.emoji} {authorPl?.name}</b>'s doing
        </p>
        {showTarget && (
          <p className="reveal-target pop">
            🤫 Their secret mission: finish <b>{engine.ordinal(result.target)}</b> of {n}
          </p>
        )}
      </div>

      <ol className="result-list">
        {result.ranking.map((p, i) => {
          const pl = game.players[p];
          const position = i + 1;
          const shown = placeShown(position);
          if (!shown) {
            return (
              <li key={p} className="mystery">
                <span className="rank-pos">{medals[i] || position}</span>
                <span className="avatar md">❓</span>
                <span className="pname">???</span>
              </li>
            );
          }
          return (
            <li key={p} className={`pop ${p === author ? 'is-author' : ''}`}>
              <span className="rank-pos">{medals[i] || position}</span>
              <span className="avatar md">{pl?.emoji}</span>
              <span className="pname">{pl?.name}</span>
              <span className="borda">{(result.points || {})[p] ?? 0} pts</span>
            </li>
          );
        })}
      </ol>

      {showVerdict && (
        <div className={`card score-card pop ${diff === 0 ? 'hit' : diff >= 3 ? 'miss' : ''}`}>
          <p className="verdict-line">{verdict}</p>
          <p>
            Aimed for <b>{engine.ordinal(result.target)}</b>, landed{' '}
            <b>{engine.ordinal(result.achieved)}</b>
            {result.ballotCount === 0 && ' (no votes — fate decided)'}
          </p>
          <p className="score-big">+{result.score} pts</p>
        </div>
      )}

      {showSab && (
        <div className={`card sabotage-card pop ${result.sabotage.success ? 'success' : 'fail'}`}>
          <p className="secret-label">😈 BUT WAIT — IT WAS A SABOTAGE ROUND</p>
          <p>
            <b>{authorPl?.name}</b> wrote this to sink{' '}
            <b>
              {game.players[result.sabotage.targetId]?.emoji}{' '}
              {game.players[result.sabotage.targetId]?.name}
            </b>{' '}
            to last place —{' '}
            {result.sabotage.success
              ? 'and NAILED it. Points doubled! 💰💰'
              : 'and completely blew it. No bonus, only shame. 🫣'}
          </p>
        </div>
      )}

      {done &&
        (controller ? (
          <button
            className="btn primary big pop"
            onClick={(e) => {
              e.stopPropagation();
              actions.revealNext();
            }}
          >
            {isLast ? 'Show leaderboard 🏆' : 'Next category ➡️'}
          </button>
        ) : (
          <p className="muted center-text">Waiting for the host…</p>
        ))}
    </div>
  );
}
