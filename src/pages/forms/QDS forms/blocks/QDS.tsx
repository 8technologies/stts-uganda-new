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
import { SR6Data, ISR6Data } from './QDSData';
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
import { KeenIcon as Icon } from '@/components';
import { Button } from '@/components/ui/button';
import { SR6DetailsDialog } from './QDSDetailsDialog';
import { LOAD_QDS_FORMS } from '@/gql/queries';
import { useMutation, useQuery } from '@apollo/client/react';
import { SAVE_QDS_FORMS } from '@/gql/mutations';// <-- new unified dialog
import { QDSFormDialog } from './QDSCreateDialog';

// --- Types ---
interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

type Qds = {
  id: string | number;
  certification: string;
  years_of_experience: string;
  dealers_in: string;
  previous_grower_number: string;
  cropping_history: string;
  have_adequate_isolation: boolean;
  have_adequate_labor: boolean;
  aware_of_minimum_standards: boolean;
  signature_of_applicant: string;
  grower_number: string;
  registration_number: string;
  status: any;
  have_been_qds: boolean;
  isolation_distance: number;
  number_of_labors: number;
  have_adequate_storage_facility: boolean;
  is_not_used: boolean;
  examination_category: number;
};

type QDSApplication = {
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
  } | null;
};

// --- Utils ---
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

