import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useLazyQuery, useMutation } from "@apollo/client/react";
import { Container } from "@/components/container";
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from "@/layouts/demo1/toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridRowSelect,
  DataGridRowSelectAll,
  KeenIcon,
  useDataGrid,
} from "@/components";
import type { Column, ColumnDef } from "@tanstack/react-table";
import {
  type Crop,
  type CropInspectionType,
  type CropVariety,
} from "./crops.data";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { LOAD_CROPS, LOAD_CROP } from "@/gql/queries";
import { CREATE_CROP, UPDATE_CROP, DELETE_CROP } from "@/gql/mutations";

const yesno = (b: boolean) => (b ? "Yes" : "No");

const CropsListPage = () => {
  const LIST_VARS = { filter: {}, pagination: { page: 1, size: 200 } } as const;
  const { data, loading, error } = useQuery(LOAD_CROPS, {
    variables: LIST_VARS,
  });
  const crops = useMemo<Crop[]>(() => {
    const items = data?.crops?.items ?? [];
    // Map items to our local type where we only need length of varieties in the list
    return items.map((it: any) => ({
      id: String(it.id),
      name: it.name,
      isQDS: !!it.isQDS,
      daysBeforeSubmission: it.daysBeforeSubmission,
      units: it.units,
      varieties: (it.varieties ?? []).map((v: any) => ({
        name: v.name ?? String(v.id),
      })),
      inspectionTypes: [],
    }));
  }, [data]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Crop | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [loadCropDetail, { loading: loadingEdit }] = useLazyQuery(LOAD_CROP, {
    fetchPolicy: "network-only",
    onError: (e) => toast("Failed to load crop", { description: e.message }),
  });

  const [createCrop, { loading: creating }] = useMutation(CREATE_CROP, {
    onCompleted: (res) => {
      const ok = res?.createCrop?.success;
      toast(
        res?.createCrop?.message || (ok ? "Crop created" : "Create failed"),
      );
    },
    onError: (e) => toast("Failed to create crop", { description: e.message }),
    refetchQueries: [{ query: LOAD_CROPS, variables: LIST_VARS }],
    awaitRefetchQueries: true,
  });
  const [updateCrop, { loading: updating }] = useMutation(UPDATE_CROP, {
    onCompleted: (res) => toast(res?.updateCrop?.message || "Saved"),
    onError: (e) => toast("Failed to update crop", { description: e.message }),
    refetchQueries: [{ query: LOAD_CROPS, variables: LIST_VARS }],
    awaitRefetchQueries: true,
  });
  const [deleteCrop] = useMutation(DELETE_CROP, {
    onCompleted: (res) => toast(res?.deleteCrop?.message || "Deleted"),
    onError: (e) => toast("Failed to delete crop", { description: e.message }),
    refetchQueries: [{ query: LOAD_CROPS, variables: LIST_VARS }],
    awaitRefetchQueries: true,
  });

  const handleCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = async (crop: Crop) => {
    setEditing(crop);
    setFormOpen(true);
    const res = await loadCropDetail({ variables: { id: crop.id } });
    const c = res?.data?.crop;
    console.log("crop", c);
    if (!c) {
      toast("Failed to load crop");
      return;
    }
    const mapped: Crop = {
      id: String(c.id),
      name: c.name,
      isQDS: !!c.isQDS,
      daysBeforeSubmission: c.daysBeforeSubmission,
      units: c.units,
      varieties: (c.varieties ?? []).map((v: any) => ({ name: v.name })),
      inspectionTypes: (c.inspectionTypes ?? [])
        .map((i: any) => ({
          stageName: i.stageName,
          order: i.order,
          required: !!i.required,
          periodAfterPlantingDays: i.periodAfterPlantingDays,
        }))
        .sort((a: any, b: any) => a.order - b.order),
    };

    setEditing(mapped);
    setFormOpen(true);
  };

  const handleDelete = (crop: Crop) => {
    setDeletingId(String(crop.id));
    deleteCrop({ variables: { id: crop.id } }).finally(() =>
      setDeletingId(null),
    );
  };

  const handleSubmit = (payload: Omit<Crop, "id"> & { id?: string }) => {
    if (editing) {
      const variables = {
        id: editing.id,
        input: {
          name: payload.name,
          isQDS: payload.isQDS,
          daysBeforeSubmission: payload.daysBeforeSubmission,
          units: payload.units,
          varieties: (payload.varieties || []).map((v) => ({ name: v.name })),
          inspectionTypes: (payload.inspectionTypes || []).map((i) => ({
            stageName: i.stageName,
            order: i.order,
            required: i.required,
            periodAfterPlantingDays: i.periodAfterPlantingDays,
          })),
          replaceChildren: true,
        },
      };
      updateCrop({ variables }).then(() => setFormOpen(false));
    } else {
      const variables = {
        input: {
          name: payload.name,
          isQDS: payload.isQDS,
          daysBeforeSubmission: payload.daysBeforeSubmission,
          units: payload.units,
          varieties: (payload.varieties || []).map((v) => ({ name: v.name })),
          inspectionTypes: (payload.inspectionTypes || []).map((i) => ({
            stageName: i.stageName,
            order: i.order,
            required: i.required,
            periodAfterPlantingDays: i.periodAfterPlantingDays,
          })),
        },
      };
      createCrop({ variables }).then(() => setFormOpen(false));
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="Crops"
            description="Manage crops and their varieties"
          />
          <ToolbarActions>
            <a
              href="#"
              className="btn btn-sm btn-primary"
              onClick={(e) => {
                e.preventDefault();
                handleCreate();
              }}
            >
              New Crop
            </a>
          </ToolbarActions>
        </Toolbar>

        {loading ? (
          <div className="p-6 space-y-3 bg-white rounded-lg border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-40 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-danger bg-white rounded-lg border">
            Failed to load crops
          </div>
        ) : (
          <CropsDataGrid
            crops={crops}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </Container>

      <CropFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        initialValues={editing}
        onSubmit={handleSubmit}
        loading={creating || updating || loadingEdit}
      />
    </div>
  );
};

const CropsDataGrid = ({
  crops,
  onEdit,
  onDelete,
  deletingId,
}: {
  crops: Crop[];
  onEdit: (c: Crop) => void;
  onDelete: (c: Crop) => void;
  deletingId: string | null;
}) => {
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

  const columns = useMemo<ColumnDef<Crop>[]>(
    () => [
      {
        accessorKey: "select",
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: "w-0" },
      },
      {
        accessorKey: "name",
        id: "name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Crop Name"
            column={column}
            filter={<ColumnInputFilter column={column} />}
          />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800 font-medium">{row.original.name}</span>
        ),
        meta: { className: "min-w-[220px]" },
      },
      {
        accessorKey: "isQDS",
        id: "isQDS",
        header: ({ column }) => (
          <DataGridColumnHeader title="Is QDS?" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{yesno(row.original.isQDS)}</span>
        ),
        meta: { className: "min-w-[120px]" },
      },
      {
        accessorKey: "daysBeforeSubmission",
        id: "daysBeforeSubmission",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Days before submission"
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">
            {row.original.daysBeforeSubmission}
          </span>
        ),
        meta: { className: "min-w-[200px]" },
      },
      {
        accessorKey: "units",
        id: "units",
        header: ({ column }) => (
          <DataGridColumnHeader title="Units" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row.original.units}</span>
        ),
        meta: { className: "min-w-[120px]" },
      },
      {
        accessorFn: (row) => row.varieties?.length ?? 0,
        id: "varieties",
        header: ({ column }) => (
          <DataGridColumnHeader title="# Varieties" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row.original.varieties.length}</span>
        ),
        meta: { className: "min-w-[140px]" },
      },
      {
        id: "actions",
        header: () => "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <div className="inline-flex gap-2">
              <Link
                to={`/admin/crops/${row.original.id}`}
                state={{ crop: row.original }}
                className="btn btn-light btn-sm"
              >
                View
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(row.original)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(row.original)}
                disabled={String(deletingId) === String(row.original.id)}
              >
                {String(deletingId) === String(row.original.id)
                  ? "Deleting…"
                  : "Delete"}
              </Button>
            </div>
          </div>
        ),
        meta: { headerClassName: "w-[240px]" },
      },
    ],
    [deletingId],
  );

  const HeaderToolbar = () => {
    const { table } = useDataGrid();
    const [searchInput, setSearchInput] = useState("");
    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">
          Showing {crops.length} crops
        </h3>
        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="Search crops"
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  table.getColumn("name")?.setFilterValue(val);
                }}
              />
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataGrid<Crop>
      columns={columns}
      data={crops}
      rowSelection={true}
      layout={{ card: true, cellSpacing: "xs", cellBorder: true }}
      toolbar={<HeaderToolbar />}
      messages={{ loading: "Loading...", empty: "No crops found" }}
    />
  );
};

