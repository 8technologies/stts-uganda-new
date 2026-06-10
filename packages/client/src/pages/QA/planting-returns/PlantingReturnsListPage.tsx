import { Fragment, useCallback, useMemo, useState } from "react";
import {
  useApolloClient,
  useLazyQuery,
  useMutation,
} from "@apollo/client/react";

import { Container } from "@/components/container";
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from "@/partials/toolbar";
import { useLayout } from "@/providers";
import { PlantingReturnCreateDialog } from "./blocks/PlantingReturnCreateDialog";
import { PlantingReturnDetailsDialog } from "./blocks/PlantingReturnDetailsDialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridRowSelect,
  DataGridRowSelectAll,
  KeenIcon,
  TDataGridRequestParams,
} from "@/components";
import { Input } from "@/components/ui/input";
import type { ColumnDef, Column } from "@tanstack/react-table";
import { formatDateTime } from "@/utils/Date";
import { useAuthContext } from "@/auth";
import { getPermissionsFromToken } from "@/utils/permissions";
import { toAbsoluteUrl } from "@/utils";
import { Link } from "react-router-dom";
import { URL_2 } from "@/config/urls";
import { LOAD_PLANTING_RETURNS, LOAD_PLANTING_RETURN } from "@/gql/queries";
import {
  CREATE_PLANTING_RETURN,
  UPDATE_PLANTING_RETURN,
  DELETE_PLANTING_RETURN,
} from "@/gql/mutations";
import { ImportSubGrowersSheet } from "./blocks/ImportSubGrowersSheet";
import { PlantingReturnActionsMenu } from "./components/PlantingReturnActionsMenu";
import { PlantingReturnStatusBadge } from "./components/PlantingReturnStatusBadge";
import { PlantingReturnsGridToolbar } from "./components/PlantingReturnsGridToolbar";

type PlantingReturn = {
  id: string;
  sr8Number: string;
  applicantName: string;
  growerNumber?: string;
  contactPhone?: string;
  gardenNumber?: string;
  fieldName?: string;
  receipt_id?: string;
  location: {
    district?: string;
    subcounty?: string;
    parish?: string;
    village?: string;
    gpsLat?: string;
    gpsLng?: string;
  };
  crop: string;
  variety: string;
  seedClass?: string;
  areaHa: number;
  dateSown: string;
  expectedHarvest: string;
  seedSource?: string;
  seedLotCode?: string;
  intendedMerchant?: string;
  quantityPlanted?: number;
  status?: string;
  inspector?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  } | null;
  createdAt?: string;
};

type PlantingReturnsResponse = {
  plantingReturns?: {
    items?: PlantingReturn[];
    total?: number;
  };
};

type PlantingReturnDetailResponse = {
  plantingReturn?: any;
};

