// Pure game logic for Party Rank. No Firebase, no React — everything here is
// deterministic given (gameState, now, rand), so any client can safely apply
// these reducers inside a Firebase transaction and duplicates are harmless.

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 10;
export const WRITE_SECONDS = 40;
export const GRACE_MS = 8000; // after this past the deadline, ANY client may advance

export function voteSeconds(playerCount) {
  return Math.min(45, Math.max(25, 20 + 3 * playerCount));
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L

export function makeCode(rand = Math.random) {
  let s = '';
  for (let i = 0; i < 4; i++) s += CODE_ALPHABET[Math.floor(rand() * CODE_ALPHABET.length)];
  return s;
}

export function makeId(rand = Math.random) {
  return 'p' + Date.now().toString(36) + Math.floor(rand() * 1e9).toString(36);
}

export const FALLBACK_CATEGORIES = [
  'Most likely to survive a zombie apocalypse',
  'Most likely to become accidentally famous',
  'Best person to be stuck in a lift with',
  'Most likely to cry at a nature documentary',
  'Most likely to text back within 10 seconds',
  'Best secret-keeper',
  'Most likely to win a reality TV show',
  'Most likely to adopt a weird pet',
  'Best at talking their way out of trouble',
  'Most likely to forget their own birthday',
];

export function shuffle(arr, rand = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Stable player order: by join time, then id.
export function playerIds(game) {
  const players = game.players || {};
  return Object.keys(players).sort(
    (a, b) => (players[a].joinedAt || 0) - (players[b].joinedAt || 0) || (a < b ? -1 : 1)
  );
}

// Each player gets a distinct secret target rank 1..N.
export function assignTargets(pids, rand = Math.random) {
  const ranks = shuffle(pids.map((_, i) => i + 1), rand);
  const targets = {};
  pids.forEach((p, i) => { targets[p] = ranks[i]; });
  return targets;
}

export function scorePoints(target, achieved) {
  const d = Math.abs(target - achieved);
  return d === 0 ? 10 : d === 1 ? 6 : d === 2 ? 2 : 0;
}

// Borda count over the submitted ballots (each ballot = full ordering of pids,
// best first). Missing/malformed ballots are simply excluded, which is the
// neutral treatment of an AFK voter. Ties: higher Borda points, then better
// average position, then random.
export function bordaRank(pids, ballotList, rand = Math.random) {
  const n = pids.length;
  const valid = (ballotList || []).filter(
    (b) => Array.isArray(b) && b.length === n && pids.every((p) => b.includes(p))
  );
  const points = {};
  pids.forEach((p) => { points[p] = 0; });
  if (valid.length === 0) {
    return { ranking: shuffle(pids, rand), points, ballotCount: 0 };
  }
  const posSum = {};
  pids.forEach((p) => { posSum[p] = 0; });
  for (const b of valid) {
    b.forEach((p, i) => {
      points[p] += n - 1 - i;
      posSum[p] += i;
    });
  }
  const tie = {};
  pids.forEach((p) => { tie[p] = rand(); });
  const ranking = [...pids].sort(
    (a, b) => points[b] - points[a] || posSum[a] - posSum[b] || tie[a] - tie[b]
  );
  return { ranking, points, ballotCount: valid.length };
}

// ---------------------------------------------------------------------------
// Phase reducers. Each takes (game, now, rand) and returns the mutated game,
// or undefined to signal "no transition applies" (aborts the transaction).
// Phases: lobby -> writing -> voting <-> reveal -> roundEnd -> (writing | gameOver)
// ---------------------------------------------------------------------------

// Start a fresh round of categories: from the lobby, or chained after roundEnd.
export function reduceStartRound(game, now, rand = Math.random) {
  if (!game) return undefined;
  if (game.phase !== 'lobby' && game.phase !== 'roundEnd') return undefined;
  const pids = playerIds(game);
  if (pids.length < MIN_PLAYERS) return undefined;

  const past = game.pastSaboteurs || {};
  let eligible = pids.filter((p) => !past[p]);
  if (eligible.length === 0) eligible = pids;
  const saboteurId = eligible[Math.floor(rand() * eligible.length)];
  const others = pids.filter((p) => p !== saboteurId);
  const targetId = others[Math.floor(rand() * others.length)];

  // If the sabotage succeeds, the mark takes last place — so the saboteur can
  // never be asked to finish last themselves. Swap that target away.
  const targets = assignTargets(pids, rand);
  if (targets[saboteurId] === pids.length) {
    const swap = others[Math.floor(rand() * others.length)];
    targets[saboteurId] = targets[swap];
    targets[swap] = pids.length;
  }

  game.round = {
    num: (game.round?.num || 0) + 1,
    targets,
    sabotage: { saboteurId, targetId },
    categories: {},
    order: null,
    idx: 0,
    ballots: {},
    results: {},
  };
  game.pastSaboteurs = { ...past, [saboteurId]: true };
  game.phase = 'writing';
  game.phaseEndsAt = now + WRITE_SECONDS * 1000;
  return game;
}

// Writing -> voting (all categories in, or timer expired: autofill from pool).
// Voting -> reveal (all ballots in, or timer expired: score with what we have).
export function reduceMaybeAdvance(game, now, rand = Math.random) {
  if (!game || !game.round) return undefined;
  const pids = playerIds(game);

  if (game.phase === 'writing') {
    const cats = { ...(game.round.categories || {}) };
    const allIn = pids.every((p) => cats[p]);
    const timedOut = game.phaseEndsAt && now >= game.phaseEndsAt;
    if (!allIn && !timedOut) return undefined;
    const pool = shuffle(FALLBACK_CATEGORIES, rand);
    pids.forEach((p, i) => { if (!cats[p]) cats[p] = pool[i % pool.length]; });
    game.round.categories = cats;
    game.round.order = shuffle(pids, rand);
    game.round.idx = 0;
    game.phase = 'voting';
    game.phaseEndsAt = now + voteSeconds(pids.length) * 1000;
    return game;
  }

  if (game.phase === 'voting') {
    const author = (game.round.order || [])[game.round.idx];
    if (!author) return undefined;
    const ballots = (game.round.ballots || {})[author] || {};
    const voters = pids.filter((p) => p !== author);
    const allIn = voters.every((v) => ballots[v]);
    const timedOut = game.phaseEndsAt && now >= game.phaseEndsAt;
    if (!allIn && !timedOut) return undefined;

    const { ranking, points, ballotCount } = bordaRank(
      pids,
      voters.map((v) => ballots[v]).filter(Boolean),
      rand
    );
    const target = (game.round.targets || {})[author];
    const achieved = ranking.indexOf(author) + 1;
    let score = scorePoints(target, achieved);
    let sabotage = null;
    const sab = game.round.sabotage;
    if (sab && sab.saboteurId === author) {
      const success = ranking[ranking.length - 1] === sab.targetId;
      if (success) score *= 2;
      sabotage = { targetId: sab.targetId, success };
    }
    game.round.results = {
      ...(game.round.results || {}),
      [author]: {
        authorId: author,
        category: (game.round.categories || {})[author] || '',
        ranking,
        points,
        ballotCount,
        target,
        achieved,
        score,
        sabotage,
      },
    };

    const pl = game.players[author];
    pl.score = (pl.score || 0) + score;
    const st = { ...(pl.stats || {}) };
    if (achieved === target) st.exact = (st.exact || 0) + 1;
    if (sabotage) {
      st.sabTries = (st.sabTries || 0) + 1;
      if (sabotage.success) st.sabWins = (st.sabWins || 0) + 1;
    }
    pl.stats = st;
    const firstP = game.players[ranking[0]];
    firstP.stats = { ...(firstP.stats || {}), firsts: ((firstP.stats || {}).firsts || 0) + 1 };
    const lastP = game.players[ranking[ranking.length - 1]];
    lastP.stats = { ...(lastP.stats || {}), lasts: ((lastP.stats || {}).lasts || 0) + 1 };

    game.phase = 'reveal';
    game.phaseEndsAt = null;
    return game;
  }

  return undefined;
}

// Reveal -> next category, or leaderboard once every category has played.
export function reduceRevealNext(game, now, rand = Math.random) {
  if (!game || game.phase !== 'reveal' || !game.round) return undefined;
  const nextIdx = game.round.idx + 1;
  if (nextIdx < (game.round.order || []).length) {
    game.round.idx = nextIdx;
    game.phase = 'voting';
    game.phaseEndsAt = now + voteSeconds(playerIds(game).length) * 1000;
  } else {
    game.phase = 'roundEnd';
    game.phaseEndsAt = null;
  }
  return game;
}

export function reduceEndGame(game) {
  if (!game || game.phase !== 'roundEnd') return undefined;
  game.phase = 'gameOver';
  game.phaseEndsAt = null;
  return game;
}

// Back to the lobby with a clean slate (same room code, same players).
export function reduceRestart(game) {
  if (!game || game.phase !== 'gameOver') return undefined;
  game.phase = 'lobby';
  game.phaseEndsAt = null;
  game.round = null;
  game.pastSaboteurs = null;
  Object.values(game.players || {}).forEach((p) => {
    p.score = 0;
    p.stats = null;
  });
  return game;
}

// ---------------------------------------------------------------------------
// End-of-game titles: every player gets exactly one, best-fitting first.
// ---------------------------------------------------------------------------

const TITLE_SPECS = [
  { title: '👑 Rank Whisperer', blurb: 'Top of the leaderboard', metric: (p) => p.score || 0 },
  { title: '🎯 Mind Reader', blurb: 'Most exact target hits', metric: (p) => (p.stats || {}).exact || 0 },
  { title: '😈 Agent of Chaos', blurb: 'Pulled off the sabotage', metric: (p) => (p.stats || {}).sabWins || 0 },
  { title: '🌟 Crowd Favourite', blurb: 'Ranked first most often', metric: (p) => (p.stats || {}).firsts || 0 },
  { title: '🐢 Fashionably Last', blurb: 'Ranked last most often', metric: (p) => (p.stats || {}).lasts || 0 },
  { title: '🎲 Chaotic Neutral', blurb: 'The scoreboard fears no one who fears no scoreboard', metric: (p) => -(p.score || 0) + 1000 },
];

const FILLER_TITLES = [
  { title: '🦄 Wildcard', blurb: 'Impossible to predict' },
  { title: '🧊 Ice Cold', blurb: 'Never let the target slip' },
  { title: '🍿 Main Character', blurb: 'The drama followed them all night' },
  { title: '🕵️ Under the Radar', blurb: 'Nobody saw them coming' },
];

export function computeTitles(game) {
  const pids = playerIds(game);
  const players = game.players || {};
  const assigned = {};
  const taken = new Set();
  for (const spec of TITLE_SPECS) {
    let best = null;
    let bestVal = 0;
    for (const pid of pids) {
      if (taken.has(pid)) continue;
      const v = spec.metric(players[pid]);
      if (v > bestVal) { bestVal = v; best = pid; }
    }
    if (best) {
      assigned[best] = { title: spec.title, blurb: spec.blurb };
      taken.add(best);
    }
  }
  let i = 0;
  for (const pid of pids) {
    if (!assigned[pid]) {
      assigned[pid] = FILLER_TITLES[i % FILLER_TITLES.length];
      i++;
    }
  }
  return assigned;
}

export function standings(game) {
  const pids = playerIds(game);
  return [...pids].sort((a, b) => (game.players[b].score || 0) - (game.players[a].score || 0));
}

// Who is allowed to drive automatic phase transitions right now. The host
// leads; if the host looks disconnected the first connected player takes
// over; and once a deadline is GRACE_MS stale, anyone may push the game on.
export function isController(game, pid, now) {
  if (!game) return false;
  const players = game.players || {};
  const hostConnected = players[game.hostId] && players[game.hostId].connected !== false;
  if (hostConnected) {
    if (pid === game.hostId) return true;
  } else {
    const fallback = playerIds(game).find((p) => players[p].connected !== false);
    if (fallback === pid) return true;
  }
  return Boolean(game.phaseEndsAt && now > game.phaseEndsAt + GRACE_MS);
}

export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
