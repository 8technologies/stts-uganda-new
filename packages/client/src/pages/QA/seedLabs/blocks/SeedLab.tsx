/* eslint-disable prettier/prettier */
import { useMemo, useState } from 'react';
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
import { SeedLabDetailsDialog } from './SeedLabDetailsDialog';
import { LOAD_SEED_LABS } from '@/gql/queries';
import { useQuery } from '@apollo/client/react';
import { _formatDate } from '@/utils/Date';

interface IColumnFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
}

type SeedLabInspection = {
  id: string;
  user_id: string | null;
  variety_id: string | null;
  stock_examination_id: string | null;
  collection_date: string | null;
  receipt_id: string | null;
  lot_number: string | null;
  applicant_remark: string | null;
  inspector_id: string | null;
  status: string | null;
  inspector_report: any | null;
  deleted: boolean;
  created_at: string | null;
  createdBy?: { username: string; name: string } | null;
  inspector?: { username: string; name: string } | null;
  variety?: { id: string; cropId: string; name: string } | null;
};

export type LabRow = {
  id: string;
  applicant: string;
  status: { label: string; color: 'success' | 'danger' | 'primary' | 'warning' | string };
  inspector: string;
  variety_id: string | null;
  stock_examination_id: string | null;
  receipt_id: string | null;
  collection_date: string | null;
  created_at: string | null;
  applicant_remark: string | null;
  raw: SeedLabInspection;
};

const statusToColor = (status?: string | null) => {
  switch (status) {
    case 'approved':
    case 'marketable':
      return 'success';
    case 'recommended':
      return 'info';
    case 'rejected':
    case 'halted':
    case 'not_marketable':
      return 'danger';
    case 'assigned_inspector':
    case 'pending':
    default:
      return 'warning';
  }
};

const ColumnInputFilter = <TData, TValue>({ column }: IColumnFilterProps<TData, TValue>) => (
  <Input
    placeholder="Filter…"
    value={(column.getFilterValue() as string) ?? ''}
    onChange={(e) => column.setFilterValue(e.target.value)}
    className="h-9 w-full max-w-40"
  />
);

const formatDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : '—');