const PlantingReturnsListPage = () => {
  const client = useApolloClient();
  const { currentLayout } = useLayout();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [cvsCreate, setCvs] = useState<any | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canCreatePlantingReturns = !!perms["can_create_planting_returns"];
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // Data
  const LIST_VARS = { filter: {} } as const;

  const fetchPlantingReturns = useCallback(
    async ({ pageIndex, pageSize, columnFilters }: TDataGridRequestParams) => {
      const searchFilter = columnFilters?.find((entry) =>
        [
          "sr8Number",
          "applicant_name",
          "fieldName",
          "inspector",
          "crop",
          "variety",
        ].includes(entry.id),
      )?.value;
      const search =
        typeof searchFilter === "string" && searchFilter.trim()
          ? searchFilter.trim()
          : undefined;

      try {
        const response = await client.query<PlantingReturnsResponse>({
          query: LOAD_PLANTING_RETURNS,
          variables: {
            filter: search ? { search } : {},
            pagination: {
              page: pageIndex + 1,
              size: pageSize,
            },
          },
          fetchPolicy: "network-only",
        });

        const items = response?.data?.plantingReturns?.items || [];
        const total = Number(response?.data?.plantingReturns?.total || 0);

        setTotalCount(total);
        setFetchError(null);

        return {
          data: items,
          totalCount: total,
        };
      } catch (error: any) {
        setTotalCount(0);
        setFetchError(error?.message || "Failed to load planting returns");

        return {
          data: [],
          totalCount: 0,
        };
      }
    },
    [client],
  );

  const [importOpen, setImportOpen] = useState(false);

  const total = totalCount;

  const [createReturn] = useMutation(CREATE_PLANTING_RETURN, {
    refetchQueries: [{ query: LOAD_PLANTING_RETURNS, variables: LIST_VARS }],
    awaitRefetchQueries: true,
  });
  const [updateReturn] = useMutation(UPDATE_PLANTING_RETURN, {
    refetchQueries: [{ query: LOAD_PLANTING_RETURNS, variables: LIST_VARS }],
    awaitRefetchQueries: true,
  });
  const [deleteReturn] = useMutation(DELETE_PLANTING_RETURN, {
    refetchQueries: [{ query: LOAD_PLANTING_RETURNS, variables: LIST_VARS }],
    awaitRefetchQueries: true,
  });
  const [loadDetail] =
    useLazyQuery<PlantingReturnDetailResponse>(LOAD_PLANTING_RETURN);

  const reloadGrid = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSave = async (vals: any, id?: string) => {
    setSaving(true);
    const input: any = {
      applicantName: vals.growerName,
      growerNumber: vals.growerNumber,
      contactPhone: vals.contactPhone,
      fieldName: vals.fieldName,
      location: {
        district: vals.district,
        subcounty: vals.subcounty,
        parish: vals.parish,
        village: vals.village,
        gpsLat: vals.gpsLat ? Number(vals.gpsLat) : null,
        gpsLng: vals.gpsLng ? Number(vals.gpsLng) : null,
      },
      cropId: vals.crop || null,
      varietyId: vals.variety || null,
      seedClass: vals.seedClass || null,
      areaHa: vals.areaHa ? Number(vals.areaHa) : null,
      dateSown: vals.dateSown || null,
      quantityPlanted: vals.quantityPlanted ? Number(vals.quantityPlanted) : null,
      expectedHarvest: vals.expectedHarvest ? Number(vals.expectedHarvest) : null,
      seedSource: vals.seedSource || null,
      seedLotCode: vals.seedLotCode || null,
      intendedMerchant: vals.intendedMerchant || null,
    };
    try {
      if (id) {
        await updateReturn({ variables: { id, input } });
        toast("Planting return updated");
      } else {
        await createReturn({ variables: { input } });
        toast("Planting return created");
      }
      reloadGrid();
      setCreateOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast("Failed to save", { description: e?.message || "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setCreateOpen(true);
  };

  const handleUpload = () => {
    setImportOpen(true);
  };

  const handleEdit = (row: any) => {
    setEditing(row);
    setCreateOpen(true);
  };

  const handlePreview = async (row: any) => {
    try {
      const res = await loadDetail({ variables: { id: row.id } });
      const rec = res.data?.plantingReturn;
      if (!rec) throw new Error("Not found");
      setPreview(rec);
    } catch (e: any) {
      toast("Failed to load details", {
        description: e?.message || "Unknown error",
      });
    }
  };

  const handleDelete = async (row: any) => {
    try {
      setDeletingId(String(row.id));
      await deleteReturn({ variables: { id: row.id } });
      reloadGrid();
      toast("Planting return deleted");
    } catch (e: any) {
      toast("Failed to delete return", {
        description: e?.message || "Unknown error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Fragment>
        {currentLayout?.name === "demo1-layout" && (
          <Container>
            <Toolbar>
              <ToolbarHeading>
                <ToolbarPageTitle />
                <ToolbarDescription>
                  <div className="flex items-center flex-wrap gap-3 font-medium">
                    {false ? (
                      <>
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-12" />
                      </>
                    ) : (
                      <>
                        <span className="text-md text-gray-700">Returns:</span>
                        <span className="text-md text-gray-800 font-medium me-2">
                          {total}
                        </span>
                        <span className="text-md text-gray-700">
                          Showing latest
                        </span>
                      </>
                    )}
                  </div>
                </ToolbarDescription>
              </ToolbarHeading>
              {canCreatePlantingReturns && (
                <ToolbarActions>
                  <a
                    href="#"
                    onClick={() => {
                      handleUpload();
                    }}
                    className="btn btn-sm btn-light"
                  >
                    {"Import CSV"}
                  </a>
                  <a
                    href="#"
                    onClick={() => {
                      handleCreate();
                    }}
                    className="btn btn-sm btn-primary"
                  >
                    {"Add Return"}
                  </a>
                </ToolbarActions>
              )}
            </Toolbar>
          </Container>
        )}

        <Container>
          {fetchError && total === 0 ? (
            <div className="p-6 text-danger bg-white rounded-lg border flex items-center justify-between">
              <span>{fetchError}</span>
            </div>
          ) : (
            <PlantingReturnsGrid
              key={refreshKey}
              onEdit={handleEdit}
              fetchPlantingReturns={fetchPlantingReturns}
              onDelete={handleDelete}
              deletingId={deletingId}
              onPreview={handlePreview}
            />
          )}
        </Container>
      </Fragment>
      <PlantingReturnCreateDialog
        open={createOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
          setCreateOpen(o);
        }}
        onSave={(vals) => handleSave(vals, editing?.id)}
        saving={saving}
        initialValues={
          editing
            ? {
                growerName: editing.applicantName,
                growerNumber: editing.growerNumber,
                contactPhone: editing.contactPhone,
                fieldName: editing.fieldName,
                district: editing.location?.district,
                subcounty: editing.location?.subcounty,
                parish: editing.location?.parish,
                village: editing.location?.village,
                gpsLat: editing.location?.gpsLat?.toString?.() || "",
                gpsLng: editing.location?.gpsLng?.toString?.() || "",
                crop: editing.crop?.id || "",
                variety: editing.variety?.id || "",
                seedClass: editing.seedClass,
                areaHa: editing.areaHa != null ? String(editing.areaHa) : "",
                dateSown: editing.dateSown,
                expectedHarvest: editing.expectedHarvest,
                seedSource: editing.seedSource,
                seedLotCode: editing.seedLotCode,
                intendedMerchant: editing.intendedMerchant,
                quantityPlanted: editing.quantityPlanted,
                receipt_id: editing.receipt_id,
                notes: "",
              }
            : null
        }
      />

      <ImportSubGrowersSheet
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={reloadGrid}
      />

      <PlantingReturnDetailsDialog
        open={!!preview}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
        }}
        data={preview}
      />
    </>
  );
};

export default PlantingReturnsListPage;

const PlantingReturnsGrid = ({
  onEdit,
  fetchPlantingReturns,
  onDelete,
  deletingId,
  onPreview,
}: {
  onEdit: (p: any) => void;
  fetchPlantingReturns: (params: TDataGridRequestParams) => Promise<{
    data: PlantingReturn[];
    totalCount: number;
  }>;
  onDelete: (p: any) => void;
  deletingId: string | null;
  onPreview: (p: any) => void;
}) => {
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canManagePlantingReturns = !!perms["can_manage_planting_returns"];
  const canEditPlantingReturns = !!perms["can_edit_planting_returns"];
  const canDeletePlantingReturns = !!perms["can_delete_planting_returns"];
  const [searchInput, setSearchInput] = useState("");

  const ColumnInputFilter = <TData, TValue>({
    column,
  }: {
    column: Column<TData, TValue>;
  }) => (
    <Input
      placeholder="Filter..."
      value={(column.getFilterValue() as string) ?? ""}
      onChange={(event) => column.setFilterValue(event.target.value)}
      className="h-9 w-full max-w-40"
    />
  );

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [
      {
        id: "select",
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: "w-0" },
      },
      {
        accessorKey: "createdOn",
        id: "createdOn",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Created On"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800 font-medium">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
        meta: { headerClassName: "min-w-[190px]" },
      },
    ];

    if (canManagePlantingReturns) {
      cols.push({
        accessorKey: "applicant_name",
        id: "applicant_name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Applicant Name"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-4">
              <img
                src={
                  row.original?.createdBy?.image
                    ? `${URL_2}/imgs/${row.original?.createdBy?.image}`
                    : toAbsoluteUrl("/media/avatars/blank.png")
                }
                className="rounded-full size-9 shrink-0"
                alt={`${row.original?.createdBy?.userName}`}
              />
              <div className="flex flex-col gap-0.5">
                <Link
                  to="#"
                  className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                >
                  {row.original?.createdBy?.name}
                </Link>
              </div>
            </div>
          );
        },
        meta: { headerClassName: "min-w-[200px]" },
      });
    }

    cols.push(
      {
        accessorKey: "sr8Number",
        id: "sr8Number",
        header: ({ column }) => (
          <DataGridColumnHeader title="SR8 Number" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row.original.sr8Number}</span>
        ),
        meta: { headerClassName: "min-w-[160px]" },
      },
      {
        accessorKey: "fieldName",
        id: "fieldName",
        header: ({ column }) => (
          <DataGridColumnHeader title="Field/Garden" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">
            {row.original.fieldName || row.original.gardenNumber}
          </span>
        ),
        meta: { headerClassName: "min-w-[160px]" },
      },
    );
    if (canManagePlantingReturns) {
      cols.push({
        accessorFn: (row: any) => row?.inspector?.name || "",
        id: "inspector",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Inspector"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const ins = row.original?.inspector || ({} as any);
          const img = ins?.image
            ? `${URL_2}/imgs/${ins.image}`
            : toAbsoluteUrl("/media/avatars/blank.png");
          return (
            <div className="flex items-center gap-2.5">
              {ins?.name && (
                <img
                  src={img}
                  className="rounded-full size-8 shrink-0 object-cover"
                  alt={ins?.name || "Inspector"}
                />
              )}
              <div className="leading-tight">
                <div className="text-sm font-medium text-gray-800">
                  {ins?.name || "—"}
                </div>
                <div className="text-[11px] text-gray-600">
                  {ins?.email || ""}
                </div>
              </div>
            </div>
          );
        },
        meta: { headerClassName: "min-w-[220px]" },
      });
    }
    cols.push(
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => (
          <PlantingReturnStatusBadge status={row.original.status} />
        ),
        meta: { headerClassName: "min-w-[140px]" },
      },
      {
        accessorKey: "crop",
        id: "crop",
        header: ({ column }) => (
          <DataGridColumnHeader title="Crop" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row?.original?.crop?.name}</span>
        ),
        meta: { headerClassName: "min-w-[180px]" },
      },
      {
        accessorKey: "variety",
        id: "variety",
        header: ({ column }) => (
          <DataGridColumnHeader title="Variety" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row?.original?.variety?.name}</span>
        ),
        meta: { headerClassName: "min-w-[180px]" },
      },

      // {
      //   accessorKey: 'dateSown',
      //   id: 'dateSown',
      //   header: ({ column }) => <DataGridColumnHeader title="Sowing Date" column={column} />,
      //   cell: ({ row }) => (
      //     <span className="text-gray-800">{formatIsoDate(row.original.dateSown)}</span>
      //   ),
      //   meta: { headerClassName: 'min-w-[140px]' }
      // },

      {
        id: "edit",
        header: () => "",
        enableSorting: false,
        cell: ({ row }) => (
          <PlantingReturnActionsMenu
            row={row.original}
            canEdit={canEditPlantingReturns}
            canDelete={canDeletePlantingReturns}
            deletingId={deletingId}
            onEdit={onEdit}
            onDelete={onDelete}
            onPreview={onPreview}
          />
        ),
        meta: { headerClassName: "w-[60px]" },
      },
    );

    return cols;
  }, [
    canDeletePlantingReturns,
    canEditPlantingReturns,
    canManagePlantingReturns,
    deletingId,
    onDelete,
    onEdit,
    onPreview,
  ]);

  return (
    <DataGrid<any>
      columns={columns}
      rowSelection={true}
      serverSide={true}
      loadingMode="empty"
      pagination={{ size: 10 }}
      onFetchData={fetchPlantingReturns}
      layout={{ card: true, cellSpacing: "xs", cellBorder: true }}
      toolbar={
        <PlantingReturnsGridToolbar
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
        />
      }
      messages={{ loading: "Loading...", empty: "No planting returns found" }}
    />
  );
};
