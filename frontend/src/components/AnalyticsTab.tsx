import { useState, useEffect } from "react";
import { apiRequest } from "../api";
import toast from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { Trophy, Star, PieChart as PieChartIcon, TrendingUp, BarChart3 } from "lucide-react";

const COLORS = [
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
];

interface AnalyticsTabProps {
  onDrillDown?: (tabId: string, filterQuery?: string) => void;
}

export function AnalyticsTab({ onDrillDown }: AnalyticsTabProps) {
  const [stats, setStats] = useState<any>(null);

  const loadData = async () => {
    try {
      const data = await apiRequest('/statistics');
      setStats(data);
    } catch (error) {
      toast.error('Failed to load analytics data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animation-delay-200"></div>
          <div className="w-2 h-2 bg-indigo-500 rounded-full animation-delay-400"></div>
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Students */}
      <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />
        <h3 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2 relative z-10">
          <Trophy className="w-5 h-5 text-amber-400" />
          Top 5 Students by GPA
        </h3>
        <div className="space-y-4 relative z-10">
          {stats.top_students.map((s: any, i: number) => (
            <div
              key={s.student_id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : i === 1
                        ? "bg-slate-300/20 text-slate-300 border border-slate-300/30"
                        : i === 2
                          ? "bg-orange-700/20 text-orange-400 border border-orange-700/30"
                          : "bg-slate-700/50 text-slate-400"
                  }`}
                >
                  #{i + 1}
                </div>
                <div>
                  <div className="font-medium text-slate-100">{s.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {s.student_id} • Year {s.year}
                  </div>
                </div>
              </div>
              <div className="text-xl font-bold bg-gradient-to-br from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
                {s.gpa?.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Courses */}
      <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 blur-3xl rounded-full" />
        <h3 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2 relative z-10">
          <Star className="w-5 h-5 text-pink-400" />
          Most Popular Courses
        </h3>
        <div className="space-y-4 relative z-10">
          {stats.popular_courses.map((c: any, i: number) => (
            <div
              key={c.course_name}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-700/30 hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
                  <span className="text-pink-400 text-xs font-bold">
                    {i + 1}
                  </span>
                </div>
                <div className="font-medium text-slate-100">
                  {c.course_name}
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1 rounded-lg border border-slate-700/50">
                <span className="text-lg font-bold text-pink-400">
                  {c.enrolled_count}
                </span>
                <span className="text-xs text-slate-400 uppercase tracking-wider">
                  Enrolled
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Department Distribution Chart */}
      <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl lg:col-span-2">
        <h3 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-indigo-400" />
          Student Distribution per Department
        </h3>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.department_distribution}
                cx="50%"
                cy="50%"
                innerRadius={100}
                outerRadius={140}
                paddingAngle={8}
                dataKey="student_count"
                nameKey="dept_name"
                label={({ name, percent }: any) =>
                  `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                }
                labelLine={{ stroke: "#475569", strokeWidth: 1 }}
                stroke="none"
              >
                {stats.department_distribution.map(
                  (entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      style={{
                        filter: `drop-shadow(0px 0px 8px ${COLORS[index % COLORS.length]}60)`,
                        cursor: onDrillDown ? "pointer" : "default",
                        transition: "all 0.3s ease",
                      }}
                      onClick={() => {
                        if (onDrillDown) {
                          // Switch to students tab and filter by department name
                          onDrillDown("students", entry.dept_name);
                        }
                      }}
                      className="hover:opacity-80"
                    />
                  ),
                )}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  backdropFilter: "blur(8px)",
                  borderColor: "rgba(51, 65, 85, 0.5)",
                  borderRadius: "1rem",
                  color: "#f8fafc",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
                }}
                itemStyle={{ color: "#f8fafc", fontWeight: 500 }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: "20px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            Most Popular Courses
          </h2>
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.popular_courses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="course_name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    backdropFilter: "blur(8px)",
                    borderColor: "rgba(51, 65, 85, 0.5)",
                    borderRadius: "1rem",
                    color: "#f8fafc",
                  }}
                />
                <Bar dataKey="enrolled_count" fill="#6366f1" radius={[6, 6, 0, 0]}>
                  {stats.popular_courses?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            GPA Distribution (Bell Curve)
          </h2>
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.gpa_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="range" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    backdropFilter: "blur(8px)",
                    borderColor: "rgba(51, 65, 85, 0.5)",
                    borderRadius: "1rem",
                    color: "#f8fafc",
                  }}
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorGpa)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
