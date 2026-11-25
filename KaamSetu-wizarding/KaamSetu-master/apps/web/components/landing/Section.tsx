import type { ReactNode } from 'react';
import { Ornament } from '../magic/Ornament';

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
          <h2 className="mt-5 text-3xl font-semibold tracking-wide sm:text-5xl">{title}</h2>
          <Ornament className="mt-5" />
          {subtitle && <p className="mt-5 font-serif text-xl leading-relaxed text-muted sm:text-2xl">{subtitle}</p>}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}
