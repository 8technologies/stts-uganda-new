import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import * as XLSX from "xlsx";
import { KeenIcon, useDataGrid } from "@/components";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthContext } from "@/auth";
import { getPermissionsFromToken } from "@/utils/permissions";
import { LOAD_INSPECTORS, LOAD_PLANTING_RETURNS } from "@/gql/queries";
import { ASSIGN_PLANTING_RETURN_INSPECTOR } from "@/gql/mutations";
import { toast } from "sonner";
import { Download } from "lucide-react";

type InspectorsResponse = {
  inspectors?: any[];
};

type AssignPlantingReturnInspectorResponse = {
  assignPlantingReturnInspector?: {
    success?: boolean;
    message?: string;
  };
};

type PlantingReturnsGridToolbarProps = {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
};

const PlantingReturnsGridToolbar = ({
  searchInput,
  onSearchInputChange,
}: PlantingReturnsGridToolbarProps) => {
  const { table, loading } = useDataGrid();
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canAssignInspector = !!perms["qa_can_assign_inspector"];

  const [inspector, setInspector] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const {
    data: inspectorsData,
    loading: inspectorsLoading,
    error: inspectorsError,
    refetch,
  } = useQuery<InspectorsResponse>(LOAD_INSPECTORS);

  const [assignInspector, { loading: assigning }] =
    useMutation<AssignPlantingReturnInspectorResponse>(
      ASSIGN_PLANTING_RETURN_INSPECTOR,
      {
        refetchQueries: [
          {
            query: LOAD_PLANTING_RETURNS,
            variables: { filter: {}, pagination: { page: 1, size: 200 } },
          },
        ],
        awaitRefetchQueries: true,
      },
    );

  const selectedIds = table
    .getSelectedRowModel()
    .flatRows.map((r) => String((r.original as any).id));

  const selectedRows = table
    .getSelectedRowModel()
    .flatRows.map((r) => r.original as any);

  const formatDateValue = (value: any) => {
    if (!value) return "";

    const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const exportSelectedRows = () => {
    if (selectedRows.length === 0) {
      toast("Select at least one planting return to export.");
      return;
    }

    const exportData = selectedRows.map((row: any, index: number) => ({
      "#": index + 1,
      "SR8 Number": row?.sr8Number || "",
      "Grower Name": row?.applicantName || "",
      "Grower Number": row?.growerNumber || "",
      Phone: row?.contactPhone || "",
      "Garden Number": row?.gardenNumber || "",
      "Field Name": row?.fieldName || "",
      District: row?.location?.district || "",
      "Sub-county": row?.location?.subcounty || "",
      Parish: row?.location?.parish || "",
      Village: row?.location?.village || "",
      "GPS Lat": row?.location?.gpsLat ?? "",
      "GPS Lng": row?.location?.gpsLng ?? "",
      Crop: row?.crop?.name || "",
      Variety: row?.variety?.name || "",
      "Seed Class": row?.seedClass || "",
      "Area (Acres)": row?.areaHa ?? "",
      "Sowing Date": formatDateValue(row?.dateSown),
      "Quantity Planted (kg)": row?.quantityPlanted ?? "",
      "Expected Harvest": row?.expectedHarvest || "",
      "Seed Source": row?.seedSource || "",
      "Seed Lot Code": row?.seedLotCode || "",
      "Intended Merchant": row?.intendedMerchant || "",
      Status: row?.status || "",
      "Status Comment": row?.statusComment || "",
      "Scheduled Visit Date": formatDateValue(row?.scheduledVisitDate),
      "Inspector Name": row?.inspector?.name || "",
      "Inspector Email": row?.inspector?.email || "",
      "Created By": row?.createdBy?.name || "",
      "Created At": row?.createdAt ? formatDateValue(row?.createdAt) : "",
      "Updated At": row?.updatedAt ? formatDateValue(row?.updatedAt) : "",
      "Receipt ID": row?.receipt_id || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Selected Returns");

    const today = new Date();
    const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    XLSX.writeFile(workbook, `planting-returns-selected-${stamp}.xlsx`);
    toast(`Exported ${selectedRows.length} planting return(s).`);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const nextSearch = searchInput.trim() || undefined;
      const searchColumn = table.getColumn("sr8Number");

      if (searchColumn?.getFilterValue() === nextSearch) return;
      if (table.getState().pagination.pageIndex !== 0) {
        table.setPageIndex(0);
      }
      searchColumn?.setFilterValue(nextSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput, table]);

  const handleAssign = async () => {
    setErrorMsg(null);
    if (!inspector || selectedIds.length === 0) return;
    try {
      const res = await assignInspector({
        variables: { input: { ids: selectedIds, inspectorId: inspector } },
      });
      const ok = res?.data?.assignPlantingReturnInspector?.success;
      if (!ok)
        throw new Error(
          res?.data?.assignPlantingReturnInspector?.message ||
            "Failed to assign inspector",
        );
      toast("Inspector assigned");
      setInspector("");
      table.toggleAllRowsSelected(false);
    } catch (e: any) {
      const msg = e?.message || "Failed to assign inspector";
      setErrorMsg(msg);
      toast("Failed to assign inspector", { description: msg });
    }
  };

  return (
    <div className="card-header flex-wrap gap-2 border-b-0 px-5">
      <h3 className="card-title font-medium text-sm">
        Showing {table.getRowModel().rows.length} returns
      </h3>
      <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
        <div className="flex items-center gap-2">
          <label className="input input-sm">
            <KeenIcon icon="magnifier" />
            <input
              type="text"
              placeholder="Search returns"
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
            />
          </label>
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="size-3 rounded-full border-2 border-gray-300 border-t-primary animate-spin" />
              Loading
            </span>
          )}
        </div>

        {canAssignInspector && (
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-600 mr-1">
              Selected: {selectedIds.length}
            </div>
            <Select
              value={inspector}
              onValueChange={setInspector}
              disabled={inspectorsLoading || !!inspectorsError || assigning}
            >
              <SelectTrigger className="h-9 w-[220px]">
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
              disabled={!inspector || selectedIds.length === 0 || assigning}
            >
              <KeenIcon icon="tick-square" />
              {assigning ? "Assigning…" : "Assign Inspector"}
            </Button>
            {inspectorsError && (
              <button
                className="btn btn-xs btn-light"
                onClick={() => refetch?.()}
              >
                Retry
              </button>
            )}
            {errorMsg && (
              <span className="text-[11px] text-danger">{errorMsg}</span>
            )}
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={exportSelectedRows}
          disabled={selectedRows.length === 0 || loading}
        >
          <Download className="size-4" />
          Export Selected
        </Button>
      </div>
    </div>
  );
};

export { PlantingReturnsGridToolbar };
