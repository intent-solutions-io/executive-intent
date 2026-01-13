'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { Container } from '@/components/ui';
import { cn } from '@/lib/utils';
import { formatTimestamp } from '@/lib/evidence/format';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}

function NavLink({ href, children, active, onClick }: NavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'text-body-sm font-medium transition-colors',
        active
          ? 'text-neutral-900'
          : 'text-neutral-700 hover:text-neutral-900'
      )}
    >
      {children}
    </Link>
  );
}

interface NavProps {
  currentPath?: string;
}

export function Nav({ currentPath = '/' }: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/proof', label: 'Proof' },
    { href: '/evidence', label: 'Evidence' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200/80 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-sm ring-1 ring-primary-500/25 group-hover:shadow-md transition-shadow" />
            <span className="font-semibold text-display-xs text-neutral-900 tracking-tight">
              Executive Intent
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(({ href, label }) => (
              <NavLink key={href} href={href} active={currentPath === href}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* Right side: CTA + Hamburger */}
          <div className="flex items-center gap-4">
            {/* Desktop CTA */}
            <Link
              href="/proof"
              className="hidden sm:inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-body-sm font-medium hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              View Proof
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 bg-white">
          <Container>
            <div className="py-4 space-y-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-3 rounded-lg text-body-md font-medium transition-colors',
                    currentPath === href
                      ? 'bg-neutral-100 text-neutral-900'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  )}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-3 mt-3 border-t border-neutral-200">
                <Link
                  href="/proof"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center bg-neutral-900 text-white px-4 py-3 rounded-lg text-body-md font-medium hover:bg-neutral-800 transition-colors"
                >
                  View Proof →
                </Link>
              </div>
            </div>
          </Container>
        </div>
      )}
    </nav>
  );
}

interface FooterProps {
  evidenceGeneratedAt?: string;
}

export function Footer({ evidenceGeneratedAt }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-white/60">
      <Container>
        <div className="py-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg ring-1 ring-primary-500/25" />
                <span className="font-semibold text-neutral-900 tracking-tight">Executive Intent</span>
              </Link>
              <p className="text-body-sm text-neutral-600 max-w-sm">
                Proof-first pipeline from Gmail/Calendar → DLP → Vector store → Retrieval.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-body-sm">
              <Link href="/proof" className="text-neutral-700 hover:text-neutral-900 transition-colors">
                Proof
              </Link>
              <Link href="/evidence" className="text-neutral-700 hover:text-neutral-900 transition-colors">
                Evidence
              </Link>
              <a
                href="https://github.com/intent-solutions-io/executive-intent"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-700 hover:text-neutral-900 transition-colors"
              >
                Repository
              </a>
              {evidenceGeneratedAt ? (
                <span className="text-neutral-700">
                  Evidence:{' '}
                  <span className="font-mono text-neutral-900">
                    {formatTimestamp(evidenceGeneratedAt)}
                  </span>
                </span>
              ) : (
                <span className="text-neutral-700">Evidence: —</span>
              )}
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-body-xs text-neutral-700">
              &copy; {currentYear} Intent Solutions. All rights reserved.
            </p>
            <span className="text-body-xs text-neutral-700">
              Next.js • Supabase • Inngest
            </span>
          </div>
        </div>
      </Container>
    </footer>
  );
}

interface BaseLayoutProps {
  children: ReactNode;
  currentPath?: string;
  evidenceGeneratedAt?: string;
}

export function BaseLayout({ children, currentPath, evidenceGeneratedAt }: BaseLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav currentPath={currentPath} />
      <main className="flex-1">{children}</main>
      <Footer evidenceGeneratedAt={evidenceGeneratedAt} />
    </div>
  );
}
