import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KeenIcon } from "@/components";
import { toast } from "sonner";
import { useAuthContext } from "@/auth";
import { getPermissionsFromToken } from "@/utils/permissions";
import StockExaminationFormSheet from "./StockExaminationFormSheet";
import StockExaminationDetailsSheet from "./StockExaminationDetailsSheet";
import { LOAD_INSPECTORS, LOAD_STOCK_EXAMINATIONS } from "@/gql/queries";
import { ASSIGN_STOCK_EXAMINATION_INSPECTOR } from "@/gql/mutations";
import StockInspectionSheet from "./StockExamInspection";

interface StockExam {
  id: string;
  created_at: string;
  user_id: string;
  createdBy: string;
  category: string;
  status: string;
  mother_lot: string;
  inspector?: {
    id: string;
    username: string;
  };
  user?: {
    id: string;
    username: string;
  };
  reportAvailable: boolean;
  seedType?: string;
  motherLot?: string;
  remarks?: string;
  importPermitLabel?: string;
  varietyLabel?: string;
  approvedFieldLabel?: string;
  qdsDeclarationLabel?: string;
  receiptUrl?: string;
  excelUrl?: string;
  reportUrl?: string;
}

const relativeTime = (iso?: string) => {
  if (!iso) return "-";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
};

export const statusBadge = (s: string) => {
  const base =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium";
  if (/approved/i.test(s))
    return (
      <span className={`${base} bg-green-100 text-green-700`}>
        <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>Accepted
      </span>
    );
  if (/inspector_assigned/i.test(s))
    return (
      <span className={`${base} bg-yellow-100 text-yellow-700`}>
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span>
        Inspector assigned
      </span>
    );
  if (/rejected/i.test(s))
    return (
      <span className={`${base} bg-red-100 text-red-700`}>
        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>Rejected
      </span>
    );
  if (/halt/i.test(s))
    return (
      <span className={`${base} bg-orange-100 text-orange-700`}>
        <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>Halted
      </span>
    );
  return (
    <span className={`${base} bg-orange-100 text-orange-700`}>
      <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
      {s}
    </span>
  );
};

export const seedCategory = (s: string) => {
  console.log("seedCategory input:", s);
  if (s == "Grower_seed") {
    return "Grower seed";
  } else if (s == "Import_seed") {
    return "Import seed";
  } else if (s == "QDS_seed") {
    return "QDS seed";
  } else {
    return s;
  }
};

