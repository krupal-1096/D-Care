export type CaseFiltersState = {
  query: string;
  startDate: string;
  endDate: string;
  minAge: string;
  maxAge: string;
  verified: "all" | "verified" | "pending";
  sort: "newest" | "oldest";
};

type Props = {
  filters: CaseFiltersState;
  onChange: (next: CaseFiltersState) => void;
  onReset?: () => void;
};

export function CaseFilters({ filters, onChange, onReset }: Props) {
  const update = (patch: Partial<CaseFiltersState>) => onChange({ ...filters, ...patch });

  return (
    <div className="card compact">
      <div className="page-header">
        <div className="page-title">
          <span className="badge neutral">Filters</span>
          <span className="muted">Date, age, verification</span>
        </div>
        <div className="dual-buttons">
          {onReset && (
            <button className="button ghost" type="button" onClick={onReset}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="form-grid compact-grid">
        <div className="stack">
          <label className="label" htmlFor="query">
            Search by patient or condition
          </label>
          <input
            id="query"
            className="input dense"
            placeholder="eg. eczema, psoriasis, Aarav"
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
          />
        </div>
        <div className="stack">
          <label className="label">Registered date range</label>
          <div className="dual-buttons" style={{ padding: 0 }}>
            <input
              type="date"
              className="input dense"
              value={filters.startDate}
              onChange={(e) => update({ startDate: e.target.value })}
            />
            <input
              type="date"
              className="input dense"
              value={filters.endDate}
              onChange={(e) => update({ endDate: e.target.value })}
            />
          </div>
        </div>
        <div className="stack">
          <label className="label">Age range</label>
          <div className="dual-buttons" style={{ padding: 0 }}>
            <input
              type="number"
              className="input dense"
              placeholder="Min"
              value={filters.minAge}
              onChange={(e) => update({ minAge: e.target.value })}
            />
            <input
              type="number"
              className="input dense"
              placeholder="Max"
              value={filters.maxAge}
              onChange={(e) => update({ maxAge: e.target.value })}
            />
          </div>
        </div>
        <div className="stack">
          <label className="label" htmlFor="verified">
            Verification status
          </label>
          <select
            id="verified"
            className="dense"
            value={filters.verified}
            onChange={(e) => update({ verified: e.target.value as CaseFiltersState["verified"] })}
          >
            <option value="all">All</option>
            <option value="verified">Verified only</option>
            <option value="pending">Unverified</option>
          </select>
        </div>
        <div className="stack">
          <label className="label" htmlFor="sort">
            Sort order
          </label>
          <select
            id="sort"
            className="dense"
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as CaseFiltersState["sort"] })}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Older first</option>
          </select>
        </div>
      </div>
    </div>
  );
}
