import { useEffect, useRef, useState } from 'react';
import { PencilSvg, BallotSvg, PodiumSvg, TrophySvg } from './AnimatedSvg';

const OVERLAY_MS = 1600;

function overlayContent(game) {
  const round = game.round || {};
  switch (game.phase) {
    case 'writing':
      return {
        svg: <PencilSvg />,
        title: `Round ${round.num}`,
        sub: 'Write your category!',
      };
    case 'voting':
      return {
        svg: <BallotSvg />,
        title: `Category ${(round.idx || 0) + 1} of ${(round.order || []).length}`,
        sub: 'Rank the crew!',
      };
    case 'roundEnd':
      return {
        svg: <PodiumSvg />,
        title: 'Leaderboard!',
        sub: 'Who is on top?',
      };
    case 'gameOver':
      return {
        svg: <TrophySvg />,
        title: 'Final results!',
        sub: 'Drumroll please…',
      };
    default:
      return null; // lobby and reveal handle their own drama
  }
}

// Full-screen animated wipe shown when the game moves to a new phase (or the
// next category). pointer-events: none, so it never blocks impatient taps.
export default function PhaseTransition({ game }) {
  const sig = `${game.phase}:${game.phase === 'voting' ? game.round?.idx : ''}`;
  const prev = useRef(sig); // initialised to current so rejoins don't flash
  const [overlay, setOverlay] = useState(null);

  useEffect(() => {
    if (prev.current === sig) return undefined;
    prev.current = sig;
    const content = overlayContent(game);
    if (!content) {
      setOverlay(null);
      return undefined;
    }
    setOverlay({ ...content, key: sig });
    const t = setTimeout(() => setOverlay(null), OVERLAY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  if (!overlay) return null;
  return (
    <div className="phase-overlay" key={overlay.key} aria-hidden>
      <div className="phase-overlay-inner">
        {overlay.svg}
        <p className="phase-overlay-title">{overlay.title}</p>
        <p className="phase-overlay-sub">{overlay.sub}</p>
      </div>
    </div>
  );
}
