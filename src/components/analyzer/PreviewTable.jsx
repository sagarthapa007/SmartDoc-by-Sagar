import { FixedSizeList } from "react-window/dist/index.esm.js";
const List = ReactWindow.FixedSizeList || ReactWindow.default.FixedSizeList;
export default function PreviewTable({ headers=[], rows=[] }){
  const height = 260, rowHeight = 32, displayRows = rows.slice(0, 200);
  const columnWidth = 150;
  const totalWidth = headers.length * columnWidth;
  
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Preview</h3>
        <span className="badge">{rows.length.toLocaleString()} rows</span>
      </div>
      <div className="mt-2" style={{ overflow: "auto", border: "1px solid var(--border)", borderRadius: 12, maxHeight: height + rowHeight + 2 }}>
        <div style={{ minWidth: totalWidth }}>
          <div style={{ position:"sticky", top:0, background:"var(--card)", zIndex:1, display:"grid", gridTemplateColumns: `repeat(${headers.length}, ${columnWidth}px)`, borderBottom:"1px solid var(--border)" }}>
            {headers.map((h,i)=>(<div key={i} style={{ textAlign:"left", padding:"8px 10px", fontSize:12, fontWeight:600, opacity:.8, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{h}</div>))}
          </div>
          <List height={height} itemCount={displayRows.length} itemSize={rowHeight} width={totalWidth}>
            {({index, style})=>{
              const r = displayRows[index];
              return (
                <div style={{...style, display:"grid", gridTemplateColumns: `repeat(${headers.length}, ${columnWidth}px)`, borderBottom:"1px solid var(--border)", alignItems:"center", fontSize:13}}>
                  {headers.map((h,i)=>( <div key={i} style={{ padding:"0 10px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{String(r[h] ?? "")}</div> ))}
                </div>
              );
            }}
          </List>
        </div>
      </div>
    </div>
  );
}