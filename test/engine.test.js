import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  assignTargets, bordaRank, scorePoints, reduceStartRound, reduceMaybeAdvance,
  reduceRevealNext, reduceEndGame, reduceRestart, computeTitles, playerIds,
  isController, voteSeconds, makeCode, ordinal, GRACE_MS,
} from '../src/game/engine.js';

// Deterministic rand for reproducible tests.
function seeded(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function makeGame(n = 4) {
  const players = {};
  for (let i = 0; i < n; i++) {
    players['p' + i] = { name: 'P' + i, emoji: '🦊', joinedAt: i, score: 0, connected: true };
  }
  return { createdAt: 1, hostId: 'p0', phase: 'lobby', players };
}

test('scorePoints table', () => {
  assert.equal(scorePoints(3, 3), 10);
  assert.equal(scorePoints(3, 2), 6);
  assert.equal(scorePoints(3, 5), 2);
  assert.equal(scorePoints(1, 4), 0);
  assert.equal(scorePoints(1, 6), 0);
});

test('assignTargets is a permutation of 1..N', () => {
  const pids = ['a', 'b', 'c', 'd', 'e'];
  const t = assignTargets(pids, seeded());
  assert.deepEqual(Object.values(t).sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(Object.keys(t).sort(), [...pids].sort());
});

test('bordaRank sums points and respects unanimous ballots', () => {
  const pids = ['a', 'b', 'c'];
  const { ranking, points, ballotCount } = bordaRank(
    pids,
    [['b', 'a', 'c'], ['b', 'a', 'c']],
    seeded()
  );
  assert.deepEqual(ranking, ['b', 'a', 'c']);
  assert.equal(points.b, 4);
  assert.equal(points.a, 2);
  assert.equal(points.c, 0);
  assert.equal(ballotCount, 2);
});

test('bordaRank ignores malformed ballots and handles zero ballots', () => {
  const pids = ['a', 'b', 'c'];
  const r1 = bordaRank(pids, [['a', 'b'], null, ['a', 'a', 'a']], seeded());
  assert.equal(r1.ballotCount, 0);
  assert.equal(r1.ranking.length, 3);
  assert.deepEqual([...r1.ranking].sort(), ['a', 'b', 'c']);
});

test('full round flow: start, write, vote, reveal, roundEnd', () => {
  const rand = seeded(7);
  const g = makeGame(4);
  const now = 1000;

  assert.ok(reduceStartRound(g, now, rand));
  assert.equal(g.phase, 'writing');
  assert.equal(Object.keys(g.round.targets).length, 4);
  const sab = g.round.sabotage;
  assert.ok(sab.saboteurId && sab.targetId && sab.saboteurId !== sab.targetId);

  // Not all categories in, not timed out -> no advance.
  g.round.categories = { p0: 'Best chef' };
  assert.equal(reduceMaybeAdvance(structuredClone(g), now + 1000, rand), undefined);

  // Timeout autofills the rest and moves to voting.
  assert.ok(reduceMaybeAdvance(g, g.phaseEndsAt + 1, rand));
  assert.equal(g.phase, 'voting');
  assert.equal(Object.keys(g.round.categories).length, 4);
  assert.equal(g.round.order.length, 4);

  // All voters submit identical ballots for the first category.
  const author = g.round.order[0];
  const pids = playerIds(g);
  const voters = pids.filter((p) => p !== author);
  const ballot = [...pids]; // p0 first ... p3 last
  g.round.ballots = { [author]: Object.fromEntries(voters.map((v) => [v, ballot])) };
  assert.ok(reduceMaybeAdvance(g, now + 2000, rand));
  assert.equal(g.phase, 'reveal');

  const res = g.round.results[author];
  assert.deepEqual(res.ranking, ballot);
  assert.equal(res.achieved, ballot.indexOf(author) + 1);
  const base = scorePoints(res.target, res.achieved);
  if (res.sabotage) {
    assert.equal(res.sabotage.success, ballot[ballot.length - 1] === sab.targetId);
    assert.equal(res.score, res.sabotage.success ? base * 2 : base);
  } else {
    assert.equal(res.score, base);
  }
  assert.equal(g.players[author].score, res.score);

  // Step through remaining categories via timeout (no ballots -> random rank).
  for (let i = 1; i < 4; i++) {
    assert.ok(reduceRevealNext(g, now + 3000, rand));
    assert.equal(g.phase, 'voting');
    assert.equal(g.round.idx, i);
    assert.ok(reduceMaybeAdvance(g, g.phaseEndsAt + 1, rand));
    assert.equal(g.phase, 'reveal');
  }
  assert.ok(reduceRevealNext(g, now + 4000, rand));
  assert.equal(g.phase, 'roundEnd');
  assert.equal(Object.keys(g.round.results).length, 4);

  // Sabotage success doubles: verify at least the math holds for every result.
  for (const r of Object.values(g.round.results)) {
    const b = scorePoints(r.target, r.achieved);
    assert.equal(r.score, r.sabotage && r.sabotage.success ? b * 2 : b);
  }

  assert.ok(reduceEndGame(g));
  assert.equal(g.phase, 'gameOver');
  const titles = computeTitles(g);
  assert.equal(Object.keys(titles).length, 4);

  assert.ok(reduceRestart(g));
  assert.equal(g.phase, 'lobby');
  assert.equal(g.players.p0.score, 0);
});

test('second round rotates the saboteur', () => {
  const rand = seeded(3);
  const g = makeGame(3);
  reduceStartRound(g, 0, rand);
  const first = g.round.sabotage.saboteurId;
  g.phase = 'roundEnd';
  reduceStartRound(g, 0, rand);
  assert.notEqual(g.round.sabotage.saboteurId, first);
  assert.equal(g.round.num, 2);
});

test('reducers refuse wrong phases', () => {
  const g = makeGame(4);
  g.phase = 'voting';
  assert.equal(reduceStartRound(structuredClone(g), 0, seeded()), undefined);
  assert.equal(reduceEndGame(structuredClone(g)), undefined);
  assert.equal(reduceRevealNext(structuredClone(g), 0, seeded()), undefined);
});

test('isController: host leads, fallback when host offline, anyone after grace', () => {
  const g = makeGame(3);
  g.phase = 'voting';
  g.phaseEndsAt = 10_000;
  assert.equal(isController(g, 'p0', 5000), true);
  assert.equal(isController(g, 'p1', 5000), false);
  g.players.p0.connected = false;
  assert.equal(isController(g, 'p1', 5000), true);
  assert.equal(isController(g, 'p2', 5000), false);
  assert.equal(isController(g, 'p2', 10_000 + GRACE_MS + 1), true);
});

test('misc helpers', () => {
  assert.match(makeCode(seeded()), /^[A-HJ-NP-Z2-9]{4}$/);
  assert.equal(voteSeconds(4), 32);
  assert.equal(voteSeconds(10), 45);
  assert.equal(ordinal(1), '1st');
  assert.equal(ordinal(2), '2nd');
  assert.equal(ordinal(3), '3rd');
  assert.equal(ordinal(4), '4th');
  assert.equal(ordinal(11), '11th');
});
