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
    applicationCategory: 'seed_merchant',
    registrationNumber: '',
    applicantName: '',
    address: '',
    phone: '',
    initials: '',
    premises: '',
    experienceIn: '',
    yearsOfExperience: '',
    dealersIn: '',
    marketingOf: '',
    adequateLand: 'No',
    adequateStorage: 'No',
    landSize: '',
    adequateEquipment: 'No',
    contractualAgreement: 'No',
    fieldOfficers: 'No',
    conversantSeedMatters: 'No',
    sourceOfSeed: '',
    adequateLandForProduction: 'No',
    internalQualityProgram: 'No',
    receipt: '',
    statusComment: ''
  });

  // hydrate values from SR4 record
  useEffect(() => {
    if (!open || !data) return;
    const d: any = data;
    const yesno = (b: any) => (b ? 'Yes' : 'No');
    setValues({
      applicationCategory: d.type ?? 'seed_merchant',
      registrationNumber: d.seed_board_registration_number ?? '',
      applicantName: d.name_of_applicant ?? '',
      address: d.address ?? '',
      phone: d.phone_number ?? '',
      initials: d.company_initials ?? '',
      premises: d.premises_location ?? '',
      experienceIn: d.experienced_in ?? '',
      yearsOfExperience: d.years_of_experience ?? '',
      dealersIn: d.dealers_in ?? '',
      marketingOf: d.marketing_of ?? '',
      adequateLand: yesno(d.have_adequate_land),
      adequateStorage: yesno(d.have_adequate_storage),
      landSize: d.land_size ?? '',
      adequateEquipment: yesno(d.have_adequate_equipment),
      contractualAgreement: yesno(d.have_contractual_agreement),
      fieldOfficers: yesno(d.have_adequate_field_officers),
      conversantSeedMatters: yesno(d.have_conversant_seed_matters),
      sourceOfSeed: d.source_of_seed ?? '',
      adequateLandForProduction: yesno(d.have_adequate_land_for_production),
      internalQualityProgram: yesno(d.have_internal_quality_program),
      receipt: '',
      statusComment: d.status_comment ?? ''
    });
  }, [open, data]);

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
    <DialogBody className="space-y-8">
      {/* Basic Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="form-label">Application Category</label>
            <Select value={values.applicationCategory} onValueChange={(v) => handleChange('applicationCategory', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seed_merchant">Seed Merchant/Company</SelectItem>
                <SelectItem value="seed_exporter_or_importer">Seed Exporter/Importer</SelectItem>
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
            <label className="form-label">Company initials</label>
            <Input value={values.initials} onChange={(e) => handleChange('initials', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="form-label">Address</label>
            <Input value={values.address} onChange={(e) => handleChange('address', e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="form-label">Phone number</label>
            <Input value={values.phone} onChange={(e) => handleChange('phone', e.target.value)} />
          </div>
          <div className="md:col-span-2 flex flex-col gap-1">
            <label className="form-label">Premises location</label>
            <Input value={values.premises} onChange={(e) => handleChange('premises', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Experience & Business Details Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Experience & Business Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="flex flex-col gap-1">
            <label className="form-label">Source of seed</label>
            <Input value={values.sourceOfSeed} onChange={(e) => handleChange('sourceOfSeed', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Capability Assessment Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Capability Assessment</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[
            ['adequateLand', 'Do you have adequate land to handle basic seed?'],
            ['adequateStorage', 'I/We have adequate storage facilities to handle the resultant seed'],
            ['adequateEquipment', 'Do you have adequate equipment to process and repackage seed?'],
            ['contractualAgreement', 'Do you have contractual agreement with the growers you have recruited?'],
            ['fieldOfficers', 'Do you have adequate field officers to supervise and advise growers on all operation of seed production?'],
            ['conversantSeedMatters', 'Do you have adequate and knowledgeable personnel who are conversant with seed matters?'],
            ['adequateLandForProduction', 'Do you have adequate land for production of basic seed?'],
            ['internalQualityProgram', 'Do you have an internal quality program?']
          ].map(([key, label]) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="form-label text-sm">{label}</label>
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
        </div>
      </div>

      {/* Receipt Upload Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Receipt Upload</h3>
        <div className="max-w-md">
          <div className="flex flex-col gap-2">
            <label className="form-label text-gray-700 font-medium">Receipt</label>
            
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
                <span className="text-sm text-gray-500">
                  Click to upload or drag & drop
                </span>
                <span className="text-xs text-gray-400">PNG, JPG, PDF (max 5MB)</span>
              </div>
              <input
                id="receipt-upload"
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(e) =>
                  handleChange("receipt", e.target.files?.[0] || null)
                }
              />
            </label>

            {/* Show file name */}
            {values.receipt && (
              <p className="text-sm text-gray-600 mt-1">
                Selected file: <span className="font-medium">{values.receipt.name}</span>
              </p>
            )}

            {/* Image preview if it's an image */}
            {values.receipt && values.receipt.type.startsWith("image/") && (
              <img
                src={URL.createObjectURL(values.receipt)}
                alt="Receipt preview"
                className="mt-2 w-40 rounded-lg shadow"
              />
            )}
          </div>
        </div>
      </div>

      {/* Declaration Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Declaration</h3>
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">
            I/WE* AT ANY TIME DURING OFFICIAL WORKING HOURS EVEN WITHOUT previous appointment will allow the inspectors entry to the seed stores and thereby provide them with the facilities necessary to carry out their inspection work as laid out in the seed and plant regulations, 2015. I/We further declare that I/We am/are conversant with the Regulations. In addition I/We will send a list of all seed lots in our stores on a given date and/or at such a date as can be mutually agreed upon between the National Seed Certification Service and ourselves.
          </p>
          <div className='flex items-center gap-2'>
            <input type="radio" id="accept-declaration" name="declaration" className="text-blue-600" />
            <label htmlFor="accept-declaration" className="form-label text-sm cursor-pointer">I Accept</label>
          </div>
        </div>
      </div>

      {/* Application Status Section */}
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
            <div className='flex flex-row gap-4'>
              <div className="flex flex-col gap-1">
                <label className="form-label">Valid from?</label>
                <Input value={values.landSize} onChange={(e) => handleChange('landSize', e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="form-label">Valid until?</label>
                <Input value={values.landSize} onChange={(e) => handleChange('landSize', e.target.value)} />
              </div>
            </div>

            </div>
            
          )}
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
