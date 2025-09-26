import { useState, useEffect } from 'react';
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
import { URL_2 } from '@/config/urls';

interface QDSFormDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: T | null; // null -> create, object -> edit
  onSave?: (values: Record<string, any>) => void;
  saving?: boolean;
}

const QDSFormDialog = ({ open, onOpenChange, onSave, data, saving }: QDSFormDialogProps) => {
  const [values, setValues] = useState<Record<string, any>>({
    croppingHistory: '',
    yearsOfExperience: '',
    previousGrowerNumber: '',
    BeenQdsProducer: '',
    adequateStorage: 'Yes',
    adequateIsolation: 'No',
    adequateLabour: 'Yes',
    standardSeed: 'Yes',
    isolationDistance: '',
    numberOfLabours: '',
    recommendation_id: '',
    receipt_id: '',
    certificate: '',
  });

  // Prefill when editing
  useEffect(() => {
    if (data) {
      setValues({
        croppingHistory: data.cropping_history ?? '',
        yearsOfExperience: data.years_of_experience ?? '',
        previousGrowerNumber: data.previous_grower_number ?? '',
        BeenQdsProducer: data.have_been_qds ? 'Yes' : 'No',
        adequateStorage: data.have_adequate_storage_facility ? 'Yes' : 'No',
        adequateIsolation: data.have_adequate_isolation ? 'Yes' : 'No',
        adequateLabour: data.have_adequate_labor ? 'Yes' : 'No',
        standardSeed: data.aware_of_minimum_standards ? 'Yes' : 'No',
        isolationDistance: data.isolation_distance?.toString() ?? '',
        numberOfLabours: data.number_of_labors?.toString() ?? '',
        recommendation_id: data.recommendation_id ?? '',
        receipt_id: data.receipt_id ?? '',
        certification: data.certification ?? '',
      });
    } else {
      setValues({
        croppingHistory: '',
        yearsOfExperience: '',
        previousGrowerNumber: '',
        BeenQdsProducer: '',
        adequateStorage: 'Yes',
        adequateIsolation: 'No',
        adequateLabour: 'Yes',
        standardSeed: 'Yes',
        isolationDistance: '',
        numberOfLabours: '',
        recommendation_id: '',
        receipt_id: '',
        certificate: '',
      });
    }
  }, [data]);

  const handleChange = (key: string, value: any) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = () => {
    const payload = {
      ...values,
      isolationDistance: values.isolationDistance
        ? parseInt(values.isolationDistance, 10)
        : 0,
      numberOfLabours: values.numberOfLabours
        ? parseInt(values.numberOfLabours, 10)
        : 0,
    };
    onSave?.(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[980px] w-[96vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="note" /> {data ? 'Edit Application' : 'Create Application'}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-8">
          {/* Experience & Business Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Experience & Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="form-label">Years of experience</label>
                <Input
                  value={values.yearsOfExperience}
                  onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="form-label">Crop history for the last three seasons or years</label>
                <Textarea
                  value={values.croppingHistory}
                  onChange={(e) => handleChange('croppingHistory', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Capability Assessment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Capability Assessment</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                ['BeenQdsProducer', 'Have you been a QDS producer in the past?'],
                ['adequateStorage', 'I/We have adequate storage facilities to handle the resultant seed'],
                ['adequateIsolation', 'Do you have adequate isolation?'],
                ['adequateLabour', 'Do you have adequate labor to carry out all farm operations in a timely manner?'],
                ['standardSeed', 'Are you aware that only seed that meets the minimum standards shall be accepted?'],
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

              {values.BeenQdsProducer === 'Yes' && (
                <div className="flex flex-col gap-1">
                  <label className="form-label">Specify QDS grower number:</label>
                  <Input
                    value={values.previousGrowerNumber || ''}
                    onChange={(e) => handleChange('previousGrowerNumber', e.target.value)}
                    placeholder="Enter previous grower number"
                  />
                </div>
              )}

              {values.adequateIsolation === 'Yes' && (
                <div className="flex flex-col gap-1">
                  <label className="form-label">Specify isolation distance (in meters)</label>
                  <Input
                    value={values.isolationDistance || ''}
                    onChange={(e) => handleChange('isolationDistance', e.target.value)}
                    placeholder="Enter distance in meters"
                  />
                </div>
              )}

              {values.adequateLabour === 'Yes' && (
                <div className="flex flex-col gap-1">
                  <label className="form-label">Specify number of laborers</label>
                  <Input
                    value={values.numberOfLabours || ''}
                    onChange={(e) => handleChange('numberOfLabours', e.target.value)}
                    placeholder="Enter number of laborers"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Receipt Upload</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div className="max-w-md">
                <div className="flex flex-col gap-2">
                  <label className="form-label text-gray-700 font-medium">Attach Receipt</label>
                  
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
    
                  {/* Existing receipt when record has one and no new file selected */}
                    {!values.receipt && (data as any)?.receipt_id && (
                      <div className="mt-2 text-sm text-gray-700">
                        <div className="mb-1">Existing receipt:</div>
                        {/\.(png|jpe?g|gif|bmp|webp)$/i.test(String((data as any)?.receipt_id)) ? (
                          <a
                            href={`${URL_2}/form_attachments/${(data as any)?.receipt_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={`${URL_2}/form_attachments/${(data as any)?.receipt_id}`}
                              alt="Existing receipt preview"
                              className="mt-1 w-40 rounded-lg shadow"
                            />
                          </a>
                        ) : (
                          <a
                            href={`${URL_2}/form_attachments/${(data as any)?.receipt_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            View existing receipt
                          </a>
                        )}
                      </div>
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
              <div className="max-w-md">
                <div className="flex flex-col gap-2">
                  <label className="form-label text-gray-700 font-medium">Attach Recommendation letter</label>
                  
                  <label
                    htmlFor="recommendation_id-upload"
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
                      id="recommendation_id-upload"
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) =>
                        handleChange("recommendation_id", e.target.files?.[0] || null)
                      }
                    />
                  </label>
    
                  {/* Show file name */}
                  {values.recommendation_id && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected file: <span className="font-medium">{values.recommendation_id.name}</span>
                    </p>
                  )}
    
                  {/* Existing receipt when record has one and no new file selected */}
                    {!values.otherDocuments && (data as any)?.recommendation_id && (
                      <div className="mt-2 text-sm text-gray-700">
                        <div className="mb-1">Existing documents:</div>
                        {/\.(png|jpe?g|gif|bmp|webp)$/i.test(String((data as any)?.recommendation_id)) ? (
                          <a
                            href={`${URL_2}/form_attachments/${(data as any)?.recommendation_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={`${URL_2}/form_attachments/${(data as any)?.recommendation_id}`}
                              alt="Existing receipt preview"
                              className="mt-1 w-40 rounded-lg shadow"
                            />
                          </a>
                        ) : (
                          <a
                            href={`${URL_2}/form_attachments/${(data as any)?.recommendation_id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            View existing Attachments
                          </a>
                        )}
                      </div>
                    )}
    
                  {/* Image preview if it's an image */}
                  {values.recommendation_id && values.recommendation_id.type.startsWith("image/") && (
                    <img
                      src={URL.createObjectURL(values.recommendation_id)}
                      alt="recommendation preview"
                      className="mt-2 w-40 rounded-lg shadow"
                    />
                  )}
                </div>
              </div>
              <div className="max-w-md">
                <div className="flex flex-col gap-2">
                  <label className="form-label text-gray-700 font-medium">Attach Certificate of registration</label>
                  
                  <label
                    htmlFor="certificate-upload"
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
                      id="certificate-upload"
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) =>
                        handleChange("certificate", e.target.files?.[0] || null)
                      }
                    />
                  </label>
    
                  {/* Show file name */}
                  {values.certificate && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected file: <span className="font-medium">{values.certificate.name}</span>
                    </p>
                  )}
    
                  {/* Existing receipt when record has one and no new file selected */}
                    {!values.certificate && (data as any)?.certificate && (
                      <div className="mt-2 text-sm text-gray-700">
                        <div className="mb-1">Existing documents:</div>
                        {/\.(png|jpe?g|gif|bmp|webp)$/i.test(String((data as any)?.certificate)) ? (
                          <a
                            href={`${URL_2}/form_attachments/${(data as any)?.certificate}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block"
                          >
                            <img
                              src={`${URL_2}/form_attachments/${(data as any)?.certificate}`}
                              alt="Existing certificate preview"
                              className="mt-1 w-40 rounded-lg shadow"
                            />
                          </a>
                        ) : (
                          <a
                            href={`${URL_2}/form_attachments/${(data as any)?.certificate}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            View existing Attachments
                          </a>
                        )}
                      </div>
                    )}
    
                  {/* Image preview if it's an image */}
                  {values.certificate && values.certificate.type.startsWith("image/") && (
                    <img
                      src={URL.createObjectURL(values.certificate)}
                      alt="certificate preview"
                      className="mt-2 w-40 rounded-lg shadow"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Declaration Section */}
          
          {!data && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Declaration</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  I/WE* AT ANY TIME DURING OFFICIAL WORKING HOURS EVEN WITHOUT previous appointment will allow the inspectors entry to the seed stores
                  and thereby provide them with the facilities necessary to carry out their inspection work as laid out in the seed and plant regulations, 2015.
                  I/We further declare that I/We am/are conversant with the Regulations.
                </p>
                <div className="flex items-center gap-2">
                  <input type="radio" id="accept-declaration" name="declaration" className="text-blue-600" />
                  <label htmlFor="accept-declaration" className="form-label text-sm cursor-pointer">I Accept</label>
                </div>
              </div>
            </div>
          )}
        </DialogBody>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <Button variant="light" onClick={() => onOpenChange(false)}>Cancel</Button>
          <div className="flex gap-2">
            {data && (
              <Button variant="outline" onClick={() => console.log('Save draft', values)}>
                <KeenIcon icon="task" /> Save Draft
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={saving}>
              <KeenIcon icon="tick-square" /> {data ? 'Save Changes' : 'Create Application'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { QDSFormDialog };
