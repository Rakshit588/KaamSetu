import type { ReactNode } from 'react';

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 py-16 sm:py-24">
      <div className="container-x">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-5xl">{title}</h2>
          {subtitle && <p className="mt-4 text-lg leading-relaxed text-muted">{subtitle}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
