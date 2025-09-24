import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Download, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type PlantingReturns = {
  id: string | number;
  companyName: string;
  companyAddress: string;
  companyTelephone: string;
  amountEnclosed: string;
  paymentReceipt?: string;
  registeredSeedMerchant: string;
  subGrowersFile?: string;
  createdAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

interface IPlantingReturnsFormProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSubmit?: (values: Record<string, any>) => void;
  loading: boolean;
  resetForm: boolean;
  initialValues?: PlantingReturns | null;
  title?: string;
  submitLabel?: string;
}
const PlantingReturnsForm = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  resetForm,
  initialValues,
  title,
  submitLabel
}: IPlantingReturnsFormProps) => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyTelephone: '',
    amountEnclosed: '',
    registeredSeedMerchant: '',
    paymentReceipt: null as File | null,
    subGrowersFile: null as File | null
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Basic validation
    if (!formData.companyName.trim()) {
      toast('Company name is required');
      return;
    }
    if (!formData.companyTelephone.trim()) {
      toast('Company telephone is required');
      return;
    }
    if (!formData.companyAddress.trim()) {
      toast('Company address is required');
      return;
    }
    if (!formData.amountEnclosed.trim()) {
      toast('Amount enclosed is required');
      return;
    }

    const submitData = {
      ...formData,
      paymentReceipt: formData.paymentReceipt?.name,
      subGrowersFile: formData.subGrowersFile?.name
    };

    onSubmit?.(submitData);
  };

  const handleClose = () => {
    setFormData({
      companyName: '',
      companyAddress: '',
      companyTelephone: '',
      amountEnclosed: '',
      registeredSeedMerchant: '',
      paymentReceipt: null,
      subGrowersFile: null
    });
    onClose?.(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files?.[0] || null }));
  };

  const downloadTemplate = () => {
    toast('Template downloaded successfully!');
  };

  useEffect(() => {
    if (resetForm) {
      setFormData({
        companyName: '',
        companyAddress: '',
        companyTelephone: '',
        amountEnclosed: '',
        registeredSeedMerchant: '',
        paymentReceipt: null,
        subGrowersFile: null
      });
    }
  }, [resetForm]);

  useEffect(() => {
    if (isOpen && initialValues) {
      setFormData({
        companyName: initialValues.companyName ?? '',
        companyAddress: initialValues.companyAddress ?? '',
        companyTelephone: initialValues.companyTelephone ?? '',
        amountEnclosed: initialValues.amountEnclosed ?? '',
        registeredSeedMerchant: initialValues.registeredSeedMerchant ?? '',
        paymentReceipt: null,
        subGrowersFile: null
      });
    }
  }, [isOpen, initialValues]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? handleClose() : undefined)}>
      <SheetContent side="right" className="w-full sm:max-w-[840px] lg:max-w-[650px]">
        <SheetHeader className="mb-4">
          <SheetTitle>{title ? 'Create New Application' : 'Edit Application'}</SheetTitle>
        </SheetHeader>
        <div>
          <div className="space-y-6">
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Input Company Name"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Telephone *
                </label>
                <Input
                  type="tel"
                  value={formData.companyTelephone}
                  onChange={(e) => handleInputChange('companyTelephone', e.target.value)}
                  placeholder="Input Company Telephone"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address *
              </label>
              <Textarea
                value={formData.companyAddress}
                onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                rows={3}
                placeholder="Input Company Address"
                required
                disabled={loading}
              />
            </div> */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount enclosed for application *
              </label>
              <Input
                type="number"
                value={formData.amountEnclosed}
                onChange={(e) => handleInputChange('amountEnclosed', e.target.value)}
                placeholder="Input Amount enclosed for application"
                required
                disabled={loading}
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
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  disabled={loading}
                >
                  <label htmlFor="paymentReceipt" className="cursor-pointer">
                    <Upload size={16} className="mr-2" />
                    Browse
                  </label>
                </Button>
                <span className="text-sm text-gray-500 truncate">
                  {formData.paymentReceipt ? formData.paymentReceipt.name : initialValues?.paymentReceipt || 'Select file'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registered seed merchant/dealer
              </label>
              <Input
                value={formData.registeredSeedMerchant}
                onChange={(e) => handleInputChange('registeredSeedMerchant', e.target.value)}
                placeholder="Input Registered seed merchant/dealer to whom the entire seed stock will be sold"
                disabled={loading}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-700 font-medium">
                  Download sub-growers template file (Excel)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  disabled={loading}
                >
                  <Download size={16} className="mr-2" />
                  DOWNLOAD TEMPLATE
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub-growers excel file *
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    name="subGrowersFile"
                    onChange={handleFileChange}
                    accept=".xlsx,.xls"
                    className="hidden"
                    id="subGrowersFile"
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={loading}
                  >
                    <label htmlFor="subGrowersFile" className="cursor-pointer">
                      <Upload size={16} className="mr-2" />
                      Browse
                    </label>
                  </Button>
                  <span className="text-sm text-gray-500 truncate">
                    {formData.subGrowersFile ? formData.subGrowersFile.name : initialValues?.subGrowersFile || 'Select file'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  To upload many planting_returns, attach an Excel file of multiple Sub-growers here.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="default" 
              className="flex-1" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Please wait...' : (submitLabel ?? (initialValues ? 'Update Application' : 'Create Application'))}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};


export { PlantingReturnsForm };
