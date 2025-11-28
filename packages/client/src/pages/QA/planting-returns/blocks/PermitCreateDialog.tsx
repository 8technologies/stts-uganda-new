import { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
import { Button } from "@/components/ui/button";
import { KeenIcon } from "@/components";
import { useQuery, useLazyQuery } from "@apollo/client/react";
import { LOAD_CROPS, LOAD_CROP } from "@/gql/queries";
import { Checkbox } from "@/components/ui/checkbox";
import { URL_2 } from "@/config/urls";

interface IUserEditDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (values: Record<string, any>) => void;
  saving?: boolean;
  initialValues?: Record<string, any> | null;
}

type PermitCropItem = {
  cropId: string;
  varietyId: string;
  category: "commercial" | "research" | "own_use";
  weight: string; // keep as string to allow easy typing
  measure: "Kgs" | "Tubes" | "Bags" | "Suckers";
};

const defaultCreateValues = {
  applicantCategory: "seed_merchant",
  stockQuantity: "",
  countryOfOrigin: "",
  supplierName: "",
  supplierAddress: "",
  consignmentAccompaniedBy: [] as string[],
  attachments: [] as File[],
  crops: [] as PermitCropItem[],
};

const PermitCreateDialog = ({
  open,
  onOpenChange,
  onSave,
  saving,
  initialValues,
}: IUserEditDialogProps) => {
  const [values, setValues] = useState<Record<string, any>>({
    ...defaultCreateValues,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  // Countries of origin
  const [countries, setCountries] = useState<
    { name: string; code: string; flag?: string }[]
  >([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const fetchCountries = async () => {
    try {
      setCountriesLoading(true);
      setCountriesError(null);
      const response = await axios.get(`${URL_2}/countries`);
      const data: any[] = response.data;
      const mapped = (Array.isArray(data) ? data : [])
        .map((c: any) => ({
          name: String(c.name),
          code: String(c.alpha3Code || c.alpha2Code || c.name),
          flag: c?.flags?.png || c?.flag,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setCountries(mapped);
    } catch (error: any) {
      setCountriesError(
        error?.response?.data?.message ||
          error?.message ||
          "Error fetching the country data",
      );
    } finally {
      setCountriesLoading(false);
    }
  };
  useEffect(() => {
    if (
      open &&
      countries.length === 0 &&
      !countriesLoading &&
      !countriesError
    ) {
      fetchCountries();
    }
    if (open) {
      if (initialValues) {
        setValues({ ...defaultCreateValues, ...initialValues });
        setErrors({});
        setRowErrors({});
      } else {
        setValues({ ...defaultCreateValues });
        setErrors({});
        setRowErrors({});
      }
    }
  }, [open, initialValues]);

  // Load crops list
  const LIST_VARS = { filter: {}, pagination: { page: 1, size: 200 } } as const;
  const {
    data: cropsData,
    loading: cropsLoading,
    error: cropsError,
  } = useQuery(LOAD_CROPS, { variables: LIST_VARS });
  const cropOptions = useMemo(
    () =>
      ((cropsData?.crops?.items || []) as any[]).map((c) => ({
        id: String(c.id),
        name: c.name,
      })),
    [cropsData?.crops?.items],
  );

  // Lazy load varieties per crop
  const [loadCropVarieties] = useLazyQuery(LOAD_CROP);
  const [varietyStore, setVarietyStore] = useState<
    Record<
      string,
      {
        items: { id: string; name: string }[];
        loading?: boolean;
        error?: string;
      }
    >
  >({});

  const fetchVarieties = async (cropId: string) => {
    if (!cropId) return;
    const cur = varietyStore[cropId];
    if (cur && cur.items && cur.items.length > 0) return;
    setVarietyStore((prev) => ({
      ...prev,
      [cropId]: {
        ...(prev[cropId] || {}),
        loading: true,
        error: undefined,
        items: prev[cropId]?.items || [],
      },
    }));
    try {
      const res = await loadCropVarieties({ variables: { id: cropId } });
      const items = ((res.data?.crop?.varieties || []) as any[]).map((v) => ({
        id: String(v.id),
        name: v.name,
      }));
      setVarietyStore((prev) => ({
        ...prev,
        [cropId]: { items, loading: false, error: undefined },
      }));
    } catch (e: any) {
      setVarietyStore((prev) => ({
        ...prev,
        [cropId]: {
          items: prev[cropId]?.items || [],
          loading: false,
          error: e?.message || "Failed to load varieties",
        },
      }));
    }
  };

  const handleChange = (key: string, value: any) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete (next as any)[key];
      return next;
    });
  };
  const toggleConsignment = (label: string, checked: boolean) => {
    setValues((v) => {
      const arr: string[] = Array.isArray(v.consignmentAccompaniedBy)
        ? v.consignmentAccompaniedBy
        : [];
      const next = checked
        ? Array.from(new Set([...arr, label]))
        : arr.filter((x) => x !== label);
      return { ...v, consignmentAccompaniedBy: next };
    });
  };

  const addCropItem = () =>
    setValues((v) => ({
      ...v,
      crops: [
        ...((v.crops as PermitCropItem[]) || []),
        {
          cropId: "",
          varietyId: "",
          category: "commercial",
          weight: "",
          measure: "Kgs",
        },
      ],
    }));
  const removeCropItem = (idx: number) =>
    setValues((v) => ({
      ...v,
      crops: (v.crops as PermitCropItem[]).filter((_, i) => i !== idx),
    }));
  const updateCropItem = (idx: number, patch: Partial<PermitCropItem>) =>
    setValues((v) => ({
      ...v,
      crops: (v.crops as PermitCropItem[]).map((it, i) =>
        i === idx ? { ...it, ...patch } : it,
      ),
    }));

  const clearRowError = (idx: number, field: string) =>
    setRowErrors((re) => {
      const cur = { ...(re[idx] || {}) } as Record<string, string>;
      delete cur[field];
      return { ...re, [idx]: cur };
    });

  const handleSubmit = async () => {
    // Validate
    const topErrors: Record<string, string> = {};
    const perRowErrors: Record<number, Record<string, string>> = {};

    if (!values.stockQuantity || Number(values.stockQuantity) <= 0) {
      topErrors.stockQuantity = "Enter a positive quantity";
    }
    if (!values.countryOfOrigin)
      topErrors.countryOfOrigin = "Country is required";
    if (!values.supplierName)
      topErrors.supplierName = "Supplier name is required";
    if (!values.supplierAddress)
      topErrors.supplierAddress = "Supplier address is required";
    if (
      !Array.isArray(values.consignmentAccompaniedBy) ||
      values.consignmentAccompaniedBy.length === 0
    ) {
      topErrors.consignmentAccompaniedBy = "Select at least one";
    }
    if (!Array.isArray(values.crops) || values.crops.length === 0) {
      topErrors.crops = "Add at least one crop item";
    } else {
      (values.crops as PermitCropItem[]).forEach((it, idx) => {
        const er: Record<string, string> = {};
        if (!it.cropId) er.cropId = "Select crop";
        if (!it.varietyId) er.varietyId = "Select variety";
        if (!it.category) er.category = "Select category";
        if (!it.weight || Number(it.weight) <= 0) er.weight = "Enter weight";
        if (!it.measure) er.measure = "Select measure";
        if (Object.keys(er).length) perRowErrors[idx] = er;
      });
    }

    setErrors(topErrors);
    setRowErrors(perRowErrors);

    if (Object.keys(topErrors).length || Object.keys(perRowErrors).length)
      return;

    // console.log('values', values);

    await onSave?.(values);
    // Reset the form after successful save
    setValues({ ...defaultCreateValues });
    setErrors({});
    setRowErrors({});
    // Parent controls closing once mutation + refetch complete
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[980px] w-[96vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeenIcon icon="note" /> Create Import Permit
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-8">
          {/* Applicant's Category */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Applicant's Category
            </h3>
            <div className="flex flex-wrap gap-6">
              {[
                ["seed_merchant", "Seed Merchant/Company"],
                ["seed_dealer", "Seed Dealer/importer/exporter"],
                ["seed_producer", "Seed Producer"],
                ["researcher", "Researchers/Own use"],
              ].map(([val, label]) => (
                <label key={val} className="radio-group">
                  <input
                    className="radio"
                    type="radio"
                    name="applicantCategory"
                    checked={values.applicantCategory === val}
                    onChange={() => handleChange("applicantCategory", val)}
                  />
                  <span className="radio-label">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Main fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">
                Quantity of seed of the same variety held in stock
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    handleChange(
                      "stockQuantity",
                      String(
                        Math.max(0, Number(values.stockQuantity || 0) - 1),
                      ),
                    )
                  }
                >
                  -
                </Button>
                <Input
                  type="number"
                  placeholder="Enter quantity"
                  value={values.stockQuantity}
                  onChange={(e) =>
                    handleChange("stockQuantity", e.target.value)
                  }
                />
                <Button
                  type="button"
                  className="btn-success"
                  onClick={() =>
                    handleChange(
                      "stockQuantity",
                      String(Number(values.stockQuantity || 0) + 1),
                    )
                  }
                >
                  +
                </Button>
              </div>
              {errors.stockQuantity && (
                <div className="text-xs text-danger mt-1">
                  {errors.stockQuantity}
                </div>
              )}
            </div>
            <div>
              <label className="form-label">Country of Origin</label>
              {countriesLoading ? (
                <div className="text-xs text-gray-600 mt-2">
                  Loading countries…
                </div>
              ) : countriesError ? (
                <div className="text-xs text-danger mt-2 flex items-center gap-2">
                  Failed to load countries
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fetchCountries}
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <Select
                  value={values.countryOfOrigin}
                  onValueChange={(v) => handleChange("countryOfOrigin", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Country of Origin" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.code} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.countryOfOrigin && (
                <div className="text-xs text-danger mt-1">
                  {errors.countryOfOrigin}
                </div>
              )}
            </div>
            <div>
              <label className="form-label">Name of supplier</label>
              <Input
                placeholder="Input Name of supplier"
                value={values.supplierName}
                onChange={(e) => handleChange("supplierName", e.target.value)}
              />
              {errors.supplierName && (
                <div className="text-xs text-danger mt-1">
                  {errors.supplierName}
                </div>
              )}
            </div>
            <div>
              <label className="form-label">Address of supplier</label>
              <Input
                placeholder="Input Address of supplier"
                value={values.supplierAddress}
                onChange={(e) =>
                  handleChange("supplierAddress", e.target.value)
                }
              />
              {errors.supplierAddress && (
                <div className="text-xs text-danger mt-1">
                  {errors.supplierAddress}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="form-label">
                The seed consignment shall be accompanied by
              </label>
              <div className="mt-2 flex items-center gap-6">
                <label className="inline-flex items-center gap-2">
                  <Checkbox
                    checked={
                      Array.isArray(values.consignmentAccompaniedBy) &&
                      values.consignmentAccompaniedBy.includes(
                        "ISTA Certificate",
                      )
                    }
                    onCheckedChange={(c) =>
                      toggleConsignment("ISTA Certificate", !!c)
                    }
                  />
                  <span className="text-sm">ISTA Certificate</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <Checkbox
                    checked={
                      Array.isArray(values.consignmentAccompaniedBy) &&
                      values.consignmentAccompaniedBy.includes(
                        "Phytosanitary certificate",
                      )
                    }
                    onCheckedChange={(c) =>
                      toggleConsignment("Phytosanitary certificate", !!c)
                    }
                  />
                  <span className="text-sm">Phytosanitary certificate</span>
                </label>
              </div>
              {errors.consignmentAccompaniedBy && (
                <div className="text-xs text-danger mt-1">
                  {errors.consignmentAccompaniedBy}
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              Attachments
            </h3>
            <div className="max-w-md">
              <label
                htmlFor="attachments-upload"
                className="flex items-center gap-3 border rounded-md p-3 cursor-pointer hover:bg-gray-50"
              >
                <KeenIcon icon="file-added" />
                <span className="text-sm">Select file</span>
              </label>
              <input
                id="attachments-upload"
                type="file"
                className="hidden"
                multiple
                onChange={(e) =>
                  handleChange("attachments", Array.from(e.target.files || []))
                }
              />
              {Array.isArray(values.attachments) &&
                values.attachments.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {values.attachments.map((f: File, i: number) => (
                      <li key={i} className="truncate">
                        {f.name}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>

          {/* Crops list */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
              I or We wish to apply for a license to import seed as indicated
              below:
            </h3>
            <p className="text-sm text-gray-600">
              Click on "Add crop" to Add Crop varieties
            </p>

            <div className="space-y-3">
              {(values.crops as PermitCropItem[]).map((it, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
                >
                  <div className="md:col-span-4">
                    <label className="form-label">Crop</label>
                    {cropsLoading ? (
                      <div className="text-xs text-gray-600 mt-2">
                        Loading crops…
                      </div>
                    ) : cropsError ? (
                      <div className="text-xs text-danger mt-2">
                        Failed to load crops
                      </div>
                    ) : (
                      <Select
                        value={it.cropId}
                        onValueChange={(v) => {
                          updateCropItem(idx, { cropId: v, varietyId: "" });
                          fetchVarieties(v);
                          setRowErrors((re) => ({
                            ...re,
                            [idx]: { ...(re[idx] || {}), cropId: "" },
                          }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select crop" />
                        </SelectTrigger>
                        <SelectContent>
                          {cropOptions.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {rowErrors[idx]?.cropId && (
                      <div className="text-xs text-danger mt-1">
                        {rowErrors[idx].cropId}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-4">
                    <label className="form-label">Variety</label>
                    <Select
                      value={it.varietyId}
                      onValueChange={(v) => {
                        updateCropItem(idx, { varietyId: v });
                        setRowErrors((re) => ({
                          ...re,
                          [idx]: { ...(re[idx] || {}), varietyId: "" },
                        }));
                      }}
                      disabled={
                        !it.cropId || !!varietyStore[it.cropId]?.loading
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            !it.cropId
                              ? "Select crop first"
                              : varietyStore[it.cropId]?.loading
                                ? "Loading varieties…"
                                : "Select variety"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {(varietyStore[it.cropId]?.items || []).map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {it.cropId && varietyStore[it.cropId]?.error && (
                      <div className="text-xs text-danger mt-1 flex items-center gap-2">
                        Failed to load varieties
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fetchVarieties(it.cropId)}
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                    {rowErrors[idx]?.varietyId && (
                      <div className="text-xs text-danger mt-1">
                        {rowErrors[idx].varietyId}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-4">
                    <label className="form-label">Category</label>
                    <Select
                      value={it.category}
                      onValueChange={(v: any) => {
                        updateCropItem(idx, { category: v });
                        setRowErrors((re) => ({
                          ...re,
                          [idx]: { ...(re[idx] || {}), category: "" },
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="own_use">Own use</SelectItem>
                      </SelectContent>
                    </Select>
                    {rowErrors[idx]?.category && (
                      <div className="text-xs text-danger mt-1">
                        {rowErrors[idx].category}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <label className="form-label">Weight</label>
                    <Input
                      type="number"
                      placeholder="Weight"
                      value={it.weight}
                      onChange={(e) => {
                        updateCropItem(idx, { weight: e.target.value });
                        setRowErrors((re) => ({
                          ...re,
                          [idx]: { ...(re[idx] || {}), weight: "" },
                        }));
                      }}
                    />
                    {rowErrors[idx]?.weight && (
                      <div className="text-xs text-danger mt-1">
                        {rowErrors[idx].weight}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <label className="form-label">Measure</label>
                    <Select
                      value={it.measure}
                      onValueChange={(v: any) => {
                        updateCropItem(idx, { measure: v });
                        setRowErrors((re) => ({
                          ...re,
                          [idx]: { ...(re[idx] || {}), measure: "" },
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Kgs">Kgs</SelectItem>
                        <SelectItem value="Tubes">Tubes</SelectItem>
                        <SelectItem value="Bags">Bags</SelectItem>
                        <SelectItem value="Suckers">Suckers</SelectItem>
                      </SelectContent>
                    </Select>
                    {rowErrors[idx]?.measure && (
                      <div className="text-xs text-danger mt-1">
                        {rowErrors[idx].measure}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-12 flex justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => removeCropItem(idx)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {errors.crops && (
                <div className="text-xs text-danger">{errors.crops}</div>
              )}
              <Button
                type="button"
                className="btn btn-sm btn-success"
                onClick={addCropItem}
              >
                + Add Crop
              </Button>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <div className="flex gap-2">
            <Button variant="light" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!!saving}
              onClick={() => console.log("Save draft", values)}
            >
              <KeenIcon icon="task" /> Save Draft
            </Button>
            <Button onClick={handleSubmit} disabled={!!saving}>
              <KeenIcon icon="tick-square" />{" "}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { PermitCreateDialog };
// Backward-compatible alias used by ImportPermitsListPage
export { PermitCreateDialog as UserCreateDialog };
