interface Props {
  label: string;
  value: string;
  hint?: string;
}

export default function StatKpi({ label, value, hint }: Props) {
  return (
    <div className="card-premium h-full p-5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-tk-text-muted">
        {label}
      </p>
      <p
        className="tabular mt-3 text-[1.6rem] font-bold leading-none tracking-tight text-tk-text"
        style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-[0.7rem] text-tk-text-faint">{hint}</p>}
    </div>
  );
}
