import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientCard from "../components/PatientCard";
import { usePatientStore } from "../stores/patients";
import { useFilterStore } from "../stores/filters";
import { useAuthStore } from "../stores/auth";

export default function HomePage() {
  const navigate = useNavigate();
  const patients = usePatientStore((state) => state.patients);
  const loading = usePatientStore((state) => state.loading);
  const lastFetchedAt = usePatientStore((state) => state.lastFetchedAt);
  const error = usePatientStore((state) => state.error);
  const loadPatients = usePatientStore((state) => state.loadPatients);
  const filters = useFilterStore();
  const token = useAuthStore((s) => s.token);
  const [pageSize] = useState(15);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showRefreshPill, setShowRefreshPill] = useState(false);
  const [refreshIndicator, setRefreshIndicator] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const refreshThreshold = 70;
  const refreshPillScrollPx = 900;
  const initialLoading = loading && patients.length === 0;
  const [lastRefreshAgo, setLastRefreshAgo] = useState<string | null>(null);
  const lastRefreshTimer = useRef<number | null>(null);
  const hideIndicatorTimer = useRef<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);

  const refreshPatients = useCallback(async () => {
    if (!token) return;
    setLastRefreshAgo(null);
    setRefreshIndicator(true);
    if (hideIndicatorTimer.current) {
      window.clearTimeout(hideIndicatorTimer.current);
    }
    setRefreshing(true);
    try {
      await loadPatients(token, pageSize, { force: true });
    } finally {
      setRefreshing(false);
      hideIndicatorTimer.current = window.setTimeout(() => setRefreshIndicator(false), 3000);
    }
  }, [loadPatients, pageSize, token]);

  useEffect(() => {
    if (!token) return;
    if (!lastFetchedAt) {
      refreshPatients();
    } else {
      loadPatients(token, pageSize);
    }
  }, [lastFetchedAt, loadPatients, pageSize, refreshPatients, token]);

  useEffect(() => {
    const onScroll = () => {
      setShowRefreshPill(window.scrollY > refreshPillScrollPx && patients.length >= 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [patients.length]);

  useEffect(() => {
    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0) return;
      pullStartY.current = event.touches[0].clientY;
      setPullDistance(0);
      pullDistanceRef.current = 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      if (pullStartY.current === null) return;
      const distance = event.touches[0].clientY - pullStartY.current;
      if (distance > 0) {
        const limited = Math.min(distance, 140);
        pullDistanceRef.current = limited;
        setPullDistance(limited);
      }
    };
    const onTouchEnd = () => {
      if (pullDistanceRef.current >= refreshThreshold) {
        refreshPatients();
      }
      pullStartY.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [refreshPatients, refreshThreshold]);

  useEffect(() => {
    if (!lastFetchedAt) return;
    if (lastRefreshTimer.current) {
      window.clearInterval(lastRefreshTimer.current);
    }
    const updateAgo = () => {
      const diff = Date.now() - new Date(lastFetchedAt).getTime();
      if (diff < 60 * 1000) {
        setLastRefreshAgo("Refreshed • just now");
        return;
      }
      const mins = Math.floor(diff / 60000);
      setLastRefreshAgo(`Refreshed • ${mins} min${mins === 1 ? "" : "s"} ago`);
    };
    updateAgo();
    lastRefreshTimer.current = window.setInterval(updateAgo, 45 * 1000);
    return () => {
      if (lastRefreshTimer.current) window.clearInterval(lastRefreshTimer.current);
    };
  }, [lastFetchedAt]);

  useEffect(() => {
    return () => {
      if (hideIndicatorTimer.current) {
        window.clearTimeout(hideIndicatorTimer.current);
      }
    };
  }, []);

  const filtered = patients.filter((patient) => {
    if (!filters.appliedShowVerified && patient.verified) return false;
    if (
      filters.appliedName &&
      !patient.name.toLowerCase().includes(filters.appliedName.toLowerCase())
    ) {
      return false;
    }
    if (filters.appliedMinAge !== undefined && patient.age < filters.appliedMinAge) return false;
    if (filters.appliedMaxAge !== undefined && patient.age > filters.appliedMaxAge) return false;
    if (filters.appliedRegisteredFrom) {
      const from = new Date(filters.appliedRegisteredFrom);
      if (new Date(patient.registeredDate) < from) return false;
    }
    if (filters.appliedRegisteredTo) {
      const to = new Date(filters.appliedRegisteredTo);
      const patientDate = new Date(patient.registeredDate);
      if (patientDate > to) return false;
    }
    return true;
  });

  useEffect(() => {
    setVisibleCount((count) => Math.min(Math.max(count, 20), filtered.length || 20));
  }, [filtered.length]);

  useEffect(() => {
    const onScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
        setVisibleCount((count) => Math.min(filtered.length, count + 10));
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [filtered.length]);

  const visiblePatients = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-3">
      {(refreshIndicator || refreshing || pullDistance > 0 || showRefreshPill) && (
        <div className="fixed left-1/2 top-4 z-30 -translate-x-1/2">
          <button
            type="button"
            onClick={refreshPatients}
            disabled={refreshing}
            className="rounded-full bg-emerald-600 text-white px-4 py-2 shadow-lg border border-emerald-700 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 hover:bg-emerald-500"
          >
            {pullDistance >= refreshThreshold || refreshing ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {refreshing ? "Refreshing…" : "Release to refresh"}
              </span>
            ) : showRefreshPill ? (
              "Tap to refresh"
            ) : (
              "Pull to refresh"
            )}
          </button>
        </div>
      )}
      {lastRefreshAgo && <div className="text-center text-xs text-stone">{lastRefreshAgo}</div>}
      {error && (
        <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full border border-rose-200 bg-white px-4 py-2 shadow-card text-sm text-rose-700 flex items-center gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={refreshPatients}
            className="rounded-full border border-rose-400 px-3 py-1 text-xs font-semibold hover:border-rose-500"
          >
            Retry
          </button>
        </div>
      )}
      {initialLoading ? (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="glass-panel rounded-2xl p-4 animate-pulse space-y-3">
              <div className="h-10 bg-slate-200/60 rounded-xl" />
              <div className="h-6 bg-slate-200/60 rounded-lg" />
              <div className="h-24 bg-slate-200/60 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {visiblePatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              onClick={() => navigate(`/patients/${patient.id}`)}
            />
          ))}
        </section>
      )}
      {visiblePatients.length < filtered.length && (
        <div className="text-center text-xs text-stone">
          Showing {visiblePatients.length} of {filtered.length} patients • keep scrolling to load more
        </div>
      )}
      <div className="h-6" aria-hidden />
    </div>
  );
}
