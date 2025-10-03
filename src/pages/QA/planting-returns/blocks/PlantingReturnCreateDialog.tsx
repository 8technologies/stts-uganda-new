import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { useAuthContext } from '@/auth';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { LOAD_CROPS, LOAD_CROP } from '@/gql/queries';
import { Upload } from 'lucide-react';

export type PlantingReturnFormValues = {
  growerName: string;
  growerNumber?: string;
  contactPhone?: string;
  gardenNumber?: string;
  fieldName?: string;
  district?: string;
  subcounty?: string;
  parish?: string;
  village?: string;
  gpsLat?: string;
  gpsLng?: string;
  crop?: string;
  variety?: string;
  seedClass?: string;
  areaHa?: string; // keep as string for input
  dateSown?: string; // yyyy-mm-dd
  expectedHarvest?: string; // yyyy-mm-dd
  seedSource?: string;
  seedLotCode?: string;
  intendedMerchant?: string;
  seedRatePerHa?: string;
  notes?: string;
  receipt_id?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (values: PlantingReturnFormValues) => void;
  saving?: boolean;
  initialValues?: PlantingReturnFormValues | null;
}

const DEFAULT_VALUES: PlantingReturnFormValues = {
  growerName: '',
  growerNumber: '',
  contactPhone: '',
  gardenNumber: '',
  fieldName: '',
  district: '',
  subcounty: '',
  parish: '',
  village: '',
  gpsLat: '',
  gpsLng: '',
  crop: '',
  variety: '',
  seedClass: '',
  areaHa: '',
  dateSown: '',
  expectedHarvest: '',
  seedSource: '',
  seedLotCode: '',
  intendedMerchant: '',
  seedRatePerHa: '',
  receipt_id: '',
  notes: ''
};

// Seed class options

const SEED_CLASS_OPTIONS = ['Pre-Basic', 'Basic', 'Certified', 'QDS'];

