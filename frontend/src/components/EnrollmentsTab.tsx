import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "../api";
import { useAuth } from "../context/AuthContext";
import { generateStudentTranscript } from "../utils/pdfGenerator";
import toast from "react-hot-toast";
import {
  BookCheck,
  UserCheck,
  ClipboardList,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  FileText,
} from "lucide-react";

interface EnrollmentsTabProps {
  initialFilterQuery?: string;
}

export function EnrollmentsTab({ initialFilterQuery = '' }: EnrollmentsTabProps) {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState(initialFilterQuery);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "enrollment_date", direction: "desc" });

  const [formData, setFormData] = useState({
    student_id: "",
    course_id: "",
    grade: "",
    attendance_percentage: "0",
    status: "Enrolled",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("/enrollments");
      setEnrollments(data);
    } catch (error) {
      toast.error("Failed to load enrollments data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...enrollments];
    
    // RBAC filtering
    if (user?.role === 'STUDENT') {
      result = result.filter(e => e.student_id === user.student_id);
    } else if (user?.role === 'INSTRUCTOR') {
      result = result.filter(e => e.instructor === user.instructor_name);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.student_name.toLowerCase().includes(q) ||
          e.course_name.toLowerCase().includes(q) ||
          e.student_id.toLowerCase().includes(q) ||
          e.course_id.toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [enrollments, searchQuery, sortConfig]);

  const requestSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnName: string) => {
    if (sortConfig.key !== columnName)
      return <ChevronUp className="w-3 h-3 opacity-0 group-hover:opacity-30" />;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-3 h-3 text-amber-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-amber-400" />
    );
  };

  const exportToCSV = () => {
    if (filteredAndSorted.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Student ID",
      "Student Name",
      "Course ID",
      "Course Name",
      "Grade",
      "Attendance %",
      "Status",
    ];
    const csvRows = [headers.join(",")];
    filteredAndSorted.forEach((e) => {
      const row = [
        e.student_id,
        `"${e.student_name}"`,
        e.course_id,
        `"${e.course_name}"`,
        `"${e.grade || ""}"`,
        e.attendance_percentage,
        e.status,
      ];
      csvRows.push(row.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `Enrollments_Export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export downloaded successfully!");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/enrollments", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast.success("Enrollment added successfully!");
      setFormData({
        student_id: "",
        course_id: "",
        grade: "",
        attendance_percentage: "0",
        status: "Enrolled",
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add enrollment");
    }
  };

  const inputClasses =
    "w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all";
  const labelClasses = "block text-sm font-medium text-slate-400 mb-1.5 ml-1";

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students or courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl transition-colors border border-slate-600/50 w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          
          {user?.role === 'STUDENT' && user.student_id && (
            <button
              onClick={async () => {
                const toastId = toast.loading("Generating transcript...");
                try {
                  const studentProfile = await apiRequest(`/students/${user.student_id}`);
                  generateStudentTranscript(studentProfile);
                  toast.success("Transcript downloaded!", { id: toastId });
                } catch (e) {
                  toast.error("Failed to generate transcript", { id: toastId });
                }
              }}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl transition-colors border border-indigo-500 w-full sm:w-auto justify-center shadow-lg shadow-indigo-500/20"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Download Transcript</span>
            </button>
          )}
        </div>
      </div>

      {user?.role !== 'STUDENT' && (
        <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-amber-400" />
          Enroll Student in Course
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <div>
            <label className={labelClasses}>Student ID*</label>
            <input
              type="text"
              name="student_id"
              value={formData.student_id}
              onChange={handleInputChange}
              required
              placeholder="S001"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Course ID*</label>
            <input
              type="text"
              name="course_id"
              value={formData.course_id}
              onChange={handleInputChange}
              required
              placeholder="CSE101"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Grade</label>
            <input
              type="text"
              name="grade"
              value={formData.grade}
              onChange={handleInputChange}
              placeholder="A+"
              maxLength={2}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Attendance %</label>
            <input
              type="number"
              name="attendance_percentage"
              value={formData.attendance_percentage}
              onChange={handleInputChange}
              step="0.01"
              min="0"
              max="100"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={inputClasses}
            >
              <option value="Enrolled">Enrolled</option>
              <option value="Completed">Completed</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>
          <div className="md:col-span-3 flex justify-end mt-2">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center gap-2"
            >
              <BookCheck className="w-4 h-4" />
              Add Enrollment
            </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/20">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-400" />
            Enrollment Records
            <span className="text-sm font-normal text-slate-400 ml-2 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
              {isLoading ? "..." : filteredAndSorted.length} records
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-slate-900/40">
              <tr>
                {["Student", "Course", "Grade", "Attendance", "Status"].map(
                  (header) => {
                    const keyMap: Record<string, string> = {
                      Student: "student_name",
                      Course: "course_name",
                      Grade: "grade",
                      Attendance: "attendance_percentage",
                      Status: "status",
                    };
                    const sortKey = keyMap[header];
                    return (
                      <th
                        key={header}
                        onClick={() => (sortKey ? requestSort(sortKey) : null)}
                        className={`px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${sortKey ? "cursor-pointer hover:text-slate-200 hover:bg-slate-800/50 transition-colors group select-none" : ""}`}
                      >
                        <div className="flex items-center gap-1">
                          {header}
                          {sortKey && getSortIcon(sortKey)}
                        </div>
                      </th>
                    );
                  },
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr
                    key={`skel-${i}`}
                    className="animate-pulse bg-slate-800/20"
                  >
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-slate-700/30 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-40 mb-2"></div>
                      <div className="h-3 bg-slate-700/30 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 bg-slate-700/50 rounded w-8"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="h-4 bg-slate-700/50 rounded w-8"></div>
                        <div className="w-16 h-1.5 bg-slate-700/50 rounded-full"></div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 bg-slate-700/50 rounded-full w-20"></div>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {filteredAndSorted.map((e: any) => (
                    <tr
                      key={`${e.student_id}-${e.course_id}`}
                      className="hover:bg-slate-700/20 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-100">
                          {e.student_name}
                        </div>
                        <div className="text-xs font-mono text-slate-500 mt-0.5">
                          {e.student_id}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-200">
                          {e.course_name}
                        </div>
                        <div className="text-xs font-mono text-amber-400/70 mt-0.5">
                          {e.course_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white">
                        {e.grade || (
                          <span className="text-slate-500 font-normal">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 w-8">
                            {e.attendance_percentage}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${e.attendance_percentage > 80 ? "bg-emerald-400" : e.attendance_percentage > 50 ? "bg-amber-400" : "bg-rose-400"}`}
                              style={{
                                width: `${Math.min(100, Math.max(0, e.attendance_percentage))}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            e.status === "Enrolled"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                              : e.status === "Completed"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredAndSorted.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center text-slate-500"
                      >
                        <Search className="w-10 h-10 mb-3 opacity-20 mx-auto" />
                        <p className="text-lg font-medium text-slate-400">
                          No enrollments found
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
