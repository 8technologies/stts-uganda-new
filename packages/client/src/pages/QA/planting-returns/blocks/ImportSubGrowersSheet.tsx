import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApolloClient, useQuery, useMutation } from "@apollo/client/react";
import * as XLSX from "xlsx";
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { GETDISTRICTS, LOAD_CROPS } from "@/gql/queries";
import { UPLOAD_PLANTING_RETURNS } from "@/gql/mutations";
import { URL_2 } from "@/config/urls";

// ─── Header alias map ─────────────────────────────────────────────────────────
// Maps canonical field names to all accepted column header variants.
// Headers are normalized (lowercase + underscores) before matching.
const HEADER_ALIASES: Record<string, string[]> = {
  field_name: [
    "field_name",
    "field name",
    "fieldname",
    "garden name",
    "garden_name",
    "field",
  ],
  name: [
    "name",
    "grower_name",
    "grower name",
    "farmer name",
    "farmer_name",
    "applicant_name",
    "applicant name",
    "person_responsible",
  ],
  size: [
    "size",
    "area_ha",
    "area ha",
    "area_(ha)",
    "area (ha)",
    "area",
    "hectares",
    "ha",
    "Field size(acres)",
    "Field_size"
  ],
  crop: [
    "crop",
    "crop and variety",
    "crop_variety",
    "crop variety",
    "crop/variety",
  ],
  seed_class: ["seed_class", "seed class", "seedclass", "class"],
  lot_number: [
    "lot_number",
    "lot number",
    "lot no",
    "lotno",
    "lot_no",
    "seed lot",
    "seed_lot",
    "seed_lot_code",
  ],
  source_of_seed: [
    "source_of_seed",
    "source of seed",
    "seed source",
    "seed_source",
  ],
  planting_date: [
    "planting_date",
    "planting date",
    "date sown",
    "date_sown",
    "date planted",
    "date_planted",
  ],
  quantity_planted: [
    "quantity_planted",
    "quantity planted",
    "quantity",
    "qty",
    "qty_planted",
  ],
  expected_yield: ["expected_yield", "expected yield", "yield"],
  phone_number: [
    "phone_number",
    "phone number",
    "phone",
    "contact",
    "contact_phone",
    "phoneno",
    "phone_no",
  ],
  gps_latitude: [
    "gps_latitude",
    "gps latitude",
    "latitude",
    "lat",
    "gps_lat",
  ],
  gps_longitude: [
    "gps_longitude",
    "gps longitude",
    "longitude",
    "lng",
    "lon",
    "gps_lng",
    "gps_long",
  ],
  district: ["district", "district_name", "location district", "district name"],
  subcounty: [
    "subcounty",
    "sub_county",
    "sub county",
    "sub-county",
    "subcounty_name",
  ],
  village: ["village", "village_name"],
};

// Client-side required columns (subset — server re-validates independently)
const REQUIRED_COLS = [
  "field_name",
  "name",
  "district",
  "crop",
  "seed_class",
  "lot_number",
] as const;

const ACCEPTED_FILE_TYPES = ".csv,.txt,.xls,.xlsx";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const normalizeHeader = (h: string) =>
  String(h)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const normalizeValue = (value: unknown) =>
  String(value ?? "").replace(/\s+/g, " ").trim();

const normalizeLookupValue = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function buildHeaderMap(rawHeaders: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  rawHeaders.forEach((raw, idx) => {
    const norm = normalizeHeader(raw);
    const rawLower = String(raw).toLowerCase().trim();
    for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
      if (canonical in map) continue;
      if (aliases.includes(norm) || aliases.includes(rawLower)) {
        map[canonical] = idx;
      }
    }
  });
  return map;
}

