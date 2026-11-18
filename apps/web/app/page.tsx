import { Cta } from '../components/landing/Cta';
import { Faq } from '../components/landing/Faq';
import { Footer } from '../components/landing/Footer';
import { Hero } from '../components/landing/Hero';
import { HowItWorks } from '../components/landing/HowItWorks';
import { Navbar } from '../components/landing/Navbar';
import { Section } from '../components/landing/Section';
import { Stats } from '../components/landing/Stats';
import { Stories } from '../components/landing/Stories';
import { Trades } from '../components/landing/Trades';
import { Trust } from '../components/landing/Trust';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Section
          id="how"
          eyebrow="How it works"
          title="Eight steps from need to done"
          subtitle="One simple flow for customers, one for workers. Tap any step to explore it."
        >
          <HowItWorks />
        </Section>
        <Section
          id="trades"
          eyebrow="Trades"
          title="Skilled hands for every job"
          subtitle="From a leaking tap to a new wall, find a verified worker nearby."
        >
          <Trades />
        </Section>
        <Section
          id="trust"
          eyebrow="Trust"
          title="Trust you can see"
          subtitle="Verification, two-way ratings and a score that explains itself."
        >
          <Trust />
        </Section>
        <Section eyebrow="Why it matters" title="Built for how India really hires">
          <Stories />
        </Section>
        <Section id="faq" eyebrow="FAQ" title="Questions, answered">
          <Faq />
        </Section>
        <Cta />
      </main>
      <Footer />
    </>
  );
}
