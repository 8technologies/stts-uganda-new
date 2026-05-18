import React, { useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

type CropVariety = {
  id: string;
  name: string;
};

type CropItem = {
  id: string;
  name: string;
  varieties?: CropVariety[];
};

type BreederItem = {
  id: string;
  name?: string | null;
  username?: string | null;
};

export type PreOrderFormValues = {
  cropId: string;
  varietyId: string;
  breederId: string;
  seedClass: string;
  quantity: string;
  requestedDate: string;
  pickup_location: string;
  comment: string;
  status: string;
};

type SubmitPayload = {
  values: PreOrderFormValues;
  mode: 'create' | 'edit';
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  crops: CropItem[];
  breeders: BreederItem[];
  loading?: boolean;
  initialValues: PreOrderFormValues;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: SubmitPayload) => Promise<void>;
};

const PreOrderFormSheet: React.FC<Props> = ({
  open,
  mode,
  crops,
  breeders,
  loading = false,
  initialValues,
  onOpenChange,
  onSubmit,
}) => {
  const [form, setForm] = useState<PreOrderFormValues>(initialValues);

  React.useEffect(() => {
    if (open) {
      setForm(initialValues);
    }
  }, [open, initialValues]);

  console.log('Form values:', initialValues);

  const selectedCrop = useMemo(
    () => crops.find((crop) => String(crop.id) === String(form.cropId)),
    [crops, form.cropId]
  );

  const varieties = selectedCrop?.varieties ?? [];
  const isEdit = mode === 'edit';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({ values: form, mode });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[660px] overflow-y-auto p-0">
        <SheetHeader className="px-6 py-5 border-b bg-primary text-primary-foreground">
          <SheetTitle className="text-primary-foreground text-xl font-semibold">
            {isEdit ? 'Edit pre-order request' : 'Create pre-order request'}
          </SheetTitle>
          <p className="text-primary-foreground/80 text-sm mt-1">
            {isEdit
              ? 'Update request notes and status from the same form.'
              : 'Submit your seed supply request in advance.'}
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700 block mb-1">Breeder</label>
              <select
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm disabled:bg-gray-100"
                value={form.breederId}
                onChange={(event) => setForm((prev) => ({ ...prev, breederId: event.target.value }))}
                 
              >
                <option value="">Select breeder</option>
                {breeders.map((breeder) => (
                  <option key={breeder.id} value={breeder.id}>
                    {breeder.name || breeder.username || `Breeder #${breeder.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-700 block mb-1">Crop</label>
              <select
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm disabled:bg-gray-100"
                value={form.cropId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    cropId: event.target.value,
                    varietyId: '',
                  }))
                }
                 
                required
              >
                <option value="">Select crop</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>
                    {crop.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-700 block mb-1">Variety</label>
              <select
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm disabled:bg-gray-100"
                value={form.varietyId}
                onChange={(event) => setForm((prev) => ({ ...prev, varietyId: event.target.value }))}
                
                required
              >
                <option value="">Select variety</option>
                {varieties.map((variety) => (
                  <option key={variety.id} value={variety.id}>
                    {variety.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-700 block mb-1">Quantity (kg)</label>
              <input
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm disabled:bg-gray-100"
                type="number"
                min="1"
                step="0.1"
                value={form.quantity}
                onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                placeholder="e.g. 500"
                 
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 block mb-1">Requested date</label>
              <input
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm disabled:bg-gray-100"
                type="date"
                value={form.requestedDate}
                onChange={(event) => setForm((prev) => ({ ...prev, requestedDate: event.target.value }))}
                 
                required
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 block mb-1">Seed class</label>
              <select
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm disabled:bg-gray-100"
                value={form.seedClass}
                onChange={(event) => setForm((prev) => ({ ...prev, seedClass: event.target.value }))}
                 
              >
                <option value="">Select seed class</option>
                <option value="certified">Certified</option>
                <option value="quality_declared">Quality Declared</option>
                <option value="basic">Basic</option>
                <option value="pre_basic">Pre-basic</option>
              </select>
              
            </div>

            <div>
              <label className="text-sm text-gray-700 block mb-1">Pickup location</label>
              <input
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm disabled:bg-gray-100"
                type="text"
                value={form.pickup_location}
                onChange={(event) => setForm((prev) => ({ ...prev, pickup_location: event.target.value }))}
                placeholder="Where seed will be picked"
                 
              />
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="text-sm text-gray-700 block mb-1">Status</label>
              <select
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                disabled={loading}
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-sm text-gray-700 block mb-1">Comment {isEdit ? '' : '(optional)'}</label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
              rows={3}
              value={form.comment}
              onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
              placeholder="Add notes for your pre-order request"
            />
          </div>

          {isEdit && (
            <div className="text-xs text-gray-500 bg-gray-50 border rounded-lg p-3">
              Crop, variety, quantity, and requested date are kept read-only for existing requests.
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Submit pre-order'}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default PreOrderFormSheet;
