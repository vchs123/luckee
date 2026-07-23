import type { ReactNode } from "react";

export function TipBox({ icon, children, style }: { icon: string; children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="tip" style={style}>
      <span className="tip-ico">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
