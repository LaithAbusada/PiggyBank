"use client";

const Bar = ({ w, h = 14, r = 8 }: { w: number | string; h?: number; r?: number }) => (
  <span className="pb-skel" style={{ width: w, height: h, borderRadius: r }} />
);

const Block = ({ h, r = 14 }: { h: number; r?: number }) => (
  <span className="pb-skel" style={{ width: "100%", height: h, borderRadius: r }} />
);

function RowSkel() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 10px" }}>
      <span className="pb-skel" style={{ width: 40, height: 40, borderRadius: 12 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <Bar w="45%" h={12} />
        <Bar w="30%" h={10} />
      </div>
      <Bar w={64} h={14} />
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Bar w={180} h={11} />
          <Bar w={340} h={26} />
        </div>
        <span className="pb-skel" style={{ width: 160, height: 42, borderRadius: 999 }} />
      </div>

      <div className="pb-dash__grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Bar w={200} h={18} />
                <Bar w={260} h={12} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <Bar w={40} h={10} />
                <Bar w={90} h={22} />
              </div>
            </div>
            <Block h={180} r={16} />
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <Bar w={210} h={18} />
              <Bar w={80} h={22} r={999} />
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <span className="pb-skel" style={{ width: 190, height: 190, borderRadius: "50%" }} />
            </div>
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <Bar w={160} h={18} />
              <div style={{ display: "flex", gap: 6 }}>
                <Bar w={56} h={28} r={999} />
                <Bar w={70} h={28} r={999} />
                <Bar w={80} h={28} r={999} />
              </div>
            </div>
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <RowSkel key={i} />
              ))}
            </div>
          </div>
        </div>

        <aside className="pb-dash__rail">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
              <Bar w="55%" h={14} />
              <Bar w="35%" h={10} />
              <Block h={i === 0 ? 120 : 80} r={14} />
            </div>
          ))}
        </aside>
      </div>
    </>
  );
}
