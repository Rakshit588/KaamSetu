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
          eyebrow="The Wizarding Guide"
          title="Eight steps from need to done"
          subtitle="Two pathways: one for customers, one for workers. Tap any step to explore it."
        >
          <HowItWorks />
        </Section>
        <Section
          id="trades"
          eyebrow="The Guilds"
          title="Skilled hands for every job"
          subtitle="From a leaking tap to a new wall, find a verified worker nearby."
        >
          <Trades />
        </Section>
        <Section
          id="trust"
          eyebrow="Verification, ratings, trust scores"
          title="The Ministry of Trust"
          subtitle="Verified identities, two-way ratings, transparent prices and a score that explains itself."
        >
          <Trust />
        </Section>
        <Section eyebrow="The Order" title="Built for how India really hires">
          <Stories />
        </Section>
        <Section id="faq" eyebrow="Ancient scrolls, plain answers" title="Questions, answered">
          <Faq />
        </Section>
        <Cta />
      </main>
      <Footer />
    </>
  );
}
