/* eslint-disable prettier/prettier */
import { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
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
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { LOAD_STOCK_RECORDS } from '@/gql/queries';

interface ISeedLabCreateDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (values: Record<string, any>) => void;
  saving?: boolean;
}

const SeedLabCreateDialog = ({ open, onOpenChange, onSave, saving }: ISeedLabCreateDialogProps) => {
  const [values, setValues] = useState<Record<string, any>>({
    varietyId: '',
    stockExamId: '',
    collectionDate: '',
    applicantRemark: '',
    receipt: null as File | null
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Load stock records to populate the select
  const {
    data: stockData,
    loading: stockLoading,
    error: stockError,
    refetch: refetchStock,
  } = useQuery(LOAD_STOCK_RECORDS, { skip: !open });

  const stockOptions = useMemo(() => {
    const rows = stockData?.stockRecords ?? [];
    return rows.map((r: any) => {
      const id = r.id?.toString?.() ?? String(r.id);
      const lot = r.lot_number ?? id;
      const cls = r.seed_class ? ` • ${r.seed_class}` : '';
      const dt = r.created_at ? ` • ${new Date(r.created_at).toLocaleDateString()}` : '';
      return {
        value: id,
        label: `Lot ${lot}${cls}${dt}`,
      };
    });
  }, [stockData]);

  const handleChange = (key: string, value: any) =>
    setValues((v) => ({ ...v, [key]: value }));

  const requiredOk = Boolean(values.stockExamId && values.collectionDate);

  const handleSubmit = () => {
    setTouched({ varietyId: true, collectionDate: true });
    if (!requiredOk) return;
    onSave?.(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[820px] w-[96vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="note" /> Create Seed Lab Inspection
          </DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-8">
          {/* Sample & Linking */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Sample & Linking</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="flex flex-col gap-1">
                <label className="form-label">Stock Examination</label>
                <Select
                  value={values.stockExamId || undefined} // use undefined to show placeholder
                  onValueChange={(v) =>
                    handleChange('stockExamId', v === '__none' ? '' : v) // map sentinel to empty
                  }
                  disabled={stockLoading || !!stockError}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        stockLoading ? 'Loading…' :
                        stockError ? 'Failed to load' :
                        'Choose stock examination (optional)'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {/* DO NOT use value="" here */}
                    <SelectItem value="__none">— None —</SelectItem>

                    {!stockLoading && !stockError && stockOptions.length === 0 && (
                      <SelectItem value="__empty" disabled>No records found</SelectItem>
                    )}

                    {!stockLoading && !stockError && stockOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Optional tiny helper under the select on error */}
                {stockError && (
                  <button
                    type="button"
                    className="text-xs underline mt-1"
                    onClick={() => refetchStock()}
                  >
                    Retry loading stock records
                  </button>
                )}
              </div>


              <div className="flex flex-col gap-1">
                <label className="form-label">
                  Collection Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={values.collectionDate}
                  onChange={(e) => handleChange('collectionDate', e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, collectionDate: true }))}
                />
                {touched.collectionDate && !values.collectionDate && (
                  <span className="text-xs text-red-600">Collection date is required.</span>
                )}
              </div>

              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="form-label">Applicant Remark</label>
                <Textarea
                  rows={3}
                  value={values.applicantRemark}
                  onChange={(e) => handleChange('applicantRemark', e.target.value)}
                  placeholder="Any additional information about the sample…"
                />
              </div>
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Receipt Upload</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="max-w-md">
                <div className="flex flex-col gap-2">
                  <label className="form-label text-gray-700 font-medium">
                    Attach Receipt (optional)
                  </label>

                  <label
                    htmlFor="receipt-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 transition"
                  >
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-10 h-10 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l-4-4m4 4l4-4" />
                      </svg>
                      <span className="text-sm text-gray-500">Click to upload or drag & drop</span>
                      <span className="text-xs text-gray-400">PNG, JPG, PDF (max 5MB)</span>
                    </div>
                    <input
                      id="receipt-upload"
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) => handleChange('receipt', e.target.files?.[0] || null)}
                    />
                  </label>

                  {values.receipt && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected file: <span className="font-medium">{values.receipt.name}</span>
                    </p>
                  )}

                  {values.receipt && values.receipt.type?.startsWith('image/') && (
                    <img
                      src={URL.createObjectURL(values.receipt)}
                      alt="Receipt preview"
                      className="mt-2 w-40 rounded-lg shadow"
                    />
                  )}
                </div>
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
            <Button
              variant="outline"
              onClick={() => console.log('Save draft', values)}
              disabled={saving}
            >
              <KeenIcon icon="task" /> Save Draft
            </Button>
            <Button onClick={handleSubmit} disabled={!requiredOk || !!saving}>
              <KeenIcon icon="tick-square" />
              {saving ? ' Saving…' : ' Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { SeedLabCreateDialog };
