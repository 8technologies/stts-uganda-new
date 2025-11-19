/* eslint-disable prettier/prettier */
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@apollo/client/react";
import { LOAD_SEED_LABS } from "@/gql/queries";
import { useNavigate, useParams } from "react-router";
import { useAuthContext } from "@/auth";
import { SeedLabInspection } from "./SeedLabDetailsDialog";
import { toast } from "sonner"; // ✅ optional, for user feedback if you’re using Sonner/toast
import { SUBMIT_LAB_TEST } from "@/gql/mutations";

// Small local label component
export const FieldLabel: React.FC<React.PropsWithChildren<{ required?: boolean }>> = ({
  children,
  required,
}) => (
  <label className="text-sm font-medium text-slate-700">
    {children}
    {required ? <span className="text-red-600"> *</span> : null}
  </label>
);

export default function StockLabTestForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthContext();
  const [marketableStatus, setMarketableStatus] = useState("marketable");
  const [submitting, setSubmitting] = useState(false);

  const { data, loading, error } = useQuery(LOAD_SEED_LABS, {
    fetchPolicy: "cache-and-network",
  });

  const [saveLabTest, { loading: saving }] = useMutation(SUBMIT_LAB_TEST, {
      refetchQueries: [{ query: LOAD_SEED_LABS }],
      awaitRefetchQueries: true,
    });

  const record: SeedLabInspection | undefined = useMemo(() => {
    const list: SeedLabInspection[] = (data?.getLabInspections || []) as any[];
    return list.find((r) => String(r.id) === String(id));
  }, [data, id]);

  // Extract tests from inspector_report
  const testsRequired = useMemo(() => {
    const report = record?.inspector_report;
    if (!report || !report.tests_required) return [];
    if (typeof report.tests_required === "string") {
      return report.tests_required.split(",").map((t) => t.trim().toLowerCase());
    }
    return report.tests_required.map((t: string) => t.toLowerCase());
  }, [record]);

  const [formData, setFormData] = useState({
    applicant: record?.createdBy?.username || "",
    lotNumber: record?.lot_number || "",
    labTestNumber: record?.lab_test_number || "",
    purity: { pure_seed: "", inert_matter: "", other_crop_seeds: "", weed_seed: "" },
    germination: {
      capacity: "",
      first_count: "",
      final_count: "",
      hard: "",
      fresh: "",
      dead: "",
      abnormal_sprouts: "",
    },
    moisture: { moisture: "" },
  });

  useEffect(() => {
    if (record) {
      setFormData((prev) => ({
        ...prev,
        applicant: record?.createdBy?.username || "",
        lotNumber: record?.lot_number || "",
        labTestNumber: record?.lab_test_number || "",
      }));
    }
  }, [record]);

  const handleChange = (section: "purity" | "germination" | "moisture", field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));

  // ✅ Handle form submission
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
        // const lab_test_report = formData.purity;

        // lab_test
      // Construct payload
      const input = {
        id,
        lab_test_report:{
            purity: formData.purity || null,
            germination: formData.germination || null,
            moisture: formData.moisture || null
        },
        marketableStatus,
      };

      console.log("📦 Submitting stock lab record:", input);

      await saveLabTest({ variables: { input } });
      
      toast?.success?.("Record saved successfully!");
      navigate(-1); // Go back to previous page or dashboard
    } catch (err) {
      console.error("❌ Error submitting record:", err);
      toast?.error?.("Failed to save record. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Edit Stock Laboratory Record</h1>

      {/* Applicant Info */}
      <Card>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          <div>
            <FieldLabel>Applicant</FieldLabel>
            <Input value={formData.applicant} disabled />
          </div>

          <div>
            <FieldLabel>Tests Required</FieldLabel>
            <div className="flex flex-wrap gap-2 mt-2">
              {testsRequired.length > 0 ? (
                testsRequired.map((test) => (
                  <Badge key={test} variant="primary" className="capitalize">
                    {test}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">No tests specified</span>
              )}
            </div>
          </div>

          <div>
            <FieldLabel>Lot number</FieldLabel>
            <Input value={formData.lotNumber} disabled />
          </div>

          <div>
            <FieldLabel>Lab test number</FieldLabel>
            <Input value={formData.labTestNumber} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Purity Section */}
      {testsRequired.includes("purity") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">PURITY (P)</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 pt-4">
            <div>
              <FieldLabel required>Enter Pure seed (in percentage)</FieldLabel>
              <Input
                placeholder="Enter Pure seed (in percentage)"
                value={formData.purity.pure_seed}
                onChange={(e) => handleChange("purity", "pure_seed", e.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Inert matter</FieldLabel>
              <Input
                placeholder="Input Inert matter"
                value={formData.purity.inert_matter}
                onChange={(e) => handleChange("purity", "inert_matter", e.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Other crop seeds</FieldLabel>
              <Input
                placeholder="Input Other crop seeds"
                value={formData.purity.other_crop_seeds}
                onChange={(e) => handleChange("purity", "other_crop_seeds", e.target.value)}
              />
            </div>

            <div>
              <FieldLabel>Weed seed</FieldLabel>
              <Input
                placeholder="Input Weed seed"
                value={formData.purity.weed_seed}
                onChange={(e) => handleChange("purity", "weed_seed", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Germination Section */}
      {testsRequired.includes("germination") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">GERMINATION (G)</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 pt-4">
            <div>
              <FieldLabel required>Enter Germination capacity (in percentage)</FieldLabel>
              <Input
                placeholder="Enter Germination capacity (in percentage)"
                value={formData.germination.capacity}
                onChange={(e) => handleChange("germination", "capacity", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <FieldLabel required>1st count</FieldLabel>
                <Input
                  placeholder="Input 1st count"
                  value={formData.germination.first_count}
                  onChange={(e) => handleChange("germination", "first_count", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel required>Final count</FieldLabel>
                <Input
                  placeholder="Input Final count"
                  value={formData.germination.final_count}
                  onChange={(e) => handleChange("germination", "final_count", e.target.value)}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Hard</FieldLabel>
              <Input
                placeholder="Input Hard"
                value={formData.germination.hard}
                onChange={(e) => handleChange("germination", "hard", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Fresh Ungerminated</FieldLabel>
              <Input
                placeholder="fresh"
                value={formData.germination.fresh}
                onChange={(e) => handleChange("germination", "fresh", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Rotten or Dead</FieldLabel>
              <Input
                placeholder="Input dead"
                value={formData.germination.dead}
                onChange={(e) => handleChange("germination", "dead", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Abnormal sprouts (in percentage)</FieldLabel>
              <Input
                placeholder="Input Abnormal sprouts (in percentage)"
                value={formData.germination.abnormal_sprouts}
                onChange={(e) => handleChange("germination", "abnormal_sprouts", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moisture Section */}
      {testsRequired.includes("moisture") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-700">MOISTURE (M)</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 pt-4">
            <div>
              <FieldLabel required>Enter Moisture content (in percentage)</FieldLabel>
              <Input
                placeholder="Enter Moisture content (in percentage)"
                value={formData.moisture.moisture}
                onChange={(e) => handleChange("moisture", "moisture", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marketability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-700">Marketability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6 mt-3">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="marketable"
                name="marketability"
                value="marketable"
                checked={marketableStatus === "marketable"}
                onChange={() => setMarketableStatus("marketable")}
                className="text-green-600"
              />
              <label htmlFor="marketable" className="font-medium text-gray-800">
                Marketable
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="not_marketable"
                name="marketability"
                value="not_marketable"
                checked={marketableStatus === "not_marketable"}
                onChange={() => setMarketableStatus("not_marketable")}
                className="text-red-600"
              />
              <label htmlFor="not_marketable" className="font-medium text-gray-800">
                Not Marketable
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {submitting ? "Saving..." : "Save Record"}
        </Button>
      </div>
    </div>
  );
}