function findHeaderRowIndex(rawRows: any[][]): number {
  const maxScan = Math.min(rawRows.length, 15);
  let bestIdx = 0;
  let bestScore = -1;

  for (let i = 0; i < maxScan; i++) {
    const candidate = (rawRows[i] ?? []).map((h) => String(h ?? "").trim());
    const score = Object.keys(buildHeaderMap(candidate)).length;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestIdx;
}

const getByAliases = (row: Record<string, unknown>, aliases: string[]) => {
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const value = row[alias] ?? row[normalizedAlias];
    if (value !== undefined && value !== null && normalizeValue(value) !== "") {
      return normalizeValue(value);
    }
  }
  return "";
};

const getRawByAliases = (row: Record<string, unknown>, aliases: string[]) => {
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const value = row[alias] ?? row[normalizedAlias];
    if (value !== undefined && value !== null && normalizeValue(value) !== "") {
      return value;
    }
  }
  return null;
};

const rowHasImportData = (row: Record<string, unknown>) => {
  return Boolean(
    getByAliases(row, HEADER_ALIASES.field_name) ||
      getByAliases(row, HEADER_ALIASES.name) ||
      getByAliases(row, HEADER_ALIASES.crop) ||
      getByAliases(row, HEADER_ALIASES.seed_class) ||
      getByAliases(row, HEADER_ALIASES.lot_number) ||
      getByAliases(row, HEADER_ALIASES.district),
  );
};

function parseExcelDate(value: any): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    // xlsx serial date
    const info = (XLSX.SSF as any).parse_date_code?.(value);
    if (info) {
      return `${info.y}-${String(info.m).padStart(2, "0")}-${String(info.d).padStart(2, "0")}`;
    }
  }
  if (value instanceof Date) return value.toISOString().split("T")[0];
  const str = String(value).trim();
  // Try DD/MM/YYYY or DD-MM-YYYY
  const parts = str.split(/[\/\-]/).map((p) => p.trim());
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const candidate = new Date(
      `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`,
    );
    if (!isNaN(candidate.getTime())) return candidate.toISOString().split("T")[0];
  }
  const direct = new Date(str);
  if (!isNaN(direct.getTime())) return direct.toISOString().split("T")[0];
  return str;
}

// Parse "CROP: CropName, VARIETY: VarName" string
function parseCropVariety(
  raw: string,
): { cropName: string; crop: string; varietyName: string } | null {
  const m = raw.match(/CROP:\s*(.*?),\s*VARIETY:\s*(.*)/i);
  if (!m) return null;
  return { cropName: m[1].trim(), crop: m[1].trim(), varietyName: m[2].trim() };
}

const makeCropVarietyKey = (cropName: string, varietyName: string) =>
  `${normalizeLookupValue(cropName)}|${normalizeLookupValue(varietyName)}`;

// ─── Types ────────────────────────────────────────────────────────────────────
type ParsedRow = {
  _idx: number; // 1-based row number in the file (including header)
  field_name: string;
  name: string;
  size: string;
  crop: string;
  cropName: string;
  varietyName: string;
  seed_class: string;
  lot_number: string;
  source_of_seed: string;
  planting_date: string;
  quantity_planted: string;
  expected_yield: string;
  phone_number: string;
  gps_latitude: string;
  gps_longitude: string;
  district: string;
  subcounty: string;
  village: string;
  errors: string[]; // validation errors
};

interface ImportResult {
  totalRecords: number;
  totalImported: number;
  totalFailed: number;
  results: Array<{ row: number; success: boolean; message: string }>;
}

// ─── Component ────────────────────────────────────────────────────────────────
interface ImportSubGrowersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful import so the parent can refetch its list */
  onImported?: () => void;
}

