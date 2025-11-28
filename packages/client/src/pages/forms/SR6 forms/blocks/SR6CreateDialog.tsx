import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { KeenIcon } from "@/components";

interface ISR6EditDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (values: Record<string, any>) => void;
  saving?: boolean;
}

const SR6CreateDialog = ({
  open,
  onOpenChange,
  onSave,
  saving,
}: ISR6EditDialogProps) => {
  const [values, setValues] = useState<Record<string, any>>({
    applicationCategory: "seed_breeder",
    registrationNumber: "",
    croppingHistory: "",
    yearsOfExperience: "",
    previousGrowerNumber: "",
    BeenSeedGrower: "",
    adequateStorage: "Yes",
    adequateIsolation: "No",
    adequateLabour: "Yes",
    standardSeed: "Yes",
    receipt: "",
    otherDocuments: "",
  });

  const handleChange = (key: string, value: any) =>
    setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = () => {
    onSave?.(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[980px] w-[96vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="note" /> Create Application
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-8">
          {/* Experience & Business Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Experience & Business Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="form-label">
                  Application category<span className="text-red-500">*</span>
                </label>
                {/* <Input value={values.applicationCategory} onChange={(e) => handleChange('applicationCategory', e.target.value)} /> */}
                <Select
                  value={values.applicationCategory}
                  onValueChange={(e) => handleChange("applicationCategory", e)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an Option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seed_breeder">Seed Breeder</SelectItem>
                    <SelectItem value="seed_producer">Seed Producer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="form-label">
                  Years of experience<span className="text-red-500">*</span>
                </label>
                <Input
                  value={values.yearsOfExperience}
                  onChange={(e) =>
                    handleChange("yearsOfExperience", e.target.value)
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="form-label">
                  Crop history for the last three season or years
                  <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={values.croppingHistory}
                  onChange={(e) =>
                    handleChange("croppingHistory", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Capability Assessment Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Capability Assessment
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[
                ["BeenSeedGrower", "Have you been a seed grower in the past??"],
                [
                  "adequateStorage",
                  "I/We have adequate storage facilities to handle the resultant seed",
                ],
                ["adequateIsolation", "Do you have adequate isolation?"],
                [
                  "adequateLabour",
                  "Do you have adequate labor to carry out all farm operations in a timely manner?",
                ],
                [
                  "standardSeed",
                  "Are you aware that only seed that meets the minimum standards shall be accepted?",
                ],
              ].map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="form-label text-sm">
                    {label}
                    <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={values[key]}
                    onValueChange={(v) => handleChange(key, v)}
                  >
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

              {values.BeenSeedGrower === "Yes" && (
                <div className="flex flex-col gap-1">
                  <label className="form-label">
                    Enter Previous grower number
                    <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={values.previousGrowerNumber || ""}
                    onChange={(e) =>
                      handleChange("previousGrowerNumber", e.target.value)
                    }
                    placeholder="Please specify you previous grower number"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Receipt Upload Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Receipt Upload
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div className="max-w-md">
                <div className="flex flex-col gap-2">
                  <label className="form-label text-gray-700 font-medium">
                    Attach Receipt<span className="text-red-500">*</span>
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
                      onChange={(e) =>
                        handleChange("receipt", e.target.files?.[0] || null)
                      }
                    />
                  </label>

                  {/* Show file name */}
                  {values.receipt && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected file:{" "}
                      <span className="font-medium">{values.receipt.name}</span>
                    </p>
                  )}

                  {/* Image preview if it's an image */}
                  {values.receipt &&
                    values.receipt.type.startsWith("image/") && (
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
                  <label className="form-label text-gray-700 font-medium">
                    Attach Other Documents
                    <span className="text-red-500">*</span>
                  </label>

                  <label
                    htmlFor="otherDocuments-upload"
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
                      id="otherDocuments-upload"
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={(e) =>
                        handleChange(
                          "otherDocuments",
                          e.target.files?.[0] || null,
                        )
                      }
                    />
                  </label>

                  {/* Show file name */}
                  {values.otherDocuments && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected file:{" "}
                      <span className="font-medium">
                        {values.otherDocuments.name}
                      </span>
                    </p>
                  )}

                  {/* Image preview if it's an image */}
                  {values.otherDocuments &&
                    values.otherDocuments.type.startsWith("image/") && (
                      <img
                        src={URL.createObjectURL(values.otherDocuments)}
                        alt="otherDocuments preview"
                        className="mt-2 w-40 rounded-lg shadow"
                      />
                    )}
                </div>
              </div>
            </div>
          </div>

          {/* Declaration Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Declaration
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                I/WE* AT ANY TIME DURING OFFICIAL WORKING HOURS EVEN WITHOUT
                previous appointment will allow the inspectors entry to the seed
                stores and thereby provide them with the facilities necessary to
                carry out their inspection work as laid out in the seed and
                plant regulations, 2015. I/We further declare that I/We am/are
                conversant with the Regulations. In addition I/We will send a
                list of all seed lots in our stores on a given date and/or at
                such a date as can be mutually agreed upon between the National
                Seed Certification Service and ourselves.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="accept-declaration"
                  name="declaration"
                  className="text-blue-600"
                />
                <label
                  htmlFor="accept-declaration"
                  className="form-label text-sm cursor-pointer"
                >
                  I Accept
                </label>
              </div>
            </div>
          </div>

          {/* Application Status Section */}
        </DialogBody>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button
              variant="light"
              className="hover:bg-red-800"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => console.log("Save draft", values)}
            >
              <KeenIcon icon="task" /> Save Draft
            </Button>
            <Button onClick={handleSubmit} disabled={!!saving}>
              <KeenIcon icon="tick-square" />{" "}
              {saving ? "Submiting" : "Submit Application"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { SR6CreateDialog };
