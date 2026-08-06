import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ChartSkeleton } from './components/ui/LoadingSkeletons';
import { OverviewPage } from './pages/OverviewPage';
import { TagsPage } from './pages/TagsPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * The two charting pages are loaded on demand because they pull in Recharts,
 * which is larger than the rest of the app combined. Importing either eagerly
 * would make every visitor download the charting library just to read the
 * Overview page. Vite factors the shared library into its own chunk, so opening
 * the second of these pages does not download it twice.
 */
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((module) => ({
    default: module.AnalyticsPage,
  })),
);

const CompetitorsPage = lazy(() =>
  import('./pages/CompetitorsPage').then((module) => ({
    default: module.CompetitorsPage,
  })),
);

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route
            path="/analytics"
            element={
              // The skeleton covers the download of the chart chunk, so the
              // page doesn't flash empty on a slow connection.
              <Suspense fallback={<ChartSkeleton />}>
                <AnalyticsPage />
              </Suspense>
            }
          />
          <Route path="/tags" element={<TagsPage />} />
          <Route
            path="/competitors"
            element={
              <Suspense fallback={<ChartSkeleton />}>
                <CompetitorsPage />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
