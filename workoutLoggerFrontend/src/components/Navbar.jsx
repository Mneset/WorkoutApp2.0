import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkClass = ({ isActive }) =>
  `px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
    isActive ? 'bg-clay-tint text-clay' : 'text-muted hover:text-ink'
  }`;

export default function Navbar() {
  const { user, loginWithRedirect, logout, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const initials = (user?.nickname || user?.name || user?.email || '?')
    .trim()
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 md:px-8">
        <Link to="/" onClick={close} className="flex items-center gap-2.5 text-base font-[650]">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-clay text-sm font-bold text-white">W</span>
          Workout Logger
        </Link>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg hover:bg-surface-2 md:hidden"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="block h-0.5 w-4.5 bg-ink shadow-[0_-6px_0_var(--color-ink),0_6px_0_var(--color-ink)]" />
        </button>

        <div
          className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-16 flex-col gap-2 border-b border-line bg-surface p-3 shadow-md md:static md:flex md:flex-row md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none`}
        >
          <div className="flex flex-col gap-1 md:flex-row md:items-center">
            <NavLink to="/" end className={linkClass} onClick={close}>Home</NavLink>
            <NavLink to="/new-session" className={linkClass} onClick={close}>New Workout</NavLink>
            <NavLink to="/session-history" className={linkClass} onClick={close}>History</NavLink>
            <NavLink to="/workout-plan" className={linkClass} onClick={close}>Plans</NavLink>
          </div>

          <div className="mx-2 hidden h-6 w-px bg-line md:block" />

          <div className="flex items-center justify-between gap-2.5 md:justify-start">
            {isAuthenticated ? (
              <>
                {user?.picture ? (
                  <img className="h-8 w-8 rounded-full object-cover" src={user.picture} alt={user.nickname || 'User'} />
                ) : (
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-clay-tint text-xs font-bold text-clay">{initials}</span>
                )}
                <button className="text-sm text-muted hover:text-ink" onClick={() => logout({ returnTo: window.location.origin })}>
                  Log out
                </button>
              </>
            ) : (
              <button className="text-sm text-muted hover:text-ink" onClick={() => loginWithRedirect()}>
                Log in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
