'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BaseLayout } from '@/components/layout';
import { Container, Section } from '@/components/ui';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/connections', label: 'Connections' },
  { href: '/search', label: 'Search' },
  { href: '/audit', label: 'Audit' },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <BaseLayout>
      <Section background="gray" padding="md" border="bottom">
        <Container>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-body-sm font-semibold text-neutral-900 mr-2">
              Console
            </span>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex items-center rounded-lg border px-3 py-2 text-body-sm font-medium transition-colors',
                    active
                      ? 'bg-white text-neutral-900 border-neutral-300 shadow-subtle'
                      : 'bg-white/70 text-neutral-900/80 border-neutral-200 hover:bg-white hover:text-neutral-900'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </Container>
      </Section>

      <Section background="white" padding="lg">
        <Container>{children}</Container>
      </Section>
    </BaseLayout>
  );
}

