import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FieldLabel } from "../seedLabs/blocks/SeedLabTest";
import { useQuery } from "@apollo/client/react";
import { LOAD_SEED_LABEL_PACKAGES, LOAD_SEED_LABS } from "@/gql/queries";
import { SeedLabInspection } from "../seedLabs/MySeedLabsForms";
import { URL_2 } from "@/config/urls";

interface SeedLabelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: any) => void;
  initialData?: any;
}

const SeedLabelForm = ({
  open,
  onOpenChange,
  onSave,
  initialData,
}: SeedLabelFormProps) => {
  const [labTestNumber, setLabTestNumber] = useState<string>(
    initialData?.seed_lab_id || "",
  );
  const [seedLabelPackage, setSeedLabelPackage] = useState<string>(
    (initialData?.seed_label_package as string) || "",
  );
  const [quantity, setQuantity] = useState<number>(initialData?.quantity || 0);
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [existingThumbnail, setExistingThumbnail] = useState<string | null>(
    initialData?.image_url || initialData?.image_id || null
  );
  const [remarks, setRemarks] = useState<string>(initialData?.applicant_remark || "");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [existingReceipt, setExistingReceipt] = useState<string | null>(
    initialData?.receipt_url || initialData?.receipt_id || null
  );
  const [cropId, setCropId] = useState<string >("");

  const { data, loading, error } = useQuery(LOAD_SEED_LABS);
  const allInspections = (data?.getLabInspections || []) as SeedLabInspection[];
  const {
    data: packagesData,
    loading: packagesLoading,
    error: packagesError,
  } = useQuery(LOAD_SEED_LABEL_PACKAGES, { variables: { activeOnly: true } });
  const packages = useMemo(
    () => (packagesData?.seedLabelPackages ?? []) as any[],
    [packagesData],
  );
  const formatPackageLabel = (pkg: any) =>
    `${pkg.name} - ${pkg.packageSizeKg}kg @ ${pkg.priceUgx} UGX`;
  const selectedPackage =
    packages.find((pkg) => pkg.name === seedLabelPackage) ||
    packages.find((pkg) => formatPackageLabel(pkg) === seedLabelPackage);
  const packageSize = Number(selectedPackage?.packageSizeKg || 0);
  const labelsPerPackage = Number(selectedPackage?.labelsPerPackage || 1);
  const labelCount =
    packageSize > 0
      ? Math.floor(Number(quantity || 0) / packageSize) * labelsPerPackage
      : 0;
  const totalCost = selectedPackage ? labelCount * selectedPackage.priceUgx : 0;
  const formattedTotal = new Intl.NumberFormat("en-UG").format(totalCost);

  const handleSubmit = () => {
    const data = {
      labTestNumber,
      seedLabelPackage,
      quantity,
      thumbnailImage, // new file or null
      existingThumbnail, // existing URL or null
      remarks,
      receipt, // new file or null
      existingReceipt, // existing URL or null
    };
    onSave?.(data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[700px] h-full overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>Create/Edit Seed Label</SheetTitle>
        </SheetHeader>
        <div className="space-y-6">
          <div>
            <FieldLabel required>Lab Test Number</FieldLabel>
            <Select
              value={labTestNumber}
              onValueChange={(v) => {
                setLabTestNumber(v);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select lab test number" />
              </SelectTrigger>
              <SelectContent>
                {!loading &&
                  !error &&
                  allInspections.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.lab_test_number}
                    </SelectItem>
                  ))}

                {/* Add more options dynamically if needed */}
              </SelectContent>
            </Select>
          </div>

          <div>
            <FieldLabel required>Seed Label Package</FieldLabel>
            <Select
              value={seedLabelPackage}
              onValueChange={setSeedLabelPackage}
              disabled={packagesLoading || !!packagesError}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    packagesLoading
                      ? "Loading packages..."
                      : "Select seed label package"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.name}>
                    {formatPackageLabel(pkg)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {packagesError && (
              <p className="text-xs text-danger mt-1">
                Failed to load label packages.
              </p>
            )}
          </div>

          <div>
            <FieldLabel required>Total Quantity (Kgs)</FieldLabel>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={1}
              placeholder="Enter quantity in Kgs"
            />
            <p className="text-xs text-gray-500 mt-1">
              The quantity entered shouldn't be more than the quantity you have
              in stock.
            </p>
            {selectedPackage && (
              <div className="mt-3 rounded-md border bg-gray-50 px-3 py-2 text-xs text-gray-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Estimated labels</span>
                  <span className="font-medium text-gray-900">
                    {labelCount || "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated total</span>
                  <span className="font-medium text-gray-900">
                    {formattedTotal} UGX
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* <div>
            <FieldLabel required>Thumbnail Image</FieldLabel>
            <FileInput value={thumbnailImage} onChange={(file) => setThumbnailImage(file)} />
          </div> */}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Image Upload
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="max-w-md">
                <div className="flex flex-col gap-2">
                  <label className="form-label text-gray-700 font-medium">
                    Attach Image
                  </label>

                  {/* Show existing image if present */}
                  {existingThumbnail && !thumbnailImage && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">Current Image:</p>
                      <img
                        src={`${URL_2}/imgs/${existingThumbnail}`}
                        alt="Current thumbnail"
                        className="w-40 h-40 object-cover rounded-lg shadow border"
                      />
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:text-red-800 mt-2"
                        onClick={() => setExistingThumbnail(null)}
                      >
                        Remove existing image
                      </button>
                    </div>
                  )}

                  <label
                    htmlFor="thumbnailImage-upload"
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l-4-4m4 4l4-4"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">
                        Click to upload or drag & drop
                      </span>
                      <span className="text-xs text-gray-400">
                        PNG, JPG, PDF (max 5MB)
                      </span>
                    </div>
                    <input
                      id="thumbnailImage-upload"
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(file) =>
                        setThumbnailImage(file.target.files?.[0] || null)
                      }
                    />
                  </label>

                  {thumbnailImage && (
                    <p className="text-sm text-gray-600 mt-1">
                      New file:{" "}
                      <span className="font-medium">{thumbnailImage.name}</span>
                    </p>
                  )}

                  {thumbnailImage &&
                    thumbnailImage.type?.startsWith("image/") && (
                      <img
                        src={URL.createObjectURL(thumbnailImage)}
                        alt="Receipt preview"
                        className="mt-2 w-40 rounded-lg shadow"
                      />
                    )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <FieldLabel>Remarks</FieldLabel>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Input Remarks"
            />
          </div>

          {/* <div>
            <FieldLabel required>Attach Receipt</FieldLabel>
            <FileInput value={receipt} onChange={(file) => setReceipt(file)} />
          </div> */}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Receipt Upload
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="max-w-md">
                <div className="flex flex-col gap-2">
                  <label className="form-label text-gray-700 font-medium">
                    Attach Receipt (optional)
                  </label>

                  {/* Show existing receipt if present */}
                  {existingReceipt && !receipt && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">Current Receipt:</p>
                      {existingReceipt.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          src={`${URL_2}/receipts/${existingReceipt}`}
                          alt="Current receipt"
                          className="w-40 h-40 object-cover rounded-lg shadow border"
                        />
                      ) : (
                        <a
                          href={existingReceipt}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Receipt ({existingReceipt.split('/').pop()})
                        </a>
                      )}
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:text-red-800 mt-2"
                        onClick={() => setExistingReceipt(null)}
                      >
                        Remove existing receipt
                      </button>
                    </div>
                  )}

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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l-4-4m4 4l4-4"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">
                        Click to upload or drag & drop
                      </span>
                      <span className="text-xs text-gray-400">
                        PNG, JPG, PDF (max 5MB)
                      </span>
                    </div>
                    <input
                      id="receipt-upload"
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(file) =>
                        setReceipt(file.target.files?.[0] || null)
                      }
                    />
                  </label>

                  {receipt && (
                    <p className="text-sm text-gray-600 mt-1">
                      New file: <span className="font-medium">{receipt.name}</span>
                    </p>
                  )}

                  {receipt && receipt.type?.startsWith("image/") && (
                    <img
                      src={URL.createObjectURL(receipt)}
                      alt="Receipt preview"
                      className="mt-2 w-40 rounded-lg shadow"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 space-x-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={quantity <= 0}>
            Save Record
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SeedLabelForm;
