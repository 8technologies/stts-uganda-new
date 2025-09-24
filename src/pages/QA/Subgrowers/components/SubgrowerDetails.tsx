import { X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";

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
  status: 'Pending' | 'Approved' | 'Rejected';
};

const SubgrowerDetails = ({
  application,
  open,
  onClose,
}: {
  application: Subgrowers;
  open: boolean;
  onClose: (open: boolean) => void;
}) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="flex justify-between items-center">
          <SheetTitle>Subgrower Details</SheetTitle>
          
        </SheetHeader>

        <div className="p-2 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Responsible Person
                </label>
                <p className="text-gray-900">{application?.responsiblePerson}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Field Name
                </label>
                <p className="text-gray-900">{application?.fieldName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Phone Number
                </label>
                <p className="text-gray-900">{application?.phoneNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Garden Size
                </label>
                <p className="text-gray-900">{application?.gardenSize}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Crop
                </label>
                <p className="text-gray-900">{application?.crop}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Crop Variety
                </label>
                <p className="text-gray-900">{application?.cropVariety}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Seed Class
                </label>
                <p className="text-gray-900">{application?.seedClass}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Motherlot Number
                </label>
                <p className="text-gray-900">{application?.motherlotNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Foundation Seed Source
                </label>
                <p className="text-gray-900">{application?.foundationSeedSource}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  District
                </label>
                <p className="text-gray-900">{application?.district}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Subcounty
                </label>
                <p className="text-gray-900">{application?.subcounty || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Village
                </label>
                <p className="text-gray-900">{application?.village}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Planting Date
                </label>
                <p className="text-gray-900">{application?.plantingDate || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Quantity
                </label>
                <p className="text-gray-900">{application?.quantity || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Expected Yield
                </label>
                <p className="text-gray-900">{application?.expectedYield || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Latitude
              </label>
              <p className="text-gray-900">{application?.latitude || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Longitude
              </label>
              <p className="text-gray-900">{application?.longitude || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Details
              </label>
              <p className="text-gray-900">{application?.details || 'N/A'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Application Date
              </label>
              <p className="text-gray-900">{application?.createdAt}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Status
              </label>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  application?.status === "Approved"
                    ? "bg-success-light text-success"
                    : application?.status === "Rejected"
                    ? "bg-danger-light text-danger"
                    : "bg-warning-light text-warning"
                }`}
              >
                {application?.status}
              </span>
            </div>
          </div>
        </div>

        <SheetFooter />
      </SheetContent>
    </Sheet>
  );
};

export { SubgrowerDetails };