export default CropsListPage;

// Drawer Form for create/edit crop
const CropFormDrawer = ({
  open,
  onOpenChange,
  initialValues,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues: Crop | null;
  onSubmit: (payload: Omit<Crop, "id"> & { id?: string }) => void;
  loading?: boolean;
}) => {
  const [name, setName] = useState("");
  const [isQDS, setIsQDS] = useState(true);
  const [daysBeforeSubmission, setDaysBeforeSubmission] = useState<number | "">(
    "",
  );
  const [units, setUnits] = useState("Kg");
  const [inspectionTypes, setInspectionTypes] = useState<CropInspectionType[]>(
    [],
  );
  const [varieties, setVarieties] = useState<CropVariety[]>([]);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setName(initialValues.name);
        setIsQDS(initialValues.isQDS);
        setDaysBeforeSubmission(initialValues.daysBeforeSubmission);
        setUnits(initialValues.units);
        setInspectionTypes(
          initialValues?.inspectionTypes?.map((x) => ({ ...x })),
        );
        setVarieties(initialValues?.varieties?.map((x) => ({ ...x })));
      } else {
        setName("");
        setIsQDS(true);
        setDaysBeforeSubmission("");
        setUnits("Kg");
        setInspectionTypes([
          {
            stageName: "Pre-planting",
            order: 1,
            required: true,
            periodAfterPlantingDays: 0,
          },
        ]);
        setVarieties([{ name: "" }]);
      }
    }
  }, [open, initialValues]);

  const addInspection = () =>
    setInspectionTypes((prev) => [
      ...prev,
      {
        stageName: "",
        order: prev.length + 1,
        required: true,
        periodAfterPlantingDays: 0,
      },
    ]);
  const removeInspection = (idx: number) =>
    setInspectionTypes((prev) => prev.filter((_, i) => i !== idx));

  const updateInspection = (idx: number, patch: Partial<CropInspectionType>) =>
    setInspectionTypes((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );

  const addVariety = () => setVarieties((prev) => [...prev, { name: "" }]);
  const removeVariety = (idx: number) =>
    setVarieties((prev) => prev.filter((_, i) => i !== idx));
  const updateVariety = (idx: number, nameVal: string) =>
    setVarieties((prev) =>
      prev.map((v, i) => (i === idx ? { name: nameVal } : v)),
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || daysBeforeSubmission === "" || !units) return;
    onSubmit({
      name,
      isQDS,
      daysBeforeSubmission: Number(daysBeforeSubmission),
      units,
      inspectionTypes,
      varieties: varieties.filter((v) => v.name.trim().length > 0),
      createdAt: initialValues?.createdAt || new Date().toISOString(),
    });
  };

  const isEditing = !!initialValues;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[1000px] lg:max-w-[880px]"
      >
        <SheetHeader className="mb-2">
          <SheetTitle>{isEditing ? "Edit Crop" : "Create Crop"}</SheetTitle>
        </SheetHeader>
        {loading && !isEditing ? (
          <div className="p-6 text-sm text-gray-600">Loading crop…</div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="h-full flex flex-col"
            style={{ height: "calc(100vh - 75px)", overflow: "auto" }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Is QDS?
                </label>
                <div className="flex items-center gap-6 mt-1">
                  <label className="radio-group">
                    <input
                      className="radio"
                      type="radio"
                      name="isqds"
                      checked={isQDS}
                      onChange={() => setIsQDS(true)}
                    />
                    <span className="radio-label">Yes</span>
                  </label>
                  <label className="radio-group">
                    <input
                      className="radio"
                      type="radio"
                      name="isqds"
                      checked={!isQDS}
                      onChange={() => setIsQDS(false)}
                    />
                    <span className="radio-label">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Enter Number of days before submission
                </label>
                <Input
                  type="number"
                  min={0}
                  value={daysBeforeSubmission}
                  onChange={(e) =>
                    setDaysBeforeSubmission(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Units
                </label>
                <Select value={units} onValueChange={setUnits}>
                  <SelectTrigger>
                    <SelectValue placeholder="Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kg">Kg</SelectItem>
                    <SelectItem value="Bags">Bags</SelectItem>
                    <SelectItem value="Tubes">Tubes</SelectItem>
                    <SelectItem value="Suckers">Suckers</SelectItem>
                    <SelectItem value="Tonnes">Tonnes</SelectItem>
                    <SelectItem value="Units">Units</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-lg font-semibold text-gray-800 border-b pb-2">
                Crop inspection types
              </div>
              <div className="mt-4 space-y-5">
                {inspectionTypes?.map((it, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
                  >
                    <div className="md:col-span-4">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Inspection stage name
                      </label>
                      <Input
                        value={it.stageName}
                        onChange={(e) =>
                          updateInspection(idx, { stageName: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Order number
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={it.order}
                        onChange={(e) =>
                          updateInspection(idx, {
                            order: Number(e.target.value || 0),
                          })
                        }
                        required
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Is required
                      </label>
                      <div className="flex items-center gap-6 mt-1">
                        <label className="radio-group">
                          <input
                            className="radio"
                            type="radio"
                            name={`required-${idx}`}
                            checked={it.required}
                            onChange={() =>
                              updateInspection(idx, { required: true })
                            }
                          />
                          <span className="radio-label">Mandatory</span>
                        </label>
                        <label className="radio-group">
                          <input
                            className="radio"
                            type="radio"
                            name={`required-${idx}`}
                            checked={!it.required}
                            onChange={() =>
                              updateInspection(idx, { required: false })
                            }
                          />
                          <span className="radio-label">Optional</span>
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Period after planting (in days)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={it.periodAfterPlantingDays}
                        onChange={(e) =>
                          updateInspection(idx, {
                            periodAfterPlantingDays: Number(
                              e.target.value || 0,
                            ),
                          })
                        }
                        required
                      />
                    </div>
                    <div className="md:col-span-12 flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeInspection(idx)}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={addInspection}
                >
                  New
                </Button>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-lg font-semibold text-gray-800 border-b pb-2">
                Crop varieties
              </div>
              <div className="mt-4 space-y-5">
                {varieties?.map((v, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
                  >
                    <div className="md:col-span-9">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Crop Variety Name
                      </label>
                      <Input
                        value={v.name}
                        onChange={(e) => updateVariety(idx, e.target.value)}
                        required
                      />
                    </div>
                    <div className="md:col-span-3 flex md:justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeVariety(idx)}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  className="btn btn-sm btn-success"
                  onClick={addVariety}
                >
                  New
                </Button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!!loading}>
                {loading
                  ? "Please wait…"
                  : isEditing
                    ? "Save Changes"
                    : "Create Crop"}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
};
