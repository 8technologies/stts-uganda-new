import { useState, useEffect } from "react";
// import { toast } from "@/components/ui/use-toast"; // optional - replace with your toast util or remove
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useMutation, useQuery } from "@apollo/client/react";
import { APPROVE_SEED_LABEL, PRINT_SEED_LABEL } from "@/gql/mutations";
import {
  LOAD_SEED_LABEL_BY_ID,
  LOAD_SEED_LABELS,
  LOAD_SEED_LABEL_PACKAGES,
} from "@/gql/queries";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { _formatDate } from "@/utils/Date";
import { URL_2 } from "@/config/urls";
import {
  CheckCircle,
  Clock,
  Printer,
  User,
  Hash,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useAuthContext } from "@/auth";
import { getPermissionsFromToken } from "@/utils/permissions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: any;
}

const parsePackageSize = (value: unknown): number => {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === "string") {
    const match = value.match(/[\d.]+/);
    if (match) {
      const parsed = parseFloat(match[0]);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
  }
  return 0;
};

const formatExpiryDate = (date: Date): string => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()] || "";
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const getSeasonAndExpiry = (printDate: Date): { season: string; expiry: string } => {
  const year = printDate.getFullYear();
  const month = printDate.getMonth();
  const isSeasonA = month < 6;
  const season = `${year}${isSeasonA ? "A" : "B"}`;
  const expiryDate = isSeasonA
    ? new Date(year, 11, 31)
    : new Date(year + 1, 5, 30);
  return { season, expiry: formatExpiryDate(expiryDate) };
};

