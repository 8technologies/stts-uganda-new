/* eslint-disable prettier/prettier */
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
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
import { SAVE_SR4_FORMS } from '@/gql/mutations';
import { useAuthContext } from '@/auth';
import { getPermissionsFromToken } from '@/utils/permissions';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

type Sr4Application = {
  id: string;
  status?: string | null;
  type: 'seed_merchant' | 'seed_exporter_or_importer';
  inspector?: { name?: string; district?: string } | null;
  user?: {
    name?: string;
    username?: string;
    company_initials?: string;
    email?: string;
    district?: string;
    premises_location?: string;
  };
  sr4_applications?: any[];
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
  const [saveForm, { loading: savingEdit }] = useMutation(SAVE_SR4_FORMS, {
    refetchQueries: [{ query: LOAD_SR4_FORMS }],
    awaitRefetchQueries: true
  });

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

  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canManageAllForms = !!perms['can_manage_all_forms'];

  const formatDateTime = (iso?: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return iso as string;
    }
  };

  const columns = useMemo<ColumnDef<IUsersData>[]>(() => {
    const cols: ColumnDef<IUsersData>[] = [
      {
        id: 'select',
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: 'w-0' }
      },
      {
        accessorFn: (row) => row.created_at ?? '',
        id: 'created_at',
        header: ({ column }) => <DataGridColumnHeader title="Created On" column={column} />,
        enableSorting: true,
        cell: (info) => formatDateTime(info.row.original.created_at),
        meta: { headerClassName: 'min-w-[160px]', cellClassName: 'text-gray-800 font-normal' }
      }
    ];

    if (canManageAllForms) {
      cols.push({
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
        cell: ({ row }) => (
          <div className="flex items-center gap-4">
            <img
              src={toAbsoluteUrl(`/media/avatars/${row.original.user.avatar}`)}
              className="rounded-full size-9 shrink-0"
              alt={`${row.original.user.userName}`}
            />
            <div className="flex flex-col gap-0.5">
              <Link
                to="#"
                className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
              >
                {row.original.user.userName}
              </Link>
            </div>
          </div>
        ),
        meta: {
          className: 'min-w-[200px]',
          headerClassName: 'min-w-[200px]',
          cellClassName: 'text-gray-800 font-normal'
        }
      });
    }

    cols.push(
      {
        accessorFn: (row) => row.role,
        id: 'role',
        header: ({ column }) => (
          <DataGridColumnHeader title="Application Category" column={column} />
        ),
        enableSorting: true,
        cell: (info) => info.row.original.role,
        meta: { headerClassName: 'min-w-[180px]' }
      },
      {
        accessorFn: (row) => row.status.label,
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
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
      // {
      //   accessorFn: (row) => row.location,
      //   id: 'location',
      //   header: ({ column }) => <DataGridColumnHeader title="Location" column={column} />,
      //   enableSorting: true,
      //   cell: (info) => (
      //     <div className="flex items-center text-gray-800 font-normal gap-1.5">
      //       {info.row.original.location}
      //     </div>
      //   ),
      //   meta: { headerClassName: 'min-w-[120px]' }
      // },
      {
        accessorFn: (row) => row.activity,
        id: 'activity',
        header: ({ column }) => <DataGridColumnHeader title="Inspector" column={column} />,
        enableSorting: true,
        cell: (info) =>
          info.row.original.activity != '-' ? (
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
          ),
        meta: { headerClassName: 'min-w-[160px]', cellClassName: 'text-gray-800 font-normal' }
      },
      // {
      //   accessorFn: (row) => row.activity,
      //   id: 'created_by',
      //   header: ({ column }) => <DataGridColumnHeader title="Created By" column={column} />,
      //   enableSorting: true,
      //   cell: (info) => info.row.original.created_user,
      //   meta: { headerClassName: 'min-w-[160px]', cellClassName: 'text-gray-800 font-normal' }
      // },
      {
        accessorFn: (row) => row.activity,
        id: 'expires_on',
        header: ({ column }) => <DataGridColumnHeader title="Expires On" column={column} />,
        enableSorting: true,
        cell: (info) => info.row.original?.valid_until,
        meta: { headerClassName: 'min-w-[150px]', cellClassName: 'text-gray-800 font-normal' }
      },
      {
        id: 'edit',
        header: () => '',
        enableSorting: false,
        cell: (info) => (
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
        ),
        meta: { headerClassName: 'w-[60px]' }
      }
    );

    return cols;
  }, [canManageAllForms]);

  const forms = (data?.sr4_applications || []) as Sr4Application[];
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const mapped: IUsersData[] = forms.map((f) => ({
    user: {
      avatar: 'blank.png',
      userName: f.user.name,
      userGmail: f.phone_number || ''
    },
    role: f.type === 'seed_merchant' ? 'Seed Merchant/Company' : 'Seed Exporter/Importer',
    status: { label: f.status || 'pending', color: statusToColor(f.status) },
    location: f.user.premises_location || f.user.premises_location || '-',
    // flag: 'uganda.svg',
    activity: f.inspector ? `${f.inspector.name ?? ''} ${f.inspector.district ?? ''}`.trim() : '-',
    created_user: '-',
    valid_until: undefined as any,
    created_at: f.created_at,
    raw: f as any
  }));
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Sr4Application | null>(null);

  const handleEditSave = async (vals: Record<string, any>) => {
    if (!selectedForm?.id) return;
    const toBool = (v: any) => String(v).toLowerCase() === 'yes';
    const payload: any = {
      id: selectedForm.id,
      years_of_experience: vals.yearsOfExperience || null,
      experienced_in: vals.experienceIn || null,
      dealers_in: vals.dealersIn || null,
      marketing_of: vals.marketingOf || null,
      marketing_of_other: vals.otherMarketingOf || null,
      dealers_in_other: vals.otherDealersIn || null,
      status: null,
      have_adequate_land: toBool(vals.adequateLand),
      land_size: vals.landSize || null,
      have_adequate_equipment: toBool(vals.adequateEquipment),
      equipment: null,
      have_contractual_agreement: toBool(vals.contractualAgreement),
      have_adequate_field_officers: toBool(vals.fieldOfficers),
      have_conversant_seed_matters: toBool(vals.conversantSeedMatters),
      have_adequate_land_for_production: toBool(vals.adequateLandForProduction),
      have_internal_quality_program: toBool(vals.internalQualityProgram),
      have_adequate_storage: toBool(vals.adequateStorage),
      source_of_seed: vals.sourceOfSeed || null,
      // seed_board_registration_number: vals.registrationNumber || null,
      type: vals.applicationCategory
    };
    if (vals.receipt) {
      payload.receipt = vals.receipt;
    }
    try {
      await saveForm({ variables: { payload } });
      // Sync category filter with the newly saved application category
      if (vals.applicationCategory) {
        setTypeFilter(vals.applicationCategory);
      }
      setEditOpen(false);
      toast('SR4 application updated');
    } catch (e: any) {
      toast('Failed to update application', { description: e?.message ?? 'Unknown error' });
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

  const Toolbar = ({
    typeFilter,
    setTypeFilter
  }: {
    typeFilter: string;
    setTypeFilter: (v: string) => void;
  }) => {
    const { table } = useDataGrid();
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const total = mapped.length;
    const shown = table?.getFilteredRowModel?.().rows.length ?? total;

    // Keep table's role column filter in sync with selected type filter
    useEffect(() => {
      const label =
        typeFilter === 'seed_merchant'
          ? 'Seed Merchant/Company'
          : typeFilter === 'seed_exporter_or_importer'
            ? 'Seed Exporter/Importer'
            : '';
      table.getColumn('role')?.setFilterValue(label);
    }, [typeFilter, table]);

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
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)}>
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
        sorting={canManageAllForms ? ([{ id: 'users', desc: false }] as any) : ([] as any)}
        toolbar={<Toolbar typeFilter={typeFilter} setTypeFilter={setTypeFilter} />}
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
        onSave={handleEditSave}
        saving={savingEdit}
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
