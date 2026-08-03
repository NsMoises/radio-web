import { useState } from "react";
import { youtubeThumb, extractYouTubeId } from "../utils/youtube-utils.js";

const THUMB_QUALITIES = ["maxresdefault", "hqdefault", "mqdefault", "default"];

export default function CandidateCard({ c, cv, onPlay }) {
  const [qi, setQi] = useState(0);
  const [imgSrc, setImgSrc] = useState(youtubeThumb(c.videoId, THUMB_QUALITIES[0]));
  const voteId = c.videoId || extractYouTubeId(c.url) || c.id;
  const count = cv.votes?.[voteId] ?? 0;
  const isMy = cv.myVote === voteId;
  return (
    <div className="candidato-card" onClick={onPlay} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onPlay(); }}>
      <div className="candidato-card__thumb">
        <img src={imgSrc} alt={c.title} loading="lazy" onError={() => {
          const next = qi + 1;
          if (next < THUMB_QUALITIES.length) {
            setQi(next);
            setImgSrc(youtubeThumb(c.videoId, THUMB_QUALITIES[next]));
          } else if (c.cover) {
            setImgSrc(c.cover);
          }
        }} />
        <span className="candidato-card__play">▶</span>
        <span className="candidato-card__pos">#{c.position}</span>
        <button
          className={"candidato-card__vote" + (isMy ? " candidato-card__vote--done" : "")}
          onClick={(e) => { e.stopPropagation(); cv.vote(voteId); }}
          title={isMy ? "Retirar voto" : "Votar"}
          aria-label="Votar"
        >
          {isMy ? "❤" : "♡"}
          {count > 0 && <span className="candidato-card__vote-count">{count}</span>}
        </button>
      </div>
      <div className="candidato-card__body">
        <div className="candidato-card__title">{c.title}</div>
        <div className="candidato-card__artist">{c.artist}</div>
      </div>
    </div>
  );
}
