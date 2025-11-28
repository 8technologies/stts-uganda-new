import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@apollo/client/react";
import { Download, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type PlantingReturns = {
  id: string | number;
  user_id: string;
  amount_enclosed: string;
  payment_receipt: string;
  registerd_dealer: string;
  sub_growers_file: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string | number;
    username: string;
    name: string;
    phone_number: string;
  };
  status: "Pending";
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

const PlantingReturnsUploadDialog = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  resetForm,
  initialValues,
  title,
  submitLabel,
}: IPlantingReturnsFormProps) => {
  const [formData, setFormData] = useState({
    amountEnclosed: "",
    registeredSeedMerchant: "",
    paymentReceipt: null as File | null,
    subGrowersFile: null as File | null,
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    // Basic validation
    if (!formData.amountEnclosed.trim()) {
      toast("Amount enclosed is required");
      return;
    }

    onSubmit?.(formData); // Pass the FormData to the backend for processing
    setFormData({
      amountEnclosed: "",
      registeredSeedMerchant: "",
      paymentReceipt: null,
      subGrowersFile: null,
    });
  };

  const handleClose = () => {
    setFormData({
      amountEnclosed: "",
      registeredSeedMerchant: "",
      paymentReceipt: null,
      subGrowersFile: null,
    });
    onClose?.(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files?.[0] || null }));
  };

  const downloadTemplate = () => {
    toast("Template downloaded successfully!");
  };

  useEffect(() => {
    if (resetForm) {
      setFormData({
        amountEnclosed: "",
        registeredSeedMerchant: "",
        paymentReceipt: null,
        subGrowersFile: null,
      });
    }
  }, [resetForm]);

  useEffect(() => {
    if (isOpen && initialValues) {
      setFormData({
        amountEnclosed: initialValues.amount_enclosed ?? "",
        registeredSeedMerchant: initialValues.registerd_dealer ?? "",
        paymentReceipt: null,
        subGrowersFile: null,
      });
    }
  }, [isOpen, initialValues]);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => (!open ? handleClose() : undefined)}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[840px] lg:max-w-[650px]"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>
            {title ? "Create New Application" : "Edit Application"}
          </SheetTitle>
        </SheetHeader>
        <div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount enclosed for application *
              </label>
              <Input
                type="number"
                value={formData.amountEnclosed}
                onChange={(e) =>
                  handleInputChange("amountEnclosed", e.target.value)
                }
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
                  {formData.paymentReceipt
                    ? formData.paymentReceipt.name
                    : initialValues?.payment_receipt || "Select file"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registered seed merchant/dealer
              </label>
              <Input
                value={formData.registeredSeedMerchant}
                onChange={(e) =>
                  handleInputChange("registeredSeedMerchant", e.target.value)
                }
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
                    {formData.subGrowersFile
                      ? formData.subGrowersFile.name
                      : initialValues?.sub_growers_file || "Select file"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  To upload many planting_returns, attach an Excel file of
                  multiple Sub-growers here.
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
              {loading
                ? "Please wait..."
                : (submitLabel ??
                  (initialValues
                    ? "Update Application"
                    : "Create Application"))}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { PlantingReturnsUploadDialog };
