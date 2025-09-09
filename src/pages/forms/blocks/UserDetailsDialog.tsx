import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';

interface IUserDetailsDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: T;
}

const LabeledRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
    <div className="text-sm text-gray-700 font-medium">{label}</div>
    <div className="md:col-span-2">
      <div className="form-control">{children}</div>
    </div>
  </div>
);

const UserDetailsDialog = ({ open, onOpenChange, data }: IUserDetailsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[980px] w-[96vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="information-2" /> Application Details
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-6">
          <div className="space-y-4">
            <LabeledRow label="Application Category">Seed Merchant/Company</LabeledRow>
            <LabeledRow label="Seed board registration number">MAAIF/MER/1029/2025</LabeledRow>
            <LabeledRow label="Name of applicant">{data?.user?.userName}</LabeledRow>
            <LabeledRow label="Address">Itaque ab qui cillum</LabeledRow>
            <LabeledRow label="Phone number">+1 (745) 145-3955</LabeledRow>
            <LabeledRow label="Company initials">Holder Phelps Associates</LabeledRow>
            <LabeledRow label="Premises location">Neque omnis nihil di</LabeledRow>
            <LabeledRow label="Experience in">Iste sunt sunt sint</LabeledRow>
            <LabeledRow label="Years of experience">1991 Years</LabeledRow>
            <LabeledRow label="Dealers in">Agricultural crops</LabeledRow>
            <LabeledRow label="Marketing of">Agricultural crops</LabeledRow>
            <LabeledRow label="Have adequate land">Yes</LabeledRow>
            <LabeledRow label="Have adequate storage">Yes</LabeledRow>
            <LabeledRow label="Land size (In Acres)">56</LabeledRow>
            <LabeledRow label="Have adequate equipment">No</LabeledRow>
            <LabeledRow label="Have contractual agreement">Yes</LabeledRow>
            <LabeledRow label="Have adequate field officers">Yes</LabeledRow>
            <LabeledRow label="Have conversant seed matters">Yes</LabeledRow>
            <LabeledRow label="Source of seed">Eos autem porro dolo</LabeledRow>
            <LabeledRow label="Have adequate land for production">Yes</LabeledRow>
            <LabeledRow label="Have internal quality program">Yes</LabeledRow>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="text-sm text-gray-700 font-medium">Status</div>
            <div className="md:col-span-2">
              <span className="badge badge-success badge-outline rounded-[30px]">Accepted</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="text-sm text-gray-700 font-medium">Status comment</div>
            <div className="md:col-span-2">
              <div className="form-control">No comment</div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="light" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => console.log('Request changes', data)}>
              <KeenIcon icon="message-text-2" /> Request Changes
            </Button>
            <Button onClick={() => console.log('Approve', data)}>
              <KeenIcon icon="tick-square" /> Approve
            </Button>
            <Button variant="light" onClick={() => console.log('Print certificate', data)}>
              <KeenIcon icon="printer" /> Print Certificate
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { UserDetailsDialog };
