import { useEffect, useState } from 'react';
import * as engine from '../game/engine';

export function Avatar({ player, size = 'md' }) {
  return <span className={`avatar ${size}`}>{player?.emoji || '❓'}</span>;
}

export function PlayerChip({ player, badge, dim }) {
  return (
    <span className={`chip ${dim ? 'dim' : ''}`}>
      <span className="chip-emoji">{player?.emoji}</span>
      <span className="chip-name">{player?.name}</span>
      {badge && <span className="chip-badge">{badge}</span>}
    </span>
  );
}

// Countdown bar synced to the shared deadline.
export function TimerBar({ endsAt, durationMs, now }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, []);
  if (!endsAt) return null;
  const remaining = Math.max(0, endsAt - now());
  const frac = durationMs ? Math.min(1, remaining / durationMs) : 0;
  const secs = Math.ceil(remaining / 1000);
  return (
    <div className="timer">
      <div className="timer-track">
        <div
          className={`timer-fill ${secs <= 5 ? 'urgent' : ''}`}
          style={{ width: `${frac * 100}%` }}
        />
      </div>
      <span className={`timer-secs ${secs <= 5 ? 'urgent' : ''}`}>{secs}s</span>
    </div>
  );
}

// "3 of 5 in" progress with per-player ticks.
export function SubmitProgress({ game, done, label, exclude = [] }) {
  const pids = engine.playerIds(game).filter((p) => !exclude.includes(p));
  return (
    <div className="progress-block">
      <p className="muted">{label}</p>
      <div className="chip-row">
        {pids.map((p) => (
          <PlayerChip
            key={p}
            player={game.players[p]}
            badge={done.includes(p) ? '✓' : '…'}
            dim={!done.includes(p)}
          />
        ))}
      </div>
    </div>
  );
}

export function Header({ code, game, pid, onLeave }) {
  const me = game?.players?.[pid];
  return (
    <header className="topbar">
      <button className="leave" onClick={onLeave} title="Leave game">✕</button>
      <span className="topbar-code">{code}</span>
      {me && (
        <span className="topbar-me">
          {me.emoji} <b>{me.score || 0}</b> pts
        </span>
      )}
    </header>
  );
}

export function ShareButton({ code }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${window.location.pathname}?g=${code}`;
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Party Rank', text: `Join my Party Rank game! Code: ${code}`, url });
        return;
      } catch { /* fall through to copy */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <button className="btn secondary" onClick={share}>
      {copied ? 'Link copied! ✓' : 'Share invite link 🔗'}
    </button>
  );
}
