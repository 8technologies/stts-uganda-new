import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Subgrowers = {
  id: string | number;
  responsiblePerson: string;
  fieldName: string;
  phoneNumber: string;
  gardenSize: string;
  crop: string;
  cropVariety: string;
  seedClass: string;
  motherlotNumber: string;
  foundationSeedSource: string;
  district: string;
  subcounty?: string;
  village: string;
  plantingDate?: string;
  quantity?: string;
  expectedYield?: string;
  latitude?: string;
  longitude?: string;
  details?: string;
  createdAt: string;
  plantingReturnId?: string | number;
  plantingReturn: {
    id: string | number;
    companyName: string;
  };
  status: "Pending" | "Approved" | "Rejected";
};

interface ISubgrowersFormProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onSubmit?: (values: Record<string, any>) => void;
  loading: boolean;
  resetForm: boolean;
  initialValues?: Subgrowers | null;
  title?: string;
  submitLabel?: string;
}

const SubgrowersForm = ({
  isOpen,
  onClose,
  onSubmit,
  loading,
  resetForm,
  initialValues,
  title,
  submitLabel,
}: ISubgrowersFormProps) => {
  const [formData, setFormData] = useState<Subgrowers>({
    id: "",
    responsiblePerson: "",
    fieldName: "",
    phoneNumber: "",
    gardenSize: "",
    crop: "",
    cropVariety: "",
    seedClass: "",
    motherlotNumber: "",
    foundationSeedSource: "",
    district: "",
    subcounty: "",
    village: "",
    plantingDate: "",
    quantity: "",
    expectedYield: "",
    latitude: "",
    longitude: "",
    details: "",
    createdAt: new Date().toISOString().split("T")[0],
    plantingReturnId: "",
    plantingReturn: { id: "", companyName: "" },
    status: "Pending",
  });

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    // Basic validation
    if (!formData.responsiblePerson.trim()) {
      toast("Responsible person is required");
      return;
    }
    if (!formData.fieldName.trim()) {
      toast("Field name is required");
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast("Phone number is required");
      return;
    }
    if (!formData.gardenSize.trim()) {
      toast("Garden size is required");
      return;
    }
    if (!formData.crop.trim()) {
      toast("Crop is required");
      return;
    }

    const submitData = { ...formData };
    onSubmit?.(submitData);
  };

  const handleClose = () => {
    setFormData({
      id: "",
      responsiblePerson: "",
      fieldName: "",
      phoneNumber: "",
      gardenSize: "",
      crop: "",
      cropVariety: "",
      seedClass: "",
      motherlotNumber: "",
      foundationSeedSource: "",
      district: "",
      subcounty: "",
      village: "",
      plantingDate: "",
      quantity: "",
      expectedYield: "",
      latitude: "",
      longitude: "",
      details: "",
      createdAt: new Date().toISOString().split("T")[0],
      plantingReturnId: "",
      plantingReturn: { id: "", companyName: "" },
      status: "Pending",
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
        id: "",
        responsiblePerson: "",
        fieldName: "",
        phoneNumber: "",
        gardenSize: "",
        crop: "",
        cropVariety: "",
        seedClass: "",
        motherlotNumber: "",
        foundationSeedSource: "",
        district: "",
        subcounty: "",
        village: "",
        plantingDate: "",
        quantity: "",
        expectedYield: "",
        latitude: "",
        longitude: "",
        details: "",
        createdAt: new Date().toISOString().split("T")[0],
        plantingReturnId: "",
        plantingReturn: { id: "", companyName: "" },
        status: "Pending",
      });
    }
  }, [resetForm]);

  useEffect(() => {
    if (isOpen && initialValues) {
      setFormData({
        ...initialValues,
        plantingReturn: initialValues.plantingReturn,
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
        className="w-full sm:max-w-[840px] lg:max-w-[650px] overflow-y-auto"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>
            {title ? "Create New Subgrower" : "Edit Subgrower"}
          </SheetTitle>
        </SheetHeader>
        <div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsible Person
                <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.responsiblePerson}
                onChange={(e) =>
                  handleInputChange("responsiblePerson", e.target.value)
                }
                placeholder="Input responsible person"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field Name
                <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.fieldName}
                onChange={(e) => handleInputChange("fieldName", e.target.value)}
                placeholder="Input field name"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
                <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) =>
                  handleInputChange("phoneNumber", e.target.value)
                }
                placeholder="Input phone number"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Garden Size <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.gardenSize}
                onChange={(e) =>
                  handleInputChange("gardenSize", e.target.value)
                }
                placeholder="Input garden size"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.crop}
                onChange={(e) => handleInputChange("crop", e.target.value)}
                placeholder="Input crop"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Crop Variety
              </label>
              <Input
                value={formData.cropVariety}
                onChange={(e) =>
                  handleInputChange("cropVariety", e.target.value)
                }
                placeholder="Input crop variety"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seed Class
              </label>
              <Input
                value={formData.seedClass}
                onChange={(e) => handleInputChange("seedClass", e.target.value)}
                placeholder="Input seed class"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motherlot Number
              </label>
              <Input
                value={formData.motherlotNumber}
                onChange={(e) =>
                  handleInputChange("motherlotNumber", e.target.value)
                }
                placeholder="Input motherlot number"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foundation Seed Source
              </label>
              <Input
                value={formData.foundationSeedSource}
                onChange={(e) =>
                  handleInputChange("foundationSeedSource", e.target.value)
                }
                placeholder="Input foundation seed source"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District
              </label>
              <Input
                value={formData.district}
                onChange={(e) => handleInputChange("district", e.target.value)}
                placeholder="Input district"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subcounty
              </label>
              <Input
                value={formData.subcounty}
                onChange={(e) => handleInputChange("subcounty", e.target.value)}
                placeholder="Input subcounty"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Village
              </label>
              <Input
                value={formData.village}
                onChange={(e) => handleInputChange("village", e.target.value)}
                placeholder="Input village"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planting Date
              </label>
              <Input
                type="date"
                value={formData.plantingDate}
                onChange={(e) =>
                  handleInputChange("plantingDate", e.target.value)
                }
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <Input
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="Input quantity"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Yield
              </label>
              <Input
                value={formData.expectedYield}
                onChange={(e) =>
                  handleInputChange("expectedYield", e.target.value)
                }
                placeholder="Input expected yield"
                disabled={loading}
              />
            </div>

            <div className="flex gap-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <Input
                  value={formData.latitude}
                  onChange={(e) =>
                    handleInputChange("latitude", e.target.value)
                  }
                  placeholder="Input latitude"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <Input
                  value={formData.longitude}
                  onChange={(e) =>
                    handleInputChange("longitude", e.target.value)
                  }
                  placeholder="Input longitude"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Details
              </label>
              <Textarea
                value={formData.details}
                onChange={(e) => handleInputChange("details", e.target.value)}
                placeholder="Input details"
                disabled={loading}
              />
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
                  (initialValues ? "Update Subgrower" : "Create Subgrower"))}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { SubgrowersForm };
