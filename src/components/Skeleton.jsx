// Skeleton genérico para placeholders mientras carga la API.
export function Skeleton({ width = "100%", height = 16, radius }) {
  return (
    <div
      className="skel"
      style={{
        width,
        height,
        borderRadius: radius || "var(--radius-sm)"
      }}
    />
  );
}

// Skeleton del encabezado Top 20 (centrado)
export function RankingHeaderSkeleton() {
  return (
    <div className="page__head page__head--center">
      <Skeleton width={220} height={12} />
      <div style={{ height: 8 }} />
      <Skeleton width={140} height={40} />
      <div style={{ height: 8 }} />
      <Skeleton width={260} height={32} radius={50} />
      <div style={{ height: 8 }} />
      <Skeleton width={420} height={14} />
    </div>
  );
}

// Skeleton de una tarjeta de canción
export function SongCardSkeleton() {
  return (
    <div className="songcard songcard--skeleton">
      <div className="songcard__cover skel" style={{ height: "auto", aspectRatio: "1/1" }} />
      <div className="songcard__body">
        <Skeleton width="80%" height={16} />
        <div style={{ height: 6 }} />
        <Skeleton width="55%" height={12} />
        <div style={{ height: 10 }} />
        <Skeleton width="40%" height={12} />
      </div>
    </div>
  );
}

// Skeleton de la cuadrícula completa: leyenda + N tarjetas
export function RankingGridSkeleton({ count = 10, cols = 5 }) {
  return (
    <div className="top20-layout">
      <div className="songgrid" style={{ "--grid-cols": cols }}>
        {Array.from({ length: count }).map((_, i) => (
          <SongCardSkeleton key={i} />
        ))}
      </div>
      <aside className="legend legend--sticky">
        <Skeleton width={80} height={16} />
        <div style={{ height: 12 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: 36, marginBottom: 4 }}>
            <Skeleton width="100%" height={32} />
          </div>
        ))}
      </aside>
    </div>
  );
}