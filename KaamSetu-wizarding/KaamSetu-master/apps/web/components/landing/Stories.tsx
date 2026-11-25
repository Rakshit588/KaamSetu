import { Quote } from 'lucide-react';
import { WaxSeal } from '../magic/WaxSeal';

const stories = [
  {
    quote: 'I used to lose half a day finding someone reliable for a leaking tap. Now I see who is nearby, what they charge and what others say.',
    name: 'Sunita D.',
    role: 'Homeowner',
  },
  {
    quote: 'Earlier I waited at the chowk and hoped. Now the job request comes to my phone, and my rating brings me the next one.',
    name: 'Ramesh K.',
    role: 'Plumber',
  },
  {
    quote: 'When a site needs three masons by tomorrow, I do not have to call five contacts. I can see who is free and who is verified.',
    name: 'Anil V.',
    role: 'Small contractor',
  },
];

export function Stories() {
  return (
    <div id="order" className="scroll-mt-24">
      <ul className="grid gap-5 md:grid-cols-3">
        {stories.map((s, i) => (
          <li key={s.name} className={`parchment flex flex-col p-6 ${i === 1 ? 'md:-translate-y-3' : ''}`}>
            <Quote size={26} className="text-[#80633A]" />
            <p className="mt-4 flex-1 font-serif text-xl leading-relaxed">{s.quote}</p>
            <div className="mt-5 flex items-center gap-3">
              <WaxSeal size={42}>
                <span className="relative font-display text-sm font-bold">{s.name[0]}</span>
              </WaxSeal>
              <span className="text-sm">
                <span className="block font-semibold">{s.name}</span>
                <span className="text-muted">{s.role}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-muted">
        Illustrative stories written for this demo. They show the problems KaamSetu is built to solve.
      </p>
    </div>
  );
}
