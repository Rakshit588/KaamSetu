import { Logo } from '../Logo';

export function Footer() {
  return (
    <footer className="border-t border-line/10 py-10">
      <div className="container-x flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <div>
          <Logo />
          <p className="mt-2 text-sm text-muted">Connecting Workers. Creating Opportunities.</p>
        </div>
        <p className="max-w-sm text-xs text-muted">
          Hackathon demo. Payments, ID checks and SMS OTP are simulated (demo mode). Demo city: Meerut, Uttar Pradesh.
        </p>
      </div>
    </footer>
  );
}