const StockExamination: React.FC = () => {
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canAssignInspector = !!perms["qa_can_assign_inspector"];

  const {
    data: examinations,
    loading: examinationsLoading,
    error: examErrors,
    refetch,
  } = useQuery(LOAD_STOCK_EXAMINATIONS);

  // const [items, setItems] = useState<StockExam[]>(examinations?.stockExaminations || []);
  const items = useMemo(
    () => (examinations?.stockExaminations ?? []) as any[],
    [examinations],
  );

  console.log("StockExaminations data:", examinations, items);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockExam | null>(null);
  const [detailsItem, setDetailsItem] = useState<StockExam | null>(null);
  const [inspectionItem, setInspectionItem] = useState<string | null>(null);
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [inspector, setInspector] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const {
    data: inspectorsData,
    loading: inspectorsLoading,
    error: inspectorsError,
  } = useQuery(LOAD_INSPECTORS);

  const [assignInspector, { loading: assigning }] = useMutation(
    ASSIGN_STOCK_EXAMINATION_INSPECTOR,
    {
      refetchQueries: [{ query: LOAD_STOCK_EXAMINATIONS }],
      awaitRefetchQueries: true,
    },
  );

  const filteredItems = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) =>
        String(it.mother_lot || "")
          .toLowerCase()
          .includes(q) ||
        String(it.createdBy || "")
          .toLowerCase()
          .includes(q) ||
        String(it.category || "")
          .toLowerCase()
          .includes(q),
    );
  }, [items, searchInput]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(filteredItems.map((r) => r.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAssign = async () => {
    // setErrorMsg(null);
    if (!inspector || selectedIds.length === 0) return;
    try {
      const res = await assignInspector({
        variables: { input: { ids: selectedIds, inspectorId: inspector } },
      });
      const ok = res?.data?.assignStockExaminationInspector?.success;
      if (!ok)
        throw new Error(
          res?.data?.assignStockExaminationInspector?.message ||
            "Failed to assign inspector",
        );
      toast("Inspector assigned");
      setInspector("");
      // Clear selection after success
      // table.toggleAllRowsSelected(false);
    } catch (e: any) {
      const msg = e?.message || "Failed to assign inspector";
      // setErrorMsg(msg);
      toast("Failed to assign inspector", { description: msg });
    }
  };

  const handleCreateSaved = async () => {
    try {
      await refetch(); // <-- This refreshes the table data
      toast.success("Stock examination added successfully");
    } catch (error) {
      console.error("Error refetching:", error);
      toast.error("Failed to refresh data");
    } finally {
      setCreateOpen(false);
    }
  };

  const handleinspectionOpen = (item: string) => {
    setInspectionItem(item);
    setIsInspectionOpen(true);
  };

  const handleInspection = async (data: any) => {
    try {
      await refetch(); // <-- This refreshes the table data
      toast.success("Stock examination inspection recorded successfully");
    } catch (error) {
      console.error("Error refetching:", error);
      toast.error("Failed to refresh data");
    } finally {
      setIsInspectionOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Stock Examination
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Returns:{" "}
              <span className="font-medium text-gray-900">
                {filteredItems.length}
              </span>{" "}
              · Showing latest
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setCreateOpen(true)}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <KeenIcon icon="plus" />
              Add Return
            </Button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-gray-700">
            Showing {filteredItems.length} returns
          </div>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <KeenIcon
                icon="magnifier"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search returns"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Selected:{" "}
                  <strong className="text-gray-900">
                    {selectedIds.length}
                  </strong>
                </span>
                <div className="w-px h-6 bg-gray-300"></div>
              </div>
            )}

            <Select
              value={inspector}
              onValueChange={setInspector}
              disabled={inspectorsLoading || !!inspectorsError}
            >
              <SelectTrigger className="w-56 h-9 rounded-lg border-gray-300">
                <SelectValue
                  placeholder={
                    inspectorsLoading ? "Loading…" : "Choose inspector"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {inspectorsData?.inspectors?.map((ins: any) => (
                  <SelectItem key={ins.id} value={ins.id}>
                    {ins.name ||
                      ins.username ||
                      ins.company_initials ||
                      "Unknown"}
                    {ins.district ? ` (${ins.district})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              size="sm"
              onClick={handleAssign}
              disabled={!canAssignInspector || inspectorsLoading}
              className="bg-green-600 hover:bg-green-700 text-white gap-2 h-9"
            >
              <KeenIcon icon="tick-square" />
              Assign Inspector
            </Button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label="select all"
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === filteredItems.length
                      }
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-gray-700">
                      Created On
                      <KeenIcon icon="sort" className="text-gray-400" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-gray-700">
                      Created by
                      <KeenIcon icon="sort" className="text-gray-400" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-gray-700">
                      Category
                      <KeenIcon icon="sort" className="text-gray-400" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-gray-700">
                      Status
                      <KeenIcon icon="sort" className="text-gray-400" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-gray-700">
                      Lot Number
                      <KeenIcon icon="sort" className="text-gray-400" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button className="flex items-center gap-1 hover:text-gray-700">
                      Inspector
                      <KeenIcon icon="sort" className="text-gray-400" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Examination Report
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        aria-label={`select-${row.id}`}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {relativeTime(row.created_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {row.user?.username}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {seedCategory(row.category)}
                    </td>
                    <td className="px-4 py-4">{statusBadge(row.status)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                      {row.mother_lot}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {row?.inspector?.username || "—"}
                    </td>
                    <td className="px-4 py-4">
                      {row.reportAvailable ? (
                        <a
                          href={`/stock/examination/${row.id}/report`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:text-green-700 hover:underline"
                        >
                          Print Report
                          <KeenIcon icon="printer" className="text-xs" />
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Unavailable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 relative">
                      <button
                        aria-label="actions"
                        onClick={() =>
                          setOpenMenuFor(openMenuFor === row.id ? null : row.id)
                        }
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                      >
                        <KeenIcon icon="dots-vertical" />
                      </button>

                      {openMenuFor === row.id && (
                        <div
                          className="absolute right-2 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]"
                          onMouseLeave={() => setOpenMenuFor(null)}
                        >
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setDetailsItem(row);
                                setOpenMenuFor(null);
                              }}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <KeenIcon icon="eye" className="text-gray-400" />
                              Details
                            </button>
                            <button
                              onClick={() => {
                                setEditItem(row);
                                setOpenMenuFor(null);
                              }}
                              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <KeenIcon icon="edit" className="text-gray-400" />
                              Edit
                            </button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <KeenIcon icon="trash" className="text-red-500" />
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <KeenIcon
                            icon="file-search"
                            className="text-gray-400 text-xl"
                          />
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          No records found
                        </div>
                        <div className="text-xs text-gray-500">
                          Try adjusting your search criteria
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Pagination */}
      <div className="bg-white border-t px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span>Rows per page</span>
            <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="text-sm text-gray-700">
            1 - {filteredItems.length} of {filteredItems.length}
          </div>

          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              <KeenIcon icon="arrow-left" className="text-gray-600" />
            </button>
            <button className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium">
              1
            </button>
            <button
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              <KeenIcon icon="arrow-right" className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      <StockExaminationFormSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSaved={handleCreateSaved}
      />

      {editItem && (
        <StockExaminationFormSheet
          open={!!editItem}
          onOpenChange={() => setEditItem(null)}
          mode="edit"
          initialData={editItem}
          onSaved={handleCreateSaved}
        />
      )}

      {detailsItem && (
        <StockExaminationDetailsSheet
          open={!!detailsItem}
          onOpenChange={() => setDetailsItem(null)}
          onInspectionOpen={handleinspectionOpen}
          data={detailsItem}
        />
      )}

      {inspectionItem && (
        <StockInspectionSheet
          open={isInspectionOpen}
          onOpenChange={setIsInspectionOpen}
          stockId={inspectionItem}
          onSaved={handleInspection}
        />
      )}
    </div>
  );
};

export default StockExamination;
