import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "../api";
import toast from "react-hot-toast";
import {
  BookPlus,
  Library,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface CoursesTabProps {
  initialFilterQuery?: string;
}

export function CoursesTab({ initialFilterQuery = '' }: CoursesTabProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(initialFilterQuery);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "course_id", direction: "asc" });

  const [formData, setFormData] = useState({
    course_id: "",
    course_name: "",
    dept_id: "",
    credits: "3",
    instructor: "",
    semester: "",
    max_capacity: "60",
    room_number: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [coursesData, deptsData] = await Promise.all([
        apiRequest("/courses"),
        apiRequest("/departments"),
      ]);
      setCourses(coursesData);
      setDepartments(deptsData);
    } catch (error) {
      toast.error("Failed to load courses data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAndSorted = useMemo(() => {
    let result = [...courses];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.course_name.toLowerCase().includes(q) ||
          c.course_id.toLowerCase().includes(q) ||
          (c.instructor && c.instructor.toLowerCase().includes(q)),
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
  }, [courses, searchQuery, sortConfig]);

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
      <ChevronUp className="w-3 h-3 text-pink-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-pink-400" />
    );
  };

  const exportToCSV = () => {
    if (filteredAndSorted.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Course ID",
      "Course Name",
      "Department",
      "Credits",
      "Instructor",
      "Semester",
      "Capacity",
    ];
    const csvRows = [headers.join(",")];
    filteredAndSorted.forEach((c) => {
      const row = [
        c.course_id,
        `"${c.course_name}"`,
        `"${c.dept_name || "N/A"}"`,
        c.credits,
        `"${c.instructor || "N/A"}"`,
        `"${c.semester || "N/A"}"`,
        c.max_capacity,
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
      `Courses_Export_${new Date().toISOString().split("T")[0]}.csv`,
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
      await apiRequest("/courses", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast.success("Course added successfully!");
      setFormData({
        course_id: "",
        course_name: "",
        dept_id: "",
        credits: "3",
        instructor: "",
        semester: "",
        max_capacity: "60",
        room_number: "",
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to add course");
    }
  };

  const inputClasses =
    "w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all";
  const labelClasses = "block text-sm font-medium text-slate-400 mb-1.5 ml-1";

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search courses or instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all"
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
        </div>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl">
        <h2 className="text-xl font-semibold mb-6 text-slate-100 flex items-center gap-2">
          <BookPlus className="w-5 h-5 text-pink-400" />
          Add New Course
        </h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <div>
            <label className={labelClasses}>Course ID*</label>
            <input
              type="text"
              name="course_id"
              value={formData.course_id}
              onChange={handleInputChange}
              required
              placeholder="CSE501"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Course Name*</label>
            <input
              type="text"
              name="course_name"
              value={formData.course_name}
              onChange={handleInputChange}
              required
              placeholder="Machine Learning"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Department*</label>
            <select
              name="dept_id"
              value={formData.dept_id}
              onChange={handleInputChange}
              required
              className={inputClasses}
            >
              <option value="">Select Department</option>
              {departments.map((d: any) => (
                <option key={d.dept_id} value={d.dept_id}>
                  {d.dept_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Credits*</label>
            <input
              type="number"
              name="credits"
              value={formData.credits}
              onChange={handleInputChange}
              min="1"
              max="6"
              required
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Instructor*</label>
            <input
              type="text"
              name="instructor"
              value={formData.instructor}
              onChange={handleInputChange}
              required
              placeholder="Professor Name"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Semester*</label>
            <input
              type="text"
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
              required
              placeholder="Fall 2024"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Max Capacity</label>
            <input
              type="number"
              name="max_capacity"
              value={formData.max_capacity}
              onChange={handleInputChange}
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Room Number</label>
            <input
              type="text"
              name="room_number"
              value={formData.room_number}
              onChange={handleInputChange}
              placeholder="A-101"
              className={inputClasses}
            />
          </div>
          <div className="md:col-span-3 flex justify-end mt-2">
            <button
              type="submit"
              className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2.5 px-6 rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] flex items-center gap-2"
            >
              <BookPlus className="w-4 h-4" />
              Add Course
            </button>
          </div>
        </form>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/20">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Library className="w-5 h-5 text-pink-400" />
            Course Catalog
            <span className="text-sm font-normal text-slate-400 ml-2 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
              {isLoading ? "..." : filteredAndSorted.length} courses
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-slate-900/40">
              <tr>
                {[
                  "Course ID",
                  "Course Name",
                  "Department",
                  "Credits",
                  "Instructor",
                  "Semester",
                  "Capacity",
                ].map((header) => {
                  const keyMap: Record<string, string> = {
                    "Course ID": "course_id",
                    "Course Name": "course_name",
                    Department: "dept_id",
                    Credits: "credits",
                    Instructor: "instructor",
                    Semester: "semester",
                    Capacity: "max_capacity",
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
                })}
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
                      <div className="h-4 bg-slate-700/50 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-40"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 bg-slate-700/50 rounded-md w-16"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-8"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-10"></div>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {filteredAndSorted.map((c: any) => (
                    <tr
                      key={c.course_id}
                      className="hover:bg-slate-700/20 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-pink-400">
                        {c.course_id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-100">
                        {c.course_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md text-xs">
                          {c.dept_name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-300">
                        {c.credits}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {c.instructor || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {c.semester || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {c.max_capacity}
                      </td>
                    </tr>
                  ))}
                  {filteredAndSorted.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-16 text-center text-slate-500"
                      >
                        <Search className="w-10 h-10 mb-3 opacity-20 mx-auto" />
                        <p className="text-lg font-medium text-slate-400">
                          No courses found
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
