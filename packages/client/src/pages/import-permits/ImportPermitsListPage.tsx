import { Fragment, useMemo, useState } from "react";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client/react";

import { Container } from "@/components/container";
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from "@/partials/toolbar";
import { useLayout } from "@/providers";
import { UserCreateDialog } from "./blocks/PermitCreateDialog";
import { ImportPermitDetailsDialog } from "./blocks/ImportPermitDetailsDialog";

import { LOAD_IMPORT_PERMITS, LOAD_IMPORT_PERMIT } from "@/gql/queries";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CREATE_IMPORT_PERMIT,
  UPDATE_IMPORT_PERMIT,
  DELETE_IMPORT_PERMIT,
} from "@/gql/mutations";
import {
  DataGrid,
  DataGridColumnHeader,
  DataGridRowSelect,
  DataGridRowSelectAll,
  KeenIcon,
  useDataGrid,
} from "@/components";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ColumnDef, Column } from "@tanstack/react-table";
import { _formatDate, formatDateTime } from "@/utils/Date";
import { useAuthContext } from "@/auth";
import { getPermissionsFromToken } from "@/utils/permissions";
import { toAbsoluteUrl } from "@/utils";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuSeparator,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { URL_2 } from "@/config/urls";

const ImportPermitsListPage = () => {
  const { currentLayout } = useLayout();
  const [createOpen, setCreateOpen] = useState(false);
  const LIST_VARS = {
    filter: { type: "import" as const },
    pagination: { page: 1, size: 200 },
  } as const;
  const {
    data: listData,
    loading: listLoading,
    error: listError,
    refetch,
  } = useQuery(LOAD_IMPORT_PERMITS, { variables: LIST_VARS });

  type Permit = {
    id: string;
    applicantCategory: string;
    stockQuantity: number;
    countryOfOrigin: string;
    supplierName: string;
    supplierAddress?: string;
    status?: string;
    statusComment?: string | null;
    inspector?: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
    } | null;
    createdAt?: string;
  };

  const permits: Permit[] = useMemo(
    () => (listData?.importPermits?.items ?? []) as Permit[],
    [listData],
  );

  const [createPermit, { loading: creating }] = useMutation(
    CREATE_IMPORT_PERMIT,
    {
      refetchQueries: [{ query: LOAD_IMPORT_PERMITS, variables: LIST_VARS }],
      awaitRefetchQueries: true,
    },
  );
  const [updatePermit, { loading: updating }] = useMutation(
    UPDATE_IMPORT_PERMIT,
    {
      refetchQueries: [{ query: LOAD_IMPORT_PERMITS, variables: LIST_VARS }],
      awaitRefetchQueries: true,
    },
  );
  const [deletePermit] = useMutation(DELETE_IMPORT_PERMIT, {
    refetchQueries: [{ query: LOAD_IMPORT_PERMITS, variables: LIST_VARS }],
    awaitRefetchQueries: true,
  });

  const [loadPermitDetail, { loading: loadingDetail }] =
    useLazyQuery(LOAD_IMPORT_PERMIT);
  const [editing, setEditing] = useState<any | null>(null);
  const [preview, setPreview] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toEnumCategory = (v: string) =>
    (
      ({
        seed_merchant: "SEED_MERCHANT",
        seed_dealer: "SEED_DEALER",
        seed_producer: "SEED_PRODUCER",
        researcher: "RESEARCHER",
      }) as any
    )[v] || "SEED_MERCHANT";
  const fromEnumCategory = (v: string) =>
    (
      ({
        SEED_MERCHANT: "seed_merchant",
        SEED_DEALER: "seed_dealer",
        SEED_PRODUCER: "seed_producer",
        RESEARCHER: "researcher",
      }) as any
    )[v] || "seed_merchant";
  const toEnumSeedCategory = (v: string) =>
    (
      ({
        commercial: "COMMERCIAL",
        research: "RESEARCH",
        own_use: "OWN_USE",
      }) as any
    )[v] || "COMMERCIAL";
  const fromEnumSeedCategory = (v: string) =>
    (
      ({
        COMMERCIAL: "commercial",
        RESEARCH: "research",
        OWN_USE: "own_use",
      }) as any
    )[v] || "commercial";
  const toEnumMeasure = (v: string) =>
    (({ Kgs: "KGS", Tubes: "TUBES", Bags: "BAGS", Suckers: "SUCKERS" }) as any)[
      v
    ] || "KGS";
  const fromEnumMeasure = (v: string) =>
    (({ KGS: "Kgs", TUBES: "Tubes", BAGS: "Bags", SUCKERS: "Suckers" }) as any)[
      v
    ] || "Kgs";
  const toEnumDoc = (label: string) =>
    label === "ISTA Certificate"
      ? "ISTA_CERTIFICATE"
      : "PHYTOSANITARY_CERTIFICATE";

  const handleSave = async (vals: Record<string, any>, id?: string) => {
    const input: any = {
      applicantCategory: toEnumCategory(vals.applicantCategory),
      stockQuantity: Number(vals.stockQuantity),
      countryOfOrigin: vals.countryOfOrigin,
      supplierName: vals.supplierName,
      supplierAddress: vals.supplierAddress,
      consignment: (vals.consignmentAccompaniedBy || []).map((d: string) =>
        toEnumDoc(d),
      ),
      items: (vals.crops || []).map((it: any) => ({
        cropId: String(it.cropId),
        varietyId: String(it.varietyId),
        category: toEnumSeedCategory(it.category),
        weight: Number(it.weight),
        measure: toEnumMeasure(it.measure),
      })),
      attachments: vals.attachments || [],
    };
    try {
      if (id) {
        const uinput: any = { ...input, replaceChildren: true };
        delete uinput.attachments; // use attachmentsAdd separately if needed
        await updatePermit({ variables: { id, input: uinput } });
        toast("Import permit updated");
      } else {
        await createPermit({ variables: { input } });
        toast("Import permit created");
      }
      setCreateOpen(false);
      setEditing(null);
    } catch (e: any) {
      toast("Failed to save permit", {
        description: e?.message || "Unknown error",
      });
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setCreateOpen(true);
  };

  const handleEdit = async (row: Permit) => {
    try {
      const res = await loadPermitDetail({ variables: { id: row.id } });
      const d = res.data?.importPermit;
      if (!d) throw new Error("Not found");
      const initialValues = {
        applicantCategory: fromEnumCategory(d.applicantCategory),
        stockQuantity: String(d.stockQuantity),
        countryOfOrigin: d.countryOfOrigin,
        supplierName: d.supplierName,
        supplierAddress: d.supplierAddress,
        consignmentAccompaniedBy: (d.consignment || []).map((c: string) =>
          c === "ISTA_CERTIFICATE"
            ? "ISTA Certificate"
            : "Phytosanitary certificate",
        ),
        attachments: [],
        crops: (d.items || []).map((it: any) => ({
          cropId: String(it.cropId),
          varietyId: String(it.varietyId),
          category: fromEnumSeedCategory(it.category),
          weight: String(it.weight),
          measure: fromEnumMeasure(it.measure),
        })),
      };
      setEditing({ id: d.id, initialValues });
      setCreateOpen(true);
    } catch (e: any) {
      toast("Failed to load permit", {
        description: e?.message || "Unknown error",
      });
    }
  };

  const handlePreview = async (row: Permit) => {
    try {
      const res = await loadPermitDetail({ variables: { id: row.id } });
      const d = res.data?.importPermit;
      if (!d) throw new Error("Not found");
      setPreview(d);
    } catch (e: any) {
      toast("Failed to load permit", {
        description: e?.message || "Unknown error",
      });
    }
  };

  const handleDelete = async (row: Permit) => {
    try {
      setDeletingId(String(row.id));
      await deletePermit({ variables: { id: row.id } });
      toast("Permit deleted");
    } catch (e: any) {
      toast("Failed to delete permit", {
        description: e?.message || "Unknown error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Fragment>
        {currentLayout?.name === "demo1-layout" && (
          <Container>
            <Toolbar>
              <ToolbarHeading>
                <ToolbarPageTitle />
                <ToolbarDescription>
                  <div className="flex items-center flex-wrap gap-3 font-medium">
                    {listLoading ? (
                      <>
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-12" />
                      </>
                    ) : (
                      <>
                        <span className="text-md text-gray-700">Permits:</span>
                        <span className="text-md text-gray-800 font-medium me-2">
                          {(listData?.importPermits?.total ?? 0) as number}
                        </span>
                        <span className="text-md text-gray-700">
                          Showing latest
                        </span>
                      </>
                    )}
                  </div>
                </ToolbarDescription>
              </ToolbarHeading>
              <ToolbarActions>
                {/* <a href="#" className="btn btn-sm btn-light">
                  Import CSV
                </a> */}
                <a
                  href="#"
                  onClick={() => {
                    handleCreate();
                  }}
                  className="btn btn-sm btn-primary"
                >
                  {"Apply For An Import Permit"}
                </a>
              </ToolbarActions>
            </Toolbar>
          </Container>
        )}

        <Container>
          {listLoading ? (
            <div className="p-6 space-y-3 bg-white rounded-lg border">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-40 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          ) : listError ? (
            <div className="p-6 text-danger bg-white rounded-lg border flex items-center justify-between">
              <span>Failed to load permits</span>
              <a className="btn btn-sm" onClick={() => refetch?.()}>
                Retry
              </a>
            </div>
          ) : (
            <PermitsDataGrid
              permits={permits}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
              onPreview={handlePreview}
            />
          )}
        </Container>
      </Fragment>
      <UserCreateDialog
        open={createOpen}
        onOpenChange={(o) => {
          if (!o) setEditing(null);
          setCreateOpen(o);
        }}
        onSave={(vals) => handleSave(vals, editing?.id)}
        saving={creating || updating || loadingDetail}
        initialValues={editing?.initialValues || null}
      />

      <ImportPermitDetailsDialog
        open={!!preview}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
        }}
        data={preview}
      />
    </>
  );
};

export default ImportPermitsListPage;

const PermitsDataGrid = ({
  permits,
  onEdit,
  onDelete,
  deletingId,
  onPreview,
}: {
  permits: any[];
  onEdit: (p: any) => void;
  onDelete: (p: any) => void;
  deletingId: string | null;
  onPreview: (p: any) => void;
}) => {
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canManageImportPermits = !!perms["can_manage_import_permits"];
  const canEditImportPermits = !!perms["can_edit_import_permits"];
  const canDeleteImportPermits = !!perms["can_delete_import_permits"];
  const [loadDetail] = useLazyQuery(LOAD_IMPORT_PERMIT);
  const ColumnInputFilter = <TData, TValue>({
    column,
  }: {
    column: Column<TData, TValue>;
  }) => (
    <Input
      placeholder="Filter..."
      value={(column.getFilterValue() as string) ?? ""}
      onChange={(event) => column.setFilterValue(event.target.value)}
      className="h-9 w-full max-w-40"
    />
  );

  const handlePrint = (d: any) => {
    try {
      const win = window.open("", "_blank");
      if (!win) {
        console.error("Popup blocked. Please allow popups for this site.");
        return;
      }

      // Data validation and fallbacks
      const number = d.permitNumber || "—";
      const validFrom = d.validFrom ? _formatDate(d.validFrom) : "—";
      const validUntil = d.validUntil ? _formatDate(d.validUntil) : "—";
      const applicant = d.createdBy?.name || d.createdBy?.username || "—";
      const applicantAddress = d.applicantAddress || "—";
      const inspectorName = d.inspector?.name || "—";
      const today = _formatDate(new Date().toISOString());
      const supplierName = d.supplierName || "—";
      const supplierAddress = d.supplierAddress || "—";
      const countryOfOrigin = d.countryOfOrigin || "—";
      const additionalConditions = d.additionalConditions || "None";

      const consignmentList = (d?.consignment || []).map((c: any) =>
        c === "ISTA_CERTIFICATE"
          ? "ISTA Certificate"
          : "Phytosanitary certificate",
      );

      // Safely handle items data
      const itemsRows = (d.items || [])
        .map(
          (it, index: number) => `
          <tr>
            <td style="padding:8px;border:1px solid #000;">${it.crop?.name || it.crop?.id || it.cropId || "—"}</td>
            <td style="padding:8px;border:1px solid #000;">${it.variety?.name || it.variety?.id || it.varietyId || "—"}</td>
            <td style="padding:8px;border:1px solid #000;">${it.category || "—"}</td>
            <td style="padding:8px;border:1px solid #000;">${it.weight || "—"} ${it.measure || ""}</td>
          </tr>`,
        )
        .join("");

      const consignmentItems = (consignmentList || [])
        .map((item) => `<li>${item}</li>`)
        .join("");

      const logo = `${URL_2}/imgs/coat.png`;

      const html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Seed Import Permit - ${number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            font-size: 80%;
            margin: 0;
            padding: 20px;
            color: #000;
          }
          .page {
            max-width: 900px;
            margin: 0 auto;
            padding: 32px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          header {
            text-align: center;
            margin-bottom: 20px;
            position: relative;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 20px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .permit-number {
            position: absolute;
            top: 10px;
            left: 10px;
            font-weight: bold;
          }
          .r-number {
            position: absolute;
            top: 10px;
            right: 10px;
            font-style: italic;
          }
          .signature-container {
            text-align: right;
            margin-top: 40px;
            margin-bottom: 20px;
          }
          .signature-text {
            text-align: left;
            margin-left: 300px;
            padding-top: 20px;
            width: 300px;
          }
          h2 {
            margin: 10px 0;
            color: #000;
          }
          h3 {
            margin: 20px 0 10px 0;
            color: #000;
          }
          p {
            margin: 8px 0;
            line-height: 1.4;
          }
          ol, ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          li {
            margin: 5px 0;
            line-height: 1.4;
          }
          .conditions {
            margin-top: 20px;
          }
          .cc-section {
            margin-top: 30px;
            font-style: italic;
          }
          @media print {
            body { padding: 0; }
            .page { 
              border: none; 
              box-shadow: none;
              padding: 20px;
            }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="page">
          <header>
            <img src="${logo}" alt="logo" style="width: 100px; height: auto" onerror="this.style.display='none'" />
            <p><strong>THE REPUBLIC OF UGANDA</strong></p>
            <p><strong>Ministry of Agriculture, Animal Industry and Fisheries</strong></p>
            <p>P.O. Box 102, ENTEBBE</p>
            <h2>IMPORT PERMIT</h2>
            <p class="permit-number"><strong>No.</strong> ${number}</p>
            <p class="r-number">[R.20(1)(c)]</p>
          </header>
  
          <h3>The Seeds and Plant Act, 2006</h3>
          <p><strong>Permit No:</strong> ${number}</p>
          <p><strong>Valid from:</strong> ${validFrom}</p>
          <p><strong>Expiry date:</strong> ${validUntil}</p>
          <p><strong>Permission is hereby granted to:</strong> ${applicant}</p>
          <p><strong>of:</strong> ${applicantAddress}</p>
          <p><strong>to import from:</strong> ${supplierName}, ${supplierAddress} (${countryOfOrigin})</p>
          <p><strong>the following seeds:</strong></p>
  
          <table>
            <thead>
              <tr>
                <th>Species</th>
                <th>Variety</th>
                <th>Category</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows || '<tr><td colspan="4" style="text-align:center;">No items found</td></tr>'}
            </tbody>
          </table>
  
          <div class="conditions">
            <p><strong>Subject to the following conditions:</strong></p>
            <ol>
              <li>
                The consignment of seed shall be accompanied by:
                <ul>
                  ${consignmentItems || "<li>No specific requirements</li>"}
                </ul>
              </li>
              <li>
                The consignment shall be subjected to Ugandan plant quarantine
                regulations and upon arrival in your stores shall be inspected by
                plant/seed inspectors.
              </li>
              <li>
                The seeds shall not be distributed prior to the release of the result of
                the tests carried on samples unless with express permission of the head
                of NSCS.
              </li>
              <li>
                Payment of sampling and testing fees as stipulated in the fifth schedule
                to seeds regulations shall be honored.
              </li>
              <li>
                Fulfillment of commerce/customs requirements and adherence to
                regulations pertaining to importation of seed.
              </li>
              <li>
                Additional Conditions: <span>${additionalConditions}</span>
              </li>
            </ol>
          </div>
  
         <div class="signature-container">
          <div class="signature-text">
            <p>Signature:___________________________</p>
            <p>Permanent Secretary</p>
            <p>Ministry of Agriculture, Animal Industry and Fisheries</p>
            <p>Date: <span id="datePlaceholder">{{date}}</span></p>
          </div>
        </div>
  
          <div class="cc-section">
            <p>cc <strong>The Head</strong></p>
            <p>National Seed Certification Services</p>
            <p>P.O.Box 7065</p>
            <p>KAMPALA</p>
          </div>
  
          <div class="no-print" style="text-align:center;margin-top:30px;padding-top:20px;border-top:1px solid #e2e8f0;">
            <button onclick="window.print()" style="padding:10px 20px;background:#3b82f6;color:white;border:none;border-radius:5px;cursor:pointer;margin:5px;">
              Print Certificate
            </button>
            <button onclick="window.close()" style="padding:10px 20px;background:#6b7280;color:white;border:none;border-radius:5px;cursor:pointer;margin:5px;">
              Close Window
            </button>
          </div>
        </div>
        
        <script>
          window.addEventListener('load', () => {
            // Auto-print after short delay
            setTimeout(() => {
              window.print();
            }, 500);
          });
          
          window.addEventListener('afterprint', () => {
            console.log('Print completed or cancelled');
          });
        </script>
      </body>
      </html>`;

      win.document.open();
      win.document.write(html);
      win.document.close();
    } catch (error) {
      console.error("Error generating print document:", error);
      alert("Error generating print document. Please try again.");
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [
      {
        id: "select",
        header: () => <DataGridRowSelectAll />,
        cell: ({ row }) => <DataGridRowSelect row={row} />,
        enableSorting: false,
        enableHiding: false,
        meta: { headerClassName: "w-0" },
      },
      {
        accessorKey: "createdOn",
        id: "createdOn",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Created On"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800 font-medium">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
        meta: { headerClassName: "min-w-[180px]" },
      },
    ];

    if (canManageImportPermits) {
      cols.push({
        accessorKey: "applicant_name",
        id: "applicant_name",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Applicant Name"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-4">
              <img
                src={`${URL_2}/imgs/${row.original?.createdBy?.image}`}
                className="rounded-full size-9 shrink-0"
                alt={`${row.original?.createdBy?.userName}`}
              />
              <div className="flex flex-col gap-0.5">
                <Link
                  to="#"
                  className="text-sm font-medium text-gray-900 hover:text-primary-active mb-px"
                >
                  {row.original?.createdBy?.name}
                </Link>
              </div>
            </div>
          );
        },
        meta: { headerClassName: "min-w-[280px]" },
      });
    }

    cols.push(
      {
        accessorFn: (row: any) => row?.inspector?.name || "",
        id: "inspector",
        header: ({ column }) => (
          <DataGridColumnHeader
            title="Inspector"
            filter={<ColumnInputFilter column={column} />}
            column={column}
          />
        ),
        cell: ({ row }) => {
          const ins = row.original?.inspector || ({} as any);
          const img = ins?.image
            ? `${URL_2}/imgs/${ins.image}`
            : toAbsoluteUrl("/media/avatars/blank.png");
          return (
            <div className="flex items-center gap-2.5">
              {ins?.name && (
                <img
                  src={img}
                  className="rounded-full size-8 shrink-0 object-cover"
                  alt={ins?.name || "Inspector"}
                />
              )}
              <div className="leading-tight">
                <div className="text-sm font-medium text-gray-800">
                  {ins?.name || "—"}
                </div>
                <div className="text-[11px] text-gray-600">
                  {ins?.email || ""}
                </div>
              </div>
            </div>
          );
        },
        meta: { headerClassName: "min-w-[220px]" },
      },
      {
        accessorKey: "status",
        id: "status",
        header: ({ column }) => (
          <DataGridColumnHeader title="Status" column={column} />
        ),
        enableSorting: true,
        cell: ({ row }) => {
          const s = String(row.original.status || "pending");
          const color =
            s === "approved" || s === "recommended"
              ? "success"
              : s === "rejected" || s === "halted"
                ? "danger"
                : s === "assigned_inspector"
                  ? "orange"
                  : "primary";
          return (
            <span
              className={`badge badge-${color} shrink-0 badge-outline rounded-[30px]`}
            >
              <span
                className={`size-1.5 rounded-full bg-${color} me-1.5`}
              ></span>
              {s}
            </span>
          );
        },
        meta: { headerClassName: "min-w-[140px]" },
      },
      {
        accessorKey: "applicantCategory",
        id: "category",
        header: ({ column }) => (
          <DataGridColumnHeader title="Applicant Category" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">
            {row.original.applicantCategory}
          </span>
        ),
        meta: { className: "min-w-[180px]" },
      },
      {
        accessorKey: "stockQuantity",
        id: "stock",
        header: ({ column }) => (
          <DataGridColumnHeader title="Stock Quantity" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row.original.stockQuantity}</span>
        ),
        meta: { className: "min-w-[140px]" },
      },
      {
        accessorKey: "countryOfOrigin",
        id: "country",
        header: ({ column }) => (
          <DataGridColumnHeader title="Country" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-gray-800">{row.original.countryOfOrigin}</span>
        ),
        meta: { headerClassName: "min-w-[140px]" },
      },

      {
        id: "edit",
        header: () => "",
        enableSorting: false,
        cell: (info) => (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="btn btn-sm btn-icon btn-clear btn-light">
                  <KeenIcon icon="dots-vertical" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[190px]">
                <DropdownMenuLabel className="font-medium">
                  Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {canEditImportPermits &&
                  info?.row?.original?.status === "pending" && (
                    <DropdownMenuItem onClick={() => onEdit(info.row.original)}>
                      <KeenIcon icon="note" /> Edit
                    </DropdownMenuItem>
                  )}

                {canDeleteImportPermits &&
                  info.row.original.status === "pending" && (
                    <DropdownMenuItem
                      onClick={() => onDelete(info.row.original)}
                      disabled={
                        String(deletingId) === String(info.row.original.id)
                      }
                    >
                      <KeenIcon icon="trash" /> Delete
                    </DropdownMenuItem>
                  )}

                <DropdownMenuItem onClick={() => onPreview(info.row.original)}>
                  <KeenIcon icon="eye" /> Details
                </DropdownMenuItem>
                {String(info.row.original?.status || "") === "approved" && (
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        const res = await loadDetail({
                          variables: { id: String(info.row.original.id) },
                        });
                        const d = res.data?.importPermit;
                        if (!d) throw new Error("Permit not found");
                        handlePrint(d);
                      } catch (e: any) {
                        alert(e?.message || "Failed to generate certificate");
                      }
                    }}
                  >
                    <KeenIcon icon="printer" /> Print Certificate
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ),
        meta: { headerClassName: "w-[60px]" },
      },
    );

    return cols;
  }, [canManageImportPermits, deletingId]);

  //   const columns = useMemo<ColumnDef<any>[]>(
  //     () => [

  //       {
  //         id: 'actions',
  //         header: () => '',
  //         enableSorting: false,
  //         cell: ({ row }) => (
  //           <div className="flex justify-end">
  //             <div className="inline-flex gap-2">
  //               <Button variant="outline" size="sm" onClick={() => onEdit(row.original)}>
  //                 Edit
  //               </Button>
  //               <Button
  //                 variant="destructive"
  //                 size="sm"
  //                 onClick={() => onDelete(row.original)}
  //                 disabled={String(deletingId) === String(row.original.id)}
  //               >
  //                 {String(deletingId) === String(row.original.id) ? 'Deleting…' : 'Delete'}
  //               </Button>
  //             </div>
  //           </div>
  //         ),
  //         meta: { headerClassName: 'w-[220px]' }
  //       }
  //     ],
  //     [deletingId]
  //   );

  const HeaderToolbar = () => {
    const { table } = useDataGrid();
    const [searchInput, setSearchInput] = useState("");
    return (
      <div className="card-header flex-wrap gap-2 border-b-0 px-5">
        <h3 className="card-title font-medium text-sm">
          Showing {permits.length} permits
        </h3>
        <div className="flex flex-wrap gap-2 lg:gap-5">
          <div className="flex">
            <label className="input input-sm">
              <KeenIcon icon="magnifier" />
              <input
                type="text"
                placeholder="Search permits"
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  table.getColumn("supplierName")?.setFilterValue(val);
                }}
              />
            </label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DataGrid<any>
      columns={columns}
      data={permits}
      rowSelection={true}
      layout={{ card: true, cellSpacing: "xs", cellBorder: true }}
      toolbar={<HeaderToolbar />}
      messages={{ loading: "Loading...", empty: "No permits found" }}
    />
  );
};
