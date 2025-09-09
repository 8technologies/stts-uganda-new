import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';

interface IUserEditDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: T;
  onSave?: (values: Record<string, any>) => void;
}

const UserEditDialog = ({ open, onOpenChange, data, onSave }: IUserEditDialogProps) => {
  const [values, setValues] = useState<Record<string, any>>({
    applicationCategory: data?.role || 'Seed Merchant/Company',
    registrationNumber: 'MAAIF/MER/1029/2025',
    applicantName: data?.user?.userName || '',
    address: '',
    phone: '',
    initials: '',
    premises: '',
    experienceIn: '',
    yearsOfExperience: '',
    dealersIn: 'Agricultural crops',
    marketingOf: 'Agricultural crops',
    adequateLand: 'Yes',
    adequateStorage: 'Yes',
    landSize: '',
    adequateEquipment: 'No',
    contractualAgreement: 'Yes',
    fieldOfficers: 'Yes',
    conversantSeedMatters: 'Yes',
    sourceOfSeed: '',
    adequateLandForProduction: 'Yes',
    internalQualityProgram: 'Yes',
    statusComment: ''
  });

  const handleChange = (key: string, value: any) => setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = () => {
    onSave?.(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[980px] w-[96vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="note" /> Edit Application
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="form-label">Application Category</label>
              <Select value={values.applicationCategory} onValueChange={(v) => handleChange('applicationCategory', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Seed Merchant/Company">Seed Merchant/Company</SelectItem>
                  <SelectItem value="Grower/Producer/Breeder">Grower/Producer/Breeder</SelectItem>
                  <SelectItem value="QDS Producer">QDS Producer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label">Seed board registration number</label>
              <Input value={values.registrationNumber} onChange={(e) => handleChange('registrationNumber', e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="form-label">Name of applicant</label>
              <Input value={values.applicantName} onChange={(e) => handleChange('applicantName', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label">Address</label>
              <Input value={values.address} onChange={(e) => handleChange('address', e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="form-label">Phone number</label>
              <Input value={values.phone} onChange={(e) => handleChange('phone', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label">Company initials</label>
              <Input value={values.initials} onChange={(e) => handleChange('initials', e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="form-label">Premises location</label>
              <Input value={values.premises} onChange={(e) => handleChange('premises', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label">Experience in</label>
              <Input value={values.experienceIn} onChange={(e) => handleChange('experienceIn', e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="form-label">Years of experience</label>
              <Input value={values.yearsOfExperience} onChange={(e) => handleChange('yearsOfExperience', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label">Dealers in</label>
              <Input value={values.dealersIn} onChange={(e) => handleChange('dealersIn', e.target.value)} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="form-label">Marketing of</label>
              <Input value={values.marketingOf} onChange={(e) => handleChange('marketingOf', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="form-label">Land size (In Acres)</label>
              <Input value={values.landSize} onChange={(e) => handleChange('landSize', e.target.value)} />
            </div>

            {[
              ['adequateLand', 'Have adequate land'],
              ['adequateStorage', 'Have adequate storage'],
              ['adequateEquipment', 'Have adequate equipment'],
              ['contractualAgreement', 'Have contractual agreement'],
              ['fieldOfficers', 'Have adequate field officers'],
              ['conversantSeedMatters', 'Have conversant seed matters'],
              ['adequateLandForProduction', 'Have adequate land for production'],
              ['internalQualityProgram', 'Have internal quality program']
            ].map(([key, label]) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="form-label">{label}</label>
                <Select value={values[key]} onValueChange={(v) => handleChange(key, v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="form-label">Status comment</label>
              <Textarea rows={3} value={values.statusComment} onChange={(e) => handleChange('statusComment', e.target.value)} />
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="light" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => console.log('Save draft', values)}>
              <KeenIcon icon="task" /> Save Draft
            </Button>
            <Button onClick={handleSubmit}>
              <KeenIcon icon="tick-square" /> Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { UserEditDialog };

