import { Suspense } from 'react';
import { BookForm } from '@/components/booking/BookForm';
import { Skeleton } from '@/components/ui/Skeleton';

export default function BookPage() {
  // useSearchParams() in BookForm needs a Suspense boundary for production builds.
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <BookForm />
    </Suspense>
  );
}
