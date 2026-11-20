import { Suspense } from 'react';
import { SearchView } from '@/components/search/SearchView';
import { Skeleton } from '@/components/ui/Skeleton';

export default function SearchPage() {
  // useSearchParams() in SearchView needs a Suspense boundary for production builds.
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <SearchView />
    </Suspense>
  );
}
