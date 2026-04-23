type DiseaseSliderProps = {
  label: string;
  value: number;
  notes?: string;
  onChange: (val: number) => void;
  disabled?: boolean;
};

const severityColor = (val: number) => {
  if (val > 70) return { text: "text-rose-700", bg: "bg-rose-100", hex: "#ef4444" };
  if (val > 40) return { text: "text-amber-700", bg: "bg-amber-100", hex: "#f59e0b" };
  if (val > 0) return { text: "text-emerald-700", bg: "bg-emerald-100", hex: "#10b981" };
  return { text: "text-stone", bg: "bg-slate-100", hex: "#e5e7eb" };
};

export default function DiseaseSlider({ label, value, notes, onChange, disabled }: DiseaseSliderProps) {
  const tone = severityColor(value);
  const sliderBg =
    value > 0
      ? `linear-gradient(90deg, ${tone.hex} 0%, ${tone.hex} ${value}%, #e5e7eb ${value}%, #e5e7eb 100%)`
      : "#e5e7eb";
  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <p className="text-sm font-semibold text-ink">{label}</p>
          {notes && <span className="text-xs text-stone">{notes}</span>}
        </div>
        <span
          className={`tag ${tone.bg} ${tone.text}`}
        >
          {value}/100
        </span>
      </div>
      <div className="relative pt-4">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          disabled={disabled}
          className={`w-full h-2 rounded-full appearance-none ${
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
          }`}
          style={{
            accentColor: value > 0 ? tone.hex : "#e5e7eb",
            background: sliderBg
          }}
        />
        <div
          className="absolute -top-1 translate-y-[-100%]"
          style={{
            left: `${value}%`,
            transform: `translateX(-${value}%)`
          }}
        >
          <span
            className={`px-2 py-1 rounded-full text-[11px] font-semibold ${tone.bg} ${tone.text} border border-white shadow-sm`}
          >
            {value}%
          </span>
        </div>
        <div className="flex justify-between text-[11px] uppercase tracking-[0.15em] text-stone mt-1">
          <span>Safe</span>
          <span>Severe</span>
        </div>
      </div>
    </div>
  );
}
