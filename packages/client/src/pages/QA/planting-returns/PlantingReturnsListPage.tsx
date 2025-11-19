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
import { PlantingReturnCreateDialog } from './blocks/PlantingReturnCreateDialog';
import { PlantingReturnDetailsDialog } from './blocks/PlantingReturnDetailsDialog';
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
import { LOAD_PLANTING_RETURNS, LOAD_PLANTING_RETURN, LOAD_INSPECTORS } from '@/gql/queries';
import {
  CREATE_PLANTING_RETURN,
  UPDATE_PLANTING_RETURN,
  DELETE_PLANTING_RETURN,
  ASSIGN_PLANTING_RETURN_INSPECTOR,
  UPLOAD_PLANTING_RETURNS
} from '@/gql/mutations';
import { PlantingReturnsUploadDialog} from './blocks/PlantingReturnUploadDialog';

type PlantingReturn = {
  id: string;
  sr8Number: string;
  applicantName: string;
  growerNumber?: string;
  contactPhone?: string;
  gardenNumber?: string;
  fieldName?: string;
  receipt_id?: string;
  location: {
    district?: string;
    subcounty?: string;
    parish?: string;
    village?: string;
    gpsLat?: string;
    gpsLng?: string;
  };
  crop: string;
  variety: string;
  seedClass?: string;
  areaHa: number;
  dateSown: string;
  expectedHarvest: string;
  seedSource?: string;
  seedLotCode?: string;
  intendedMerchant?: string;
  seedRatePerHa?: string;
  status?: string;
  inspector?: { id: string; name?: string; email?: string; image?: string } | null;
  createdAt?: string;
};

const PlantingReturnsListPage = () => {
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
  const { data, loading, error, refetch } = useQuery(LOAD_PLANTING_RETURNS, {
    variables: LIST_VARS
  });

  const [isFormOpen, setFormOpen] = useState(false);
  const [loading1, setLoading] = useState(false);

  const handleClose = (open: boolean) => {
    setFormOpen(false);
  };

  const handleSubmit = async (values: Record<string, any>) => {
    setLoading(true);
    const input = {
      amount_enclosed: parseInt(values.amountEnclosed) || null,
      payment_receipt: values.paymentReceipt || null,
      sub_grower_file: values.subGrowersFile || null,
      registered_dealer: values.registeredSeedMerchant || ''
    }

    try {
      // Submit logic here (e.g., API call)
      console.log('Submitted values:', values);
      console.log('Submitted input:', input);

      await uploadReturns({ variables: { input } });
      toast('Planting return updated');
    } catch (e: any) {
      toast('Failed to upload:', { description: e?.message || 'Unknown error' });
    } finally {
      setLoading(false);
      setFormOpen(false);
    }
  };

  const rows = useMemo(() => (data?.plantingReturns?.items ?? []) as any[], [data]);
  const total = Number(data?.plantingReturns?.total || 0);

  const [createReturn] = useMutation(CREATE_PLANTING_RETURN, {
    refetchQueries: [{ query: LOAD_PLANTING_RETURNS, variables: LIST_VARS }],
    awaitRefetchQueries: true
  });
  const [uploadReturns] = useMutation(UPLOAD_PLANTING_RETURNS, {
    refetchQueries: [{ query: LOAD_PLANTING_RETURNS, variables: LIST_VARS }],
    awaitRefetchQueries: true
  });
  const [updateReturn] = useMutation(UPDATE_PLANTING_RETURN, {
    refetchQueries: [{ query: LOAD_PLANTING_RETURNS, variables: LIST_VARS }],
    awaitRefetchQueries: true
  });
  const [deleteReturn] = useMutation(DELETE_PLANTING_RETURN, {
    refetchQueries: [{ query: LOAD_PLANTING_RETURNS, variables: LIST_VARS }],
    awaitRefetchQueries: true
  });
  const [loadDetail] = useLazyQuery(LOAD_PLANTING_RETURN);

  const handleSave = async (vals: any, id?: string) => {
    setSaving(true);
    const input: any = {
      applicantName: vals.growerName,
      growerNumber: vals.growerNumber,
      contactPhone: vals.contactPhone,
      fieldName: vals.fieldName,
      location: {
        district: vals.district,
        subcounty: vals.subcounty,
        parish: vals.parish,
        village: vals.village,
        gpsLat: vals.gpsLat ? Number(vals.gpsLat) : null,
        gpsLng: vals.gpsLng ? Number(vals.gpsLng) : null
      },
      cropId: vals.crop || null,
      varietyId: vals.variety || null,
      seedClass: vals.seedClass || null,
      areaHa: vals.areaHa ? Number(vals.areaHa) : null,
      dateSown: vals.dateSown || null,
      expectedHarvest: vals.expectedHarvest || null,
      seedSource: vals.seedSource || null,
      seedLotCode: vals.seedLotCode || null,
      intendedMerchant: vals.intendedMerchant || null,
      seedRatePerHa: vals.seedRatePerHa || null
    };
    try {
      if (id) {
        await updateReturn({ variables: { id, input } });
        toast('Planting return updated');
      } else {
        await createReturn({ variables: { input } });
        toast('Planting return created');
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

  const handleUpload = () => {
    setFormOpen(true);
  };

  const handleEdit = (row: any) => {
    
    setEditing(row);
    setCreateOpen(true);
  };

  const handlePreview = async (row: any) => {
    try {
      const res = await loadDetail({ variables: { id: row.id } });
      const rec = res.data?.plantingReturn;
      if (!rec) throw new Error('Not found');
      setPreview(rec);
    } catch (e: any) {
      toast('Failed to load details', { description: e?.message || 'Unknown error' });
    }
  };

  const handleDelete = async (row: any) => {
    try {
      setDeletingId(String(row.id));
      await deleteReturn({ variables: { id: row.id } });
      toast('Planting return deleted');
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
                  <a href="#" 
                    onClick={() => {
                      handleUpload();
                    }} 
                    className="btn btn-sm btn-light">
                    {'Import CSV'}
                  </a>
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
      <PlantingReturnCreateDialog
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
                growerName: editing.applicantName,
                growerNumber: editing.growerNumber,
                contactPhone: editing.contactPhone,
                fieldName: editing.fieldName,
                district: editing.location?.district,
                subcounty: editing.location?.subcounty,
                parish: editing.location?.parish,
                village: editing.location?.village,
                gpsLat: editing.location?.gpsLat?.toString?.() || '',
                gpsLng: editing.location?.gpsLng?.toString?.() || '',
                crop: editing.crop?.id || '',
                variety: editing.variety?.id || '',
                seedClass: editing.seedClass,
                areaHa: editing.areaHa != null ? String(editing.areaHa) : '',
                dateSown: editing.dateSown,
                expectedHarvest: editing.expectedHarvest,
                seedSource: editing.seedSource,
                seedLotCode: editing.seedLotCode,
                intendedMerchant: editing.intendedMerchant,
                seedRatePerHa: editing.seedRatePerHa,
                receipt_id: editing.receipt_id,
                notes: ''
              }
            : null
        }
      />
      
      <PlantingReturnsUploadDialog
      isOpen={isFormOpen}
      onClose={handleClose}
      onSubmit={handleSubmit}
      loading={loading1}
      resetForm={false}
      initialValues={null}
      title="Edit Planting Return"
      submitLabel="Save Changes"
    />


      <PlantingReturnDetailsDialog
        open={!!preview}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
        }}
        data={preview}
      />
    </>
  );
};

