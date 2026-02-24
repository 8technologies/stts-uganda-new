import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Container } from "@/components/container";
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from "@/partials/toolbar";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridRowSelect,
  DataGridRowSelectAll,
  KeenIcon,
  useDataGrid,
} from "@/components";
import { toast } from "sonner";
import { LOAD_SEED_LABEL_PACKAGES } from "@/gql/queries";
import {
  SAVE_SEED_LABEL_PACKAGE,
  DELETE_SEED_LABEL_PACKAGE,
} from "@/gql/mutations";
import type { Column, ColumnDef } from "@tanstack/react-table";

type SeedLabelPackage = {
  id: string;
  name: string;
  packageSizeKg: number;
  labelsPerPackage: number;
  priceUgx: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const DEFAULT_FORM = {
  name: "",
  packageSizeKg: "",
  labelsPerPackage: "1",
  priceUgx: "",
  isActive: true,
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-UG").format(value);

const SeedLabelPackagesPage = () => {
  const { data, loading, error, refetch } = useQuery(
    LOAD_SEED_LABEL_PACKAGES,
    {
      variables: { activeOnly: false },
    },
  );
  const packages = useMemo(
    () => (data?.seedLabelPackages ?? []) as SeedLabelPackage[],
    [data],
  );

  const [savePackage, { loading: saving }] = useMutation(
    SAVE_SEED_LABEL_PACKAGE,
    {
      refetchQueries: [{ query: LOAD_SEED_LABEL_PACKAGES, variables: { activeOnly: false } }],
      awaitRefetchQueries: true,
    },
  );
  const [deletePackage] = useMutation(DELETE_SEED_LABEL_PACKAGE, {
    refetchQueries: [{ query: LOAD_SEED_LABEL_PACKAGES, variables: { activeOnly: false } }],
    awaitRefetchQueries: true,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SeedLabelPackage | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const listErrorMessage = error?.graphQLErrors?.length
    ? error.graphQLErrors.map((err) => err.message).join(", ")
    : error?.networkError?.message ?? error?.message ?? "Unknown error";
  const listErrorCode = error?.graphQLErrors?.[0]?.extensions?.code;

  const openCreate = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setFormOpen(true);
  };

  const openEdit = (pkg: SeedLabelPackage) => {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      packageSizeKg: String(pkg.packageSizeKg ?? ""),
      labelsPerPackage: String(pkg.labelsPerPackage ?? 1),
      priceUgx: String(pkg.priceUgx ?? ""),
      isActive: !!pkg.isActive,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      id: editing?.id,
      name: form.name.trim(),
      packageSizeKg: Number(form.packageSizeKg),
      labelsPerPackage: Number(form.labelsPerPackage) || 1,
      priceUgx: Number(form.priceUgx),
      isActive: form.isActive,
    };

    if (!payload.name) {
      toast.error("Package name is required");
      return;
    }
    if (!payload.packageSizeKg || payload.packageSizeKg <= 0) {
      toast.error("Package size must be greater than 0");
      return;
    }
    if (!payload.priceUgx || payload.priceUgx <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }

    try {
      await savePackage({ variables: { input: payload } });
      toast.success(
        editing ? "Package updated successfully" : "Package created successfully",
      );
      setFormOpen(false);
    } catch (e: any) {
      toast.error("Failed to save package", {
        description: e?.message ?? "Unknown error",
      });
    }
  };

  const handleDelete = async (pkg: SeedLabelPackage) => {
    if (!window.confirm(`Delete package "${pkg.name}"?`)) return;
    try {
      await deletePackage({ variables: { id: pkg.id } });
      toast.success("Package deleted");
    } catch (e: any) {
      toast.error("Failed to delete package", {
        description: e?.message ?? "Unknown error",
      });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle text="Seed Label Packages" />
            <ToolbarDescription>
              Manage label package sizes and pricing.
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button size="sm" onClick={openCreate}>
              <KeenIcon icon="plus" />
              Add Package
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <div className="mt-4">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-6 bg-white rounded-lg border">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-danger-clarity bg-danger-light text-danger">
                    <KeenIcon icon="information-2" className="text-lg" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-base font-semibold text-gray-900">
                      Unable to load packages
                    </div>
                    <div className="text-sm text-gray-700">
                      {listErrorMessage}
                    </div>
                    {listErrorCode ? (
                      <div className="text-xs text-gray-500">
                        Error code: {listErrorCode}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="light" onClick={() => refetch?.()}>
                    <KeenIcon icon="arrow-rotate-right" /> Retry
                  </Button>
                </div>
              </div>
              <div className="mt-4 border-t border-dashed pt-3 text-xs text-gray-600">
                If you believe this is a mistake, contact your administrator.
              </div>
            </div>
          ) : (
            <SeedLabelPackagesGrid
              packages={packages}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}
        </div>
      </Container>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-[520px] w-[96vw]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit Label Package" : "Create Label Package"}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="form-label">Package Name</label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. 5 kg package"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Package Size (kg)</label>
                <Input
                  type="number"
                  min={0}
                  value={form.packageSizeKg}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      packageSizeKg: e.target.value,
                    }))
                  }
                  placeholder="5"
                />
              </div>
              <div>
                <label className="form-label">Labels per Package</label>
                <Input
                  type="number"
                  min={1}
                  value={form.labelsPerPackage}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      labelsPerPackage: e.target.value,
                    }))
                  }
                  placeholder="1"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Price (UGX)</label>
              <Input
                type="number"
                min={0}
                value={form.priceUgx}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, priceUgx: e.target.value }))
                }
                placeholder="5000"
              />
            </div>
            <div className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="text-sm text-gray-700">Active</div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, isActive: checked }))
                }
              />
            </div>
          </DialogBody>
          <DialogFooter className="flex items-center justify-between">
            <Button variant="light" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeedLabelPackagesPage;

