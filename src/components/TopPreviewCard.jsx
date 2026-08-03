import { extractYouTubeId, youtubeThumb } from "../utils/youtube-utils.js";
import { useState } from "react";

function MiniThumb({ song }) {
  const videoId = extractYouTubeId(song.url);
  const qualities = ["maxresdefault", "hqdefault", "mqdefault"];
  const [idx, setIdx] = useState(0);
  const [broken, setBroken] = useState(false);
  const src = videoId && !broken
    ? youtubeThumb(videoId, qualities[idx])
    : `https://picsum.photos/seed/${song.id}/400/225`;
  return (
    <img
      src={src}
      alt={song.title}
      loading="lazy"
      onError={() => {
        if (idx < qualities.length - 1) setIdx(idx + 1);
        else setBroken(true);
      }}
    />
  );
}

function rankDiff(song) {
  const last = song.lastWeekPosition;
  if (last == null || last <= 0) return null;
  return last - song.position;
}

export default function TopPreviewCard({ song }) {
  const diff = rankDiff(song);
  return (
    <div className="topp20-mini">
      <div className="topp20-mini__cover">
        <MiniThumb song={song} />
        <span className="topp20-mini__pos">#{song.position}</span>
        <span className={"topp20-mini__trend " + (song.trend?.className || "")} title={song.trend?.label}>
          {song.trend?.symbol}
          {diff != null && diff !== 0 && <span className="topp20-mini__diff">{Math.abs(diff)}</span>}
        </span>
      </div>
      <div className="topp20-mini__body">
        <div className="topp20-mini__title">{song.title}</div>
        <div className="topp20-mini__artist">{song.artist}</div>
        <div className="topp20-mini__meta">
          {song.trend?.label}
          {diff != null && diff > 0 && ` +${diff}`}
          {diff != null && diff < 0 && ` −${Math.abs(diff)}`}
          <span className="topp20-mini__weeks">{song.weeksLabel}</span>
        </div>
      </div>
    </div>
  );
}