import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { LOAD_CROPS, LOAD_USERS, ROLES, SEEDLABELPACKAGES } from "@/gql/queries";
import { CREATE_USER, DELETE_USER, DELETESEEDLABELPACKAGE, SAVESEEDLABELPACKAGE } from "@/gql/mutations";
import { Container } from "@/components/container";
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from "@/layouts/demo1/toolbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toAbsoluteUrl } from "@/utils";
import { toast } from "sonner";
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridRowSelect,
  DataGridRowSelectAll,
  useDataGrid,
  KeenIcon,
} from "@/components";
import { Column, ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAIN_URL, URL_2 } from "@/config/urls";

type LabelPackage = {
  id: string | number;
  crop_id: string;
  quantity?: string;
  price?: number;
  created_at?: string;
  Crop:{
    name: string;
    units: string;
  }
};

const SeedLabelPackagesFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
  initialValues,
  cropsOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  loading: boolean;
  initialValues?: (Partial<LabelPackage> ) | null;
  cropsOptions: { id: string | number; name: string }[];
}) => {
  const [form, setForm] = useState({
    id: "",
    crop_id: "",
    quantity: "",
    price: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        id: String(initialValues?.id ?? ""),
        crop_id: initialValues?.crop_id || "",
        quantity: initialValues?.quantity || "",
        price: initialValues?.price ? String(initialValues?.price) : "",
      });
      const initRoles =
        (initialValues as any)?.role_name || (initialValues as any)?.roles;
      if (Array.isArray(initRoles) && initRoles.length > 0) {
        const match = cropsOptions.find((r) => r.name === initRoles[0]);
        if (match) setForm((prev) => ({ ...prev, roleId: String(match.id) }));
      }
    }
  }, [open, initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      id: form.id ? String(form.id) : null,
      crop_id: form.crop_id,
      quantity: form.quantity,
      price: form.price ? Number(form.price) : null,
      
    };
    
    onSubmit({ payload });
  };

  const isEditing = !!form.id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[440px] lg:max-w-[400px]"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>{isEditing ? "Edit Seed Label Package" : "Create Seed Label Package"}</SheetTitle>
        </SheetHeader>
        <form
          onSubmit={handleSubmit}
          className="h-full flex flex-col"
          style={{
            height: "calc(100vh - 75px)",
            overflow: "auto",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Crop
              </label>
              <Select
                value={form.crop_id}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, crop_id: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select crop" />
                </SelectTrigger>
                <SelectContent>
                  {cropsOptions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && form.crop_id && (
                <div className="mt-1 text-xs text-gray-600">
                  Selected crop:
                  <span className="badge badge-sm ml-2">
                    {cropsOptions.find(
                      (r) => String(r.id) === String(form.crop_id),
                    )?.name || "—"}
                  </span>
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Quantity 
              </label>
              <Input
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Price (UGX)
              </label>
              <Input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required={!isEditing}
              />
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
            <Button type="submit" disabled={loading}>
              {loading
                ? "Please wait…"
                : isEditing
                  ? "Save Changes"
                  : "Create User"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

const SeedLabelPackagesDialog = ({
  open,
  onOpenChange,
  labelpackage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labelpackage: LabelPackage | null;
}) => {
  if (!labelpackage) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Preview Label Package</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex items-start gap-4">
            {/* <img
              src={
                user.image
                  ? `${URL_2}/imgs/${user.image}`
                  : toAbsoluteUrl("/media/avatars/blank.png")
              }
              alt={user.username}
              className="size-14 rounded-full object-cover"
            /> */}
            <div className="space-y-1">
              <div className="text-base font-semibold text-gray-900">
                <label>Crop :</label>
                {labelpackage.Crop.name}
              </div>
              <div className="text-sm text-gray-700">
                <label>Quantity: </label>
                {labelpackage.quantity} {labelpackage.Crop.units}
              </div>
              <div className="text-sm text-gray-700">
                <label>Price :</label>
                {labelpackage.price}
              </div>
              {/* <div className="text-sm text-gray-700">{user.district}</div> */}
              {/* <div className="mt-2 flex flex-wrap gap-1">
                {Array.isArray((user as any).role_name || (user as any).roles)
                  ? ((user as any).role_name || (user as any).roles).map(
                      (r: string, idx: number) => (
                        <span key={idx} className="badge badge-sm">
                          {r}
                        </span>
                      ),
                    )
                  : null}
              </div> */}
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

const SeedLabelPackagesList = () => {
  const { data, loading, error } = useQuery(SEEDLABELPACKAGES);
  const { data: cropData } = useQuery(LOAD_CROPS);
  const [saveLabelPackage, { loading: saving }] = useMutation(SAVESEEDLABELPACKAGE, {
    refetchQueries: [{ query: SEEDLABELPACKAGES }],
    awaitRefetchQueries: true,
  });
  const [deleteLabelPackage] = useMutation(DELETESEEDLABELPACKAGE, {
    refetchQueries: [{ query: SEEDLABELPACKAGES }],
    awaitRefetchQueries: true,
  });

  const LabelPackages = (data?.getSeedLabelPackages || []) as LabelPackage[];
  const cropsOptions = useMemo(
    () =>
      ((cropData?.crops.items || []) as any[]).map((r) => ({
        id: r.id,
        name: r.name,
      })),
    [cropData?.crops.items],
  );
  console.log("crops", cropData?.crops.items);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<LabelPackage | null>(null);
  const [previewUser, setPreviewUser] = useState<LabelPackage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };
  const handleEdit = (labelPackage: LabelPackage) => {
    console.log("edit", labelPackage);
    setEditingUser(labelPackage);
    setIsFormOpen(true);
  };
  const handleDelete = async (labelPackage: LabelPackage) => {
    if (!window.confirm(`Delete label package for crop "${labelPackage.Crop.name}"?`)) return;
    try {
      setDeletingId(String(labelPackage.id));
      await deleteLabelPackage({ variables: { deleteSeedLabelPackageId: String(labelPackage.id) } });
      toast("User deleted");
    } catch (e: any) {
      toast("Failed to delete user", {
        description: e?.message ?? "Unknown error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async ({ payload }: { payload: any }) => {
    try {
      console.log("submit", payload);
      
      await saveLabelPackage({ variables: {input: payload } });
      toast(payload?.id ? "Seed label package updated" : "Seed label package created");
      setIsFormOpen(false);
    } catch (e: any) {
      toast("Failed to save seed label package", {
        description: e?.message ?? "Unknown error",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container>
        <Toolbar>
          <ToolbarHeading
            title="Seed Label Packages"
            description="Manage Seed Label Packages "
          />
          <ToolbarActions>
            <a
              href="#"
              className="btn btn-sm btn-primary"
              onClick={handleCreate}
            >
              New Seed Label Packages
            </a>
          </ToolbarActions>
        </Toolbar>
      </Container>
      <Container>
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
            Failed to load Label Packages
          </div>
        ) : (
          <LabelPackagesDataGrid
            LabelPackages={LabelPackages}
            onPreview={(u) => setPreviewUser(u)}
            onEdit={(u) => handleEdit(u)}
            onDelete={(u) => handleDelete(u)}
            deletingId={deletingId}
          />
        )}
      </Container>

      <SeedLabelPackagesFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        loading={saving}
        initialValues={editingUser}
        cropsOptions={cropsOptions}
      />

      <SeedLabelPackagesDialog
        open={!!previewUser}
        onOpenChange={() => setPreviewUser(null)}
        labelpackage={previewUser}
      />
    </div>
  );
};

const LabelPackagesDataGrid = ({
  LabelPackages,
  onPreview,
  onEdit,
  onDelete,
  deletingId,
}: {
  LabelPackages: LabelPackage[];
  onPreview: (u: LabelPackage) => void;
  onEdit: (u: LabelPackage) => void;
  onDelete: (u: LabelPackage) => void;
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

  const columns = useMemo<ColumnDef<LabelPackage>[]>(
    () => [
      {
        accessorKey: "id",
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: "w-0" },
      },
      {
        accessorFn: (row: LabelPackage) => row.Crop.name,
        id: "crops",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Crop"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            {/* <img
              src={
                row.original.image
                  ? `${URL_2}/imgs/${row.original.image}`
                  : toAbsoluteUrl("/media/avatars/blank.png")
              }
              className="rounded-full size-8 shrink-0 object-cover"
              alt={row.original.username}
            /> */}
            <div>
              <div className="text-sm font-semibold text-gray-800">{`${row.original.Crop.name}`}</div>
              {/* <div className="text-xs text-gray-600">{`@${row.original.Crop.name}`}</div> */}
            </div>
          </div>
        ),
        meta: { className: "min-w-[240px]" },
      },
      // {
      //   accessorFn: (row: User) => row.role_name || (row as any).roles,
      //   id: "role",
      //   header: ({ column }) => (
      //     <DataGridColumnHeader title="Role" column={column} />
      //   ),
      //   cell: ({ row }) => (
      //     <span className="badge badge-success shrink-0 badge-outline rounded-[30px]">
      //       {row.original.role_name}
      //     </span>
      //   ),
      //   meta: { className: "min-w-[300px]" },
      // },
      {
        accessorFn: (row: LabelPackage) => row.quantity,
        id: "quantity",
        header: ({ column }) => (
          <DataGridColumnHeader title="Package size" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row.original.quantity} {row.original.Crop.units}</span>
        ),
        meta: { className: "min-w-[180px]" },
      },
      {
        accessorFn: (row: LabelPackage) => row.price,
        id: "price",
        header: ({ column }) => (
          <DataGridColumnHeader title="Price (UGX)" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row.original.price || "-"}</span>
        ),
        meta: { className: "min-w-[160px]" },
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
                onClick={() => onPreview(row.original)}
              >
                Preview
              </Button>
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
        meta: { headerClassName: "w-[220px]" },
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
          Showing {LabelPackages.length} Label Packages
        </h3>
        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="Search Label Packages"
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  table.getColumn("user")?.setFilterValue(val);
                }}
              />
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataGrid<LabelPackage>
      columns={columns}
      data={LabelPackages}
      rowSelection={true}
      layout={{ card: true, cellSpacing: "xs", cellBorder: true }}
      toolbar={<HeaderToolbar />}
      messages={{ loading: "Loading...", empty: "No Label packages found" }}
    />
  );
};

export { SeedLabelPackagesList };
