import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KeenIcon } from '@/components';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { LOAD_CROPS, LOAD_CROP } from '@/gql/queries';
import { URL_2 } from '@/config/urls';

export type CropDeclarationInput = {
  id?: string;
  source_of_seed?: string;
  field_size?: number;
  seed_rate?: string;
  amount?: number;
  receipt_id?: File | null;
  crops: { crop_id: string; variety_id: string }[];
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (values: CropDeclarationInput) => void;
  saving?: boolean;
  initialValues?: CropDeclarationInput | null;
}

const DEFAULT_VALUES: CropDeclarationInput = {
  source_of_seed: '',
  field_size: undefined,
  seed_rate: '',
  amount: undefined,
  receipt_id: null,
  crops: []
};

const CropDeclarationDialog = ({ open, onOpenChange, onSave, saving, initialValues }: Props) => {
  const [values, setValues] = useState<CropDeclarationInput>({ ...DEFAULT_VALUES });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Crops + varieties
  const LIST_VARS = { filter: {}, pagination: { page: 1, size: 200 } } as const;
  const { data: cropsData } = useQuery(LOAD_CROPS, { variables: LIST_VARS });
  const cropOptions = (cropsData?.crops?.items || []).map((c: any) => ({
    id: String(c.id),
    name: c.name
  }));
  const [loadCropVarieties] = useLazyQuery(LOAD_CROP);
  const [varietyStore, setVarietyStore] = useState<Record<string, { id: string; name: string }[]>>({});

  const fetchVarieties = async (cropId: string) => {
    if (!cropId) return;
    if (varietyStore[cropId]) return; // already loaded
    const res = await loadCropVarieties({ variables: { id: cropId } });
    const items = (res.data?.crop?.varieties || []).map((v: any) => ({
      id: String(v.id),
      name: v.name
    }));
    setVarietyStore((prev) => ({ ...prev, [cropId]: items }));
  };

  useEffect(() => {
    if (open) {
      setValues(initialValues ? { ...DEFAULT_VALUES, ...initialValues } : { ...DEFAULT_VALUES });
      setErrors({});
    }
  }, [open, initialValues]);

  const handleChange = (key: keyof CropDeclarationInput, value: any) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete n[key as string];
      return n;
    });
  };

  const handleCropChange = (index: number, key: 'crop_id' | 'variety_id', value: string) => {
    const crops = [...values.crops];
    crops[index] = { ...crops[index], [key]: value };
    setValues((v) => ({ ...v, crops }));
    if (key === 'crop_id') fetchVarieties(value);
  };

  const addCropRow = () => {
    setValues((v) => ({ ...v, crops: [...v.crops, { crop_id: '', variety_id: '' }] }));
  };

  const removeCropRow = (index: number) => {
    setValues((v) => ({ ...v, crops: v.crops.filter((_, i) => i !== index) }));
  };

  const validate = (): boolean => {
    const er: Record<string, string> = {};
    if (!values.source_of_seed) er.source_of_seed = 'Source of seed required';
    if (!values.field_size || values.field_size <= 0) er.field_size = 'Field size required';
    if (!values.seed_rate) er.seed_rate = 'Seed rate required';
    if (!values.amount || values.amount <= 0) er.amount = 'Amount required';
    if (!values.crops.length) er.crops = 'At least one crop is required';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSave?.(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] w-[96vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="sprout" /> Crop Declaration
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Source of Seed</label>
              <Input
                value={values.source_of_seed || ''}
                onChange={(e) => handleChange('source_of_seed', e.target.value)}
              />
              {errors.source_of_seed && <div className="text-xs text-danger">{errors.source_of_seed}</div>}
            </div>
            <div>
              <label className="form-label">Field Size (ha)</label>
              <Input
                type="number"
                value={values.field_size || ''}
                onChange={(e) => handleChange('field_size', Number(e.target.value))}
              />
              {errors.field_size && <div className="text-xs text-danger">{errors.field_size}</div>}
            </div>
            <div>
              <label className="form-label">Seed Rate</label>
              <Input
                value={values.seed_rate || ''}
                onChange={(e) => handleChange('seed_rate', e.target.value)}
              />
              {errors.seed_rate && <div className="text-xs text-danger">{errors.seed_rate}</div>}
            </div>
            <div>
              <label className="form-label">Amount</label>
              <Input
                type="number"
                value={values.amount || ''}
                onChange={(e) => handleChange('amount', Number(e.target.value))}
              />
              {errors.amount && <div className="text-xs text-danger">{errors.amount}</div>}
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Receipt Upload</label>
              <Input
                type="file"
                onChange={(e) => handleChange('receipt_id', e.target.files?.[0] || null)}
              />
              {/* {console.log(values?.receipt_id)} */}
              {values?.receipt_id ? (
                console.log(values?.receipt_id),
                <a
                  href={`${URL_2}/form_attachments/${values?.receipt_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  View receipt
                </a>
              ) : (
                '-'
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex justify-between">
              Crops
              <Button type="button" size="sm" onClick={addCropRow}>
                + Add Crop
              </Button>
            </h3>
            {values.crops.map((crop, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="form-label">Crop</label>
                  <Select
                    value={crop.crop_id}
                    onValueChange={(v) => handleCropChange(idx, 'crop_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {cropOptions.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="form-label">Variety</label>
                  <Select
                    value={crop.variety_id}
                    onValueChange={(v) => handleCropChange(idx, 'variety_id', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={crop.crop_id ? 'Select variety' : 'Select crop first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(varietyStore[crop.crop_id] || []).map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button variant="destructive" size="sm" onClick={() => removeCropRow(idx)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {errors.crops && <div className="text-xs text-danger">{errors.crops}</div>}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="light" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!!saving}>
            <KeenIcon icon="tick-square" /> {saving ? 'Saving…' : 'Submit Declaration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { CropDeclarationDialog };