export const ImportSubGrowersSheet: React.FC<ImportSubGrowersSheetProps> = ({
  open,
  onOpenChange,
  onImported,
}) => {
  // ── Form state ──
  const [amountEnclosed, setAmountEnclosed] = useState("");
  const [registeredDealer, setRegisteredDealer] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const receiptRef = useRef<HTMLInputElement>(null);

  // ── Sub-growers file state ──
  const [subGrowersFile, setSubGrowersFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [missingHeaders, setMissingHeaders] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);

  // ── Import result ──
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [allCropItems, setAllCropItems] = useState<any[]>([]);
  const [loadingAllCrops, setLoadingAllCrops] = useState(false);
  const [allCropsError, setAllCropsError] = useState<Error | null>(null);
  const apolloClient = useApolloClient();

  // ── Lookups ──
  const { data: districtData, loading: loadingDistricts, error: districtsError } =
    useQuery(GETDISTRICTS);

  useEffect(() => {
    let cancelled = false;

    const loadAllCrops = async () => {
      setLoadingAllCrops(true);
      setAllCropsError(null);

      try {
        const size = 100;
        let page = 1;
        let total = 0;
        const items: any[] = [];

        do {
          const { data } = await apolloClient.query({
            query: LOAD_CROPS,
            variables: { filter: {}, pagination: { page, size } },
            fetchPolicy: "network-only",
          });

          const payload = (data as any)?.crops;
          const pageItems = payload?.items ?? [];
          total = Number(payload?.total ?? pageItems.length);
          items.push(...pageItems);

          if (pageItems.length === 0) break;
          page += 1;
        } while (items.length < total);

        if (!cancelled) {
          setAllCropItems(items);
        }
      } catch (error: any) {
        if (!cancelled) {
          setAllCropsError(error);
          setAllCropItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingAllCrops(false);
        }
      }
    };

    loadAllCrops();

    return () => {
      cancelled = true;
    };
  }, [apolloClient]);

  const districtNames = useMemo<Set<string>>(
    () =>
      new Set(
        ((districtData as any)?.getDistricts ?? []).map((d: any) =>
          d.name.toLowerCase().trim(),
        ),
      ),
    [districtData],
  );

  const cropVarietyPairs = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    allCropItems.forEach((crop: any) => {
      (crop.varieties ?? []).forEach((v: any) => {
        const vName = v.name ?? String(v.id ?? "");
        set.add(makeCropVarietyKey(crop.name, vName));
      });
    });
    return set;
  }, [allCropItems]);

  const lookupsReady = !loadingDistricts && !loadingAllCrops;

  // ── Reset ──
  const resetAll = useCallback(() => {
    setAmountEnclosed("");
    setRegisteredDealer("");
    setReceiptFile(null);
    setSubGrowersFile(null);
    setParsedRows([]);
    setHeaders([]);
    setParseError(null);
    setMissingHeaders([]);
    setImportResult(null);
    setParsing(false);
    setImporting(false);
  }, []);

  useEffect(() => {
    if (!open) {
      resetAll();
    }
  }, [open, resetAll]);

  const handleClose = () => {
    resetAll();
    onOpenChange(false);
  };

  // ── File parsing ──
  const parseFile = useCallback((file: File) => {
    setParsing(true);
    setParseError(null);
    setMissingHeaders([]);
    setParsedRows([]);
    setHeaders([]);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });

        // Prefer "Sheet1" data sheet; fall back to first non-hidden sheet
        const DATA_SHEET_NAMES = ["Sheet1", "sheet1", "Data", "data", "Sub-Growers", "SubGrowers"];
        const sheetName =
          DATA_SHEET_NAMES.find((n) => wb.SheetNames.includes(n)) ??
          wb.SheetNames.find((n) => !n.startsWith("_")) ??
          wb.SheetNames[0];
        if (!sheetName) {
          setParseError("No worksheet found in the file.");
          return;
        }
        const ws = wb.Sheets[sheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
        });

        if (rawRows.length < 2) {
          setParseError("File is empty or contains no data rows.");
          return;
        }

        const headerRowIndex = findHeaderRowIndex(rawRows);

        // Parse again starting at detected header row, same pattern used in PWD importer
        const objectRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
          raw: true,
          blankrows: false,
          range: headerRowIndex,
        });

        const normalizedRows = objectRows.map((row) => {
          const assoc: Record<string, unknown> = {};
          Object.entries(row).forEach(([key, value]) => {
            assoc[normalizeHeader(key)] = value;
          });
          return assoc;
        });

        const filteredRows = normalizedRows.filter((row) => rowHasImportData(row));

        const parsedHeaders = Object.keys(normalizedRows[0] || {});

        // Check required columns are present
        const missing = REQUIRED_COLS.filter((field) => {
          const aliases = HEADER_ALIASES[field];
          return !aliases.some((alias) => parsedHeaders.includes(normalizeHeader(alias)));
        });
        const availableCols = parsedHeaders.join(", ");
        if (missing.length > 0) {
          setMissingHeaders(missing);
          setParseError(
            `Missing required columns:..... ${missing.join(", ")}. Available columns: ${availableCols}. Please use the provided template.`,
          );
          return;
        }

        setHeaders(parsedHeaders);

        const rows: ParsedRow[] = [];
        for (let i = 0; i < filteredRows.length; i++) {
          const raw = filteredRows[i];

          const cropRaw = getByAliases(raw, HEADER_ALIASES.crop);
          const cropParsed = parseCropVariety(cropRaw);

          const row: ParsedRow = {
            _idx: i + 1,
            field_name: getByAliases(raw, HEADER_ALIASES.field_name),
            name: getByAliases(raw, HEADER_ALIASES.name),
            size: getByAliases(raw, HEADER_ALIASES.size),
            crop: cropRaw,
            cropName: cropParsed?.cropName ?? cropRaw,
            varietyName: cropParsed?.varietyName ?? "",
            seed_class: getByAliases(raw, HEADER_ALIASES.seed_class),
            lot_number: getByAliases(raw, HEADER_ALIASES.lot_number),
            source_of_seed: getByAliases(raw, HEADER_ALIASES.source_of_seed),
            planting_date: parseExcelDate(
              getRawByAliases(raw, HEADER_ALIASES.planting_date),
            ),
            quantity_planted: getByAliases(raw, HEADER_ALIASES.quantity_planted),
            expected_yield: getByAliases(raw, HEADER_ALIASES.expected_yield),
            phone_number: getByAliases(raw, HEADER_ALIASES.phone_number),
            gps_latitude: getByAliases(raw, HEADER_ALIASES.gps_latitude),
            gps_longitude: getByAliases(raw, HEADER_ALIASES.gps_longitude),
            district: getByAliases(raw, HEADER_ALIASES.district),
            subcounty: getByAliases(raw, HEADER_ALIASES.subcounty),
            village: getByAliases(raw, HEADER_ALIASES.village),
            errors: [],
          };

          // Basic required-field validation (lookup validation applied later)
          if (!row.name) row.errors.push("Name is required");
          if (!row.district) row.errors.push("District is required");
          if (!row.crop) row.errors.push("Crop & Variety is required");
          if (!row.seed_class) row.errors.push("Seed class is required");
          if (!row.lot_number) row.errors.push("Lot number is required");

          rows.push(row);
        }

        if (!filteredRows.length || rows.length === 0) {
          setParseError("No data rows found in the file.");
          return;
        }

        setParsedRows(rows);
      } catch (err: any) {
        setParseError(
          `Failed to parse file: ${err?.message ?? "Unknown error"}`,
        );
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // ── Per-row validation enriched by lookup data ──
  const validatedRows = useMemo<ParsedRow[]>(() => {
    if (parsedRows.length === 0) return [];
    return parsedRows.map((row) => {
      // Carry forward non-lookup errors, re-run lookup validations
      const baseErrors = row.errors.filter(
        (e) => !e.startsWith("District") && !e.startsWith("Crop"),
      );
      const extra: string[] = [];

      if (lookupsReady) {
        // District validation
        if (row.district) {
          if (!districtNames.has(row.district.toLowerCase().trim())) {
            extra.push(`District "${row.district}" not found in the system`);
          }
        }

        // Crop / variety validation
        if (row.cropName && row.varietyName) {
          const key = makeCropVarietyKey(row.cropName, row.varietyName);
          console.log('key', key);
          console.log('available pairs', Array.from(cropVarietyPairs).slice(0, 10));
          if (!cropVarietyPairs.has(key)) {
            extra.push(
              `Crop "${row.cropName}" / Variety "${row.varietyName}" not found in the system`,
            );
          }
        } else if (row.crop && !row.varietyName) {
          extra.push('Crop field must be in format "CROP: Name, VARIETY: Name"');
        }
      }

      return { ...row, errors: [...baseErrors, ...extra] };
    });
  }, [parsedRows, lookupsReady, districtNames, cropVarietyPairs]);

  const validCount = validatedRows.filter((r) => r.errors.length === 0).length;
  const invalidCount = validatedRows.filter((r) => r.errors.length > 0).length;
  const allRowsValid = validatedRows.length > 0 && invalidCount === 0;

  console.log('errors', validatedRows.filter((r) => r.errors.length > 0).map((r) => ({ row: r._idx, errors: r.errors })));

  const canImport =
    !!subGrowersFile &&
    parsedRows.length > 0 &&
    parseError === null &&
    allRowsValid &&
    lookupsReady &&
    districtNames.size > 0 &&
    cropVarietyPairs.size > 0 &&
    !parsing &&
    !!amountEnclosed.trim();

  // ── Mutation ──
  const [uploadMutation] = useMutation(UPLOAD_PLANTING_RETURNS);

  const handleImport = async () => {
    if (!canImport || !subGrowersFile) return;
    setImporting(true);
    try {
      const input = {
        amount_enclosed: parseInt(amountEnclosed) || null,
        payment_receipt: receiptFile ?? null,
        sub_grower_file: subGrowersFile,
        registered_dealer: registeredDealer || "",
      };
      const res = await uploadMutation({ variables: { input } });
      const payload = (res.data as any)?.createPlantingReturnUpload;

      if (payload?.success) {
        const imported = payload.totalImported ?? validatedRows.length;
        const total = payload.totalRecords ?? validatedRows.length;
        toast("Import completed", {
          description: `Imported ${imported} of ${total} records`,
        });
        setImportResult({
          totalRecords: total,
          totalImported: imported,
          totalFailed: payload.totalFailed ?? 0,
          results: payload.results ?? [],
        });
        onImported?.();
      } else {
        toast("Import failed", {
          description: payload?.message ?? "Unknown error",
        });
      }
    } catch (e: any) {
      toast("Import failed", { description: e?.message ?? "Unknown error" });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const url = `${URL_2}/templates/sub-growers-template.xlsx?t=${Date.now()}`;
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win)
      toast("Popup blocked. Please allow popups to download the template.");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <Sheet open={open} onOpenChange={(o) => !o && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[800px] lg:max-w-[800px] overflow-y-auto flex flex-col"
      >
        <SheetHeader className="mb-5">
          <SheetTitle>Import Sub-Growers</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6">
          {/* ── Metadata fields ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount enclosed *
              </label>
              <Input
                type="number"
                value={amountEnclosed}
                onChange={(e) => setAmountEnclosed(e.target.value)}
                placeholder="Amount enclosed for application"
                min={0}
                disabled={importing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment receipt
              </label>
              <div className="flex items-center gap-2">
                <input
                  ref={receiptRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  disabled={importing}
                  onChange={(e) =>
                    setReceiptFile(e.target.files?.[0] ?? null)
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={importing}
                  onClick={() => receiptRef.current?.click()}
                >
                  <Upload size={14} className="mr-1.5" />
                  Browse
                </Button>
                <span className="text-sm text-gray-500 truncate max-w-[180px]">
                  {receiptFile?.name ?? "Select file"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered seed merchant
              </label>
              <Input
                value={registeredDealer}
                onChange={(e) => setRegisteredDealer(e.target.value)}
                placeholder="Seed merchant / dealer"
                disabled={importing}
              />
            </div>
          </div>

          {/* ── Sub-growers file picker ──────────────────────────────────── */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Sub-growers file{" "}
                <span className="text-gray-400 font-normal">
                  (.csv, .txt, .xls, .xlsx)
                </span>{" "}
                *
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                disabled={importing}
              >
                <Download size={14} className="mr-1.5" />
                Download Template
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                className="hidden"
                disabled={importing}
                onClick={(e) => {
                  // Clear selection so choosing the same file again still triggers onChange.
                  (e.currentTarget as HTMLInputElement).value = "";
                }}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setSubGrowersFile(f);
                  if (f) parseFile(f);
                  else {
                    setParsedRows([]);
                    setParseError(null);
                    setMissingHeaders([]);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={importing}
                onClick={() => fileRef.current?.click()}
              >
                <FileSpreadsheet size={14} className="mr-1.5" />
                Choose File
              </Button>
              <span className="text-sm text-gray-500">
                {subGrowersFile?.name ?? "No file selected"}
              </span>
            </div>

            <div className="mt-2 text-xs text-gray-600">
              District source: <span className="font-medium">{districtNames.size}</span>
            </div>
            <div className="text-xs text-gray-600">
              Crop/Variety source: <span className="font-medium">{cropVarietyPairs.size}</span>
            </div>
            {loadingDistricts && (
              <div className="text-xs text-gray-500 mt-1">Loading district list...</div>
            )}
            {loadingAllCrops && (
              <div className="text-xs text-gray-500">Loading crops/varieties...</div>
            )}
            {districtsError && (
              <div className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-700">
                Failed to load districts. District validation will fail until this is resolved.
              </div>
            )}
            {allCropsError && (
              <div className="mt-2 rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-700">
                Failed to load crops/varieties. Crop validation will fail until this is resolved.
              </div>
            )}

            <p className="text-xs text-gray-500 mt-2">
              Crop column must be in the format:{" "}
              <code className="bg-gray-100 px-1 rounded">
                CROP: CropName, VARIETY: VarietyName
              </code>
            </p>

            {/* Parse error banner */}
            {parseError && (
              <div className="mt-3 flex gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <XCircle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{parseError}</p>
                  {missingHeaders.length > 0 && (
                    <p className="mt-1 text-xs">
                      Missing headers:{" "}
                      <strong>{missingHeaders.join(", ")}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}

            {headers.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Detected columns: {headers.join(", ")}
              </div>
            )}
          </div>

          {/* ── Preview table ────────────────────────────────────────────── */}
          {validatedRows.length > 0 && (
            <div>
              {/* Summary bar */}
              <div className="mb-3 flex items-center gap-5 text-sm">
                <span className="font-semibold text-gray-800">
                  Preview — {validatedRows.length} row
                  {validatedRows.length !== 1 ? "s" : ""}
                </span>
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle size={14} />
                  {validCount} valid
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-red-600">
                    <XCircle size={14} />
                    {invalidCount} invalid
                  </span>
                )}
                {!lookupsReady && (
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <AlertCircle size={12} />
                    Validating against database…
                  </span>
                )}
              </div>

              <div className="overflow-x-auto rounded-lg border max-h-[440px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-50 border-b">
                    <tr>
                      {[
                        "#",
                        "",
                        "Name",
                        "District",
                        "Crop / Variety",
                        "Seed Class",
                        "Lot #",
                        "Field Name",
                        "Phone",
                        "Area (ha)",
                        "Planting Date",
                        "Subcounty",
                        "Village",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validatedRows.map((row) => {
                      const hasError = row.errors.length > 0;
                      return (
                        <tr
                          key={row._idx}
                          className={
                            hasError
                              ? "bg-red-50 hover:bg-red-100"
                              : "hover:bg-gray-50"
                          }
                        >
                          <td className="px-2 py-1.5 text-gray-400">
                            {row._idx}
                          </td>
                          <td className="px-2 py-1.5">
                            {hasError ? (
                              <div className="relative group">
                                <XCircle
                                  size={14}
                                  className="text-red-500 cursor-help"
                                />
                                {/* Tooltip */}
                                <div className="pointer-events-none absolute left-5 top-0 z-20 hidden w-60 rounded border bg-white p-2 text-xs text-red-700 shadow-md group-hover:block">
                                  {row.errors.map((e, i) => (
                                    <div key={i}>• {e}</div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <CheckCircle
                                size={14}
                                className="text-green-600"
                              />
                            )}
                          </td>
                          <td className="px-2 py-1.5 font-medium">
                            {row.name || (
                              <span className="italic text-red-400">empty</span>
                            )}
                          </td>
                          <td
                            className={`px-2 py-1.5 ${
                              row.errors.some((e) =>
                                e.toLowerCase().includes("district"),
                              )
                                ? "font-medium text-red-600"
                                : ""
                            }`}
                          >
                            {row.district || (
                              <span className="italic text-red-400">empty</span>
                            )}
                          </td>
                          <td
                            className={`px-2 py-1.5 ${
                              row.errors.some((e) =>
                                e.toLowerCase().includes("crop"),
                              )
                                ? "font-medium text-red-600"
                                : ""
                            }`}
                          >
                            <div>{row.cropName}</div>
                            {row.varietyName && (
                              <div className="text-gray-500">
                                {row.varietyName}
                              </div>
                            )}
                          </td>
                          <td className="px-2 py-1.5">{row.seed_class}</td>
                          <td className="px-2 py-1.5">{row.lot_number}</td>
                          <td className="px-2 py-1.5">{row.field_name}</td>
                          <td className="px-2 py-1.5">{row.phone_number}</td>
                          <td className="px-2 py-1.5">{row.size}</td>
                          <td className="px-2 py-1.5 whitespace-nowrap">
                            {row.planting_date}
                          </td>
                          <td className="px-2 py-1.5">{row.subcounty}</td>
                          <td className="px-2 py-1.5">{row.village}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Import result ────────────────────────────────────────────── */}
          {importResult && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-green-800">
                Import Complete
              </h4>
              <div className="flex gap-6 text-sm">
                <span>
                  Total: <strong>{importResult.totalRecords}</strong>
                </span>
                <span className="text-green-700">
                  Imported: <strong>{importResult.totalImported}</strong>
                </span>
                {importResult.totalFailed > 0 && (
                  <span className="text-red-600">
                    Failed: <strong>{importResult.totalFailed}</strong>
                  </span>
                )}
              </div>
              {importResult.results.some((r) => !r.success) && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs font-medium text-red-600">
                    View failed rows ({importResult.totalFailed})
                  </summary>
                  <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-red-600">
                    {importResult.results
                      .filter((r) => !r.success)
                      .map((r) => (
                        <li key={r.row}>
                          Row {r.row}: {r.message}
                        </li>
                      ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="mt-6 flex gap-3 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={importing}
          >
            {importResult ? "Close" : "Cancel"}
          </Button>
          {!importResult && (
            <Button
              type="button"
              className="flex-1"
              disabled={!canImport || importing}
              onClick={handleImport}
            >
              {parsing
                ? "Reading file..."
                : importing
                ? "Importing…"
                : canImport
                  ? `Import ${validatedRows.length} Record${validatedRows.length !== 1 ? "s" : ""}`
                  : !amountEnclosed.trim()
                    ? "Enter amount to continue"
                    : !subGrowersFile
                      ? "Choose a file to continue"
                      : parseError
                        ? "Fix file errors first"
                        : !lookupsReady
                          ? "Loading lookups…"
                          : "Fix row errors first"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
