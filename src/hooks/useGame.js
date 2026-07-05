import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ref, onValue, set, get, update, runTransaction, onDisconnect,
} from 'firebase/database';
import { db } from '../firebase';
import * as engine from '../game/engine';

// Server-adjusted clock so timers agree across devices.
export function useServerNow() {
  const offsetRef = useRef(0);
  useEffect(() => {
    if (!db) return;
    const r = ref(db, '.info/serverTimeOffset');
    return onValue(r, (snap) => { offsetRef.current = snap.val() || 0; });
  }, []);
  return useCallback(() => Date.now() + offsetRef.current, []);
}

export async function createGame({ name, emoji }) {
  const code = engine.makeCode();
  const pid = engine.makeId();
  const gameRef = ref(db, `games/${code}`);
  const existing = await get(gameRef);
  if (existing.exists()) return createGame({ name, emoji }); // rare collision: reroll
  await set(gameRef, {
    createdAt: Date.now(),
    hostId: pid,
    phase: 'lobby',
    players: {
      [pid]: { name, emoji, joinedAt: Date.now(), score: 0, connected: true },
    },
  });
  return { code, pid };
}

export async function joinGame({ code, name, emoji, existingPid }) {
  const gameRef = ref(db, `games/${code}`);
  const snap = await get(gameRef);
  if (!snap.exists()) throw new Error('No game found with that code.');
  const game = snap.val();
  if (existingPid && game.players && game.players[existingPid]) {
    return { code, pid: existingPid }; // rejoin mid-game
  }
  if (game.phase !== 'lobby') throw new Error('That game has already started.');
  const pid = engine.makeId();
  const result = await runTransaction(gameRef, (g) => {
    if (!g) return g;
    if (g.phase !== 'lobby') return undefined;
    const count = Object.keys(g.players || {}).length;
    if (count >= engine.MAX_PLAYERS) return undefined;
    g.players = g.players || {};
    g.players[pid] = { name, emoji, joinedAt: Date.now(), score: 0, connected: true };
    return g;
  });
  if (!result.committed) throw new Error('Could not join — the game is full or already started.');
  return { code, pid };
}

export async function leaveLobby(code, pid) {
  await set(ref(db, `games/${code}/players/${pid}`), null).catch(() => {});
}

export function useGame(code, pid) {
  const [game, setGame] = useState(undefined); // undefined = loading, null = missing
  const now = useServerNow();
  const gameRef = useRef(null);
  if (!gameRef.current && db && code) gameRef.current = ref(db, `games/${code}`);

  useEffect(() => {
    if (!db || !code) return;
    const r = ref(db, `games/${code}`);
    return onValue(r, (snap) => setGame(snap.exists() ? snap.val() : null));
  }, [code]);

  // Presence: mark connected, flip to false on disconnect.
  useEffect(() => {
    if (!db || !code || !pid) return;
    const connRef = ref(db, '.info/connected');
    const meRef = ref(db, `games/${code}/players/${pid}/connected`);
    return onValue(connRef, (snap) => {
      if (snap.val() === true) {
        onDisconnect(meRef).set(false);
        set(meRef, true);
      }
    });
  }, [code, pid]);

  const tx = useCallback(
    (reducer) =>
      runTransaction(ref(db, `games/${code}`), (g) => {
        if (!g) return g;
        const next = reducer(structuredClone(g), now(), Math.random);
        return next === undefined ? undefined : next;
      }),
    [code, now]
  );

  // Drive automatic transitions (all-submitted or deadline hit). The engine
  // decides who the controller is; transactions make duplicate pushes safe.
  const gameSnap = useRef(game);
  gameSnap.current = game;
  useEffect(() => {
    if (!db || !code || !pid) return;
    const tick = () => {
      const g = gameSnap.current;
      if (!g || !engine.isController(g, pid, now())) return;
      if (g.phase !== 'writing' && g.phase !== 'voting') return;
      // Dry-run on a clone; only fire the transaction if a transition applies.
      if (engine.reduceMaybeAdvance(structuredClone(g), now(), Math.random) !== undefined) {
        tx(engine.reduceMaybeAdvance);
      }
    };
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [code, pid, now, tx]);

  const actions = {
    submitCategory: (text) =>
      set(ref(db, `games/${code}/round/categories/${pid}`), text.slice(0, 140)),
    submitBallot: (authorId, order) =>
      set(ref(db, `games/${code}/round/ballots/${authorId}/${pid}`), order),
    startRound: () => tx(engine.reduceStartRound),
    revealNext: () => tx(engine.reduceRevealNext),
    endGame: () => tx(engine.reduceEndGame),
    restart: () => tx(engine.reduceRestart),
  };

  return { game, now, actions };
}
