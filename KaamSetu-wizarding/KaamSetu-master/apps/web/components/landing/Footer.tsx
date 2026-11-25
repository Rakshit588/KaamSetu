import { Logo } from '../Logo';
import { Ornament } from '../magic/Ornament';

export function Footer() {
  return (
    <footer className="border-t border-line/30 py-10">
      <div className="container-x">
        <Ornament className="mb-8" />
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div>
            <Logo />
            <p className="mt-2 font-serif text-lg text-muted">Connecting Workers. Creating Opportunities.</p>
            <p className="font-serif text-base italic text-brand">Where Every Skill Finds Its Magic.</p>
          </div>
          <p className="max-w-sm text-xs text-muted">
            Hackathon demo. Payments, ID checks and SMS OTP are simulated (demo mode). Demo city: Meerut, Uttar Pradesh.
            Wizarding World is a theme only; KaamSetu is not affiliated with any film or book franchise.
          </p>
        </div>
      </div>
    </footer>
  );
}
