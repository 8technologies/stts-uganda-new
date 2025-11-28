import React, { useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { KeenIcon } from "@/components";
import {
  LOAD_CROP_DECLARATIONS,
  LOAD_IMPORT_PERMITS,
  LOAD_PLANTING_RETURNS,
  LOAD_IMPORT_PERMIT,
  LOAD_STOCK_EXAMINATIONS,
} from "@/gql/queries";
import { useAuthContext } from "@/auth";
import { useQuery, useMutation } from "@apollo/client/react";
import { CREATE_STOCKEXAMINATION } from "@/gql/mutations";
import { toast } from "sonner";

type Mode = "create" | "edit";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  initialData?: any;
  onSaved?: (saved?: any) => void;
}

type SeedType = "Import_seed" | "Grower_seed" | "QDS_seed";

const StockExaminationFormSheet: React.FC<Props> = ({
  open,
  onOpenChange,
  mode,
  initialData,
  onSaved,
}) => {
  const [seedType, setSeedType] = useState<SeedType>("Grower_seed");
  const [motherLot, setMotherLot] = useState("");
  const [remarks, setRemarks] = useState("");
  const [selectedImportPermit, setSelectedImportPermit] = useState<
    string | null
  >(null);
  const [selectedVarietyImported, setSelectedVarietyImported] = useState<
    string | null
  >(null);
  const [selectedApprovedField, setSelectedApprovedField] = useState<
    string | null
  >(null);
  const [selectedQdsDeclaration, setSelectedQdsDeclaration] = useState<
    string | null
  >(null);
  const [selectedVarietyQds, setSelectedVarietyQds] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const LIST_VARS = { filter: {} } as const;
  const {
    data: cropDeclarations,
    loading,
    error,
    refetch,
  } = useQuery(LOAD_CROP_DECLARATIONS, {
    variables: LIST_VARS,
  });

  const RETURN_VARS = { filter: { status: "approved" } } as const;
  const {
    data: returns,
    loading: returnLoading,
    error: returnError,
  } = useQuery(LOAD_PLANTING_RETURNS, {
    variables: RETURN_VARS,
  });

  const PERMIT_VARS = { filter: { type: "import" as const } } as const;
  const {
    data: listData,
    loading: listLoading,
    error: listError,
  } = useQuery(LOAD_IMPORT_PERMITS, {
    variables: PERMIT_VARS,
  });

  const mockQdsDeclarations = useMemo(
    () => (cropDeclarations?.cropDeclarations?.items ?? []) as any[],
    [cropDeclarations],
  );
  const mockApprovedFields = useMemo(
    () => (returns?.plantingReturns?.items ?? []) as any[],
    [returns],
  );

  const mockImportPermits = useMemo(
    () => (listData?.importPermits?.items ?? []) as any[],
    [listData],
  );

  console.log("mockImportPermits:", mockImportPermits, listData);
  // derive the currently selected QDS declaration object and its varieties/crops
  const currentQdsDeclaration = useMemo(
    () =>
      mockQdsDeclarations.find(
        (d) => String(d.id) === String(selectedQdsDeclaration),
      ) ?? null,
    [mockQdsDeclarations, selectedQdsDeclaration],
  );

  const qdsVarieties = useMemo(() => {
    // the crop structure can vary depending on the backend shape.
    // try common keys used in the project: crops array with variety_id / variety_name
    if (!currentQdsDeclaration) return [];
    if (Array.isArray(currentQdsDeclaration.crops))
      return currentQdsDeclaration.crops;
    if (Array.isArray(currentQdsDeclaration.varieties))
      return currentQdsDeclaration.varieties;
    return [];
  }, [currentQdsDeclaration]);

  // derive the currently selected import permit object and its varieties/crops
  const currentImportPermit = useMemo(
    () =>
      mockImportPermits.find(
        (p) => String(p.id) === String(selectedImportPermit),
      ) ?? null,
    [mockImportPermits, selectedImportPermit],
  );

  // Fetch import permit details when one is selected
  const { data: importPermitData, loading: importPermitLoading } = useQuery(
    LOAD_IMPORT_PERMIT,
    {
      variables: { id: selectedImportPermit },
      skip: !selectedImportPermit,
    },
  );

  console.log("importPermitData:", importPermitData);

  // Get varieties from the import permit items
  const importVarieties = useMemo(() => {
    if (!importPermitData?.importPermit?.items) return [];
    return importPermitData.importPermit.items.map((item: any) => ({
      id: item.varietyId,
      name: item.variety?.name,
      cropName: item.crop?.name,
    }));
  }, [importPermitData]);

  //   const mockVarieties = useMemo(() => (selectedQdsDeclaration?.varieties?.items ?? []) as any[], [cropDeclarations]);

  console.log("mockQdsDeclarations:", mockQdsDeclarations);
  console.log("selectedQdsDeclaration:", selectedQdsDeclaration);
  //   const mockVarieties = cropDeclarations?.varieties?.items

  useEffect(() => {
    if (!open) return;
    setSeedType((initialData?.category as SeedType) || "Grower_seed");
    setMotherLot(initialData?.mother_lot || "");
    setRemarks(initialData?.remarks || "");
    setSelectedImportPermit(initialData?.import_export_permit_id || null);
    setSelectedVarietyImported(initialData?.variety_id || null);
    setSelectedApprovedField(initialData?.planting_return_id || null);
    setSelectedQdsDeclaration(initialData?.form_qds_id || null);
    setSelectedVarietyQds(initialData?.variety_id || null);
    setSaving(false);
  }, [open, initialData]);

  // Add mutation hook
  const [saveStockExamination, { loading: savingMutation }] = useMutation(
    CREATE_STOCKEXAMINATION,
    {
      refetchQueries: [{ query: LOAD_STOCK_EXAMINATIONS }],
      awaitRefetchQueries: true,
    },
  );

  // Replace the existing handleSave with this:
  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);

    try {
      // Construct the payload based on seedType
      const payload: any = {
        mother_lot: motherLot,
        remarks: remarks,
      };

      // Add specific fields based on seed type
      if (seedType === "Import_seed") {
        if (!selectedImportPermit || !selectedVarietyImported) {
          toast.error("Please select both import permit and variety");
          return;
        }
        payload.import_export_permit_id = selectedImportPermit;
        payload.variety_id = selectedVarietyImported;
      } else if (seedType === "Grower_seed") {
        if (!selectedApprovedField) {
          toast.error("Please select an approved field");
          return;
        }
        payload.planting_return_id = selectedApprovedField;
      } else if (seedType === "QDS_seed") {
        if (!selectedQdsDeclaration || !selectedVarietyQds) {
          toast.error("Please select both QDS declaration and variety");
          return;
        }
        payload.form_qds_id = selectedQdsDeclaration;
        payload.variety_id = selectedVarietyQds;
      }

      const { data } = await saveStockExamination({
        variables: {
          payload,
        },
      });

      if (data?.saveStockExamination?.success) {
        toast.success(
          data.saveStockExamination.message ||
            "Stock examination saved successfully",
        );
        onSaved?.(data.saveStockExamination.data);
        onOpenChange(false);
      } else {
        toast.error(
          data?.saveStockExamination?.message ||
            "Failed to save stock examination",
        );
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[720px] h-full flex flex-col bg-gray-50"
      >
        <SheetHeader className="px-6 pt-6 pb-4 bg-white border-b">
          <SheetTitle className="flex items-center gap-3 text-xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 text-primary-600">
              <KeenIcon icon={mode === "create" ? "plus" : "edit-2"} />
            </div>
            <div>
              <div className="font-semibold">
                {mode === "create"
                  ? "Create Stock Examination"
                  : "Edit Stock Examination"}
              </div>
              <div className="text-sm text-gray-500 font-normal mt-0.5">
                {mode === "create"
                  ? "Add a new stock examination record"
                  : "Update examination details"}
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Category Selection Card */}
            <div className="bg-white rounded-lg border p-5 shadow-sm">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                <span className="text-red-500 mr-1">*</span>
                Examination Category
              </label>
              <p className="text-sm text-gray-600 mb-4">
                Select the type of seed being examined
              </p>

              {/* <div role="radiogroup" aria-label="examination category" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSeedType('Import_seed')}
                  className={`group relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    seedType === 'Import_seed' 
                      ? 'bg-primary-50 border-primary-500 shadow-sm' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  aria-pressed={seedType === 'Import_seed'}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    seedType === 'Import_seed' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }`}>
                    <KeenIcon icon="package" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${seedType === 'Import_seed' ? 'text-primary-900' : 'text-gray-900'}`}>
                      Imported
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Foreign seed</div>
                  </div>
                  {seedType === 'Import_seed' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <KeenIcon icon="check" className="text-white text-xs" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSeedType('Grower_seed')}
                  className={`group relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    seedType === 'Grower_seed' 
                      ? 'bg-primary-50 border-primary-500 shadow-sm' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  aria-pressed={seedType === 'Grower_seed'}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    seedType === 'Grower_seed' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }`}>
                    <KeenIcon icon="field" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${seedType === 'Grower_seed' ? 'text-primary-900' : 'text-gray-900'}`}>
                      Grower
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Local grower</div>
                  </div>
                  {seedType === 'Grower_seed' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <KeenIcon icon="check" className="text-white text-xs" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setSeedType('QDS_seed')}
                  className={`group relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                    seedType === 'QDS_seed' 
                      ? 'bg-primary-50 border-primary-500 shadow-sm' 
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  aria-pressed={seedType === 'QDS_seed'}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                    seedType === 'QDS_seed' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }`}>
                    <KeenIcon icon="file-text" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className={`font-medium ${seedType === 'QDS_seed' ? 'text-primary-900' : 'text-gray-900'}`}>
                      QDS
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Quality declared</div>
                  </div>
                  {seedType === 'QDS_seed' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                      <KeenIcon icon="check" className="text-white text-xs" />
                    </div>
                  )}
                </button>
              </div> */}
              <div
                role="radiogroup"
                aria-label="examination category"
                className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              >
                {[
                  {
                    type: "Import_seed",
                    icon: "package",
                    label: "Imported",
                    desc: "Foreign seed",
                    color: "from-blue-500 to-blue-600",
                  },
                  {
                    type: "Grower_seed",
                    icon: "field",
                    label: "Grower",
                    desc: "Local grower",
                    color: "from-green-500 to-green-600",
                  },
                  {
                    type: "QDS_seed",
                    icon: "file-text",
                    label: "QDS",
                    desc: "Quality declared",
                    color: "from-amber-500 to-amber-600",
                  },
                ].map((btn) => {
                  const isActive = seedType === btn.type;
                  return (
                    <button
                      key={btn.type}
                      type="button"
                      onClick={() => setSeedType(btn.type as SeedType)}
                      className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 
                        ${
                          isActive
                            ? `border-transparent bg-gradient-to-r ${btn.color} text-white shadow-lg scale-[1.02]`
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm text-gray-900"
                        }`}
                      aria-pressed={isActive}
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200
                          ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600 group-hover:bg-gray-200"}
                        `}
                      >
                        <KeenIcon icon={btn.icon} />
                      </div>
                      <div className="flex-1 text-left">
                        <div
                          className={`font-semibold ${isActive ? "text-white" : "text-gray-900"}`}
                        >
                          {btn.label}
                        </div>
                        <div
                          className={`text-xs ${isActive ? "text-white/80" : "text-gray-500"} mt-0.5`}
                        >
                          {btn.desc}
                        </div>
                      </div>
                      {isActive && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-white text-primary-600 rounded-full flex items-center justify-center">
                          <KeenIcon icon="check" className="text-sm" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields Card */}
            <div className="bg-white rounded-lg border p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <KeenIcon icon="document" className="text-gray-400" />
                Examination Details
              </h3>

              <div className="space-y-5">
                {/* Imported */}
                {seedType === "Import_seed" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>
                        Import Permit
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <KeenIcon icon="document" />
                        </div>
                        <select
                          className="form-select w-full pl-10 pr-10 h-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={selectedImportPermit ?? ""}
                          onChange={(e) => {
                            const val = e.target.value || null;
                            setSelectedImportPermit(val);
                            // reset selected variety when permit changes
                            setSelectedVarietyImported(null);
                          }}
                          required
                        >
                          <option value="">Choose import permit</option>
                          {mockImportPermits.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.countryOfOrigin || p.permitNumber || p.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <KeenIcon icon="chevron-down" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1">
                        <KeenIcon icon="information" className="mt-0.5" />
                        <span>
                          Select the active import permit for this examination
                        </span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>
                        Variety
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <KeenIcon icon="category" />
                        </div>
                        <select
                          className="form-select w-full pl-10 pr-10 h-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={selectedVarietyImported ?? ""}
                          onChange={(e) =>
                            setSelectedVarietyImported(e.target.value || null)
                          }
                          disabled={importPermitLoading}
                          required
                        >
                          <option value="">
                            {importPermitLoading
                              ? "Loading varieties..."
                              : "Choose variety"}
                          </option>
                          {importVarieties.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name} ({v.cropName})
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <KeenIcon icon="chevron-down" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>
                        Mother Lot Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <KeenIcon icon="hash" />
                        </div>
                        <input
                          type="text"
                          className="form-input w-full pl-10 h-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={motherLot}
                          onChange={(e) => setMotherLot(e.target.value)}
                          placeholder="Enter mother lot number"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Grower */}
                {seedType === "Grower_seed" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>
                        Approved Field
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <KeenIcon icon="field" />
                        </div>
                        <select
                          className="form-select w-full pl-10 pr-10 h-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={selectedApprovedField ?? ""}
                          onChange={(e) =>
                            setSelectedApprovedField(e.target.value || null)
                          }
                          required
                        >
                          <option value="">Choose approved field</option>
                          {mockApprovedFields.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.fieldName}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <KeenIcon icon="chevron-down" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5 flex items-start gap-1">
                        <KeenIcon icon="information" className="mt-0.5" />
                        <span>Field where the seed sample originated</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>
                        Mother Lot Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <KeenIcon icon="hash" />
                        </div>
                        <input
                          type="text"
                          className="form-input w-full pl-10 h-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={motherLot}
                          onChange={(e) => setMotherLot(e.target.value)}
                          placeholder="Enter mother lot number"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* QDS */}
                {seedType === "QDS_seed" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>
                        QDS Declaration
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <KeenIcon icon="file-text" />
                        </div>
                        <select
                          className="form-select w-full pl-10 pr-10 h-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={selectedQdsDeclaration ?? ""}
                          onChange={(e) => {
                            const val = e.target.value || null;
                            setSelectedQdsDeclaration(val);
                            // reset selected variety when declaration changes
                            setSelectedVarietyQds(null);
                          }}
                          required
                        >
                          <option value="">Choose QDS declaration</option>
                          {mockQdsDeclarations.map((q) => (
                            <option key={q.id} value={q.id}>
                              {q.source_of_seed}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <KeenIcon icon="chevron-down" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>
                        Variety
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <KeenIcon icon="category" />
                        </div>
                        <select
                          className="form-select w-full pl-10 pr-10 h-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={selectedVarietyQds ?? ""}
                          onChange={(e) =>
                            setSelectedVarietyQds(e.target.value || null)
                          }
                          required
                        >
                          <option value="">Choose variety</option>
                          {qdsVarieties.map((v: any) => {
                            const id =
                              v.variety_id ?? v.varietyId ?? v.id ?? v.value;
                            const label =
                              v.variety_name ??
                              v.varietyName ??
                              v.name ??
                              v.label ??
                              String(id);
                            return (
                              <option key={id} value={id}>
                                {label}
                              </option>
                            );
                          })}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          <KeenIcon icon="chevron-down" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>
                        Mother Lot Number
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          <KeenIcon icon="hash" />
                        </div>
                        <input
                          type="text"
                          className="form-input w-full pl-10 h-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          value={motherLot}
                          onChange={(e) => setMotherLot(e.target.value)}
                          placeholder="Enter mother lot number"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    className="form-textarea w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={4}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add any additional notes or observations..."
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Optional: Include any relevant comments
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="border-t bg-white px-6 py-4 flex items-center justify-between shadow-sm">
          <Button
            type="button"
            variant="light"
            onClick={() => onOpenChange(false)}
            className="px-5"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || savingMutation}
            className="px-6 min-w-[120px]"
          >
            {saving || savingMutation ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {mode === "create" ? "Creating..." : "Saving..."}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <KeenIcon icon={mode === "create" ? "plus" : "check"} />
                {mode === "create" ? "Create Examination" : "Save Changes"}
              </span>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StockExaminationFormSheet;
