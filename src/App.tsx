import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ChartSkeleton } from './components/ui/LoadingSkeletons';
import { OverviewPage } from './pages/OverviewPage';
import { ContentToolsPage } from './pages/ContentToolsPage';
import { CompetitorsPage } from './pages/CompetitorsPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * Analytics is loaded on demand because it pulls in Recharts, which is larger
 * than the rest of the app combined. Importing it eagerly would make every
 * visitor download the charting library just to read the Overview page.
 */
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((module) => ({
    default: module.AnalyticsPage,
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
          <Route path="/content-tools" element={<ContentToolsPage />} />
          <Route path="/competitors" element={<CompetitorsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
