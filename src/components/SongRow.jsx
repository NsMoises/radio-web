export default function SongRow({ song, rank, onPick, isPicked }) {
  const p = song.position ?? rank;
  return (
    <tr
      className={"songrow" + (isPicked ? " songrow--picked" : "") + (song.trend?.className ? " " + song.trend.className : "")}
      onClick={onPick}
      style={onPick ? { cursor: "pointer" } : undefined}
    >
      <td className="songrow__pos">{p}</td>
      <td className="songrow__trend">
        <span className={"trend " + (song.trend?.className || "")} title={song.trend?.label}>
          {song.trend?.symbol}
        </span>
        {song.lastWeekPosition > 0 && (
          <span className="songrow__lw">({song.lastWeekPosition})</span>
        )}
      </td>
      <td className="songrow__cover">
        <img src={song.cover} alt="" loading="lazy" />
      </td>
      <td className="songrow__info">
        <div className="songrow__title">{song.title}</div>
        <div className="songrow__artist">{song.artist}</div>
      </td>
      <td className="songrow__peak">{song.peak || p}</td>
      <td className="songrow__weeks">{song.weeksLabel}</td>
    </tr>
  );
}