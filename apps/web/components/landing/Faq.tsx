'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    q: 'How are workers verified?',
    a: 'Workers confirm their phone number with an OTP and submit an ID that our team reviews. Verified workers get a badge and a higher trust score. In this demo, ID checks are simulated.',
  },
  {
    q: 'What does KaamSetu cost?',
    a: 'There is a flat 8% platform fee on completed jobs. You see it in the price breakdown before you book, so there are no surprises.',
  },
  {
    q: 'What if I need someone right now?',
    a: 'Use emergency booking. Nearby available workers are alerted and have 45 seconds to accept. The search widens from 2 km to 5 km to 10 km. If nobody accepts in 3 minutes, you can schedule the job for later.',
  },
  {
    q: 'How does payment work?',
    a: 'You pay by UPI in the app after the job is done, and the money is released to the worker when you confirm. Payments in this demo use a test provider, so no real money moves.',
  },
  {
    q: 'Which trades can I hire?',
    a: 'Masons, electricians, plumbers, carpenters, painters, construction labour, cleaners and repair technicians. More trades can be added as the network grows.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex min-h-[56px] w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold sm:px-6"
            >
              {f.q}
              <ChevronDown size={20} className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <p className="px-5 pb-5 leading-relaxed text-muted sm:px-6">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
