import { Fragment, useMemo, useState } from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client/react';

import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { useLayout } from '@/providers';
import { CropDeclarationDialog } from './blocks/CropDeclarationDialog';
import { CropDeclarationDetailsDialog} from './blocks/CropDeclarationDetailsDialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridRowSelect,
  DataGridRowSelectAll,
  KeenIcon,
  useDataGrid
} from '@/components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { ColumnDef, Column } from '@tanstack/react-table';
import { formatDateTime, formatIsoDate } from '@/utils/Date';
import { useAuthContext } from '@/auth';
import { getPermissionsFromToken } from '@/utils/permissions';
import { toAbsoluteUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { URL_2 } from '@/config/urls';
import { LOAD_CROP_DECLARATIONS, LOAD_CROP_DECLARATION, LOAD_INSPECTORS } from '@/gql/queries';
import {
  CREATE_CROP_DECLARATION,
  DELETE_CROP_DECLARATION,
  ASSIGN_CROP_DECLARATION_INSPECTOR
} from '@/gql/mutations';

type CropDeclaration = {
    id: string;
    user_id: string;
    application_id: string;
    source_of_seed: string;
    field_size: string;
    seed_rate: string;
    amount: string;
    receipt_id: string;
    inspector_id: string;
    status: string;
    status_comment: string;
    valid_from: string;
    valid_until: string;
    created_at: string;
    updated_at: string;
    crops: {
      id: string;
      crop_declaration_id: string;
      crop_id: string;
      variety_id: string;
    }
    inspector: {
      id: string;
      username: string;
      name: string;
    }
    createdBy: {
      id: string;
      username: string;
      name: string;
      email: string;
    }
  }


const CropDeclarationListPage = () => {
  const { currentLayout } = useLayout();
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [cvsCreate, setCvs] = useState<any | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canCreatePlantingReturns = !!perms['can_create_planting_returns'];
  const canAssignInspector = !!perms['qa_can_assign_inspector'];

  // Data
  const LIST_VARS = { filter: {}, pagination: { page: 1, size: 200 } } as const;
  const { data, loading, error, refetch } = useQuery(LOAD_CROP_DECLARATIONS, {
    variables: LIST_VARS
  });

  const [isFormOpen, setFormOpen] = useState(false);
  const [loading1, setLoading] = useState(false);

  const handleClose = (open: boolean) => {
    setFormOpen(false);
  };

  const rows = useMemo(() => (data?.cropDeclarations?.items ?? []) as any[], [data]);
  const total = Number(data?.cropDeclarations?.total || 0);

  const [createDeclaration] = useMutation(CREATE_CROP_DECLARATION, {
    refetchQueries: [{ query: LOAD_CROP_DECLARATIONS, variables: LIST_VARS }],
    awaitRefetchQueries: true
  });
  
  const [deleteDeclaration] = useMutation(DELETE_CROP_DECLARATION, {
    refetchQueries: [{ query: LOAD_CROP_DECLARATIONS, variables: LIST_VARS }],
    awaitRefetchQueries: true
  });

  const [loadDetail] = useLazyQuery(LOAD_CROP_DECLARATION);

  const handleSave = async (vals: any, id?: string) => {
    setSaving(true);
    console.log('values', vals)
    const payload: any = {
      id : id ? id: null,
      source_of_seed: vals.source_of_seed,
      field_size: vals.field_size ? Number(vals.field_size) : null,
      seed_rate: vals.seed_rate,
      amount: vals.amount ? Number(vals.amount) : null,
      receipt_id: vals.receipt_id ? vals.receipt_id : null,
      crops: (vals.crops || []).map(({ id, crop_id, variety_id }) => ({ 
        id, 
        crop_declaration_id: id ? id : null,
        crop_id, 
        variety_id }))
    
    };

    try {
      if (id) {
        await createDeclaration({ variables: { payload } });
        toast('Crop Declaration updated');
      } else {
        await createDeclaration({ variables: { payload } });
        toast('Crop Declaration created');
      }
      setCreateOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast('Failed to save', { description: e?.message || 'Unknown error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setCreateOpen(true);
  };

  // const handleUpload = () => {
  //   setFormOpen(true);
  // };

  const handleEdit = (row: any) => {
    
    setEditing(row);
    setCreateOpen(true);
  };

  const handlePreview = async (row: any) => {
    try {
      const res = await loadDetail({ variables: { cropDeclarationId: row.id } });
      const rec = res.data?.cropDeclaration;
      if (!rec) throw new Error('Not found');
      setPreview(rec);
    } catch (e: any) {
      toast('Failed to load details', { description: e?.message || 'Unknown error' });
    }
  };

  const handleDelete = async (row: any) => {
    try {
      setDeletingId(String(row.id));
      await deleteDeclaration({ variables: { cropDeclarationId: row.id } });
      toast('Crop Declaration deleted');
    } catch (e: any) {
      toast('Failed to delete return', { description: e?.message || 'Unknown error' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Fragment>
        {currentLayout?.name === 'demo1-layout' && (
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
                        <span className="text-md text-gray-800 font-medium me-2">{total}</span>
                        <span className="text-md text-gray-700">Showing latest</span>
                      </>
                    )}
                  </div>
                </ToolbarDescription>
              </ToolbarHeading>
              {canCreatePlantingReturns && (
                <ToolbarActions>
                  {/* <a href="#" 
                    onClick={() => {
                      handleUpload();
                    }} 
                    className="btn btn-sm btn-light">
                    {'Import CSV'}
                  </a> */}
                  <a
                    href="#"
                    onClick={() => {
                      handleCreate();
                    }}
                    className="btn btn-sm btn-primary"
                  >
                    {'Add Return'}
                  </a>
                </ToolbarActions>
              )}
            </Toolbar>
          </Container>
        )}

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
            <div className="p-6 text-danger bg-white rounded-lg border flex items-center justify-between">
              <span>Failed to load permits</span>
              <a className="btn btn-sm" onClick={() => refetch?.()}>
                Retry
              </a>
            </div>
          ) : (
            <PlantingReturnsGrid
              rows={rows}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
              onPreview={handlePreview}
            />
          )}
        </Container>
      </Fragment>
      <CropDeclarationDialog
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
                source_of_seed: editing.source_of_seed,
                field_size: editing.field_size,
                seed_rate: editing.seed_rate,
                amount: editing.amount,
                receipt_id: editing.receipt_id,
                crops: editing.crops || [],
              }
            : null
        }
      />
      
      <CropDeclarationDetailsDialog
        open={!!preview}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
        }}
        data={preview}
      />
    </>
  );
};