// --- Main ---
const QDs = () => {
  const { data, loading, error, refetch } = useQuery(LOAD_QDS_FORMS);

  const ColumnInputFilter = <TData, TValue>({
    column
  }: IColumnFilterProps<TData, TValue>) => (
    <Input
      placeholder="Filter..."
      value={(column.getFilterValue() as string) ?? ''}
      onChange={(event) => column.setFilterValue(event.target.value)}
      className="h-9 w-full max-w-40"
    />
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQds, setEditingQds] = useState<Qds | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<QDSApplication | null>(null);

  const [saveForm, { loading: saving }] = useMutation(SAVE_QDS_FORMS, {
    refetchQueries: [{ query: LOAD_QDS_FORMS }],
    awaitRefetchQueries: true
  });

  const handleSave = async (vals: Record<string, any>) => {
    const toBool = (v: any) => String(v).toLowerCase() === 'yes';
    const payload: any = {
      id: editingQds?.id ?? undefined,
      certification: vals.otherDocuments,
      years_of_experience: vals.yearsOfExperience,
      dealers_in: null,
      previous_grower_number: vals.previousGrowerNumber,
      cropping_history: vals.croppingHistory,
      have_adequate_isolation: toBool(vals.adequateIsolation),
      have_adequate_labor: toBool(vals.adequateLabour),
      aware_of_minimum_standards: toBool(vals.standardSeed),
      signature_of_applicant: null,
      grower_number: null,
      registration_number: vals.previousGrowerNumber,
      have_been_qds: toBool(vals.BeenQdsProducer),
      isolation_distance: vals.isolationDistance
        ? parseInt(vals.isolationDistance, 10)
        : 0,
      status: null,
      number_of_labors: vals.numberOfLabours
        ? parseInt(vals.numberOfLabours, 10)
        : 0,
      have_adequate_storage_facility: toBool(vals.adequateStorage),
      is_not_used: null,
      examination_category: null
    };

    try {
      await saveForm({ variables: { payload } });
      toast(editingQds ? 'QDS application updated' : 'QDS application created');
      setDialogOpen(false);
      setEditingQds(null);
    } catch (e: any) {
      toast('Failed to save application', {
        description: e?.message ?? 'Unknown error'
      });
    }
  };

  // --- Columns ---
  const columns = useMemo<ColumnDef<ISR6Data>[]>(
    () => [
      {
        id: 'select',
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: 'w-0' }
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
        cell: (info) =>
          info.row.original.user.userName != '-' ? (
            <div className="flex items-center gap-2">
              <img
                src={toAbsoluteUrl(
                  `/media/avatars/${info.row.original.user.avatar}`
                )}
                className="rounded-full size-9 shrink-0"
                alt={`${info.row.original.user.userName}`}
              />
              {info.row.original.user.userName}
            </div>
          ) : (
            info.row.original.user.userName
          ),
        meta: {
          className: 'min-w-[200px]',
          headerClassName: 'min-w-[200px]',
          cellClassName: 'text-gray-800 font-normal'
        }
      },
      {
        accessorFn: (row) => row.status.label,
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        enableSorting: true,
        cell: (info) => (
          <span
            className={`badge badge-${info.row.original.status.color} shrink-0 badge-outline rounded-[30px]`}
          >
            <span
              className={`size-1.5 rounded-full bg-${info.row.original.status.color} me-1.5`}
            ></span>
            {info.row.original.status.label}
          </span>
        ),
        meta: { headerClassName: 'min-w-[120px]' }
      },
      {
        accessorFn: (row) => row.location,
        id: 'location',
        header: ({ column }) => (
          <DataGridColumnHeader title="Location" column={column} />
        ),
        enableSorting: true,
        cell: (info) => (
          <div className="flex items-center text-gray-800 font-normal gap-1.5">
            {info.row.original.location}
          </div>
        ),
        meta: { headerClassName: 'min-w-[120px]' }
      },
      {
        accessorFn: (row) => row.activity,
        id: 'activity',
        header: ({ column }) => (
          <DataGridColumnHeader title="Inspector" column={column} />
        ),
        enableSorting: true,
        cell: (info) =>
          info.row.original.activity != '-' ? (
            <div className="flex items-center gap-2">
              <img
                src={toAbsoluteUrl(
                  `/media/avatars/${info.row.original.user.avatar}`
                )}
                className="rounded-full size-9 shrink-0"
                alt={`${info.row.original.user.userName}`}
              />
              {info.row.original.activity}
            </div>
          ) : (
            info.row.original.activity
          ),
        meta: {
          headerClassName: 'min-w-[160px]',
          cellClassName: 'text-gray-800 font-normal'
        }
      },
      {
        accessorFn: (row) => row.activity,
        id: 'created_by',
        header: ({ column }) => (
          <DataGridColumnHeader title="Created By" column={column} />
        ),
        enableSorting: true,
        cell: (info) => info.row.original.created_user,
        meta: {
          headerClassName: 'min-w-[160px]',
          cellClassName: 'text-gray-800 font-normal'
        }
      },
      {
        accessorFn: (row) => row.activity,
        id: 'expires_on',
        header: ({ column }) => (
          <DataGridColumnHeader title="Expires On" column={column} />
        ),
        enableSorting: true,
        cell: (info) => info.row.original?.valid_until,
        meta: {
          headerClassName: 'min-w-[150px]',
          cellClassName: 'text-gray-800 font-normal'
        }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: (info) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="btn btn-sm btn-icon btn-clear btn-light">
                <KeenIcon icon="dots-vertical" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[190px]">
              <DropdownMenuLabel className="font-medium">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setEditingQds(info.row.original.raw as any);
                  setDialogOpen(true);
                }}
              >
                <KeenIcon icon="note" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedForm(info.row.original.raw as any);
                  setDetailsOpen(true);
                }}
              >
                <KeenIcon icon="eye" /> Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  console.log('Print Certificate', info.row.original)
                }
              >
                <KeenIcon icon="printer" /> Print Certificate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        meta: { headerClassName: 'w-[60px]' }
      }
    ],
    []
  );

  const forms = (data?.qds_applications || []) as QDSApplication[];
  const mapped: ISR6Data[] = useMemo(
    () =>
      forms.map((f) => ({
        user: {
          avatar: 'blank.png',
          userName: f.user?.name,
          userGmail: f.user?.phone_number || ''
        },
        role: f.type === 'seed_breeder' ? 'Seed Breeder' : 'Seed Producer',
        status: { label: f.status || 'pending', color: statusToColor(f.status) },
        location: f.user?.premises_location || '-',
        activity: f.inspector
          ? `${f.inspector.name ?? ''} ${f.inspector.district ?? ''}`.trim()
          : '-',
        created_user: '-',
        valid_until: undefined as any,
        raw: f as any
      })),
    [forms]
  );

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
                <SelectItem value="assigned_inspector">
                  Assigned inspector
                </SelectItem>
                <SelectItem value="recommended">Recommended</SelectItem>
              </SelectContent>
            </Select>

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
                <SelectItem value="seed_exporter_or_importer">
                  Seed Exporter/Importer
                </SelectItem>
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
          Failed to load Qds applications
          <button className="btn btn-sm" onClick={() => refetch()}>
            <KeenIcon icon="arrow-rotate-right" /> Retry
          </button>
        </div>
        <div className="text-xs text-gray-600">
          {String(error.message || 'Unknown error')}
        </div>
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
          empty: 'No QDS applications found'
        }}
      />

      <QDSFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        data={editingQds}
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

export { QDs };
