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
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAuthContext } from '@/auth';
import { getPermissionsFromToken } from '@/utils/permissions';
import { useMutation, useQuery } from '@apollo/client/react';
import { LOAD_INSPECTORS, LOAD_PLANTING_RETURN, LOAD_PLANTING_RETURNS } from '@/gql/queries';
import { ASSIGN_PLANTING_RETURN_INSPECTOR } from '@/gql/mutations';
import { toast } from 'sonner';

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

const PlantingReturnDetailsDialog = ({ open, onOpenChange, data }: Props) => {
  const d = data as any;
  const lat = Number(d?.location?.gpsLat);
  const lng = Number(data?.location?.gpsLng);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const customIcon = useMemo(
    () =>
      L.divIcon({
        html: `<i class="ki-solid ki-geolocation text-3xl text-danger"></i>`,
        className: 'leaflet-marker',
        bgPos: [10, 10],
        iconAnchor: [20, 37],
        popupAnchor: [0, -37]
      }),
    []
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[860px] w-[96vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="information-2" /> Planting Return Details
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg border bg-white">
              <h3 className="font-semibold text-gray-800 mb-3">Grower</h3>
              <Field label="Grower Name" value={data?.applicantName} />
              <Field label="Grower Number" value={data?.growerNumber} />
              <Field label="Phone" value={data?.contactPhone} />
            </div>
            <div className="p-4 rounded-lg border bg-white">
              <h3 className="font-semibold text-gray-800 mb-3">Field</h3>
              <Field label="SR8 Number" value={data?.sr8Number} />
              <Field label="Garden Number" value={data?.gardenNumber} />
              <Field label="Field Name" value={data?.fieldName} />
            </div>
          </div>

          <div className="p-4 rounded-lg border bg-white">
            <h3 className="font-semibold text-gray-800 mb-3">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="District" value={data?.location?.district} />
              <Field label="Sub-county" value={data?.location?.subcounty} />
              <Field label="Parish" value={data?.location?.parish} />
              <Field label="Village" value={data?.location?.village} />
              <Field label="GPS Lat" value={data?.location?.gpsLat} />
              <Field label="GPS Lng" value={data?.location?.gpsLng} />
            </div>
            {hasCoords && (
              <div className="mt-4">
                <MapContainer
                  center={[lat, lng]}
                  zoom={14}
                  className="rounded-xl w-full h-[260px] min-h-52"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[lat, lng]} icon={customIcon}>
                    <Popup>
                      <div className="text-sm">
                        <div className="font-semibold">{data?.applicantName || 'Grower'}</div>
                        {data?.growerNumber && (
                          <div className="text-gray-700">No: {data.growerNumber}</div>
                        )}
                        {data?.fieldName && (
                          <div className="text-gray-700">Field: {data.fieldName}</div>
                        )}
                        <div className="text-gray-600">
                          {lat}, {lng}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg border bg-white">
            <h3 className="font-semibold text-gray-800 mb-3">Crop</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Field label="Crop" value={data?.crop?.name} />
              <Field label="Variety" value={data?.variety?.name} />
              <Field label="Seed Class" value={data?.seedClass} />
              <Field label="Area (ha)" value={data?.areaHa} />
              <Field label="Sowing Date" value={formatIsoDate(data?.dateSown)} />
              <Field label="Expected Harvest" value={formatIsoDate(data?.expectedHarvest)} />
              <Field label="Seed Source" value={data?.seedSource} />
              <Field label="Seed Lot Code" value={data?.seedLotCode} />
              <Field label="Intended Merchant" value={data?.intendedMerchant} />
              <Field label="Seed Rate/ha" value={data?.seedRatePerHa} />
              <Field label="Status" value={data?.status} />
            </div>
            {!!data?.id && (
              <div className="mt-4 flex items-center justify-end">
                <Link
                  to={`/qa/planting-returns/${data.id}/inspection`}
                  onClick={() => onOpenChange(false)}
                >
                  <Button>
                    <KeenIcon icon="geolocation" /> Open Inspection
                  </Button>
                </Link>
              </div>
            )}
          </div>

          <PlantingReturnActions open={open} onClose={() => onOpenChange(false)} data={d} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

export { PlantingReturnDetailsDialog };

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
        query: LOAD_PLANTING_RETURNS,
        variables: { filter: {}, pagination: { page: 1, size: 200 } }
      },
      data?.id ? { query: LOAD_PLANTING_RETURN, variables: { id: String(data.id) } } : undefined
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
