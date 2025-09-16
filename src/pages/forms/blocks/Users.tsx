/* eslint-disable prettier/prettier */
import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { LOAD_SR4_FORMS } from '@/gql/queries';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/utils';
import {
  DataGrid,
  DataGridColumnHeader,
  KeenIcon,
  useDataGrid,
  DataGridRowSelectAll,
  DataGridRowSelect
} from '@/components';
import { ColumnDef, Column, RowSelectionState } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { UsersData, IUsersData } from './UsersData';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserEditDialog } from './UserEditDialog';
import { UserDetailsDialog } from './UserDetailsDialog';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

type Sr4Application = {
  id: string;
  name_of_applicant: string;
  address: string;
  phone_number: string;
  company_initials: string;
  premises_location: string;
  status?: string | null;
  type: 'seed_merchant' | 'seed_exporter_or_importer';
  inspector?: { first_name?: string; other_names?: string } | null;
};

const statusToColor = (status?: string | null) => {
  switch (status) {
    case 'accepted':
    case 'recommended':
      return 'success';
    case 'rejected':
    case 'halted':
      return 'danger';
    case 'assigned_inspector':
    case 'pending':
    default:
      return 'primary';
  }
};

const Users = () => {
  const { data, loading, error, refetch } = useQuery(LOAD_SR4_FORMS);
  const ColumnInputFilter = <TData, TValue>({ column }: IColumnFilterProps<TData, TValue>) => {
    return (
      <Input
        placeholder="Filter..."
        value={(column.getFilterValue() as string) ?? ''}
        onChange={(event) => column.setFilterValue(event.target.value)}
        className="h-9 w-full max-w-40"
      />
    );
  };

  const columns = useMemo<ColumnDef<IUsersData>[]>(
    () => [
      {
        id: 'select',
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerClassName: 'w-0'
        }
      },
      {
        accessorFn: (row: IUsersData) => row.user.userName,
        id: 'users',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Name of Applicant"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          // 'row' argumentini cell funksiyasiga qo'shdik
          return (
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-0.5">
                <Link
                  to="#"
                  className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                >
                  {row.original.user.userName}
                </Link>

                {/* <Link
                  to="#"
                  className="text-2sm text-gray-700 font-normal hover:text-primary-active"
                >
                  {row.original.user.userGmail}
                </Link> */}
              </div>
            </div>
          );
        },
        meta: {
          className: 'min-w-[200px]',
          headerClassName: 'min-w-[200px]',
          cellClassName: 'text-gray-800 font-normal'
        }
      },
      {
        accessorFn: (row) => row.role,
        id: 'role',
        header: ({ column }) => (
          <DataGridColumnHeader title="Application Category" column={column} />
        ),
        enableSorting: true,
        cell: (info) => {
          return info.row.original.role;
        },
        meta: {
          headerClassName: 'min-w-[180px]'
        }
      },
      {
        // return label for filtering
        accessorFn: (row) => row.status.label,
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return (
            <span
              className={`badge badge-${info.row.original.status.color} shrink-0 badge-outline rounded-[30px]`}
            >
              <span
                className={`size-1.5 rounded-full bg-${info.row.original.status.color} me-1.5`}
              ></span>
              {info.row.original.status.label}
            </span>
          );
        },
        meta: {
          headerClassName: 'min-w-[120px]'
        }
      },
      {
        accessorFn: (row) => row.location,
        id: 'location',
        header: ({ column }) => <DataGridColumnHeader title="Location" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return (
            <div className="flex items-center text-gray-800 font-normal gap-1.5">
              {/* <img
                src={toAbsoluteUrl(`/media/flags/${info.row.original.flag}`)}
                className="rounded-full size-4 shrink-0"
                alt={`${info.row.original.user.userName}`}
              /> */}
              {info.row.original.location}
            </div>
          );
        },
        meta: {
          headerClassName: 'min-w-[120px]'
        }
      },
      {
        accessorFn: (row) => row.activity,
        id: 'activity',
        header: ({ column }) => <DataGridColumnHeader title="Inspector" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return info.row.original.activity != '-' ? (
            <div className="flex items-center gap-2">
              <img
                src={toAbsoluteUrl(`/media/avatars/${info.row.original.user.avatar}`)}
                className="rounded-full size-9 shrink-0"
                alt={`${info.row.original.user.userName}`}
              />
              {info.row.original.activity}
            </div>
          ) : (
            info.row.original.activity
          );
        },
        meta: {
          headerClassName: 'min-w-[160px]',
          cellClassName: 'text-gray-800 font-normal'
        }
      },
      {
        accessorFn: (row) => row.activity,
        id: 'created_by',
        header: ({ column }) => <DataGridColumnHeader title="Created By" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return info.row.original.created_user;
        },
        meta: {
          headerClassName: 'min-w-[160px]',
          cellClassName: 'text-gray-800 font-normal'
        }
      },
      {
        accessorFn: (row) => row.activity,
        id: 'expires_on',
        header: ({ column }) => <DataGridColumnHeader title="Expires On" column={column} />,
        enableSorting: true,
        cell: (info) => {
          return info.row.original?.valid_until;
        },
        meta: {
          headerClassName: 'min-w-[150px]',
          cellClassName: 'text-gray-800 font-normal'
        }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: (info) => {
          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="btn btn-sm btn-icon btn-clear btn-light">
                    <KeenIcon icon="dots-vertical" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[190px]">
                  <DropdownMenuLabel className="font-medium">Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedForm((info.row.original as any).raw);
                      setEditOpen(true);
                    }}
                  >
                    <KeenIcon icon="note" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedForm((info.row.original as any).raw);
                      setDetailsOpen(true);
                    }}
                  >
                    <KeenIcon icon="eye" /> Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => console.log('Print Certificate', info.row.original)}
                  >
                    <KeenIcon icon="printer" /> Print Certificate
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          );
        },
        meta: {
          headerClassName: 'w-[60px]'
        }
      }
    ],
    []
  );

  const forms = (data?.sr4_applications || []) as Sr4Application[];
  const mapped: IUsersData[] = useMemo(
    () =>
      forms.map((f) => ({
        user: {
          avatar: 'blank.png',
          userName: f.name_of_applicant,
          userGmail: f.phone_number || ''
        },
        role: f.type === 'seed_merchant' ? 'Seed Merchant/Company' : 'Seed Exporter/Importer',
        status: { label: f.status || 'pending', color: statusToColor(f.status) },
        location: f.premises_location || f.address || '-',
        // flag: 'uganda.svg',
        activity: f.inspector
          ? `${f.inspector.first_name ?? ''} ${f.inspector.other_names ?? ''}`.trim()
          : '-',
        created_user: '-',
        valid_until: undefined as any,
        raw: f as any
      })),
    [forms]
  );
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Sr4Application | null>(null);

  const handleRowSelection = (state: RowSelectionState) => {
    const selectedRowIds = Object.keys(state);

    if (selectedRowIds.length > 0) {
      toast(`Total ${selectedRowIds.length} are selected.`, {
        description: `Selected row IDs: ${selectedRowIds}`,
        action: {
          label: 'Undo',
          onClick: () => console.log('Undo')
        }
      });
    }
  };

  const Toolbar = () => {
    const { table } = useDataGrid();
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const total = mapped.length;
    const shown = table?.getFilteredRowModel?.().rows.length ?? total;

    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">
          Showing {shown} of {total} applications
        </h3>

        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="Search applicant"
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  table.getColumn('users')?.setFilterValue(val);
                }}
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Status filter */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                table.getColumn('status')?.setFilterValue(v === 'all' ? '' : v);
              }}
            >
              <SelectTrigger className="w-36" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="w-40">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="halted">Halted</SelectItem>
                <SelectItem value="assigned_inspector">Assigned inspector</SelectItem>
                <SelectItem value="recommended">Recommended</SelectItem>
              </SelectContent>
            </Select>

            {/* Category filter */}
            <Select
              value={typeFilter}
              onValueChange={(v) => {
                setTypeFilter(v);
                const label =
                  v === 'seed_merchant'
                    ? 'Seed Merchant/Company'
                    : v === 'seed_exporter_or_importer'
                      ? 'Seed Exporter/Importer'
                      : '';
                table.getColumn('role')?.setFilterValue(label);
              }}
            >
              <SelectTrigger className="w-48" size="sm">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="w-56">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="seed_merchant">Seed Merchant/Company</SelectItem>
                <SelectItem value="seed_exporter_or_importer">Seed Exporter/Importer</SelectItem>
              </SelectContent>
            </Select>

            <button className="btn btn-sm btn-outline btn-primary">
              <KeenIcon icon="setting-4" /> Filters
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2 text-red-700">
          Failed to load SR4 applications
          <button className="btn btn-sm" onClick={() => refetch()}>
            <KeenIcon icon="arrow-rotate-right" /> Retry
          </button>
        </div>
        <div className="text-xs text-gray-600">{String(error.message || 'Unknown error')}</div>
      </div>
    );
  }

  return (
    <>
      <DataGrid
        columns={columns}
        data={mapped}
        rowSelection={true}
        onRowSelectionChange={handleRowSelection}
        pagination={{ size: 5 }}
        sorting={[{ id: 'users', desc: false }]}
        toolbar={<Toolbar />}
        layout={{ card: true, cellSpacing: 'xs', cellBorder: true }}
        messages={{
          loading: loading,
          empty: 'No SR4 applications found'
        }}
      />

      <UserEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        data={selectedForm || undefined}
        onSave={(vals) => console.log('Save edit', { row: selectedForm, vals })}
      />
      <UserDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        data={selectedForm || undefined}
      />
    </>
  );
};

export { Users };
