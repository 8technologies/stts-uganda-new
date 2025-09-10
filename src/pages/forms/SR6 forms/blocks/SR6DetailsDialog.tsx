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
import { Textarea } from '@/components/ui/textarea';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

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

const SR6DetailsDialog = ({ open, onOpenChange, data }: IUserDetailsDialogProps) => {
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
      BeenSeedGrower: 'Yes',
      adequateStorage: 'Yes',
      landSize: '',
      adequateIsolation: 'No',
      adequateLabour: 'Yes',
      standardSeed: 'Yes',
      sourceOfSeed: '',
      receipt:'',
      otherDocuments: '',
      statusComment: '',
    });

  const handleChange = (key: string, value: any) => setValues((v) => ({ ...v, [key]: value }));

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

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Application Status</h3>
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <label className="form-label">Select Action</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'assign_inspector', label: 'Assign Inspector', color: 'text-blue-600' },
                    { value: 'halt', label: 'Halt', color: 'text-orange-600' },
                    { value: 'reject', label: 'Reject', color: 'text-red-600' },
                    { value: 'accept', label: 'Accept', color: 'text-green-600' }
                  ].map((option) => (
                    <div key={option.value} className="flex items-center gap-2 p-3 border rounded-lg hover:bg-gray-50">
                      <input 
                        type="radio" 
                        id={option.value}
                        name="applicationStatus" 
                        value={option.value}
                        checked={values.applicationStatus === option.value}
                        onChange={(e) => handleChange('applicationStatus', e.target.value)}
                        className="text-blue-600" 
                      />
                      <label 
                        htmlFor={option.value} 
                        className={`form-label text-sm font-medium cursor-pointer ${option.color}`}
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
    
              {/* Status Comment - Only show when Halt or Reject is selected */}
              {(values.applicationStatus === 'halt' || values.applicationStatus === 'reject') && (
                <div className="flex flex-col gap-1 animate-in slide-in-from-top-2 duration-200">
                  <label className="form-label">Status comment *</label>
                  <Textarea 
                    rows={3} 
                    value={values.statusComment} 
                    onChange={(e) => handleChange('statusComment', e.target.value)}
                    placeholder={`Please provide a reason for ${values.applicationStatus === 'halt' ? 'halting' : 'rejecting'} this application...`}
                    className="border-orange-300 focus:border-orange-500"
                  />
                </div>
                
              )}
              {(values.applicationStatus === 'assign_inspector') && (
                <div className="flex flex-col gap-1">
                  <label className="form-label">Select Inspector</label>
                  <Select value={values.landSize} onValueChange={(v) => handleChange('landSize', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Isaac">Isaac Mbabazi</SelectItem>
                      <SelectItem value="Otim">Otim Jb</SelectItem>
                      <SelectItem value="Hilda">Hilda</SelectItem>
                    </SelectContent>
                  </Select>
                  {/* <Input value={values.landSize} onChange={(e) => handleChange('landSize', e.target.value)} /> */}
                </div>
                
              )}
              {(values.applicationStatus === 'accept') && (
                <div>
                <div className="flex flex-col gap-1">
                  <label className="form-label">Enter Seed Board Registration number</label>
                  <Input value={values.landSize} onChange={(e) => handleChange('landSize', e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="form-label">Valid from?</label>
                    <Input type='date' className='' value={values.landSize} onChange={(e) => handleChange('landSize', e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="form-label">Valid until?</label>
                    <Input type='date' className='' value={values.landSize} onChange={(e) => handleChange('landSize', e.target.value)} />
                  </div>
                </div>
    
                </div>
                
              )}
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

export { SR6DetailsDialog };
