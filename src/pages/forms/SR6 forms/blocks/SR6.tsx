/* eslint-disable prettier/prettier */
import { useMemo, useState } from 'react';
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
import { SR6Data, ISR6Data } from './SR6Data';
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
import { SR6EditDialog } from './SR6EditDialog';
import { SR6DetailsDialog } from './SR6DetailsDialog';
import { LOAD_SR6_FORMS } from '@/gql/queries';
import { useMutation, useQuery } from '@apollo/client/react';
import { SAVE_SR6_FORMS } from '@/gql/mutations';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

type Sr6Application = {
  id: string;
  status?: string | null;
  type: 'seed_breeder' | 'seed_producer';
  inspector?: { name?: string; district?: string } | null;
  user?: {
    name?: string;
    username?: string;
    company_initials?: string;
    email?: string;
    district?: string;
    phone_number?: string;
    premises_location?: string;
  };
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

const SR6s = () => {
  const { data, loading, error, refetch } = useQuery(LOAD_SR6_FORMS);
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

  const columns = useMemo<ColumnDef<ISR6Data>[]>(
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
        accessorFn: (row: ISR6Data) => row.user.userName,
        id: 'users',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Name of Applicant"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        enableSorting: true,
        // cell: ({ row }) => {
        //   // 'row' argumentini cell funksiyasiga qo'shdik
        //   return (
        //     <div className="flex items-center gap-4">
        //       <div className="flex flex-col gap-0.5">
        //         <Link
        //           to="#"
        //           className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
        //         >
        //           {row.original.user.userName}
        //         </Link>

        //         {/* <Link
        //           to="#"
        //           className="text-2sm text-gray-700 font-normal hover:text-primary-active"
        //         >
        //           {row.original.user.userGmail}
        //         </Link> */}
        //       </div>
        //     </div>
        //   );

        // },
        cell: (info) => {
          return info.row.original.user.userName != '-' ? (
            <div className="flex items-center gap-2">
              <img
                src={toAbsoluteUrl(`/media/avatars/${info.row.original.user.avatar}`)}
                className="rounded-full size-9 shrink-0"
                alt={`${info.row.original.user.userName}`}
              />
              {info.row.original.user.userName}
            </div>
          ) : (
            info.row.original.user.userName
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

                  {info.row.original.status.label === 'pending' && (
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedForm((info.row.original as any).raw);
                        setEditOpen(true);
                      }}
                    >
                      <KeenIcon icon="note" /> Edit
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedForm((info.row.original as any).raw);
                      setDetailsOpen(true);
                    }}
                  >
                    <KeenIcon icon="eye" /> Details
                  </DropdownMenuItem>

                  {/* <DropdownMenuItem
                    onClick={() => console.log('Print Certificate', info.row.original)}
                  >
                    <KeenIcon icon="printer" /> Print Certificate
                  </DropdownMenuItem> */}
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

  const forms = (data?.sr6_applications || []) as Sr6Application[];
  const mapped: ISR6Data[] = useMemo(
    () =>
      forms.map((f) => ({
        user: {
          avatar: 'blank.png',
          userName: f.user.name,
          userGmail: f.phone_number || ''
        },
        role: f.type === 'seed_breeder' ? 'Seed Breeder' : 'Seed Producer',
        status: { label: f.status || 'pending', color: statusToColor(f.status) },
        location: f.user.premises_location || f.user.premises_location || '-',
        // flag: 'uganda.svg',
        activity: f.inspector
          ? `${f.inspector.name ?? ''} ${f.inspector.district ?? ''}`.trim()
          : '-',
        created_user: '-',
        valid_until: undefined as any,
        raw: f as any
      })),
    [forms]
  );
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Sr6Application | null>(null);
  const [saveForm, { loading: saving }] = useMutation(SAVE_SR6_FORMS, {
    refetchQueries: [{ query: LOAD_SR6_FORMS }],
    awaitRefetchQueries: true
  });

  const handleSave = async (vals: Record<string, any>) => {
    const toBool = (v: any) => String(v).toLowerCase() === 'yes';
    const payload: any = {
      years_of_experience: vals.yearsOfExperience,
      dealers_in: null,
      previous_grower_number: vals.previousGrowerNumber,
      cropping_history: vals.croppingHistory,
      have_adequate_isolation: toBool(vals.adequateIsolation),
      have_adequate_labor: toBool(vals.adequateLabour),
      aware_of_minimum_standards: toBool(vals.standardSeed),
      signature_of_applicant: null,
      grower_number: null,
      status: vals.status,
      inspector_id: null,
      status_comment: null,
      recommendation: null,
      have_adequate_storage: toBool(vals.adequateStorage),
      seed_grower_in_past: toBool(vals.BeenSeedGrower),
      type: vals.applicationCategory,
      id: vals?.id || null
    };

    try {
      await saveForm({ variables: { payload } });
      toast('SR6 application saved');
      setEditOpen(false);
    } catch (e: any) {
      toast('Failed to save application', { description: e?.message ?? 'Unknown error' });
    }
  };

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
          empty: 'No SR6 applications found'
        }}
      />

      <SR6EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        data={selectedForm || undefined}
        onSave={handleSave}
        saving={saving}
      />

      <SR6DetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        data={selectedForm || undefined}
      />
    </>
  );
};

export { SR6s };
