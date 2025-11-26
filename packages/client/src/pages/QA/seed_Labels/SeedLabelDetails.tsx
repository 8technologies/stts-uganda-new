import { useState, useEffect } from "react";
// import { toast } from "@/components/ui/use-toast"; // optional - replace with your toast util or remove
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useMutation, useQuery } from "@apollo/client/react";
import { APPROVE_SEED_LABEL, PRINT_SEED_LABEL } from "@/gql/mutations";
import { LOAD_SEED_LABEL_BY_ID, LOAD_SEED_LABELS } from "@/gql/queries";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { _formatDate } from "@/utils/Date";
import { URL_2 } from "@/config/urls";
import { CheckCircle, Clock, Printer, User, Hash, Calendar, AlertCircle } from "lucide-react";
import { useAuthContext } from "@/auth";
import { getPermissionsFromToken } from "@/utils/permissions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: any;
}

const SeedLabelDetailSheet: React.FC<Props> = ({ open, onOpenChange, data }) => {
  const d = data || {};
  
    console.log("Printing Seed Label:", d);
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canAssignInspector = !!perms['qa_can_assign_inspector'];
  const canPrintLabels = !!perms['can_print_seed_labels'];
  

//   const [approveSeedLabel] = useMutation(APPROVE_SEED_LABEL);
  const [approveSeedLabel, { loading: approving }] = useMutation(APPROVE_SEED_LABEL, {
      refetchQueries: [{ query: LOAD_SEED_LABELS }],
      awaitRefetchQueries: true
    });
  // track printing state and whether already printed once
  const [printSeedLabel, { loading: printing }] = useMutation(PRINT_SEED_LABEL, {
      refetchQueries: [{ query: LOAD_SEED_LABELS }],
      awaitRefetchQueries: true
    });
  const [printedOnce, setPrintedOnce] = useState<boolean>(() => {
    // initialize from server data if available (adapt field to your API)
    if (!data) return false;
    return Boolean((data as any).printed || (data as any).printed_count > 0);
  });

  const [status, setStatus] = useState("pending");

  console.log("Seed Label Details data:", d);

  useEffect(() => {
    if (d?.status) {
      setStatus(d.status);
    }
  }, [d]);

  const handleApprove = async () => {
    try {
      await approveSeedLabel({ variables: { approveSeedLabelRequestId: d.id } });
      setStatus("approved");
    } catch (error) {
      console.error("Error approving label:", error);
    }
  };

  const handlePrint1 = async (formDetails: any) => {
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

      const verifyUrl = `${URL_2}/certificates/sr4/${String(formDetails?.id ?? '')}`;
  
    const crop = formDetails?.Crop?.name || '';
    const variety = formDetails?.CropVariety?.name || '';
    const lot_number = formDetails?.SeedLab?.lot_number || '';
    const cert_date = _formatDate(formDetails?.created_at) || '';
    const applicantName = formDetails?.createdBy?.name || '';
    const address = formDetails?.createdBy?.district || formDetails?.createdBy?.premises_location ||'';
    const season = formDetails?.Crop?.name || '';
    const expiry = formDetails?.Crop?.name || '';
    const germination = formDetails?.SeedLab?.lab_test_report?.germination.capacity || '';
    const purity = formDetails?.SeedLab?.lab_test_report?.purity.pure_seed || '';
    const weight = formDetails?.seed_label_package|| '';
    const seedClass = formDetails?.createdBy?.name || '';

    const formHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SEED LABEL</title>
    <style>
      :root {
        --text: #0f172a;
        --muted: #475569;
        --border: #e2e8f0;
        --brand: #14532d;
        --accent: #16a34a;
        --bg: #ffffff;
      }
      * {
        box-sizing: border-box;
      }
      html,
      body {
        margin: 0;
        padding: 0;
        height: 100%;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;
        color: var(--text);
        background: var(--bg);
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }
      .page {
        width: 900px;
        margin: 24px auto;
        padding: 32px;
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
        background: #fff;
      }
      .title {
        margin: 0 0 16px;
        font-size: 28px;
        text-align: center;
        letter-spacing: 0.4px;
      }
      .details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 24px;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 16px;
      }
      .field {
        display: flex;
        gap: 8px;
      }
      .label {
        color: var(--muted);
        width: 48%;
        font-size: 13px;
      }
      .value {
        font-weight: 600;
        font-size: 14px;
      }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px dashed var(--border);
      }
      .sign {
        display: flex;
        flex-direction: column;
        gap: 6px;
        max-width: 60%;
      }
      .sign .line {
        width: 260px;
        height: 1px;
        background: var(--border);
      }
      .qr {
        text-align: right;
      }
      .qr small {
        display: block;
        color: var(--muted);
        margin-top: 6px;
      }

      @media print {
        @page {
          size: auto;
          margin: 5mm;
        }

        body {
          background: #fff;
          margin: 0;
          padding: 0;
        }

        .page {
          box-shadow: none;
          border: none;
          margin: 0;
          padding: 8mm;
          width: 100%;
          max-width: none;
          page-break-after: avoid;
        }

        .footer {
          margin-top: 12px;
          padding-top: 8px;
        }

        html, body {
          height: auto;
        }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <h2 class="title">${seedClass}</h2>

      <div class="details">
        <div class="field"><div class="label">CROP</div><div class="value">${crop}</div></div>
        <div class="field"><div class="label">VARIETY</div><div class="value">${variety}</div></div>
        <div class="field"><div class="label">LOT No</div><div class="value">${lot_number}</div></div>
        <div class="field"><div class="label">CERT DATE</div><div class="value">${cert_date}</div></div>
        <div class="field"><div class="label">COMPANY</div><div class="value">${applicantName}</div></div>
        <div class="field"><div class="label">PHYSICAL ADDRESS</div><div class="value">${address}</div></div>
        <div class="field"><div class="label">SEASON</div><div class="value">${season}</div></div>
        <div class="field"><div class="label">EXPIRY</div><div class="value">${expiry}</div></div>
        <div class="field"><div class="label">GERM %</div><div class="value">${germination}</div></div>
        <div class="field"><div class="label">PURITY</div><div class="value">${purity}</div></div>
        <div class="field"><div class="label">WEIGHT</div><div class="value">${weight} </div></div>
      </div>

      <div class="footer">
        <div class="qr">
          <div id="qrcode"></div>
          <small>Scan to verify: ${verifyUrl}</small>
        </div>
      </div>
    </div>

    <script>
      (function() {
        var s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        s.onload = function() {
          try {
            var el = document.getElementById('qrcode');
            if (el && window.QRCode) {
              new window.QRCode(el, { text: '${verifyUrl}', width: 120, height: 120 });
            }
          } catch (_) {
            var el2 = document.getElementById('qrcode');
            if (el2)
              el2.innerHTML = '<div style="font-size:12px;color:#64748b">QR code unavailable</div>';
          }
        };
        s.onerror = function() {
          var el = document.getElementById('qrcode');
          if (el)
            el.innerHTML = '<div style="font-size:12px;color:#64748b">QR code unavailable</div>';
        };
        document.head.appendChild(s);
      })();
    </script>
  </body>
</html>
`;
  
    const popup = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
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
          label: "Approved"
        };
      case "pending":
        return {
          icon: <Clock className="w-4 h-4" />,
          bg: "bg-amber-100",
          text: "text-amber-800",
          label: "Pending"
        };
      default:
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          bg: "bg-gray-100",
          text: "text-gray-800",
          label: status
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[700px] h-full overflow-y-auto p-0">
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
            <h3 className="text-lg font-semibold text-gray-900">Label Information</h3>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bg} ${statusConfig.text} font-medium text-sm`}>
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
                  <div className="text-sm font-medium text-gray-500 mb-1">Applicant</div>
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
                        <div className="text-xs font-medium text-gray-500 mb-1">Crop</div>
                        <div className="text-sm font-medium text-gray-900">{d.Crop.name}</div>
                      </div>
                    )}
                    {d?.CropVariety?.name && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Variety</div>
                        <div className="text-sm font-medium text-gray-900">{d.CropVariety.name}</div>
                      </div>
                    )}
                    {d?.quantity && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Quantity</div>
                        <div className="text-sm font-medium text-gray-900">{d.quantity} Kgs</div>
                      </div>
                    )}
                    {d?.seed_label_package && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Package</div>
                        <div className="text-sm font-medium text-gray-900">{d.seed_label_package}</div>
                      </div>
                    )}
                    {d?.available_stock && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Available stock</div>
                        <div className="text-sm font-medium text-gray-900">{d.available_stock} Kgs</div>
                      </div>
                    )}
                    {d?.receipt_id && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Receipt</div>
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
                        '-'
                    )}
                        </div>
                      </div>
                    )}
                    
                    {d?.created_at && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">Created</div>
                        <div className="text-sm font-medium text-gray-900">{_formatDate(d.created_at)}</div>
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
                disabled={
                    approving 
                  }
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 font-medium shadow-sm transition-all duration-200"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                { approving ? 'Approving...' : 'Approve Label' }
                
              </Button>
              <Button 
                onClick={handleApprove} 
                disabled={
                    approving 
                  }
                className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11 font-medium shadow-sm transition-all duration-200"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                { approving ? 'Rejecting...' : 'Reject Label' }
                
              </Button>
              </>
            )}

            <Button 
              onClick={() => handlePrint1(d)} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11 font-medium shadow-sm transition-all duration-200"
              disabled={!canPrintLabels || printing || printedOnce}
              title={!canPrintLabels ? "You don't have permission to print" : printedOnce ? "Already printed" : undefined}
            >
               <Printer className="w-4 h-4 mr-2" />
               Print Label
             </Button>
            {/* )} */}
          </div>

          {/* Info Notice */}
          {status === "pending"  && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <div className="font-medium mb-1">Approval Required</div>
                <div className="text-amber-700">
                  This label is pending approval. Review the information carefully before approving.
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