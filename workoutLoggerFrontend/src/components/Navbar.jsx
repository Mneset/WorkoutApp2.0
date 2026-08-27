import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
    isActive ? 'bg-clay-tint text-clay' : 'text-muted hover:text-ink'
  }`;

// Shared icon wrapper (24x24 stroke icons).
function Icon({ children, className = '' }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const icons = {
  home: (
    <>
      <path d="m3 10.5 9-7 9 7" />
      <path d="M5 9.5V20h14V9.5" />
    </>
  ),
  history: (
    <>
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  plans: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </>
  ),
};

// One bottom-bar tab (mobile).
function BottomTab({ to, end, label, glyph }) {
  return (
    <NavLink to={to} end={end} className="flex flex-1 flex-col items-center gap-0.5 py-1.5">
      {({ isActive }) => (
        <>
          <Icon className={isActive ? 'text-clay' : 'text-muted'}>{glyph}</Icon>
          <span className={`text-[10px] font-medium ${isActive ? 'text-clay' : 'text-muted'}`}>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Navbar() {
  const { user, loginWithRedirect, logout, isAuthenticated } = useAuth();

  const doLogout = () => logout({ logoutParams: { returnTo: window.location.origin } });

  const initials = (user?.nickname || user?.name || user?.email || '?')
    .trim()
    .slice(0, 2)
    .toUpperCase();

  const avatar = user?.picture ? (
    <img className="h-8 w-8 rounded-full object-cover" src={user.picture} alt={user.nickname || 'User'} />
  ) : (
    <span className="grid h-8 w-8 place-items-center rounded-full bg-clay-tint text-xs font-bold text-clay">
      {initials}
    </span>
  );

  return (
    <>
      {/* Top bar — full nav on desktop, brand + avatar on mobile */}
      <nav className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-8">
          <Link to="/" className="flex items-center gap-2.5 text-base font-[650]">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-clay text-sm font-bold text-white">W</span>
            Workout Logger
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 md:flex">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/new-session" className={linkClass}>New Session</NavLink>
            <NavLink to="/session-history" className={linkClass}>History</NavLink>
            <NavLink to="/workout-plan" className={linkClass}>Plans</NavLink>
            <div className="mx-2 h-6 w-px bg-line" />
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                {avatar}
                <button className="text-sm text-muted hover:text-ink" onClick={doLogout}>Log out</button>
              </div>
            ) : (
              <button className="text-sm text-muted hover:text-ink" onClick={() => loginWithRedirect()}>Log in</button>
            )}
          </div>

          {/* Mobile: avatar only (nav + logout live in the bottom bar) */}
          <div className="md:hidden">
            {isAuthenticated ? (
              avatar
            ) : (
              <button className="text-sm text-muted hover:text-ink" onClick={() => loginWithRedirect()}>Log in</button>
            )}
          </div>
        </div>
      </nav>

      {/* Bottom tab bar — mobile only */}
      {isAuthenticated && (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 backdrop-blur md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto flex max-w-md items-end justify-around px-2 pt-1">
            <BottomTab to="/" end label="Home" glyph={icons.home} />
            <BottomTab to="/session-history" label="History" glyph={icons.history} />

            {/* Raised center — New Session */}
            <NavLink to="/new-session" className="flex flex-1 flex-col items-center">
              {({ isActive }) => (
                <>
                  <span
                    className={`-mt-6 grid h-12 w-12 place-items-center rounded-full border-4 border-surface text-white shadow-md transition-colors ${
                      isActive ? 'bg-clay-hover' : 'bg-clay'
                    }`}
                  >
                    <Icon>{icons.plus}</Icon>
                  </span>
                  <span className={`mt-0.5 text-[10px] font-medium ${isActive ? 'text-clay' : 'text-muted'}`}>New</span>
                </>
              )}
            </NavLink>

            <BottomTab to="/workout-plan" label="Plans" glyph={icons.plans} />

            <button className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-muted" onClick={doLogout}>
              <Icon>{icons.logout}</Icon>
              <span className="text-[10px] font-medium">Log out</span>
            </button>
          </div>
        </nav>
      )}
    </>
  );
}
