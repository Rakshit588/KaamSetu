import { Suspense } from 'react';
import { LoginFlow } from '../../components/auth/LoginFlow';

export const metadata = { title: 'Log in | KaamSetu' };

export default function LoginPage() {
  // useSearchParams() in LoginFlow needs a Suspense boundary for production builds.
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center text-muted">Loading...</div>}>
      <LoginFlow />
    </Suspense>
  );
}
