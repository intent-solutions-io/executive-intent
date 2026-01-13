import Link from 'next/link';
import { ReactNode } from 'react';
import { Container } from '@/components/ui';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  href: string;
  children: ReactNode;
  active?: boolean;
}

function NavLink({ href, children, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'text-body-sm font-medium transition-colors',
        active
          ? 'text-neutral-900'
          : 'text-neutral-600 hover:text-neutral-900'
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
  return (
    <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-sm group-hover:shadow-md transition-shadow" />
            <span className="font-bold text-display-xs text-neutral-900">
              Executive Intent
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="/" active={currentPath === '/'}>
              Home
            </NavLink>
            <NavLink href="/proof" active={currentPath === '/proof'}>
              Proof
            </NavLink>
            <NavLink href="/evidence" active={currentPath === '/evidence'}>
              Evidence
            </NavLink>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link
              href="/proof"
              className="hidden sm:inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-body-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              View Proof
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </Container>
    </nav>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 bg-neutral-50">
      <Container>
        <div className="py-12">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            {/* Brand */}
            <div className="flex flex-col gap-3">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded" />
                <span className="font-semibold text-neutral-900">Executive Intent</span>
              </Link>
              <p className="text-body-sm text-neutral-500 max-w-xs">
                Your inbox + calendar, organized for decisions. DLP-enforced. Source-linked.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-12">
              <div>
                <h4 className="text-label uppercase text-neutral-500 font-semibold mb-3">Product</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/proof" className="text-body-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                      Proof
                    </Link>
                  </li>
                  <li>
                    <Link href="/evidence" className="text-body-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                      Evidence Bundle
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-label uppercase text-neutral-500 font-semibold mb-3">Resources</h4>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://github.com/intent-solutions-io/executive-intent"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-body-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                    >
                      GitHub
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-body-xs text-neutral-500">
              &copy; {currentYear} Intent Solutions. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="text-body-xs text-neutral-400">
                Built with Next.js + Supabase + Inngest
              </span>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

interface BaseLayoutProps {
  children: ReactNode;
  currentPath?: string;
}

export function BaseLayout({ children, currentPath }: BaseLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Nav currentPath={currentPath} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