export default CropDeclarationListPage;

const PlantingReturnsGrid = ({
  rows,
  onEdit,
  onDelete,
  deletingId,
  onPreview
}: {
  rows: any[];
  onEdit: (p: any) => void;
  onDelete: (p: any) => void;
  deletingId: string | null;
  onPreview: (p: any) => void;
}) => {
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canCreatePlantingReturns = !!perms['can_create_planting_returns'];
  const canManagePlantingReturns = !!perms['can_manage_planting_returns'];
  const canEditPlantingReturns = !!perms['can_edit_planting_returns'];
  const canDeletePlantingReturns = !!perms['can_delete_planting_returns'];
  const ColumnInputFilter = <TData, TValue>({ column }: { column: Column<TData, TValue> }) => (
    <Input
      placeholder="Filter..."
      value={(column.getFilterValue() as string) ?? ''}
      onChange={(event) => column.setFilterValue(event.target.value)}
      className="h-9 w-full max-w-40"
    />
  );

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [
      {
        id: 'select',
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: 'w-0' }
      },
      {
        accessorKey: 'createdOn',
        id: 'createdOn',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Created On"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800 font-medium">
            {formatDateTime(row.original.created_at)}
          </span>
        ),
        meta: { headerClassName: 'min-w-[190px]' }
      }
    ];

    if (canManagePlantingReturns) {
      cols.push({
        accessorKey: 'applicant_name',
        id: 'applicant_name',
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Applicant Name"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: ({ row }) => {
          console.log('row', row.original);
          return (
            <div className="flex items-center gap-4">
              <img
                src={`${URL_2}/imgs/${row.original?.createdBy?.image}`}
                className="rounded-full size-9 shrink-0"
                alt={`${row.original?.createdBy?.username}`}
              />
              <div className="flex flex-col gap-0.5">
                <Link
                  to="#"
                  className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                >
                  {row.original?.applicantName || row.original?.createdBy?.name}
                </Link>
              </div>
            </div>
          );
        },
        meta: { headerClassName: 'min-w-[200px]' }
      });
    }

    cols.push(
      /* {
        accessorKey: 'sr8Number',
        id: 'sr8Number',
        header: ({ column }) => <DataGridColumnHeader title="SR8 Number" column={column} />,
        cell: ({ row }) => <span className="text-gray-800">{row.original.sr8Number}</span>,
        meta: { headerClassName: 'min-w-[160px]' }
      }, */
      {
        accessorKey: 'fieldSize',
        id: 'fieldSize',
        header: ({ column }) => <DataGridColumnHeader title="Field size" column={column} />,
        cell: ({ row }) => (
          <span className="text-gray-800">
            {row.original.field_size} Acres
          </span>
        ),
        meta: { headerClassName: 'min-w-[160px]' }
      },
      {
        accessorKey: 'seedRate',
        id: 'seedRate',
        header: ({ column }) => <DataGridColumnHeader title="Seed Rate" column={column} />,
        cell: ({ row }) => <span className="text-gray-800">{row.original.seed_rate}</span>,
        meta: { headerClassName: 'min-w-[160px]' }
      },
      {
        accessorKey: 'amount',
        id: 'amount',
        header: ({ column }) => <DataGridColumnHeader title="Amount" column={column} />,
        cell: ({ row }) => <span className="text-gray-800">{row.original.amount}</span>,
        meta: { headerClassName: 'min-w-[160px]' }
      },
      {
        accessorFn: (row: any) => row?.inspector?.name || '',
        id: 'inspector',
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
            : toAbsoluteUrl('/media/avatars/blank.png');
          return (
            <div className="flex items-center gap-2.5">
              {ins?.name && (
                <img
                  src={img}
                  className="rounded-full size-8 shrink-0 object-cover"
                  alt={ins?.name || 'Inspector'}
                />
              )}
              <div className="leading-tight">
                <div className="text-sm font-medium text-gray-800">{ins?.name || '—'}</div>
                <div className="text-[11px] text-gray-600">{ins?.email || ''}</div>
              </div>
            </div>
          );
        },
        meta: { headerClassName: 'min-w-[220px]' }
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Status" column={column} />,
        enableSorting: true,
        cell: ({ row }) => {
          const s = String(row.original.status || 'pending');
          const color =
            s === 'approved' || s === 'recommended'
              ? 'success'
              : s === 'rejected' || s === 'halted'
                ? 'danger'
                : s === 'assigned' || s === 'assigned_inspector'
                  ? 'info'
                  : 'warning';
          return (
            <span className={`badge badge-${color} shrink-0 badge-outline rounded-[30px]`}>
              <span className={`size-1.5 rounded-full bg-${color} me-1.5`}></span>
              {s}
            </span>
          );
        },
        meta: { headerClassName: 'min-w-[140px]' }
      },
      {
        accessorKey: 'validUntil',
        id: 'validUntil',
        header: ({ column }) => <DataGridColumnHeader title="Valid Until" column={column} />,
        cell: ({ row }) => <span className="text-gray-800">{row.original.valid_until}</span>,
        meta: { headerClassName: 'min-w-[160px]' }
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

                {canEditPlantingReturns && info?.row?.original?.status === 'pending' && (
                  <DropdownMenuItem onClick={() => onEdit(info.row.original)}>
                    <KeenIcon icon="note" /> Edit
                  </DropdownMenuItem>
                )}

                {canDeletePlantingReturns && info.row.original.status === 'pending' && (
                  <DropdownMenuItem
                    onClick={() => onDelete(info.row.original)}
                    disabled={String(deletingId) === String(info.row.original.id)}
                  >
                    <KeenIcon icon="trash" /> Delete
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => onPreview(info.row.original)}>
                  <KeenIcon icon="eye" /> Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ),
        meta: { headerClassName: 'w-[60px]' }
      }
    );

    return cols;
  }, [canCreatePlantingReturns, deletingId]);

  const HeaderToolbar = () => {
    const { table } = useDataGrid();
    const [searchInput, setSearchInput] = useState('');
    const { auth } = useAuthContext();
    const perms = getPermissionsFromToken(auth?.access_token);
    const canAssignInspector = !!perms['qa_can_assign_inspector'];

    const [inspector, setInspector] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const {
      data: inspectorsData,
      loading: inspectorsLoading,
      error: inspectorsError,
      refetch
    } = useQuery(LOAD_INSPECTORS);

    const [assignInspector, { loading: assigning }] = useMutation(
      ASSIGN_CROP_DECLARATION_INSPECTOR,
      {
        refetchQueries: [
          {
            query: LOAD_CROP_DECLARATIONS,
            variables: { filter: {}, pagination: { page: 1, size: 200 } }
          }
        ],
        awaitRefetchQueries: true
      }
    );

    const selectedIds = table.getSelectedRowModel().flatRows.map((r) => String(r.original.id));

    const handleAssign = async () => {
      setErrorMsg(null);
      if (!inspector || selectedIds.length === 0) return;
      try {
        const res = await assignInspector({ variables: { input: { ids: selectedIds, inspectorId: inspector } } });
        const ok = res?.data?.assignPlantingReturnInspector?.success;
        if (!ok) throw new Error(res?.data?.assignPlantingReturnInspector?.message || 'Failed to assign inspector');
        toast('Inspector assigned');
        setInspector('');
        // Clear selection after success
        table.toggleAllRowsSelected(false);
      } catch (e: any) {
        const msg = e?.message || 'Failed to assign inspector';
        setErrorMsg(msg);
        toast('Failed to assign inspector', { description: msg });
      }
    };
    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">Showing {rows.length} returns</h3>
        <div className="flex flex-wrap gap-2 lg:gap-5 items-center">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="Search returns"
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  table.getColumn('applicant_name')?.setFilterValue(val);
                }}
              />
            </label>
          </div>

          {canAssignInspector && (
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-600 mr-1">Selected: {selectedIds.length}</div>
              <Select
                value={inspector}
                onValueChange={setInspector}
                disabled={inspectorsLoading || !!inspectorsError || assigning}
              >
                <SelectTrigger className="h-9 w-[220px]">
                  <SelectValue placeholder={inspectorsLoading ? 'Loading…' : 'Choose inspector'} />
                </SelectTrigger>
                <SelectContent>
                  {inspectorsData?.inspectors?.map((ins: any) => (
                    <SelectItem key={ins.id} value={ins.id}>
                      {ins.name || ins.username || ins.company_initials || 'Unknown'}
                      {ins.district ? ` (${ins.district})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAssign}
                disabled={!inspector || selectedIds.length === 0 || assigning}
              >
                <KeenIcon icon="tick-square" />
                {assigning ? 'Assigning…' : 'Assign Inspector'}
              </Button>
              {inspectorsError && (
                <button className="btn btn-xs btn-light" onClick={() => refetch?.()}>
                  Retry
                </button>
              )}
              {errorMsg && <span className="text-[11px] text-danger">{errorMsg}</span>}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DataGrid<any>
      columns={columns}
      data={rows}
      rowSelection={true}
      layout={{ card: true, cellSpacing: 'xs', cellBorder: true }}
      toolbar={<HeaderToolbar />}
      messages={{ loading: 'Loading...', empty: 'No planting returns found' }}
    />
  );
};
