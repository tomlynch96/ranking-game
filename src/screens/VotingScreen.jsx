import { useMemo, useState } from 'react';
import * as engine from '../game/engine';
import { Header, TimerBar, SubmitProgress } from './shared';
import RankList from './RankList';

export default function VotingScreen({ game, pid, code, now, actions, onLeave }) {
  const round = game.round;
  const pids = engine.playerIds(game);
  const author = round.order[round.idx];
  const category = (round.categories || {})[author] || '';
  const ballots = (round.ballots || {})[author] || {};
  const iAmAuthor = pid === author;
  const iVoted = Boolean(ballots[pid]);
  const votersDone = Object.keys(ballots);
  const durationMs = engine.voteSeconds(pids.length) * 1000;

  // Shuffle the starting order once per category so nobody gets position bias.
  const [order, setOrder] = useState(null);
  const catKey = `${round.num}-${round.idx}`;
  const [orderKey, setOrderKey] = useState(catKey);
  if (orderKey !== catKey || order === null) {
    setOrder(engine.shuffle(pids));
    setOrderKey(catKey);
  }

  const catNum = round.idx + 1;
  const catTotal = round.order.length;

  return (
    <div className="screen">
      <Header code={code} game={game} pid={pid} onLeave={onLeave} />
      <TimerBar endsAt={game.phaseEndsAt} durationMs={durationMs} now={now} />
      <p className="muted center-text">Category {catNum} of {catTotal}</p>
      <div className="card category-card">
        <p className="category-text">“{category}”</p>
      </div>

      {iAmAuthor ? (
        <div className="card center-text">
          <p className="big-emoji">✍️</p>
          <p>This one's <b>yours</b>. Sit tight and look innocent.</p>
          <SubmitProgress
            game={game}
            done={votersDone}
            label={`Votes in: ${votersDone.length}/${pids.length - 1}`}
            exclude={[author]}
          />
        </div>
      ) : iVoted ? (
        <div className="card center-text">
          <p className="big-emoji">🗳️</p>
          <p>Vote cast!</p>
          <SubmitProgress
            game={game}
            done={votersDone}
            label={`Votes in: ${votersDone.length}/${pids.length - 1}`}
            exclude={[author]}
          />
        </div>
      ) : (
        <>
          <RankList order={order || pids} players={game.players} onChange={setOrder} />
          <button
            className="btn primary big"
            onClick={() => actions.submitBallot(author, order || pids)}
          >
            Submit ranking 🗳️
          </button>
        </>
      )}
    </div>
  );
}
