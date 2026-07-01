import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Dashboard } from "./components/Dashboard";
import { StudentsTab } from "./components/StudentsTab";
import { DepartmentsTab } from "./components/DepartmentsTab";
import { CoursesTab } from "./components/CoursesTab";
import { EnrollmentsTab } from "./components/EnrollmentsTab";
import { AnalyticsTab } from "./components/AnalyticsTab";
import { GlobalSearch } from "./components/GlobalSearch";
import { AuthPage } from "./components/AuthPage";
import { useAuth } from "./context/AuthContext";
import {
  GraduationCap,
  Users,
  Building2,
  BookOpen,
  BookCheck,
  PieChart,
  Search,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";

function App() {
  const { user, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.role === 'STUDENT') return 'courses';
    if (user?.role === 'INSTRUCTOR') return 'courses';
    return 'students';
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => {
    return localStorage.getItem('theme') === 'light';
  });
  const [initialFilters, setInitialFilters] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    if (isLightMode) {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLightMode]);

  // Listen for the custom event to open search
  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    document.addEventListener("open-global-search", handleOpenSearch);
    return () =>
      document.removeEventListener("open-global-search", handleOpenSearch);
  }, []);

  // Function to trigger a re-render of the Dashboard when data changes
  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const navigateToTab = (tabId: string, filterQuery?: string) => {
    setActiveTab(tabId);
    if (filterQuery) {
      setInitialFilters({ ...initialFilters, [tabId]: filterQuery });
    }
  };

  const allTabs = [
    { id: "students", label: "Students", icon: Users, roles: ['ADMIN', 'INSTRUCTOR'] },
    { id: "departments", label: "Departments", icon: Building2, roles: ['ADMIN'] },
    { id: "courses", label: "Courses", icon: BookOpen, roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
    { id: "enrollments", label: "Enrollments", icon: BookCheck, roles: ['ADMIN', 'INSTRUCTOR', 'STUDENT'] },
    { id: "analytics", label: "Analytics", icon: PieChart, roles: ['ADMIN'] },
  ];

  const tabs = allTabs.filter(tab => !user || tab.roles.includes(user.role));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30 pb-20 transition-colors duration-300">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f8fafc",
            border: "1px solid #334155",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
          },
          success: { iconTheme: { primary: "#10b981", secondary: "#1e293b" } },
          error: { iconTheme: { primary: "#f43f5e", secondary: "#1e293b" } },
        }}
      />

      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={navigateToTab}
      />

      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
              <GraduationCap className="text-indigo-400 w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight hidden sm:block">
                University Management
              </h1>
              <h1 className="text-2xl font-bold text-white tracking-tight sm:hidden">
                UniManage
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:block text-right">
              <div className="text-sm font-medium text-slate-200">
                {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {user.email.split('@')[0]}
              </div>
              <div className="text-xs text-indigo-400 font-medium">
                {user.role} Dashboard
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors group border border-transparent hover:border-rose-400/20"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-colors group border border-transparent hover:border-amber-400/20"
              title="Toggle Theme"
            >
              {isLightMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 px-4 py-2.5 rounded-xl transition-colors group"
            >
              <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              <span className="text-sm text-slate-400 hidden sm:block">Search...</span>
              <div className="hidden sm:flex items-center gap-1 opacity-60">
                <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-xs font-sans border border-slate-700">Cmd</kbd>
                <kbd className="bg-slate-900 px-1.5 py-0.5 rounded text-xs font-sans border border-slate-700">K</kbd>
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Pass refreshKey to Dashboard so it knows when to re-fetch */}
        <Dashboard refreshKey={refreshKey} />

        {/* Modern Glassmorphic Navigation with Framer Motion */}
        <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl p-2 border border-slate-700/50 shadow-2xl overflow-hidden">
          <div className="flex space-x-2 overflow-x-auto no-scrollbar relative z-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-colors duration-300 ease-out whitespace-nowrap
                    ${isActive ? "text-white" : "text-slate-400 hover:text-slate-200"}
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute inset-0 bg-indigo-500 shadow-[0_4px_20px_-4px_rgba(99,102,241,0.5)] rounded-xl -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 z-10 ${isActive ? "text-indigo-50" : "text-slate-500"}`}
                  />
                  <span className="z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Area with Framer Motion Page Transitions */}
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === "students" && (
                <StudentsTab
                  onDataChange={triggerRefresh}
                  initialFilterQuery={initialFilters["students"]}
                />
              )}
              {activeTab === "departments" && (
                <DepartmentsTab
                  initialFilterQuery={initialFilters["departments"]}
                />
              )}
              {activeTab === "courses" && (
                <CoursesTab initialFilterQuery={initialFilters["courses"]} />
              )}
              {activeTab === "enrollments" && (
                <EnrollmentsTab
                  initialFilterQuery={initialFilters["enrollments"]}
                />
              )}
              {activeTab === "analytics" && (
                <AnalyticsTab onDrillDown={navigateToTab} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default App;