const SeedLabs = () => {
  const { data, loading, error, refetch } = useQuery(LOAD_SEED_LABS);

  const labs = (data?.getLabInspections || []) as SeedLabInspection[];

  const mapped: LabRow[] = useMemo(
    () =>
      labs.map((f) => ({
        id: f.id,
        applicant: f.createdBy?.username || '-', // ✅ use createdBy.username
        status: { label: (f.status || 'PENDING').toUpperCase(), color: statusToColor(f.status) },
        inspector: f.inspector?.username || '-', // ✅ use inspector.username
        variety_id: f.variety.name || null,
        stock_examination_id: f.stock_examination_id || null,
        receipt_id: f.receipt_id || null,
        lot_number:f.lot_number || null,
        collection_date: f.collection_date,
        created_at: f.created_at,
        applicant_remark: f.applicant_remark || null,
        raw: f
      })),
    [labs]
  );

  const columns = useMemo<ColumnDef<LabRow>[]>(() => [
    {
      id: 'select',
      header: () => <DataGridRowSelectAll />,
      cell: ({ row }) => <DataGridRowSelect row={row} />,
      enableSorting: false,
      enableHiding: false,
      meta: { headerClassName: 'w-0' },
    },
    {
      accessorKey: 'applicant',
      id: 'applicant',
      header: ({ column }) => (
        <DataGridColumnHeader title="Applicant" filter={<ColumnInputFilter column={column} />} column={column} />
      ),
      cell: (info) => <span className="text-gray-800">{info.getValue<string>()}</span>,
      meta: { headerClassName: 'min-w-[180px]' },
    },
    {
      accessorFn: (row) => row.status.label,
      id: 'status',
      header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
      cell: (info) => {
        const color = info.row.original.status.color;
        const label = info.getValue<string>();
        return (
          <span className={`badge badge-${color} shrink-0 badge-outline rounded-[30px]`}>
            <span className={`size-1.5 rounded-full bg-${color} me-1.5`} />
            {label}
          </span>
        );
      },
      meta: { headerClassName: 'min-w-[120px]' },
    },
    {
      accessorKey: 'inspector',
      id: 'inspector',
      header: ({ column }) => (
        <DataGridColumnHeader title="Inspector" filter={<ColumnInputFilter column={column} />} column={column} />
      ),
      cell: (info) => <span className="text-gray-800">{info.getValue<string>()}</span>,
      meta: { headerClassName: 'min-w-[160px]' },
    },
    {
      accessorKey: 'variety_id',
      id: 'variety_id',
      header: ({ column }) => <DataGridColumnHeader title="Variety ID" column={column} />,
      cell: (info) => info.getValue<string>() || '—',
      meta: { headerClassName: 'min-w-[140px]' },
    },
    
    {
      accessorKey: 'lot_number',
      id: 'lot_number',
      header: ({ column }) => <DataGridColumnHeader title="Lot Number" column={column} />,
      cell: (info) => info.getValue<string>() || '—',
      meta: { headerClassName: 'min-w-[140px]' },
    },
    {
      accessorKey: 'collection_date',
      id: 'collection_date',
      header: ({ column }) => <DataGridColumnHeader title="Collection Date" column={column} />,
      cell: (info) => _formatDate(info.getValue<string | null>()),
      meta: { headerClassName: 'min-w-[160px]' },
    },
    {
      accessorKey: 'created_at',
      id: 'created_at',
      header: ({ column }) => <DataGridColumnHeader title="Created" column={column} />,
      cell: (info) => formatDate(info.getValue<string | null>()),
      meta: { headerClassName: 'min-w-[160px]' },
    },
    /* {
      accessorKey: 'applicant_remark',
      id: 'applicant_remark',
      header: ({ column }) => <DataGridColumnHeader title="Applicant Remark" column={column} />,
      cell: (info) => {
        const v = info.getValue<string | null>();
        return v ? <span className="line-clamp-1" title={v}>{v}</span> : '—';
      },
      meta: { headerClassName: 'min-w-[220px]' },
    }, */
    {
      id: 'actions',
      header: () => '',
      cell: (info) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="btn btn-sm btn-icon btn-clear btn-light">
              <KeenIcon icon="dots-vertical" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel className="font-medium">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setSelected(info.row.original.raw);
                setDetailsOpen(true);
              }}
            >
              <KeenIcon icon="eye" /> Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      meta: { headerClassName: 'w-[60px]' },
    },
  ], []);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<SeedLabInspection | null>(null);

  const handleRowSelection = (state: RowSelectionState) => {
    const selectedRowIds = Object.keys(state);
    if (selectedRowIds.length > 0) {
      toast(`Total ${selectedRowIds.length} selected.`, {
        description: `Row IDs: ${selectedRowIds.join(', ')}`,
      });
    }
  };

  const Toolbar = () => {
    const { table } = useDataGrid();
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const total = mapped.length;
    const shown = table?.getFilteredRowModel?.().rows.length ?? total;

    const uniqueStatuses = useMemo(
      () => Array.from(new Set(mapped.map((r) => r.status.label))).sort(),
      [mapped]
    );

    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">
          Showing {shown} of {total} lab inspections
        </h3>

        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="Search applicant / inspector / receipt / ID"
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  table.getColumn('applicant')?.setFilterValue(val);
                  table.getColumn('inspector')?.setFilterValue(val);
                  table.getColumn('receipt_id')?.setFilterValue(val);
                  table.getColumn('variety_id')?.setFilterValue(val);
                  table.getColumn('stock_examination_id')?.setFilterValue(val);
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
              <SelectTrigger className="w-40" size="sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="w-44">
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button className="btn btn-sm btn-outline btn-primary" onClick={() => refetch()}>
              <KeenIcon icon="arrow-rotate-right" /> Refresh
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
          Failed to load seed lab inspections
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
        sorting={[{ id: 'created_at', desc: true }]}
        toolbar={<Toolbar />}
        layout={{ card: true, cellSpacing: 'xs', cellBorder: true }}
        messages={{
          loading: loading,
          empty: 'No seed lab inspections found'
        }}
      />

      <SeedLabDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        data={selected || undefined}
      />
    </>
  );
};

export { SeedLabs };
