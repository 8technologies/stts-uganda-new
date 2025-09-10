import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { LOAD_USERS, ROLES } from '@/gql/queries';
import { CREATE_USER, DELETE_USER } from '@/gql/mutations';
import { Container } from '@/components/container';
import { Toolbar, ToolbarActions, ToolbarHeading } from '@/layouts/demo1/toolbar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toAbsoluteUrl } from '@/utils';
import { toast } from 'sonner';
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridRowSelect,
  DataGridRowSelectAll,
  useDataGrid,
  KeenIcon
} from '@/components';
import { Column, ColumnDef } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { MAIN_URL, URL_2 } from '@/config/urls';

type User = {
  id: string | number;
  username: string;
  first_name?: string;
  other_names?: string;
  email?: string;
  district?: string;
  image?: string | null;
  role_id?: string;
  role_name?: string[];
  created_at?: string;
};

const UserFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
  initialValues,
  rolesOptions
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  loading: boolean;
  initialValues?: (Partial<User> & { password?: string }) | null;
  rolesOptions: { id: string | number; name: string }[];
}) => {
  const [form, setForm] = useState({
    id: '',
    username: '',
    first_name: '',
    other_names: '',
    email: '',
    district: '',
    imageFile: null as File | null,
    previewUrl: '',
    password: '',
    roleId: ''
  });

  useEffect(() => {
    if (open) {
      setForm({
        id: String(initialValues?.id ?? ''),
        username: initialValues?.username ?? '',
        first_name: initialValues?.first_name ?? '',
        other_names: initialValues?.other_names ?? '',
        email: initialValues?.email ?? '',
        district: initialValues?.district ?? '',
        imageFile: null,
        previewUrl: initialValues?.image ? `${URL_2}/imgs/${initialValues.image}` : '',
        password: '',
        roleId: ''
      });
      const initRoles = (initialValues as any)?.role_name || (initialValues as any)?.roles;
      if (Array.isArray(initRoles) && initRoles.length > 0) {
        const match = rolesOptions.find((r) => r.name === initRoles[0]);
        if (match) setForm((prev) => ({ ...prev, roleId: String(match.id) }));
      }
    }
  }, [open, initialValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = {
      id: form.id ? String(form.id) : null,
      username: form.username,
      first_name: form.first_name,
      other_names: form.other_names,
      email: form.email,
      district: form.district,
      password: form.password || undefined
    };
    if (form.imageFile) {
      payload.image = form.imageFile;
    }
    if (form.roleId) {
      payload.role_id = String(form.roleId);
    }
    onSubmit({ payload });
  };

  const isEditing = !!form.id;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[840px] lg:max-w-[800px]">
        <SheetHeader className="mb-4">
          <SheetTitle>{isEditing ? 'Edit User' : 'Create User'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">First Name</label>
              <Input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required={!isEditing}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Other Names</label>
              <Input
                value={form.other_names}
                onChange={(e) => setForm({ ...form, other_names: e.target.value })}
                required={!isEditing}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required={!isEditing}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">District</label>
              <Input
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                required={!isEditing}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const url = URL.createObjectURL(file);
                  setForm((prev) => ({ ...prev, imageFile: file, previewUrl: url }));
                }}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                required={!isEditing}
              />
              {form.previewUrl && (
                <img
                  src={form.previewUrl}
                  alt="Preview"
                  className="mt-2 h-20 w-20 rounded-md object-cover"
                />
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Role</label>
              <Select
                value={form.roleId}
                onValueChange={(v) => setForm((prev) => ({ ...prev, roleId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {rolesOptions.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEditing && form.roleId && (
                <div className="mt-1 text-xs text-gray-600">
                  Selected role:
                  <span className="badge badge-sm ml-2">
                    {rolesOptions.find((r) => String(r.id) === String(form.roleId))?.name || '—'}
                  </span>
                </div>
              )}
            </div>
            {!isEditing && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Please wait…' : isEditing ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

const UserPreviewDialog = ({
  open,
  onOpenChange,
  user
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}) => {
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Preview User</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="flex items-start gap-4">
            <img
              src={
                user.image
                  ? `${URL_2}/imgs/${user.image}`
                  : toAbsoluteUrl('/media/avatars/blank.png')
              }
              alt={user.username}
              className="size-14 rounded-full object-cover"
            />
            <div className="space-y-1">
              <div className="text-base font-semibold text-gray-900">{user.username}</div>
              <div className="text-sm text-gray-700">
                {user.first_name} {user.other_names}
              </div>
              <div className="text-sm text-gray-700">{user.email}</div>
              <div className="text-sm text-gray-700">{user.district}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {Array.isArray((user as any).role_name || (user as any).roles)
                  ? ((user as any).role_name || (user as any).roles).map(
                      (r: string, idx: number) => (
                        <span key={idx} className="badge badge-sm">
                          {r}
                        </span>
                      )
                    )
                  : null}
              </div>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

const UsersListPage = () => {
  const { data, loading, error } = useQuery(LOAD_USERS);
  const { data: rolesData } = useQuery(ROLES);
  const [createUser, { loading: saving }] = useMutation(CREATE_USER, {
    refetchQueries: [{ query: LOAD_USERS }],
    awaitRefetchQueries: true
  });
  const [deleteUser] = useMutation(DELETE_USER, {
    refetchQueries: [{ query: LOAD_USERS }],
    awaitRefetchQueries: true
  });

  const users = (data?.users || []) as User[];
  const rolesOptions = useMemo(
    () => ((rolesData?.roles || []) as any[]).map((r) => ({ id: r.id, name: r.name })),
    [rolesData?.roles]
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [previewUser, setPreviewUser] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };
  const handleDelete = async (user: User) => {
    if (!window.confirm(`Delete user "${user.username}"?`)) return;
    try {
      setDeletingId(String(user.id));
      await deleteUser({ variables: { userId: String(user.id) } });
      toast('User deleted');
    } catch (e: any) {
      toast('Failed to delete user', { description: e?.message ?? 'Unknown error' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSubmit = async ({ payload }: { payload: any }) => {
    try {
      await createUser({ variables: { payload } });
      toast(payload?.id ? 'User updated' : 'User created');
      setIsFormOpen(false);
    } catch (e: any) {
      toast('Failed to save user', { description: e?.message ?? 'Unknown error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Container>
        <Toolbar>
          <ToolbarHeading title="Users" description="Manage users and their roles" />
          <ToolbarActions>
            <a href="#" className="btn btn-sm btn-primary" onClick={handleCreate}>
              New User
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
          <div className="p-6 text-danger bg-white rounded-lg border">Failed to load users</div>
        ) : (
          <UsersDataGrid
            users={users}
            onPreview={(u) => setPreviewUser(u)}
            onEdit={(u) => handleEdit(u)}
            onDelete={(u) => handleDelete(u)}
            deletingId={deletingId}
          />
        )}
      </Container>

      <UserFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        loading={saving}
        initialValues={editingUser}
        rolesOptions={rolesOptions}
      />

      <UserPreviewDialog
        open={!!previewUser}
        onOpenChange={() => setPreviewUser(null)}
        user={previewUser}
      />
    </div>
  );
};

const UsersDataGrid = ({
  users,
  onPreview,
  onEdit,
  onDelete,
  deletingId
}: {
  users: User[];
  onPreview: (u: User) => void;
  onEdit: (u: User) => void;
  onDelete: (u: User) => void;
  deletingId: string | null;
}) => {
  const ColumnInputFilter = <TData, TValue>({ column }: { column: Column<TData, TValue> }) => (
    <Input
      placeholder="Filter..."
      value={(column.getFilterValue() as string) ?? ''}
      onChange={(event) => column.setFilterValue(event.target.value)}
      className="h-9 w-full max-w-40"
    />
  );

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'id',
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: 'w-0' }
      },
      {
        accessorFn: (row: User) => row.username,
        id: 'user',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Users"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <img
              src={
                row.original.image
                  ? `${URL_2}/imgs/${row.original.image}`
                  : toAbsoluteUrl('/media/avatars/blank.png')
              }
              className="rounded-full size-8 shrink-0 object-cover"
              alt={row.original.username}
            />
            <div>
              <div className="text-sm font-semibold text-gray-800">{`${row.original.first_name} ${row.original.other_names}`}</div>
              <div className="text-xs text-gray-600">{`@${row.original.username}`}</div>
            </div>
          </div>
        ),
        meta: { className: 'min-w-[240px]' }
      },
      {
        accessorFn: (row: User) => row.role_name || (row as any).roles,
        id: 'role',
        header: ({ column }) => <DataGridColumnHeader title="Role" column={column} />,
        cell: ({ row }) => (
          <span className="badge badge-success shrink-0 badge-outline rounded-[30px]">
            {row.original.role_name}
          </span>
        ),
        meta: { className: 'min-w-[300px]' }
      },
      {
        accessorFn: (row: User) => row.email,
        id: 'email',
        header: ({ column }) => <DataGridColumnHeader title="Email" column={column} />,
        cell: ({ row }) => <span className="text-gray-800">{row.original.email}</span>,
        meta: { className: 'min-w-[180px]' }
      },
      {
        accessorFn: (row: User) => row.district,
        id: 'district',
        header: ({ column }) => <DataGridColumnHeader title="District" column={column} />,
        cell: ({ row }) => <span className="text-gray-800">{row.original.district || '-'}</span>,
        meta: { className: 'min-w-[160px]' }
      },
      {
        id: 'actions',
        header: () => '',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <div className="inline-flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onPreview(row.original)}>
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(row.original)}
                disabled={String(deletingId) === String(row.original.id)}
              >
                {String(deletingId) === String(row.original.id) ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        ),
        meta: { headerClassName: 'w-[220px]' }
      }
    ],
    [deletingId]
  );

  const HeaderToolbar = () => {
    const { table } = useDataGrid();
    const [searchInput, setSearchInput] = useState('');
    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">Showing {users.length} users</h3>
        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="Search users"
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  table.getColumn('user')?.setFilterValue(val);
                }}
              />
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataGrid<User>
      columns={columns}
      data={users}
      rowSelection={true}
      layout={{ card: true, cellSpacing: 'xs', cellBorder: true }}
      toolbar={<HeaderToolbar />}
      messages={{ loading: 'Loading...', empty: 'No users found' }}
    />
  );
};

export { UsersListPage };
