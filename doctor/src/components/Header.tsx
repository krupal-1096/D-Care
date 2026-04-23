import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "../stores/auth";
import { useFilterStore } from "../stores/filters";

type HeaderProps = {
  title: string;
};

export default function Header({ title }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const filterStore = useFilterStore();
  const [hintIndex, setHintIndex] = useState(0);
  const hints = useMemo(
    () => ["Search by name", "Try a date range", "Filter verified only", "Search by partial name"],
    []
  );
  const initials = useMemo(() => {
    const source = user?.email || user?.id || "DR";
    return source
      .split("@")[0]
      .split(/[\s._-]/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const handleMinAgeChange = (raw: string) => {
    if (raw === "") {
      filterStore.setAgeRange(undefined, filterStore.maxAge);
      return;
    }
    const num = Math.max(0, Number(raw));
    if (Number.isNaN(num)) return;
    filterStore.setAgeRange(num, filterStore.maxAge);
  };

  const handleMaxAgeChange = (raw: string) => {
    if (raw === "") {
      filterStore.setAgeRange(filterStore.minAge, undefined);
      return;
    }
    const num = Math.max(0, Number(raw));
    if (Number.isNaN(num)) return;
    filterStore.setAgeRange(filterStore.minAge, num);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHintIndex((idx) => (idx + 1) % hints.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [hints.length]);

  const activeFilters = useMemo(() => {
    const chips: string[] = [];
    if (filterStore.appliedName) chips.push(`Name: ${filterStore.appliedName}`);
    if (filterStore.appliedMinAge !== undefined || filterStore.appliedMaxAge !== undefined) {
      const min = filterStore.appliedMinAge ?? "0";
      const max = filterStore.appliedMaxAge ?? "∞";
      chips.push(`Age ${min}–${max}`);
    }
    if (filterStore.appliedRegisteredFrom || filterStore.appliedRegisteredTo) {
      const from = filterStore.appliedRegisteredFrom ?? "start";
      const to = filterStore.appliedRegisteredTo ?? "now";
      chips.push(`Registered ${from} → ${to}`);
    }
    if (!filterStore.appliedShowVerified) chips.push("Pending only");
    return chips;
  }, [
    filterStore.appliedMaxAge,
    filterStore.appliedMinAge,
    filterStore.appliedName,
    filterStore.appliedRegisteredFrom,
    filterStore.appliedRegisteredTo,
    filterStore.appliedShowVerified
  ]);

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <>
      <header className="w-full sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.2em] text-stone">Doctor Panel</span>
              <h1 className="text-xl sm:text-2xl font-semibold font-display text-ink">
                {searchOpen ? "Search" : title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {!searchOpen ? (
                <button
                  type="button"
                  aria-expanded={searchOpen}
                  onClick={() => setSearchOpen(true)}
                  className="btn btn-ghost h-10 w-10 p-0"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 text-ink"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="6" />
                    <path d="m16 16 4 4" />
                  </svg>
                </button>
                ) : (
                  <button
                    type="button"
                    aria-expanded={searchOpen}
                    onClick={() => setSearchOpen(false)}
                    className="h-9 w-9 p-0 rounded-full border border-rose-300 text-rose-600 shadow-sm flex items-center justify-center"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
              {user && (
                <div className="relative">
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpen((prev) => !prev)}
                    className="glass-panel grid grid-cols-[auto,1fr] items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl hover:-translate-y-[1px] transition"
                  >
                    <div className="h-9 w-9 rounded-full bg-brand-500 text-white grid place-items-center font-semibold">
                      {initials}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-semibold leading-tight text-ink">{user?.name || user?.email || "Doctor"}</p>
                      <span className="text-xs text-stone">Tap for details</span>
                    </div>
                  </button>
                  <div
                    className={`absolute right-0 mt-2 w-56 rounded-2xl p-3 origin-top-right transition duration-200 shadow-card border border-slate-200 bg-white ${
                      open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    <p className="text-sm font-semibold text-ink">{user.email || "Doctor"}</p>
                    <p className="text-xs text-stone mb-2">{user.name || "Doctor access"}</p>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowLogoutConfirm(true);
                        }}
                        className="w-full btn btn-primary text-sm justify-center"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone">
              <span className="uppercase tracking-[0.18em] text-[11px] text-slate-500">Filters</span>
              {activeFilters.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-ink shadow-sm"
                >
                  {chip}
                </span>
              ))}
              <button
                type="button"
                onClick={() => filterStore.reset()}
                className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1 text-rose-600 font-semibold hover:border-rose-400 bg-white"
              >
                Clear
              </button>
            </div>
          )}
          <div
            className={`overflow-hidden transition-[max-height,opacity] duration-300 ${
              searchOpen ? "max-h-[360px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
            }`}
          >
            <div className="glass-panel rounded-2xl p-3 grid gap-3 shadow-card">
              <div className="flex flex-wrap items-center gap-3 w-full">
                <input
                  type="search"
                  value={filterStore.name}
                  onChange={(event) => filterStore.setName(event.target.value)}
                  placeholder={hints[hintIndex]}
                  className="flex-1 min-w-[200px] max-w-[320px] rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone">Age:</span>
                  <label className="inline-flex items-center gap-2">
                    <span className="text-xs text-stone">Min</span>
                    <input
                      type="number"
                      min={0}
                      value={filterStore.minAge ?? ""}
                      onChange={(event) => handleMinAgeChange(event.target.value)}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white"
                    />
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <span className="text-xs text-stone">Max</span>
                    <input
                      type="number"
                      min={0}
                      value={filterStore.maxAge ?? ""}
                      onChange={(event) => handleMaxAgeChange(event.target.value)}
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white"
                    />
                  </label>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full">
                <label className="inline-flex items-center gap-2">
                  <span>Reg. from</span>
                  <input
                    type="date"
                    value={filterStore.registeredFrom || ""}
                    onChange={(event) =>
                      filterStore.setRegisteredRange(event.target.value || undefined, filterStore.registeredTo)
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white"
                  />
                </label>
                <label className="inline-flex items-center gap-2">
                  <span>to</span>
                  <input
                    type="date"
                    value={filterStore.registeredTo || ""}
                    onChange={(event) =>
                      filterStore.setRegisteredRange(filterStore.registeredFrom, event.target.value || undefined)
                    }
                    className="rounded-lg border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white"
                  />
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={filterStore.showVerified}
                    onChange={(event) => filterStore.setShowVerified(event.target.checked)}
                    className="accent-brand-600 h-4 w-4"
                  />
                  Show verified
                </label>
              </div>
              <div className="flex items-center gap-4 w-full pt-1">
                <button
                  type="button"
                  onClick={() => filterStore.reset()}
                  className="px-3 py-2 rounded-xl border border-rose-300 text-sm font-semibold text-rose-700 hover:border-rose-400 bg-white"
                >
                  Reset
                </button>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      filterStore.apply();
                      setSearchOpen(false);
                    }}
                    className="rounded-full border border-emerald-200 bg-emerald-500 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-400 shadow-sm"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {showLogoutConfirm &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
            <div className="modal-card glass-panel p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-ink">Confirm logout</h3>
              <p className="text-sm text-stone">Are you sure you want to sign out?</p>
              <div className="flex gap-2 justify-end">
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    logout();
                    setOpen(false);
                    setShowLogoutConfirm(false);
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