export default PlantingReturnsListPage;

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
            {formatDateTime(row.original.createdAt)}
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
          return (
            <div className="flex items-center gap-4">
              <img
                src={`${URL_2}/imgs/${row.original?.createdBy?.image}`}
                className="rounded-full size-9 shrink-0"
                alt={`${row.original?.createdBy?.userName}`}
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
      {
        accessorKey: 'sr8Number',
        id: 'sr8Number',
        header: ({ column }) => <DataGridColumnHeader title="SR8 Number" column={column} />,
        cell: ({ row }) => <span className="text-gray-800">{row.original.sr8Number}</span>,
        meta: { headerClassName: 'min-w-[160px]' }
      },
      {
        accessorKey: 'fieldName',
        id: 'fieldName',
        header: ({ column }) => <DataGridColumnHeader title="Field/Garden" column={column} />,
        cell: ({ row }) => (
          <span className="text-gray-800">
            {row.original.fieldName || row.original.gardenNumber}
          </span>
        ),
        meta: { headerClassName: 'min-w-[160px]' }
      },
    );
    if (canManagePlantingReturns) {
    cols.push(
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
    );
    }
    cols.push(
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
        accessorKey: 'crop',
        id: 'crop',
        header: ({ column }) => <DataGridColumnHeader title="Crop" column={column} />,
        cell: ({ row }) => <span className="text-gray-800">{row?.original?.crop?.name}</span>,
        meta: { headerClassName: 'min-w-[180px]' }
      },
      {
        accessorKey: 'variety',
        id: 'variety',
        header: ({ column }) => <DataGridColumnHeader title="Variety" column={column} />,
        cell: ({ row }) => <span className="text-gray-800">{row?.original?.variety?.name}</span>,
        meta: { headerClassName: 'min-w-[180px]' }
      },
      // {
      //   accessorKey: 'areaHa',
      //   id: 'areaHa',
      //   header: ({ column }) => <DataGridColumnHeader title="Area (ha)" column={column} />,
      //   cell: ({ row }) => <span className="text-gray-800">{row.original.areaHa}</span>,
      //   meta: { headerClassName: 'min-w-[120px]' }
      // },
      // {
      //   accessorKey: 'dateSown',
      //   id: 'dateSown',
      //   header: ({ column }) => <DataGridColumnHeader title="Sowing Date" column={column} />,
      //   cell: ({ row }) => (
      //     <span className="text-gray-800">{formatIsoDate(row.original.dateSown)}</span>
      //   ),
      //   meta: { headerClassName: 'min-w-[140px]' }
      // },

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
      ASSIGN_PLANTING_RETURN_INSPECTOR,
      {
        refetchQueries: [
          {
            query: LOAD_PLANTING_RETURNS,
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
