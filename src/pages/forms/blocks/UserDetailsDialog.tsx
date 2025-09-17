import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface IUserDetailsDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: T;
}

const LabeledRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 md:gap-y-4 md:gap-x-8 items-start">
    <div className="text-sm text-gray-700 font-medium pt-1">{label}</div>
    <div className="md:col-span-2">
      <div className="form-control">{children}</div>
    </div>
  </div>
);

const yesno = (b?: boolean | null) => (b ? 'Yes' : 'No');

const typeLabel = (t?: string) =>
  t === 'seed_exporter_or_importer' ? 'Seed Exporter/Importer' : 'Seed Merchant/Company';

const statusBadge = (s?: string | null) => {
  const color =
    s === 'accepted' || s === 'recommended'
      ? 'success'
      : s === 'rejected' || s === 'halted'
        ? 'danger'
        : 'primary';
  return (
    <span className={`badge badge-${color} badge-outline rounded-[30px]`}>{s || 'pending'}</span>
  );
};

const UserDetailsDialog = ({ open, onOpenChange, data }: IUserDetailsDialogProps<any>) => {
  const d = data || {};
  const [action, setAction] = useState<'assign_inspector' | 'halt' | 'reject' | ''>('');
  const [inspector, setInspector] = useState('');
  const [comment, setComment] = useState('');
  const isConfirmDisabled =
    !action ||
    (action === 'assign_inspector' && !inspector) ||
    ((action === 'halt' || action === 'reject') && !comment);
  const handleConfirm = () => {
    console.log('Confirm action', { id: d?.id, action, inspector, comment });
    onOpenChange(false);
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[570px] h-full flex flex-col">
        <SheetHeader className="mb-0 px-2 pt-0">
          <SheetTitle className="flex items-center gap-2">
            <KeenIcon icon="information-2" /> Application Details
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-6 space-y-6">
          <div className="space-y-4">
            <LabeledRow label="Application Category">{typeLabel(d.type)}</LabeledRow>
            <LabeledRow label="Seed board registration number">
              {d.seed_board_registration_number || '-'}
            </LabeledRow>
            <LabeledRow label="Experience in">{d.experienced_in || '-'}</LabeledRow>
            <LabeledRow label="Years of experience">{d.years_of_experience || '-'}</LabeledRow>
            <LabeledRow label="Dealers in">{d.dealers_in || '-'}</LabeledRow>
            <LabeledRow label="Marketing of">{d.marketing_of || '-'}</LabeledRow>
            <LabeledRow label="Have adequate land">{yesno(d.have_adequate_land)}</LabeledRow>
            <LabeledRow label="Have adequate storage">{yesno(d.have_adequate_storage)}</LabeledRow>
            <LabeledRow label="Land size (In Acres)">{d.land_size || '-'}</LabeledRow>
            <LabeledRow label="Have adequate equipment">
              {yesno(d.have_adequate_equipment)}
            </LabeledRow>
            <LabeledRow label="Have contractual agreement">
              {yesno(d.have_contractual_agreement)}
            </LabeledRow>
            <LabeledRow label="Have adequate field officers">
              {yesno(d.have_adequate_field_officers)}
            </LabeledRow>
            <LabeledRow label="Have conversant seed matters">
              {yesno(d.have_conversant_seed_matters)}
            </LabeledRow>
            <LabeledRow label="Source of seed">{d.source_of_seed || '-'}</LabeledRow>
            <LabeledRow label="Have adequate land for production">
              {yesno(d.have_adequate_land_for_production)}
            </LabeledRow>
            <LabeledRow label="Have internal quality program">
              {yesno(d.have_internal_quality_program)}
            </LabeledRow>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="text-sm text-gray-700 font-medium">Status</div>
            <div className="md:col-span-2">{statusBadge(d.status)}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="text-sm text-gray-700 font-medium">Status comment</div>
            <div className="md:col-span-2">
              <div className="form-control">{d.status_comment || '-'}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-900">Take Action</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { value: 'assign_inspector', label: 'Assign Inspector' },
                { value: 'halt', label: 'Halt' },
                { value: 'reject', label: 'Reject' }
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    action === (opt.value as any) ? 'border-primary-500' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="sr4-action"
                    value={opt.value}
                    checked={action === (opt.value as any)}
                    onChange={() => setAction(opt.value as any)}
                    className="text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                </label>
              ))}
            </div>

            {action === 'assign_inspector' && (
              <div className="max-w-sm">
                <label className="form-label text-sm">Select Inspector</label>
                <Select value={inspector} onValueChange={setInspector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose inspector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isaac">Isaac Mbabazi</SelectItem>
                    <SelectItem value="otim">Otim Jb</SelectItem>
                    <SelectItem value="hilda">Hilda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {(action === 'halt' || action === 'reject') && (
              <div className="max-w-xl">
                <label className="form-label text-sm">Status comment</label>
                <Textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={`Provide a reason for ${action}…`}
                />
              </div>
            )}
          </div>
        </div>
        <div className="mt-0 border-t px-2 py-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="light" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              className="btn btn-secondary"
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
            >
              <KeenIcon icon="tick-square" /> Approve
            </Button>
            <Button onClick={handleConfirm} disabled={isConfirmDisabled}>
              <KeenIcon icon="tick-square" /> Confirm Action
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { UserDetailsDialog };
