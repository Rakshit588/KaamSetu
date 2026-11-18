import { Quote } from 'lucide-react';

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
    <div>
      <ul className="grid gap-4 md:grid-cols-3">
        {stories.map((s) => (
          <li key={s.name} className="card flex flex-col p-6">
            <Quote size={26} className="text-saffron" />
            <p className="mt-4 flex-1 leading-relaxed">{s.quote}</p>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-saffron to-flame text-sm font-bold text-[#2a1600]">
                {s.name[0]}
              </span>
              <span className="text-sm">
                <span className="block font-semibold">{s.name}</span>
                <span className="text-muted">{s.role}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-center text-xs text-muted">
        Illustrative stories written for this demo. They show the problems KaamSetu is built to solve.
      </p>
    </div>
  );
}
