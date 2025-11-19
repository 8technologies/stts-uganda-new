import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { KeenIcon } from "@/components";
import { toast } from "sonner";
import { useMutation } from "@apollo/client/react";
import { SUBMIT_STOCK_EXAMINATION_INSPECTION } from "@/gql/mutations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockId?: string;
  onSaved?: (data: any) => void;
}

const StockInspectionSheet: React.FC<Props> = ({ open, onOpenChange, stockId, onSaved }) => {
  const [formData, setFormData] = useState({
    decision: "",
    report: {
      field_size: "",
      yield: "",
      seed_class: "",
      purity: "",
      moisture_content: "",
      insect_damage: "",
      moldiness: "",
      weeds: "",
      germination: "",
    },
    remarks: "",
  });

  const [saveExamInspection, { loading: savingMutation }] = useMutation(SUBMIT_STOCK_EXAMINATION_INSPECTION);

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReportChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      report: {
        ...prev.report,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      input: {
        id: stockId,
        decision: formData.decision,
        report: {
          field_size: parseFloat(formData.report.field_size as string),
          yield: parseFloat(formData.report.yield as string),
          seed_class: formData.report.seed_class,
          purity: parseFloat(formData.report.purity as string),
          moisture_content: parseFloat(formData.report.moisture_content as string),
          insect_damage: formData.report.insect_damage,
          moldiness: formData.report.moldiness,
          weeds: formData.report.weeds,
          germination: parseFloat(formData.report.germination as string),
        },
        remarks: formData.remarks,
      },
    };

    console.log("Submitting payload:", payload);

    const { data } = await saveExamInspection({
        variables:payload
        
      });

    if (data?.submitStockExaminationInspection?.success) {
        toast.success(data.submitStockExaminationInspection.message || 'Stock examination saved successfully');
        onSaved?.(data.submitStockExaminationInspection.data);
        onOpenChange(false);
    } else {
        toast.error(data?.submitStockExaminationInspection?.message || 'Failed to save stock examination');
    }

    // onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[700px] h-full flex flex-col bg-gray-50"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-5 bg-white border-b shadow-sm">
          <SheetTitle className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600">
              <KeenIcon icon="search-check" className="text-xl" />
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">Stock Inspection</div>
              <div className="text-sm text-gray-500">
                Fill in the inspection details below
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Report Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label>Field Size (acres)</label>
              <Input
                type="number"
                step="0.1"
                value={formData.report.field_size}
                onChange={(e) => handleReportChange("field_size", e.target.value)}
              />
            </div>
            <div>
              <label>Yield (kg)</label>
              <Input
                type="number"
                value={formData.report.yield}
                onChange={(e) => handleReportChange("yield", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seed Class</label>
              <Select
                value={formData.report.seed_class || ""}
                onValueChange={(value) => handleReportChange("seed_class", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Seed Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">Basic Seed</SelectItem>
                  <SelectItem value="certified">Certified Seed</SelectItem>
                  <SelectItem value="pre-basic">Pre-basic Seed</SelectItem>
                  <SelectItem value="qds">QDS Seed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label>Purity (%)</label>
              <Input
                type="number"
                step="0.1"
                value={formData.report.purity}
                onChange={(e) => handleReportChange("purity", e.target.value)}
              />
            </div>
            <div>
              <label>Moisture Content (%)</label>
              <Input
                type="number"
                step="0.1"
                value={formData.report.moisture_content}
                onChange={(e) =>
                  handleReportChange("moisture_content", e.target.value)
                }
              />
            </div>
            <div>
              <label>Insect Damage</label>
              <Input
                type="text"
                value={formData.report.insect_damage}
                onChange={(e) =>
                  handleReportChange("insect_damage", e.target.value)
                }
              />
            </div>
            <div>
              <label>Moldiness</label>
              <Input
                type="text"
                value={formData.report.moldiness}
                onChange={(e) => handleReportChange("moldiness", e.target.value)}
              />
            </div>
            <div>
              <label>Weeds</label>
              <Input
                type="text"
                value={formData.report.weeds}
                onChange={(e) => handleReportChange("weeds", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label>Germination (%)</label>
              <Input
                type="number"
                step="0.1"
                value={formData.report.germination}
                onChange={(e) =>
                  handleReportChange("germination", e.target.value)
                }
              />
            </div>
          </div>

          {/* Decision */}
          <div>
            <label className="text-gray-700">Decision</label>
            <Select onValueChange={(value) => handleChange("decision", value)}>
              <SelectTrigger className="mt-1 w-full">
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Remarks */}
          <div>
            <label>Remarks</label>
            <Textarea
              placeholder="Enter remarks..."
              value={formData.remarks}
              onChange={(e) => handleChange("remarks", e.target.value)}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="border-t bg-white px-6 py-4 flex items-center justify-between shadow-sm">
          <Button variant="light" onClick={() => onOpenChange(false)} className="px-6">
            Close
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            <KeenIcon icon="check-circle" />
            Submit Inspection
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StockInspectionSheet;
