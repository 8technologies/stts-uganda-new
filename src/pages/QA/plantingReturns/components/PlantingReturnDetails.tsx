import { X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"

type PlantingReturns = {
  id: string | number
  companyName: string
  companyAddress: string
  companyTelephone: string
  amountEnclosed: string
  paymentReceipt?: string
  registeredSeedMerchant: string
  subGrowersFile?: string
  createdAt: string
  status: "Pending" | "Approved" | "Rejected"
}

const PlantingReturnDetails = ({
  application,
  open,
  onClose,
}: {
  application: PlantingReturns
  open: boolean
  onClose: (open: boolean) => void
}) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="flex justify-between items-center">
          <SheetTitle>Application Details</SheetTitle>
          <SheetClose asChild>
            <button className="btn btn-light btn-sm flex items-center gap-1">
              <X size={16} />
              Close
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="p-2 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Company Name
                </label>
                <p className="text-gray-900">{application?.companyName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Company Telephone
                </label>
                <p className="text-gray-900">{application?.companyTelephone}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Amount Enclosed
                </label>
                <p className="text-gray-900">
                  UGX {parseInt(application?.amountEnclosed).toLocaleString()}
                </p>
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

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Application Date
                </label>
                <p className="text-gray-900">{application?.createdAt}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Payment Receipt
                </label>
                <p className="text-gray-900">
                  {application?.paymentReceipt || "N/A"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Sub-growers File
                </label>
                <p className="text-gray-900">
                  {application?.subGrowersFile || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Company Address
              </label>
              <p className="text-gray-900">{application?.companyAddress}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Registered Seed Merchant/Dealer
              </label>
              <p className="text-gray-900">
                {application?.registeredSeedMerchant || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <SheetFooter />
      </SheetContent>
    </Sheet>
  )
}

export { PlantingReturnDetails }
