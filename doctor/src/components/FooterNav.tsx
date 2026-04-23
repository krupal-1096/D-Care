import { NavLink } from "react-router-dom";

const linkBase =
  "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition";

function HomeIcon({ active }: { active: boolean }) {
  const tone = active ? "text-brand-700" : "text-stone";
  return (
    <svg
      className={`h-5 w-5 ${tone}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3.5 9.5 12 3l8.5 6.5" />
      <path d="M6.5 11.5v7a1 1 0 0 0 1 1H16a1 1 0 0 0 1-1v-7" />
      <path d="M10 18h4" />
    </svg>
  );
}

function VerifiedIcon({ active }: { active: boolean }) {
  const tone = active ? "text-brand-700" : "text-stone";
  return (
    <svg
      className={`h-5 w-5 ${tone}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 10.5 11 14.5 17 8.5" />
      <path d="M12 3.5c-2.5 0-3.4 1.3-4.8 1.7S4 5.8 4 7.9c0 1.6.4 2.5-.3 4.2S3 15.5 4.2 16.8 6 19.6 7.1 20s1.5 1.3 3.1.5 2.2-.5 3.8 0 3 .7 3.9-.6 2.1-2.7 2.5-3.8 1.3-1.3.7-2.9-.4-2.7-.4-4.3-1.2-2.6-2.8-3.1-2.3-2-4.9-2Z" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const tone = active ? "text-brand-700" : "text-stone";
  return (
    <svg
      className={`h-5 w-5 ${tone}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M5 19c1.3-2.2 3.7-3.5 7-3.5S17.7 16.8 19 19" />
    </svg>
  );
}

export default function FooterNav() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.04)]">
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "text-brand-700" : "text-stone"}`
          }
        >
          {({ isActive }) => (
            <>
              <HomeIcon active={isActive} />
              Home
            </>
          )}
        </NavLink>
        <NavLink
          to="/verified"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "text-brand-700" : "text-stone"}`
          }
        >
          {({ isActive }) => (
            <>
              <VerifiedIcon active={isActive} />
              Verified
            </>
          )}
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `${linkBase} ${isActive ? "text-brand-700" : "text-stone"}`
          }
        >
          {({ isActive }) => (
            <>
              <ProfileIcon active={isActive} />
              Profile
            </>
          )}
        </NavLink>
      </div>
    </footer>
  );
}
