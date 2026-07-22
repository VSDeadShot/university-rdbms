import { useState, useEffect, useRef } from "react";
import { Search, X, Users, BookOpen, Building2 } from "lucide-react";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, query: string) => void;
}

export function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle Cmd+K / Ctrl+K globally, and local navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : document.dispatchEvent(new CustomEvent('open-global-search'));
        return;
      }
      
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selected = results[selectedIndex];
          if (selected) {
            onNavigate(selected.tab, query);
            onClose();
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results, selectedIndex, query, onNavigate]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const activeElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results]);

  // Debounced Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // GET /api/students is Admin/Instructor-only server-side; a Student
        // token would get a 403 here, so skip that category entirely for them
        // rather than letting it fail the whole search.
        const canSearchStudents = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';

        const [studentsResult, coursesResult, departmentsResult] = await Promise.allSettled([
          canSearchStudents ? apiRequest('/students') : Promise.resolve([]),
          apiRequest('/courses'),
          apiRequest('/departments')
        ]);

        const q = query.toLowerCase();
        const searchResults: any[] = [];

        if (studentsResult.status === 'fulfilled') {
          studentsResult.value.forEach((s: any) => {
            if (s.name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q)) {
              searchResults.push({ type: 'student', title: s.name, subtitle: s.student_id, icon: Users, tab: 'students' });
            }
          });
        }

        if (coursesResult.status === 'fulfilled') {
          coursesResult.value.forEach((c: any) => {
            if (c.course_name.toLowerCase().includes(q) || c.course_id.toLowerCase().includes(q)) {
              searchResults.push({ type: 'course', title: c.course_name, subtitle: c.course_id, icon: BookOpen, tab: 'courses' });
            }
          });
        }

        if (departmentsResult.status === 'fulfilled') {
          departmentsResult.value.forEach((d: any) => {
            if (d.dept_name.toLowerCase().includes(q) || d.dept_id.toLowerCase().includes(q)) {
              searchResults.push({ type: 'department', title: d.dept_name, subtitle: `Head: ${d.head_of_dept || 'N/A'}`, icon: Building2, tab: 'departments' });
            }
          });
        }

        setResults(searchResults.slice(0, 10));
        setSelectedIndex(0); // Reset selection on new results
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-slate-800 border border-slate-700/50 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Input Area */}
        <div className="flex items-center px-4 border-b border-slate-700/50">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none text-slate-100 placeholder-slate-500 py-5 px-4 focus:outline-none focus:ring-0 text-lg"
            placeholder="Search students, courses, departments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2" ref={resultsRef}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, i) => {
                const Icon = result.icon;
                const isSelected = selectedIndex === i;
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setSelectedIndex(i)}
                    onClick={() => {
                      onNavigate(result.tab, query);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors group text-left ${
                      isSelected ? 'bg-slate-700' : 'hover:bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        result.type === 'student' ? 'bg-blue-500/10 text-blue-400' :
                        result.type === 'course' ? 'bg-pink-500/10 text-pink-400' :
                        'bg-purple-500/10 text-purple-400'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className={`font-medium transition-colors ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                          {result.title}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>
                          {result.subtitle}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded transition-opacity uppercase tracking-wider ${
                      isSelected ? 'bg-slate-900 text-slate-300 opacity-100' : 'bg-slate-900 text-slate-400 opacity-0 group-hover:opacity-100'
                    }`}>
                      Enter to jump
                    </span>
                  </button>
                );
              })}
            </div>
          ) : query ? (
            <div className="text-center py-12 text-slate-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-slate-500">
              <span className="inline-block px-2 py-1 rounded bg-slate-900 border border-slate-700 mr-2 shadow-inner">Type</span> 
              to start searching your entire university database.
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1.5 rounded border border-slate-700 font-sans">↑</kbd><kbd className="bg-slate-800 px-1.5 rounded border border-slate-700 font-sans">↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1.5 rounded border border-slate-700 font-sans">↵</kbd> to select</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="bg-slate-800 px-1.5 rounded border border-slate-700 font-sans">ESC</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}