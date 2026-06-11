import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "../api";
import toast from "react-hot-toast";
import {
  Trash2,
  UserPlus,
  ListFilter,
  Search,
  Download,
  Edit2,
  ChevronUp,
  ChevronDown,
  X,
  Save,
  Eye,
  BookOpen,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface StudentsTabProps {
  onDataChange?: () => void;
  initialFilterQuery?: string;
}

export function StudentsTab({ onDataChange, initialFilterQuery = '' }: StudentsTabProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [searchQuery, setSearchQuery] = useState(initialFilterQuery);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "student_id", direction: "asc" });
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // Pagination & Bulk Actions
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form States
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    name: "",
    email: "",
    dept_id: "",
    year: "1",
    gpa: "",
    phone: "",
    date_of_birth: "",
    status: "Active",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Deep Dive Profile State
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentsData, deptsData] = await Promise.all([
        apiRequest("/students"),
        apiRequest("/departments"),
      ]);
      setStudents(studentsData);
      setDepartments(deptsData);
    } catch (error) {
      toast.error("Failed to load students data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generateNextStudentId = () => {
    if (students.length === 0) return "S001";
    const ids = students
      .map((s) => parseInt(s.student_id.replace(/\D/g, "")))
      .filter((n) => !isNaN(n));
    const maxId = Math.max(...ids, 0);
    return `S${String(maxId + 1).padStart(3, "0")}`;
  };

  // --- Derived Data (Search, Filter, Sort) ---
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    if (filterDept !== "All")
      result = result.filter((s) => s.dept_id === filterDept);
    if (filterStatus !== "All")
      result = result.filter((s) => s.status === filterStatus);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.student_id.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (s.dept_name && s.dept_name.toLowerCase().includes(q)) ||
          (s.dept_id && s.dept_id.toLowerCase().includes(q))
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
  }, [students, searchQuery, filterDept, filterStatus, sortConfig]);

  // Pagination Math
  const totalPages = Math.ceil(filteredAndSortedStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedStudents.slice(
      startIndex,
      startIndex + itemsPerPage,
    );
  }, [filteredAndSortedStudents, currentPage, itemsPerPage]);

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
      <ChevronUp className="w-3 h-3 text-indigo-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-indigo-400" />
    );
  };

  // --- Bulk Actions ---
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedStudents.map((s) => s.student_id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id],
    );
  };

  const handleBulkDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedIds.length} students?`,
      )
    )
      return;
    setIsLoading(true);
    try {
      for (const id of selectedIds) {
        await apiRequest(`/students/${id}`, { method: "DELETE" });
      }
      toast.success(`Successfully deleted ${selectedIds.length} students!`);
      setSelectedIds([]);
      loadData();
      if (onDataChange) onDataChange();
    } catch (error) {
      toast.error("Failed to complete bulk deletion");
      loadData();
    }
  };

  const handleBulkGraduate = async () => {
    if (!window.confirm(`Mark ${selectedIds.length} students as Graduated?`))
      return;
    setIsLoading(true);
    try {
      for (const id of selectedIds) {
        const student = students.find((s) => s.student_id === id);
        if (student) {
          await apiRequest(`/students/${id}`, {
            method: "PUT",
            body: JSON.stringify({ ...student, status: "Graduated" }),
          });
        }
      }
      toast.success(`Successfully graduated ${selectedIds.length} students!`);
      setSelectedIds([]);
      loadData();
      if (onDataChange) onDataChange();
    } catch (error) {
      toast.error("Failed to complete bulk update");
      loadData();
    }
  };

  // --- Actions ---
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.student_id) errors.student_id = "ID is required";
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Invalid email format";
    if (!formData.dept_id) errors.dept_id = "Department is required";

    const gpa = parseFloat(formData.gpa);
    if (formData.gpa !== "" && (isNaN(gpa) || gpa < 0 || gpa > 10)) {
      errors.gpa = "GPA must be between 0 and 10";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (formErrors[e.target.name])
      setFormErrors({ ...formErrors, [e.target.name]: "" });
  };

  const openAddForm = () => {
    setFormData({
      student_id: generateNextStudentId(),
      name: "",
      email: "",
      dept_id: "",
      year: "1",
      gpa: "",
      phone: "",
      date_of_birth: "",
      status: "Active",
    });
    setFormErrors({});
    setIsEditing(false);
    setShowForm(true);
  };

  const openEditForm = (student: any) => {
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      dept_id: student.dept_id || "",
      year: student.year.toString(),
      gpa: student.gpa !== null ? student.gpa.toString() : "",
      phone: student.phone || "",
      date_of_birth: student.date_of_birth
        ? student.date_of_birth.split("T")[0]
        : "",
      status: student.status,
    });
    setFormErrors({});
    setIsEditing(true);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      if (isEditing) {
        await apiRequest(`/students/${formData.student_id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        toast.success("Student updated successfully!");
      } else {
        await apiRequest("/students", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        toast.success("Student added successfully!");
      }
      setShowForm(false);
      loadData();
      if (onDataChange) onDataChange();
    } catch (error: any) {
      toast.error(
        error.message || `Failed to ${isEditing ? "update" : "add"} student`,
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete student ${id}?`))
      return;
    try {
      await apiRequest(`/students/${id}`, { method: "DELETE" });
      toast.success("Student deleted successfully!");
      loadData();
      if (onDataChange) onDataChange();
    } catch (error) {
      toast.error("Failed to delete student");
    }
  };

  const openDeepDive = async (id: string) => {
    setIsProfileLoading(true);
    setSelectedProfile({ id }); // Show skeleton modal instantly
    try {
      const data = await apiRequest(`/students/${id}`);
      setSelectedProfile(data);
    } catch (error) {
      toast.error("Failed to load profile");
      setSelectedProfile(null);
    } finally {
      setIsProfileLoading(false);
    }
  };

  const exportToCSV = () => {
    if (filteredAndSortedStudents.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Student ID",
      "Name",
      "Email",
      "Department",
      "Year",
      "GPA",
      "Phone",
      "Status",
    ];
    const csvRows = [headers.join(",")];
    filteredAndSortedStudents.forEach((s) => {
      const row = [
        s.student_id,
        `"${s.name}"`,
        s.email,
        s.dept_id || "N/A",
        s.year,
        s.gpa !== null ? s.gpa : "N/A",
        s.phone || "N/A",
        s.status,
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
      `Students_Export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export downloaded successfully!");
  };

  const inputClasses =
    "w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all";
  const errorInputClasses =
    "border-rose-500/50 focus:ring-rose-500/50 focus:border-rose-500";
  const labelClasses = "block text-sm font-medium text-slate-400 mb-1.5 ml-1";

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
          >
            <option value="All">All Departments</option>
            {departments.map((d: any) => (
              <option key={d.dept_id} value={d.dept_id}>
                {d.dept_name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Graduated">Graduated</option>
          </select>
          <div className="h-8 w-px bg-slate-700/50 hidden sm:block mx-1"></div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl transition-colors border border-slate-600/50"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-xl p-3 px-6 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <span className="text-indigo-200 font-medium">
            <span className="text-white font-bold">{selectedIds.length}</span>{" "}
            students selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleBulkGraduate}
              className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-4 py-1.5 rounded-lg transition-colors border border-emerald-500/30"
            >
              <GraduationCap className="w-4 h-4" />
              Mark Graduated
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-4 py-1.5 rounded-lg transition-colors border border-rose-500/30"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          ></div>
          <div className="relative bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-slate-800/95 backdrop-blur border-b border-slate-700 p-6 flex justify-between items-center z-10">
              <h2 className="text-2xl font-semibold text-slate-100 flex items-center gap-3">
                {isEditing ? (
                  <Edit2 className="w-6 h-6 text-indigo-400" />
                ) : (
                  <UserPlus className="w-6 h-6 text-indigo-400" />
                )}
                {isEditing ? "Edit Student Record" : "Enroll New Student"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className={labelClasses}>Student ID*</label>
                  <input
                    type="text"
                    name="student_id"
                    value={formData.student_id}
                    onChange={handleInputChange}
                    disabled={isEditing}
                    placeholder="e.g. S011"
                    className={`${inputClasses} ${formErrors.student_id ? errorInputClasses : ""} ${isEditing ? "opacity-50 cursor-not-allowed" : ""}`}
                  />
                  {formErrors.student_id && (
                    <p className="text-rose-400 text-xs mt-1 ml-1">
                      {formErrors.student_id}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClasses}>Full Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className={`${inputClasses} ${formErrors.name ? errorInputClasses : ""}`}
                  />
                  {formErrors.name && (
                    <p className="text-rose-400 text-xs mt-1 ml-1">
                      {formErrors.name}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClasses}>Email Address*</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="student@university.edu"
                    className={`${inputClasses} ${formErrors.email ? errorInputClasses : ""}`}
                  />
                  {formErrors.email && (
                    <p className="text-rose-400 text-xs mt-1 ml-1">
                      {formErrors.email}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClasses}>Department*</label>
                  <select
                    name="dept_id"
                    value={formData.dept_id}
                    onChange={handleInputChange}
                    className={`${inputClasses} ${formErrors.dept_id ? errorInputClasses : ""}`}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d: any) => (
                      <option key={d.dept_id} value={d.dept_id}>
                        {d.dept_name}
                      </option>
                    ))}
                  </select>
                  {formErrors.dept_id && (
                    <p className="text-rose-400 text-xs mt-1 ml-1">
                      {formErrors.dept_id}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClasses}>Academic Year*</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    className={inputClasses}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>GPA (0.0 - 10.0)</label>
                  <input
                    type="number"
                    name="gpa"
                    value={formData.gpa}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="8.5"
                    className={`${inputClasses} ${formErrors.gpa ? errorInputClasses : ""}`}
                  />
                  {formErrors.gpa && (
                    <p className="text-rose-400 text-xs mt-1 ml-1">
                      {formErrors.gpa}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClasses}>Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 890"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Date of Birth</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses}>Enrollment Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={inputClasses}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-300 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2.5 px-8 rounded-xl transition-all shadow-lg flex items-center gap-2"
                >
                  {isEditing ? (
                    <Save className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {isEditing ? "Save Changes" : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deep Dive Profile Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setSelectedProfile(null)}
          ></div>
          <div className="relative bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition z-10"
            >
              <X className="w-6 h-6" />
            </button>

            {isProfileLoading || !selectedProfile.name ? (
              <div className="p-8 animate-pulse">
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 bg-slate-700/50 rounded-full"></div>
                  <div className="space-y-3">
                    <div className="h-8 bg-slate-700/50 rounded w-64"></div>
                    <div className="h-4 bg-slate-700/50 rounded w-40"></div>
                  </div>
                </div>
                <div className="h-6 bg-slate-700/50 rounded w-32 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-16 bg-slate-700/30 rounded w-full"></div>
                  <div className="h-16 bg-slate-700/30 rounded w-full"></div>
                </div>
              </div>
            ) : (
              <div className="p-0">
                {/* Profile Header */}
                <div className="bg-slate-800/80 p-8 border-b border-slate-700 flex flex-col sm:flex-row items-start sm:items-center gap-6 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>

                  <div className="w-24 h-24 bg-indigo-500/10 border-2 border-indigo-500/30 rounded-full flex items-center justify-center text-4xl font-bold text-indigo-300">
                    {selectedProfile.name.charAt(0)}
                  </div>

                  <div className="flex-1 z-10">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <h2 className="text-3xl font-bold text-slate-100">
                        {selectedProfile.name}
                      </h2>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                          selectedProfile.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }`}
                      >
                        {selectedProfile.status}
                      </span>
                    </div>
                    <p className="text-slate-400 flex flex-wrap items-center gap-3 text-sm">
                      <span className="font-mono bg-slate-900/50 px-2 py-0.5 rounded text-indigo-300 border border-slate-700/50">
                        {selectedProfile.student_id}
                      </span>
                      <span>{selectedProfile.email}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {selectedProfile.department?.dept_name ||
                          selectedProfile.dept_id}
                      </span>
                    </p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl text-center min-w-[120px] z-10">
                    <div className="text-sm text-slate-400 mb-1">
                      Current GPA
                    </div>
                    <div
                      className={`text-3xl font-bold ${selectedProfile.gpa >= 9 ? "text-emerald-400" : selectedProfile.gpa < 7 ? "text-rose-400" : "text-blue-400"}`}
                    >
                      {selectedProfile.gpa?.toFixed(2) || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Profile Body - Enrollments */}
                <div className="p-8">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Course Enrollments
                  </h3>

                  {!selectedProfile.enrollments ||
                  selectedProfile.enrollments.length === 0 ? (
                    <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-slate-700/30 text-slate-400">
                      No courses found for this student.
                    </div>
                  ) : (
                    <div className="grid gap-4 grid-cols-1">
                      {selectedProfile.enrollments.map((en: any) => (
                        <div
                          key={en.enrollment_id}
                          className="bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-800/80 transition-colors"
                        >
                          <div>
                            <div className="font-medium text-slate-200">
                              {en.course?.course_name || en.course_id}
                            </div>
                            <div className="text-sm font-mono text-slate-500 mt-1">
                              {en.course_id}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-6">
                            <div>
                              <div className="text-xs text-slate-400 mb-1">
                                Attendance
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-200">
                                  {en.attendance_percentage}%
                                </span>
                                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${en.attendance_percentage > 80 ? "bg-emerald-400" : en.attendance_percentage > 50 ? "bg-amber-400" : "bg-rose-400"}`}
                                    style={{
                                      width: `${Math.min(100, Math.max(0, en.attendance_percentage))}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="text-xs text-slate-400 mb-1">
                                Grade
                              </div>
                              <div className="text-lg font-bold text-white">
                                {en.grade || "-"}
                              </div>
                            </div>

                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                                en.status === "Enrolled"
                                  ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                                  : en.status === "Completed"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              }`}
                            >
                              {en.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden flex flex-col">
        <div className="p-4 sm:p-6 border-b border-slate-700/50 flex justify-between items-center bg-slate-800/20">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-indigo-400" />
            Student Directory
            <span className="text-sm font-normal text-slate-400 ml-2 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
              {isLoading ? "..." : filteredAndSortedStudents.length} records
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-slate-900/40">
              <tr>
                <th className="px-6 py-4 text-left w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === paginatedStudents.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                  />
                </th>
                {[
                  "ID",
                  "Name",
                  "Department",
                  "Year",
                  "GPA",
                  "Status",
                  "Actions",
                ].map((header) => {
                  const keyMap: Record<string, string> = {
                    ID: "student_id",
                    Name: "name",
                    Department: "dept_id",
                    Year: "year",
                    GPA: "gpa",
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
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 relative">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr
                    key={`skel-${i}`}
                    className="animate-pulse bg-slate-800/20"
                  >
                    <td className="px-6 py-5">
                      <div className="w-4 h-4 bg-slate-700/50 rounded"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-slate-700/30 rounded w-48"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 bg-slate-700/50 rounded-md w-16"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-10"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-6 bg-slate-700/50 rounded-full w-20"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-8 bg-slate-700/50 rounded-lg w-24"></div>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {paginatedStudents.map((s: any) => (
                    <tr
                      key={s.student_id}
                      className={`hover:bg-slate-700/30 transition-colors duration-150 group ${selectedIds.includes(s.student_id) ? "bg-indigo-500/5" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(s.student_id)}
                          onChange={() => toggleSelect(s.student_id)}
                          className="rounded border-slate-600 bg-slate-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                        {s.student_id}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-sm font-medium text-slate-100 cursor-pointer hover:text-indigo-400 transition-colors"
                          onClick={() => openDeepDive(s.student_id)}
                        >
                          {s.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {s.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        <span className="bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-md text-xs">
                          {s.dept_name || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        Year {s.year}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {s.gpa !== null ? (
                          <div className="flex flex-col gap-1.5">
                            <span className={`font-semibold ${s.gpa >= 9 ? "text-emerald-400" : s.gpa < 7 ? "text-rose-400" : "text-blue-400"}`}>
                              {s.gpa.toFixed(2)}
                            </span>
                            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${s.gpa >= 9 ? "bg-emerald-400" : s.gpa < 7 ? "bg-rose-400" : "bg-blue-400"}`} 
                                style={{ width: `${Math.min(100, (s.gpa / 10) * 100)}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            s.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : s.status === "Graduated"
                                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s.status === "Active" ? "bg-emerald-400" : s.status === "Graduated" ? "bg-indigo-400" : "bg-slate-400"}`}
                          ></span>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openDeepDive(s.student_id)}
                            className="text-slate-400 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-blue-500/10"
                            title="View Profile"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openEditForm(s)}
                            className="text-slate-400 hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-indigo-500/10"
                            title="Edit Student"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(s.student_id)}
                            className="text-slate-400 hover:text-rose-400 transition-colors p-2 rounded-lg hover:bg-rose-500/10"
                            title="Delete Student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {paginatedStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <Search className="w-10 h-10 mb-3 opacity-20" />
                          <p className="text-lg font-medium text-slate-400">
                            No students found
                          </p>
                          <p className="text-sm mt-1">
                            Try adjusting your search or filters.
                          </p>
                          {searchQuery && (
                            <button
                              onClick={() => setSearchQuery("")}
                              className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                            >
                              Clear search
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-700/50 bg-slate-800/20 flex items-center justify-between text-sm text-slate-400 mt-auto">
            <div>
              Showing{" "}
              <span className="font-medium text-slate-200">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-slate-200">
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredAndSortedStudents.length,
                )}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-200">
                {filteredAndSortedStudents.length}
              </span>{" "}
              results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg font-medium transition-colors ${
                      currentPage === i + 1
                        ? "bg-indigo-500 text-white border border-indigo-400"
                        : "border border-transparent hover:bg-slate-700 text-slate-300"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
