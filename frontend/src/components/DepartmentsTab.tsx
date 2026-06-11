import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "../api";
import toast from "react-hot-toast";
import {
  Building2,
  Layers,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface DepartmentsTabProps {
  initialFilterQuery?: string;
}

export function DepartmentsTab({ initialFilterQuery = '' }: DepartmentsTabProps) {
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [searchQuery, setSearchQuery] = useState(initialFilterQuery);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "dept_name", direction: "asc" });

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest("/departments");
      setDepartments(data);
    } catch (error) {
      toast.error("Failed to load departments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  // --- Derived Data (Search & Sort) ---
  const filteredAndSorted = useMemo(() => {
    let result = [...departments];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.dept_name.toLowerCase().includes(q) ||
          d.dept_id.toLowerCase().includes(q) ||
          (d.head_of_dept && d.head_of_dept.toLowerCase().includes(q)),
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
  }, [departments, searchQuery, sortConfig]);

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
      <ChevronUp className="w-3 h-3 text-purple-400" />
    ) : (
      <ChevronDown className="w-3 h-3 text-purple-400" />
    );
  };

  const exportToCSV = () => {
    if (filteredAndSorted.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = [
      "Dept ID",
      "Department Name",
      "Head of Dept",
      "Building",
      "Budget",
      "Established Year",
    ];
    const csvRows = [headers.join(",")];
    filteredAndSorted.forEach((d) => {
      const row = [
        d.dept_id,
        `"${d.dept_name}"`,
        `"${d.head_of_dept || "N/A"}"`,
        `"${d.building || "N/A"}"`,
        d.budget || 0,
        d.established_year || "N/A",
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
      `Departments_Export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export downloaded successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search departments or heads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
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

      <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50 bg-slate-800/20 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            Departments Directory
            <span className="text-sm font-normal text-slate-400 ml-2 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
              {isLoading ? "..." : filteredAndSorted.length} units
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-700/50">
            <thead className="bg-slate-900/40">
              <tr>
                {[
                  "ID",
                  "Department Name",
                  "Head of Dept",
                  "Building",
                  "Budget",
                  "Established",
                ].map((header) => {
                  const keyMap: Record<string, string> = {
                    ID: "dept_id",
                    "Department Name": "dept_name",
                    "Head of Dept": "head_of_dept",
                    Building: "building",
                    Budget: "budget",
                    Established: "established_year",
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
                [...Array(4)].map((_, i) => (
                  <tr
                    key={`skel-${i}`}
                    className="animate-pulse bg-slate-800/20"
                  >
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-5 bg-slate-700/50 rounded w-40"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="h-4 bg-slate-700/50 rounded w-12"></div>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {filteredAndSorted.map((d: any) => (
                    <tr
                      key={d.dept_id}
                      className="hover:bg-slate-700/20 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-purple-400">
                        {d.dept_id}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-100">
                        {d.dept_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {d.head_of_dept ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                              {d.head_of_dept.charAt(0)}
                            </div>
                            {d.head_of_dept}
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 opacity-50" />
                        {d.building || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-emerald-400 font-mono">
                        ₹{(d.budget || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {d.established_year || "N/A"}
                      </td>
                    </tr>
                  ))}
                  {filteredAndSorted.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-16 text-center text-slate-500"
                      >
                        <Search className="w-10 h-10 mb-3 opacity-20 mx-auto" />
                        <p className="text-lg font-medium text-slate-400">
                          No departments found
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
