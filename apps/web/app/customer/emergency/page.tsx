import { Suspense } from 'react';
import { EmergencyForm } from '@/components/booking/EmergencyForm';
import { Skeleton } from '@/components/ui/Skeleton';

export default function EmergencyPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <EmergencyForm />
    </Suspense>
  );
}