const SeedLabelDetailSheet: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
}) => {
  const d = data || {};

  console.log("Printing Seed Label:", d);
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canAssignInspector = !!perms["qa_can_assign_inspector"];
  const canPrintLabels = !!perms["can_print_seed_labels"];

  //   const [approveSeedLabel] = useMutation(APPROVE_SEED_LABEL);
  const [approveSeedLabel, { loading: approving }] = useMutation(
    APPROVE_SEED_LABEL,
    {
      refetchQueries: [{ query: LOAD_SEED_LABELS }],
      awaitRefetchQueries: true,
    },
  );
  const [printSeedLabel, { loading: printing }] = useMutation(PRINT_SEED_LABEL, {
    refetchQueries: [{ query: LOAD_SEED_LABELS }],
    awaitRefetchQueries: true
  });
  const [status, setStatus] = useState("pending");
  const { data: packagesData } = useQuery(LOAD_SEED_LABEL_PACKAGES, {
    variables: { activeOnly: false },
    skip: !open,
  });
  const packages = (packagesData?.seedLabelPackages || []) as any[];

  console.log("Seed Label Details data:", d);

  useEffect(() => {
    if (d?.status) {
      setStatus(d.status);
    }
  }, [d]);

  const handleApprove = async () => {
    try {
      await approveSeedLabel({
        variables: { approveSeedLabelRequestId: d.id },
      });
      setStatus("approved");
    } catch (error) {
      console.error("Error approving label:", error);
    }
  };

  const [printedOnce, setPrintedOnce] = useState<boolean>(() => {
    // initialize from server data if available (adapt field to your API)
    if (!data) return false;
    return Boolean((data as any).printed || (data as any).printed_count > 0);
  });

  const handlePrint = async (formDetails: any) => {
    console.log("nnnnnnnnnnn:", formDetails.id);
    if (printedOnce) {
      // already printed once - block further printing
      alert("This label has already been printed once and cannot be printed again.");
      return;
    }
    
    try {
      // call server mutation to record a print attempt (server should enforce one-time print)
      const res = await printSeedLabel({ variables: { printSeedLabelRequestId: formDetails.id } });
      // read mutation payload robustly (first field)
      const payload = res?.data && Object.values(res.data)[0];
      const ok = payload?.success ?? true; // default to true if your API returns raw data
      if (!ok) {
        const msg = payload?.message || "Failed to record printing.";
        alert(msg);
        return;
      }

      // mark locally to prevent double printing in UI; server should also enforce
      setPrintedOnce(true);
      // optional toast
      // try { toast?.success({ title: "Print recorded", description: payload?.message || "Proceeding to print…" }); } catch {}
      try { toast?.success( "Proceeding to print…" ); } catch {}

      const verifyUrl = `${URL_2}/verify/seed-label/${String(formDetails?.id ?? '')}`;
  
      const crop = formDetails?.Crop?.name || '';
      const variety = formDetails?.CropVariety?.name || '';
      const lot_number = formDetails?.SeedLab?.lot_number || '';
      const cert_date = _formatDate(formDetails?.created_at) || "";
    const applicantName = formDetails?.createdBy?.name || "";
    const address =
      formDetails?.createdBy?.district ||
      formDetails?.createdBy?.premises_location ||
      "";
    const { season, expiry } = getSeasonAndExpiry(new Date());
    const germination =
      formDetails?.SeedLab?.lab_test_report?.germination?.capacity || "";
    const purity =
      formDetails?.SeedLab?.lab_test_report?.purity?.pure_seed || "";
    const packageMatch =
      packages.find((pkg) => pkg.name === formDetails?.seed_label_package) ||
      packages.find(
        (pkg) =>
          `${pkg.name} - ${pkg.packageSizeKg}kg @ ${pkg.priceUgx} UGX` ===
          formDetails?.seed_label_package,
      );
    const packageSize =
      packageMatch?.packageSizeKg ||
      parsePackageSize(formDetails?.seed_label_package);
    const weight = packageSize ? `${packageSize} kg` : formDetails?.seed_label_package || "";
    const seedClass = formDetails?.SeedLab?.seed_class || "CERTIFIED SEED";
    const labelNumber = String(formDetails?.id ?? "").padStart(6, "0");

    const labelCard = (index: number) => `
      <section class="tag">
        <div class="dotmatrix">
          <div class="header">${seedClass}</div>
<<<<<<< Updated upstream
=======
          <div class="tag-number">${String(index + 1).padStart(4, "0")}</div>
>>>>>>> Stashed changes
          <div class="main-grid">
            <div class="left-col">
              <div class="row"><div class="label">CROP:</div><div class="value">${crop}</div></div>
              <div class="row"><div class="label">VARIETY:</div><div class="value">${variety}</div></div>
              <div class="row"><div class="label">LOT No.:</div><div class="value">${lot_number}</div></div>
              <div class="row"><div class="label">INSPECTION No.:</div><div class="value">${String(index + 1).padStart(4, "0")}</div></div>
              <div class="row"><div class="label">CERT DATE:</div><div class="value">${cert_date}</div></div>
              <div class="row"><div class="label">COMPANY:</div><div class="value">${applicantName}</div></div>
              <div class="row"><div class="label">PHYSICAL ADDRESS:</div><div class="value">${address}</div></div>
            </div>
            <div class="right-col">
              <div class="right-item"><span>SEASON:</span><span>${season}</span></div>
              <div class="right-item"><span>EXPIRY:</span><span>${expiry}</span></div>
              <div class="right-item"><span>GERM%:</span><span>${germination}</span></div>
              <div class="right-item"><span>PURITY%:</span><span>${purity}</span></div>
              <div class="right-item"><span>WEIGHT:</span><span>${weight}</span></div>
            </div>
            <div class="qr-col">
              <div class="qr-wrap" data-qr-payload="${verifyUrl}"></div>
              <small>Scan to verify</small>
            </div>
          </div>
          <div class="bottom">TREATED SEED, NOT FOR HUMAN CONSUMPTION</div>
        </div>
      </section>`;

    const quantity = Number(formDetails?.quantity) || 0;
    const labelsPerPackage = packageMatch?.labelsPerPackage || 1;
    const labelCount =
      packageSize > 0
        ? Math.floor(quantity / packageSize) * labelsPerPackage
        : 0;

    const labelMarkup = Array.from({ length: Math.max(1, labelCount) })
      .map((_, idx) => labelCard(idx))
      .join("");

    const formHTML = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Certified Seed Tags</title>
        <style>
          body {
            margin: 0;
            padding: 12px;
            background: #e0e7ff;
            font-family: 'Courier New', Courier, monospace;
          }

          .sheet {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

<<<<<<< Updated upstream
          .tag {
            width: 720px;
            height: 320px;
            background: #f5f0e1;
            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f5f0e1"/><path d="M0,0 Q50,20 100,0 L100,100 L0,100 Z" fill="%23e8e0d5" opacity="0.3"/></svg>');
            background-size: 100px 100px;
            padding: 16px 28px;
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
            position: relative;
            border-radius: 8px;
            page-break-inside: avoid;
          }
=======
      .tag {
        width: 720px;
        height: 320px;
        background: #f5f0e1;
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f5f0e1"/><path d="M0,0 Q50,20 100,0 L100,100 L0,100 Z" fill="%23e8e0d5" opacity="0.3"/></svg>');
        background-size: 100px 100px;
        padding: 16px 28px 52px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
        position: relative;
        border-radius: 8px;
        page-break-inside: avoid;
      }
>>>>>>> Stashed changes

          @font-face {
            font-family: "DotMatrix";
            src: url("https://cdn.jsdelivr.net/gh/danhongtang/dot-matrix-font@master/OCR-A.ttf");
          }

          .dotmatrix {
            font-family: "DotMatrix", "Courier New", Courier, monospace;
            letter-spacing: 1.5px;
            line-height: 1.35;
            font-weight: bold;
          }

          .header {
            font-size: 32px;
            text-align: center;
            letter-spacing: 4px;
            margin-bottom: 8px;
          }

          .tag-number {
            position: absolute;
            top: 28px;
            right: 80px;
            font-size: 18px;
          }

<<<<<<< Updated upstream
          .main-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 180px 110px;
            align-items: start;
            margin-top: 12px;
            column-gap: 12px;
          }
=======
      .main-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 180px 110px;
        align-items: start;
        margin-top: 12px;
        column-gap: 12px;
        row-gap: 4px;
      }
>>>>>>> Stashed changes

          .left-col {
            font-size: 18px;
          }

<<<<<<< Updated upstream
          .row {
            display: flex;
            margin: 6px 0;
          }

          .label {
            width: 200px;
          }

          .value {
            font-weight: normal;
          }

          .right-col {
            font-size: 18px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: 2px;
          }

          .right-item span:first-child {
            font-weight: bold;
          }

          .right-item span:nth-child(2) {
            font-weight: normal;
          }
=======
      .row {
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
        column-gap: 10px;
        margin: 4px 0;
      }

      .label {
        white-space: nowrap;
      }

      .value {
        font-weight: normal;
          white-space: normal;
        overflow-wrap: anywhere;
      }

      .right-col {
        font-size: 18px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 2px;
      }

      .right-item {
        display: grid;
        grid-template-columns: 92px minmax(0, 1fr);
        column-gap: 6px;
        align-items: start;
      }

      .right-item span:first-child {
        font-weight: bold;
        white-space: nowrap;
      }

      .right-item span:nth-child(2) {
        font-weight: normal;
       white-space: normal;
        overflow-wrap: anywhere;
      }
>>>>>>> Stashed changes

          .qr-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            justify-content: flex-start;
            text-align: center;
            padding-top: 6px;
          }

          .qr-wrap {
            width: 85px;
            height: 85px;
            overflow: hidden;
          }

          .qr-col small {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }

<<<<<<< Updated upstream
          .bottom {
            position: absolute;
            bottom: 18px;
            width: 100%;
            left: 0;
            text-align: center;
            font-size: 20px;
            letter-spacing: 2px;
            transform: translateY(6px);
          }
=======
      .bottom {
        position: absolute;
        bottom: 14px;
        width: 100%;
        left: 0;
        text-align: center;
        font-size: 16px;
        letter-spacing: 2px;
        transform: translateY(6px);
      }
>>>>>>> Stashed changes

          @media print {
            body {
              background: #fff;
              padding: 6px;
            }

            @page {
              margin: 8mm;
            }

            .tag {
              box-shadow: none;
            }
          }
        </style>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        <script>
          window.addEventListener('load', function () {
            const nodes = document.querySelectorAll('[data-qr-payload]');
            nodes.forEach(function (node) {
              var payload = node.getAttribute('data-qr-payload');
              if (!payload || !window.QRCode) return;
              node.innerHTML = '';
              new window.QRCode(node, {
                text: payload,
                width: 85,
                height: 85,
                margin: 0,
              });
            });

            setTimeout(function () {
              window.print();
            }, 400);
          });
        </script>
      </head>
      <body>
        <div class="sheet">
          ${labelMarkup}
        </div>
      </body>
    </html>`;

    const popup = window.open(
      "",
      "_blank",
      "width=1200,height=1000,scrollbars=yes,resizable=yes",
    );
    if (popup) {
      popup.document.open();
      popup.document.write(formHTML);
      popup.document.close();
    }

    } catch (err) {
    console.error("Print failed", err);
    alert("Failed to record print. Try again or contact admin.");
    }
  }; 
 

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "approved":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          bg: "bg-emerald-100",
          text: "text-emerald-800",
          label: "Approved",
        };
      case "pending":
        return {
          icon: <Clock className="w-4 h-4" />,
          bg: "bg-amber-100",
          text: "text-amber-800",
          label: "Pending",
        };
      case "printed":
        return {
          icon: <Printer className="w-4 h-4" />,
          bg: "bg-blue-100",
          text: "text-blue-800",
          label: "Printed",
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: status,
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[700px] h-full overflow-y-auto p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-emerald-200 bg-primary">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-white text-xl font-semibold">
                Seed Label Details
              </SheetTitle>
              <p className="text-emerald-100 text-sm mt-1">
                Review and manage seed certification label
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Label Information
            </h3>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.text} font-medium text-sm`}
            >
              {statusConfig.icon}
              {statusConfig.label}
            </div>
          </div>

          {/* Main Information Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="p-6 space-y-5">
              {/* Label Number */}
              {/* <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Hash className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-500 mb-1">Label Number</div>
                  <div className="text-base font-semibold text-gray-900 break-all">
                    {d?.id || "—"}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100"></div> */}

              {/* Applicant */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    Applicant
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    {d?.createdBy?.username || "—"}
                  </div>
                  {d?.createdBy?.name && (
                    <div className="text-sm text-gray-600 mt-0.5">
                      {d.createdBy.name}
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Information */}
              {(d?.Crop?.name || d?.CropVariety?.name || d?.quantity) && (
                <>
                  <div className="border-t border-gray-100"></div>

                  <div className="grid grid-cols-2 gap-4">
                    {d?.Crop?.name && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Crop
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {d.Crop.name}
                        </div>
                      </div>
                    )}
                    {d?.CropVariety?.name && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Variety
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {d.CropVariety.name}
                        </div>
                      </div>
                    )}
                    {d?.quantity && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Quantity
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {d.quantity} Kgs
                        </div>
                      </div>
                    )}
                    {d?.seed_label_package && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Package
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {d.seed_label_package}
                        </div>
                      </div>
                    )}
                    {d?.available_stock && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Available stock
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {d.available_stock} Kgs
                        </div>
                      </div>
                    )}
                    {d?.receipt_id && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Receipt
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {d.receipt_id ? (
                            <a
                              href={`${URL_2}/receipts/${d.receipt_id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary-600 hover:underline"
                            >
                              View receipt
                            </a>
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>
                    )}

                    {d?.created_at && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Created
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {_formatDate(d.created_at)}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {status === "pending" && canAssignInspector && (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-medium shadow-sm transition-all duration-200"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {approving ? "Approving..." : "Approve Label"}
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={approving}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11 font-medium shadow-sm transition-all duration-200"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {approving ? "Rejecting..." : "Reject Label"}
                </Button>
              </>
            )}

            {canPrintLabels && status === "approved" && (
              <Button
              onClick={() => handlePrint(d)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 font-medium shadow-sm transition-all duration-200"
              disabled={!canPrintLabels || printing || printedOnce}
              title={!canPrintLabels ? "You don't have permission to print" : printedOnce ? "Already printed" : undefined}
            >
               <Printer className="w-4 h-4 mr-2" />
               Print Label
             </Button>
            )}
            
            {/* )} */}
          </div>

          {/* Info Notice */}
          {status === "pending" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <div className="font-medium mb-1">Approval Required</div>
                <div className="text-amber-700">
                  This label is pending approval. Review the information
                  carefully before approving.
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SeedLabelDetailSheet;
