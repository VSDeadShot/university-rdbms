import { useState, useEffect } from "react";
import { apiRequest } from '../api';
import { Users, Building2, BookOpen, TrendingUp } from 'lucide-react';

interface DashboardProps {
  refreshKey?: number;
}

export function Dashboard({ refreshKey = 0 }: DashboardProps) {
  const [stats, setStats] = useState({
    total_students: 0,
    total_departments: 0,
    total_courses: 0,
    average_gpa: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest('/statistics');
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [refreshKey]);

  const statCards = [
    { label: 'Total Students', value: stats.total_students, isFloat: false, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { label: 'Departments', value: stats.total_departments, isFloat: false, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { label: 'Total Courses', value: stats.total_courses, isFloat: false, icon: BookOpen, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
    { label: 'Average GPA', value: stats.average_gpa, isFloat: true, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-400"/>
        Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`relative overflow-hidden bg-slate-800/40 backdrop-blur-sm p-6 rounded-2xl border ${stat.border} hover:bg-slate-800/60 transition-colors duration-300`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
                  {isLoading ? (
                    <div className="h-9 w-16 bg-slate-700/50 rounded animate-pulse mt-1"></div>
                  ) : (
                    <h3 className={`text-3xl font-bold ${stat.color}`}>
                      {stat.value}
                    </h3>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color} ${isLoading ? 'opacity-50' : ''}`} />
                </div>
              </div>
              {/* Decorative background gradient glow */}
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full blur-2xl opacity-20 ${stat.bg.replace('/10', '')}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
}