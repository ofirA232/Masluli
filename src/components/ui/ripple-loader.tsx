import { cn } from "@/lib/utils";
// A 3×3 grid whose cells light up in a diagonal ripple from one corner to the
// other (21st.dev "loader-4", moved from styled-components to redesign.css).
// Each number is the cell's step along the diagonal.
const steps = [0, 1, 2, 1, 2, 2, 3, 3, 4];
export function RippleLoader({ className }: { className?: string }) {
  return (
    <div className={cn("ripple-loader", className)} aria-hidden>
      {steps.map((step, i) => (
        <div key={i} className={`ripple-cell d-${step}`} />
      ))}
    </div>
  );
}