const SeedLabelPackagesGrid = ({
  packages,
  onEdit,
  onDelete,
}: {
  packages: SeedLabelPackage[];
  onEdit: (pkg: SeedLabelPackage) => void;
  onDelete: (pkg: SeedLabelPackage) => void;
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

  const columns = useMemo<ColumnDef<SeedLabelPackage>[]>(
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
            title="Package"
            column={column}
            filter={<ColumnInputFilter column={column} />}
          />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800 font-medium">
            {row.original.name}
          </span>
        ),
        meta: { className: "min-w-[200px]" },
      },
      {
        accessorKey: "packageSizeKg",
        id: "packageSizeKg",
        header: ({ column }) => (
          <DataGridColumnHeader title="Size (kg)" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row.original.packageSizeKg}</span>
        ),
        meta: { className: "min-w-[120px]" },
      },
      {
        accessorKey: "labelsPerPackage",
        id: "labelsPerPackage",
        header: ({ column }) => (
          <DataGridColumnHeader title="Labels/Package" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row.original.labelsPerPackage}</span>
        ),
        meta: { className: "min-w-[160px]" },
      },
      {
        accessorKey: "priceUgx",
        id: "priceUgx",
        header: ({ column }) => (
          <DataGridColumnHeader title="Price (UGX)" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">
            {formatNumber(row.original.priceUgx)}
          </span>
        ),
        meta: { className: "min-w-[140px]" },
      },
      {
        accessorKey: "isActive",
        id: "isActive",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              row.original.isActive
                ? "bg-emerald-100 text-emerald-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                row.original.isActive ? "bg-emerald-600" : "bg-gray-400"
              }`}
            />
            {row.original.isActive ? "Active" : "Inactive"}
          </span>
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
              >
                Delete
              </Button>
            </div>
          </div>
        ),
        meta: { headerClassName: "w-[200px]" },
      },
    ],
    [onEdit, onDelete],
  );

  const HeaderToolbar = () => {
    const { table } = useDataGrid();
    const [searchInput, setSearchInput] = useState("");
    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">
          Showing {packages.length} packages
        </h3>
        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="Search packages"
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
    <DataGrid<SeedLabelPackage>
      columns={columns}
      data={packages}
      rowSelection={true}
      layout={{ card: true, cellSpacing: "xs", cellBorder: true }}
      toolbar={<HeaderToolbar />}
      messages={{ loading: "Loading...", empty: "No packages found" }}
    />
  );
};
