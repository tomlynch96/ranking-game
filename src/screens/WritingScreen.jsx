import { useState } from 'react';
import * as engine from '../game/engine';
import { Header, TimerBar, SubmitProgress } from './shared';

export default function WritingScreen({ game, pid, code, now, actions, onLeave }) {
  const [text, setText] = useState('');
  const round = game.round || {};
  const categories = round.categories || {};
  const submitted = Boolean(categories[pid]);
  const target = (round.targets || {})[pid];
  const total = engine.playerIds(game).length;
  const sab = round.sabotage;
  const isSaboteur = sab && sab.saboteurId === pid;
  const sabTarget = isSaboteur ? game.players[sab.targetId] : null;

  return (
    <div className="screen">
      <Header code={code} game={game} pid={pid} onLeave={onLeave} />
      <TimerBar endsAt={game.phaseEndsAt} durationMs={engine.WRITE_SECONDS * 1000} now={now} />
      <h2 className="phase-title">Round {round.num} — write your category</h2>

      <div className="card secret">
        <p className="secret-label">🤫 Your secret target</p>
        <p className="secret-value">
          Finish <b>{engine.ordinal(target)}</b> out of {total}
        </p>
        <p className="muted small">
          Write a category where the group would rank <i>you</i> {engine.ordinal(target)}.
        </p>
      </div>

      {isSaboteur && (
        <div className="card sabotage">
          <p className="secret-label">😈 SABOTAGE MISSION</p>
          <p>
            Make <b>{sabTarget?.emoji} {sabTarget?.name}</b> finish <b>LAST</b> in your
            category. Succeed and your points for this category are <b>doubled</b>.
            Fail and you just score normally. Don't get caught…
          </p>
        </div>
      )}

      {!submitted ? (
        <div className="card">
          <label className="label">Your category</label>
          <textarea
            className="input textarea"
            value={text}
            maxLength={140}
            placeholder="Most likely to…"
            onChange={(e) => setText(e.target.value)}
          />
          <button
            className="btn primary big"
            disabled={!text.trim()}
            onClick={() => actions.submitCategory(text.trim())}
          >
            Lock it in ✅
          </button>
        </div>
      ) : (
        <div className="card">
          <p className="center-text">✅ Category locked in!</p>
          <SubmitProgress
            game={game}
            done={Object.keys(categories)}
            label="Waiting for everyone…"
          />
        </div>
      )}
    </div>
  );
}