const PlantingReturnCreateDialog = ({
  open,
  onOpenChange,
  onSave,
  saving,
  initialValues
}: Props) => {
  const { currentUser } = useAuthContext();
  const [values, setValues] = useState<PlantingReturnFormValues>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Crops and varieties from API
  const LIST_VARS = { filter: {}, pagination: { page: 1, size: 200 } } as const;
  const { data: cropsData, loading: cropsLoading } = useQuery(LOAD_CROPS, { variables: LIST_VARS });
  const cropOptions = useMemo(
    () =>
      ((cropsData?.crops?.items || []) as any[]).map((c) => ({ id: String(c.id), name: c.name })),
    [cropsData?.crops?.items]
  );
  const [loadCropVarieties] = useLazyQuery(LOAD_CROP);
  const [varietyStore, setVarietyStore] = useState<
    Record<string, { items: { id: string; name: string }[]; loading?: boolean; error?: string }>
  >({});

  const fetchVarieties = async (cropId: string) => {
    if (!cropId) return;
    setVarietyStore((prev) => ({
      ...prev,
      [cropId]: {
        ...(prev[cropId] || {}),
        loading: true,
        error: undefined,
        items: prev[cropId]?.items || []
      }
    }));
    try {
      const res = await loadCropVarieties({ variables: { id: cropId } });
      const items = ((res.data?.crop?.varieties || []) as any[]).map((v) => ({
        id: String(v.id),
        name: v.name
      }));
      setVarietyStore((prev) => ({
        ...prev,
        [cropId]: { items, loading: false, error: undefined }
      }));
    } catch (e: any) {
      setVarietyStore((prev) => ({
        ...prev,
        [cropId]: {
          items: prev[cropId]?.items || [],
          loading: false,
          error: e?.message || 'Failed to load varieties'
        }
      }));
    }
  };

  useEffect(() => {
    if (open) {
      const prefill: Partial<PlantingReturnFormValues> = {
        growerName: currentUser?.name || currentUser?.username || '',
        contactPhone: currentUser?.phone_number || ''
      };
      if (initialValues) {
        setValues({ ...DEFAULT_VALUES, ...prefill, ...initialValues });
      } else {
        setValues({ ...DEFAULT_VALUES, ...prefill });
      }
      setErrors({});
      // If a crop is preselected (edit mode), ensure its varieties are loaded
      const cid = initialValues?.crop;
      if (cid) fetchVarieties(String(cid));
    }
  }, [open, initialValues, currentUser]);

  const varietyOptions = useMemo(
    () => (values.crop ? varietyStore[values.crop]?.items || [] : []),
    [values.crop, varietyStore]
  );

  const handleChange = (key: keyof PlantingReturnFormValues, value: any) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete (n as any)[key];
      return n;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    setValues(prev => ({ ...prev, [name]: files?.[0] || null }));
  };

  const handleGeo = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleChange('gpsLat', String(pos.coords.latitude));
        handleChange('gpsLng', String(pos.coords.longitude));
      },
      () => {
        // ignore
      }
    );
  };

  const validate = (): boolean => {
    const er: Record<string, string> = {};
    if (!values.growerName) er.growerName = 'Grower name is required';
    // Garden number is generated in backend; do not validate here
    if (!values.crop) er.crop = 'Select crop';
    if (!values.variety) er.variety = 'Select variety';
    if (!values.areaHa || Number(values.areaHa) <= 0) er.areaHa = 'Enter area in ha';
    if (!values.dateSown) er.dateSown = 'Date of sowing required';
    if (!values.expectedHarvest) er.expectedHarvest = 'Expected harvest date required';
    if (!values.seedSource) er.seedSource = 'Seed source is required';
    if (!values.seedLotCode) er.seedLotCode = 'Lot code is required';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSave?.(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[980px] w-[96vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="note" /> Planting Return (SR8)
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-8">
          {/* Grower details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Seed Grower Name</label>
              <Input
                value={values.growerName}
                onChange={(e) => handleChange('growerName', e.target.value)}
                placeholder="Name"
                readOnly
              />
              {errors.growerName && (
                <div className="text-xs text-danger mt-1">{errors.growerName}</div>
              )}
            </div>
            <div>
              <label className="form-label">Seed Grower Number</label>
              <Input
                value={values.growerNumber || ''}
                onChange={(e) => handleChange('growerNumber', e.target.value)}
                placeholder="e.g. H001"
              />
            </div>
            <div>
              <label className="form-label">Contact Phone</label>
              <Input
                value={values.contactPhone || ''}
                onChange={(e) => handleChange('contactPhone', e.target.value)}
                placeholder="Phone number"
                readOnly
              />
            </div>
            {/* Garden Number is auto-generated by backend; hidden in form */}
            <div className="md:col-span-2">
              <label className="form-label">Field Name</label>
              <Input
                value={values.fieldName || ''}
                onChange={(e) => handleChange('fieldName', e.target.value)}
                placeholder="Field name"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">District</label>
                <Input
                  value={values.district || ''}
                  onChange={(e) => handleChange('district', e.target.value)}
                  placeholder="District"
                />
              </div>
              <div>
                <label className="form-label">Sub-county</label>
                <Input
                  value={values.subcounty || ''}
                  onChange={(e) => handleChange('subcounty', e.target.value)}
                  placeholder="Sub-county"
                />
              </div>
              <div>
                <label className="form-label">Parish</label>
                <Input
                  value={values.parish || ''}
                  onChange={(e) => handleChange('parish', e.target.value)}
                  placeholder="Parish"
                />
              </div>
              <div>
                <label className="form-label">Village</label>
                <Input
                  value={values.village || ''}
                  onChange={(e) => handleChange('village', e.target.value)}
                  placeholder="Village"
                />
              </div>
              <div>
                <label className="form-label">GPS Latitude</label>
                <div className="flex gap-2">
                  <Input
                    value={values.gpsLat || ''}
                    onChange={(e) => handleChange('gpsLat', e.target.value)}
                    placeholder="Latitude"
                  />
                  <Button type="button" variant="outline" onClick={handleGeo}>
                    Get GPS
                  </Button>
                </div>
              </div>
              <div>
                <label className="form-label">GPS Longitude</label>
                <Input
                  value={values.gpsLng || ''}
                  onChange={(e) => handleChange('gpsLng', e.target.value)}
                  placeholder="Longitude"
                />
              </div>
            </div>
          </div>

          {/* Crop details */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Crop Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Crop</label>
                <Select
                  value={values.crop}
                  onValueChange={(v) => {
                    handleChange('crop', v);
                    handleChange('variety', '');
                    fetchVarieties(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={cropsLoading ? 'Loading crops…' : 'Select crop'} />
                  </SelectTrigger>
                  <SelectContent>
                    {cropOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.crop && <div className="text-xs text-danger mt-1">{errors.crop}</div>}
              </div>
              <div>
                <label className="form-label">Crop Variety</label>
                <Select value={values.variety} onValueChange={(v) => handleChange('variety', v)}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={values.crop ? 'Select variety' : 'Select crop first'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {varietyOptions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.variety && <div className="text-xs text-danger mt-1">{errors.variety}</div>}
              </div>
              <div>
                <label className="form-label">Select Seed Class</label>
                <Select
                  value={values.seedClass}
                  onValueChange={(v) => handleChange('seedClass', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select seed class" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEED_CLASS_OPTIONS.map((sc) => (
                      <SelectItem key={sc} value={sc}>
                        {sc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="form-label">Area planted (ha)</label>
                <Input
                  type="number"
                  value={values.areaHa || ''}
                  onChange={(e) => handleChange('areaHa', e.target.value)}
                  placeholder="e.g. 2.5"
                />
                {errors.areaHa && <div className="text-xs text-danger mt-1">{errors.areaHa}</div>}
              </div>
              <div>
                <label className="form-label">Date of sowing</label>
                <Input
                  type="date"
                  value={values.dateSown || ''}
                  onChange={(e) => handleChange('dateSown', e.target.value)}
                />
                {errors.dateSown && (
                  <div className="text-xs text-danger mt-1">{errors.dateSown}</div>
                )}
              </div>
              <div>
                <label className="form-label">Expected harvest date</label>
                <Input
                  type="date"
                  value={values.expectedHarvest || ''}
                  onChange={(e) => handleChange('expectedHarvest', e.target.value)}
                />
                {errors.expectedHarvest && (
                  <div className="text-xs text-danger mt-1">{errors.expectedHarvest}</div>
                )}
              </div>
              <div>
                <label className="form-label">Seed source</label>
                <Input
                  value={values.seedSource || ''}
                  onChange={(e) => handleChange('seedSource', e.target.value)}
                  placeholder="Supplier / source"
                />
                {errors.seedSource && (
                  <div className="text-xs text-danger mt-1">{errors.seedSource}</div>
                )}
              </div>
              <div>
                <label className="form-label">Seed lot code</label>
                <Input
                  value={values.seedLotCode || ''}
                  onChange={(e) => handleChange('seedLotCode', e.target.value)}
                  placeholder="Lot number/code"
                />
                {errors.seedLotCode && (
                  <div className="text-xs text-danger mt-1">{errors.seedLotCode}</div>
                )}
              </div>
              <div>
                <label className="form-label">Intended merchant / seed company</label>
                <Input
                  value={values.intendedMerchant || ''}
                  onChange={(e) => handleChange('intendedMerchant', e.target.value)}
                  placeholder="Company"
                />
              </div>
              <div>
                <label className="form-label">Seed rate per hectare</label>
                <Input
                  value={values.seedRatePerHa || ''}
                  onChange={(e) => handleChange('seedRatePerHa', e.target.value)}
                  placeholder="e.g. 20kg/ha"
                />
              </div>
            </div>
            <div>
              <label className="form-label">Detail</label>
              <Textarea
                rows={4}
                value={values.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Any additional info"
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment receipt *
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  name="paymentReceipt"
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  id="paymentReceipt"
                  // disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  // disabled={loading}
                >
                  <label htmlFor="paymentReceipt" className="cursor-pointer">
                    <Upload size={16} className="mr-2" />
                    Browse
                  </label>
                </Button>
                
                <span className="text-sm text-gray-500 truncate">
                  {values.receipt_id ? values.receipt_id : initialValues?.receipt_id || 'Select file'}
                </span>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button variant="light" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!!saving}>
              <KeenIcon icon="tick-square" /> {saving ? 'Saving…' : 'Submit SR8'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { PlantingReturnCreateDialog };
