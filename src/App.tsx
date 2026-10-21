import { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { TabNavigation } from './components/layout/TabNavigation';
import { TodayCockpit } from './components/cockpit/TodayCockpit';
import { RoadmapView } from './components/roadmap/RoadmapView';
import { LogTable } from './components/logs/LogTable';
import { CapstoneSection } from './components/capstone/CapstoneSection';
import { RubricTable } from './components/capstone/RubricTable';
import { ToastProvider } from './components/ui/Toast';
import { AppProvider } from './context/AppContext';
import type { TabId } from './types';

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const hash = window.location.hash.replace('#', '') as TabId;
    if (['cockpit', 'roadmap', 'logs', 'capstones'].includes(hash)) {
      return hash;
    }
    return 'cockpit';
  });

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as TabId;
      if (['cockpit', 'roadmap', 'logs', 'capstones'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-ink-950 text-slate-100 flex flex-col font-sans selection:bg-tech-500/30 selection:text-white">
      {/* Navbar with stats, streak, install button */}
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'cockpit' && <TodayCockpit onNavigateTab={handleTabChange} />}
        {activeTab === 'roadmap' && <RoadmapView onNavigateTab={handleTabChange} />}
        {activeTab === 'logs' && <LogTable />}
        {activeTab === 'capstones' && (
          <div className="space-y-12 animate-fade-in pb-16">
            <CapstoneSection />
            <RubricTable />
          </div>
        )}
      </main>

      {/* Mobile Tab Navigation */}
      <TabNavigation active={activeTab} onChange={handleTabChange} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  );
}
