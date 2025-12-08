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
import { useLazyQuery, useQuery } from "@apollo/client/react";
import { LOAD_SEED_LABS, SEEDLABELPACKAGES } from "@/gql/queries";
import { SeedLabInspection } from "../seedLabs/MySeedLabsForms";

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
    initialData?.labTestNumber,
  );
  const [seedLabelPackage, setSeedLabelPackage] = useState<string>(
    initialData?.seedLabelPackage || "",
  );
  const [quantity, setQuantity] = useState<number>(initialData?.quantity || 0);
  const [thumbnailImage, setThumbnailImage] = useState<File | null>(null);
  const [remarks, setRemarks] = useState<string>(initialData?.remarks || "");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [cropId, setCropId] = useState<string >("");

  const [loadseedlabelpackages] = useLazyQuery(SEEDLABELPACKAGES);
  const [packagesStore, setPackageStore] = useState<
      Record<
        string,
        {
          items: { id: string; crop_id: string, quantity:string, price:string, units:string }[];
          loading?: boolean;
          error?: string;
        }
      >
    >
  ({});

  console.log("packagesStore", packagesStore );
  const { data, loading, error, refetch } = useQuery(LOAD_SEED_LABS);
  const allInspections = (data?.getLabInspections || []) as SeedLabInspection[];
// const labelpackages = (data?.getSeedLabelPackages || []) as any[];

  const fetchlabelpackages = async (labTestId: string) => {
    const inspection = allInspections.find(i => i.id === labTestId);

     setCropId(inspection?.variety.cropId);
    console.log("fetchlabelpackages", labTestId, cropId, inspection);
    if (!labTestId) return;
    setPackageStore((prev) => ({
      ...prev,
      [cropId]: {
        ...(prev[cropId] || {}),
        loading: true,
        error: undefined,
        items: prev[cropId]?.items || [],
      },
    }));
    try {
      const res = await loadseedlabelpackages({ variables: {cropId: cropId } });

      console.log("loadseedlabelpackages", res.data?.getSeedLabelPackages, { crop_id : cropId });

      const items = ((res.data?.getSeedLabelPackages || []) as any[]).map((v) => ({
        id: String(v.id),
        crop_id: v.crop_id,
        quantity: v.quantity,
        price: v.price,
        units: v.Crop?.units,

      }));
      setPackageStore((prev) => ({
        ...prev,
        [cropId]: { items, loading: false, error: undefined },
      }));
    } catch (e: any) {
      setPackageStore((prev) => ({
        ...prev,
        [cropId]: {
          items: prev[cropId]?.items || [],
          loading: false,
          error: e?.message || "Failed to load varieties",
        },
      }));
    }
  }

  const labelpackageOptions = useMemo(
      () => (cropId ? packagesStore[cropId]?.items || [] : []),
      [cropId, packagesStore],
    );

  const handleSubmit = () => {
    const data = {
      labTestNumber,
      seedLabelPackage,
      quantity,
      thumbnailImage,
      remarks,
      receipt,
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
            <Select value={labTestNumber} //onValueChange={setLabTestNumber}
                onValueChange={(v) => {
                    setLabTestNumber(v);
                    fetchlabelpackages(v);
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
              onValueChange={(v) => {setSeedLabelPackage(v)}}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Seed label package" />
              </SelectTrigger>
              <SelectContent>
                {labelpackageOptions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.quantity}{v.units} @ {v.price} UGX
                      </SelectItem>
                ))}
                {/* <SelectItem value="2kgs">2 Kgs @ 2000 UGX</SelectItem>
                <SelectItem value="5kgs">5 Kgs @ 5000 UGX</SelectItem> */}
                {/* Add more options dynamically if needed */}
              </SelectContent>
            </Select>
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
                      //   onChange={(e) => handleChange('receipt', e.target.files?.[0] || null)}
                      onChange={(file) =>
                        setThumbnailImage(file.target.files?.[0] || null)
                      }
                    />
                  </label>

                  {thumbnailImage && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected file:{" "}
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
                      //   onChange={(e) => handleChange('receipt', e.target.files?.[0] || null)}
                      onChange={(file) =>
                        setReceipt(file.target.files?.[0] || null)
                      }
                    />
                  </label>

                  {receipt && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected file:{" "}
                      <span className="font-medium">{receipt.name}</span>
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
