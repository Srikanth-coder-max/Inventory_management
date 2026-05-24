"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type AccountUser = {
  id: string;
  name?: string | null;
  email?: string | null;
};

interface AccountMenuProps {
  user: AccountUser | null;
}

export function AccountMenu({ user }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (!user) {
    return (
      <Link
        href="/auth"
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 hover:border-white/20"
      >
        Sign In
      </Link>
    );
  }

  const displayName = user.name?.trim() || "Account";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left shadow-lg shadow-black/10 transition hover:bg-white/10 hover:border-white/20"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 text-sm font-bold text-white shadow-md shadow-brand-500/20">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-white leading-tight">{displayName}</p>
          <p className="text-xs text-[hsl(220,12%,54%)] leading-tight">
            {user.email}
          </p>
        </div>
        <svg
          className={`h-4 w-4 text-[hsl(220,12%,54%)] transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 overflow-hidden rounded-3xl border border-white/10 bg-[hsl(222,24%,10%)]/95 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="border-b border-white/10 bg-white/5 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-brand-500/20">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{displayName}</p>
                <p className="truncate text-xs text-[hsl(220,12%,54%)]">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="px-2 py-2">
            <Link
              href="/account/reservations"
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-white/8"
              onClick={() => setOpen(false)}
            >
              <span>Your reservations</span>
              <span className="text-[hsl(220,12%,54%)]">Orders</span>
            </Link>

            <Link
              href="/auth"
              className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm text-white transition hover:bg-white/8"
              onClick={() => setOpen(false)}
            >
              <span>Switch account</span>
              <span className="text-[hsl(220,12%,54%)]">Sign in</span>
            </Link>

            <button
              type="button"
              onClick={async () => {
                setOpen(false);
                await signOut({ callbackUrl: "/" });
              }}
              className="mt-2 flex w-full items-center justify-between rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-200 transition hover:bg-red-500/15 hover:text-red-100"
            >
              <span>Log out</span>
              <span className="text-red-300/70">Secure exit</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}