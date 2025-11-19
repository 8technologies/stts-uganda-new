import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody
} from '@/components/ui/dialog';
import { KeenIcon } from '@/components';
import { formatIsoDate } from '@/utils/Date';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/auth';
import { getPermissionsFromToken } from '@/utils/permissions';
import { useMutation, useQuery } from '@apollo/client/react';
import { LOAD_CROP_DECLARATION, LOAD_CROP_DECLARATIONS, LOAD_INSPECTORS } from '@/gql/queries';
import { ASSIGN_PLANTING_RETURN_INSPECTOR } from '@/gql/mutations';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { URL_2 } from '@/config/urls';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: any | null;
}

const Field = ({ label, value }: { label: string; value: any }) => (
  <div className="grid grid-cols-5 gap-3 py-1">
    <div className="col-span-2 text-sm text-gray-600">{label}</div>
    <div className="col-span-3 text-sm text-gray-900 font-medium">{value ?? '—'}</div>
  </div>
);

const CropDeclarationDetailsDialog = ({ open, onOpenChange, data }: Props) => {
  const d = data as any;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[860px] w-[96vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="information-2" /> Crop Declaration Details
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-6">

          {/* Grower Section */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className="p-4 rounded-lg border bg-white">
              <h3 className="font-semibold text-gray-800 mb-3">Grower</h3>
              <Field label="Name" value={d?.createdBy?.name} />
              <Field label="Username" value={d?.createdBy?.username} />
              <Field label="Email" value={d?.createdBy?.email} />
            </div>

            {/* Actionable Section */}
            <div className="p-4 rounded-lg border bg-white">
              <h3 className="font-semibold text-gray-800 mb-3">Actionable</h3>
              <Field label="Valid From" value={formatIsoDate(d?.valid_from)} />
              <Field label="Valid Until" value={formatIsoDate(d?.valid_until)} />
              <Field
                label="Inspector"
                value={d?.inspector ? (d?.inspector?.name || d?.inspector?.username) : '—'}
              />
            </div>
          </div>

          {/* Crops Section */}
          <div className="p-4 rounded-lg border bg-white">
            <h3 className="font-semibold text-gray-800 mb-3">Crops</h3>
            {d?.crops?.length ? (
              <div className="space-y-2">
                {d.crops.map((c: any, i: number) => (
                  <div
                    key={i}
                    className="border rounded-md p-3 bg-gray-50"
                  >
                    <Field label="Crop ID" value={c.crop_name} />
                    <Field label="Variety ID" value={c.variety_name} />
                    {!!data?.id && (
                      <div className="mt-4 flex items-center justify-end">
                        <Link
                          to={`/qa/crop-declarations/${data.id}/${c.crop_id}/inspection`}
                          onClick={() => onOpenChange(false)}
                        >
                          <Button>
                            <KeenIcon icon="geolocation" /> Open Inspection
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No crops provided</div>
            )}
          </div>

          {/* General Section */}
          <div className="p-4 rounded-lg border bg-white">
            <h3 className="font-semibold text-gray-800 mb-3">General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Source of Seed" value={d?.source_of_seed} />
              <Field label="Field Size (ha)" value={d?.field_size} />
              <Field label="Seed Rate" value={d?.seed_rate} />
              <Field label="Amount" value={d?.amount} />
              <Field label="Receipt" value=/* {d?.receipt_id} */ 
                {d?.receipt_id ? (
                <a
                  href={`${URL_2}/form_attachments/${d?.receipt_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  View receipt
                </a>
              ) : (
                '-'
              )}
              />
              <Field label="Status" value={d?.status} />
              <Field label="Status Comment" value={d?.status_comment} />
              <Field label="Created At" value={formatIsoDate(d?.created_at)} />
              {/* <Field label="Updated At" value={formatIsoDate(d?.updated_at)} /> */}
            </div>

            
          
          </div>
            <PlantingReturnActions open={open} onClose={() => onOpenChange(false)} data={d} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export { CropDeclarationDetailsDialog };


const PlantingReturnActions = ({
  open,
  onClose,
  data
}: {
  open: boolean;
  onClose: () => void;
  data: any | null;
}) => {
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
  } = useQuery(LOAD_INSPECTORS, { skip: !open });

  useEffect(() => {
    if (open) {
      setInspector('');
      setErrorMsg(null);
    }
  }, [open, data?.id]);

  const [assignInspector, { loading: assigning }] = useMutation(ASSIGN_PLANTING_RETURN_INSPECTOR, {
    refetchQueries: [
      {
        query: LOAD_CROP_DECLARATIONS,
        variables: { filter: {}, pagination: { page: 1, size: 200 } }
      },
      data?.id ? { query: LOAD_CROP_DECLARATION, variables: { id: String(data.id) } } : undefined
    ].filter(Boolean) as any,
    awaitRefetchQueries: true
  });

  if (!canAssignInspector) return null;

  const handleAssign = async () => {
    setErrorMsg(null);
    const id = String(data?.id || '');
    if (!id || !inspector) return;
    try {
      const res = await assignInspector({ variables: { input: { id, inspectorId: inspector } } });
      const ok = res?.data?.assignPlantingReturnInspector?.success;
      if (!ok)
        throw new Error(
          res?.data?.assignPlantingReturnInspector?.message || 'Failed to assign inspector'
        );
      toast('Inspector assigned');
      onClose();
    } catch (e: any) {
      const msg = e?.message || 'Failed to assign inspector';
      setErrorMsg(msg);
      toast('Failed to assign inspector', { description: msg });
    }
  };

  if (data?.status == 'pending') {
    return (
      <div className="p-4 rounded-lg border bg-white">
        <h3 className="font-semibold text-gray-800 mb-3">Actions</h3>
        <div className="space-y-3">
          <div className="text-sm text-gray-700">Assign Inspector</div>
          <div className="flex items-center gap-2 flex-wrap">
            {inspectorsLoading && <div className="text-xs text-gray-600">Loading inspectors…</div>}
            {inspectorsError && (
              <div className="text-xs text-danger flex items-center gap-2">
                Failed to load inspectors
                <button className="btn btn-xs btn-light" onClick={() => refetch?.()}>
                  Retry
                </button>
              </div>
            )}

            <Select
              value={inspector}
              onValueChange={setInspector}
              disabled={inspectorsLoading || !!inspectorsError || assigning}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose inspector" />
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

            <Button onClick={handleAssign} disabled={!inspector || assigning}>
              <KeenIcon icon="tick-square" /> {assigning ? 'Assigning…' : 'Assign'}
            </Button>

            {errorMsg && (
              <div className="text-xs text-danger bg-danger/10 px-3 py-1 rounded-md">
                {errorMsg}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};