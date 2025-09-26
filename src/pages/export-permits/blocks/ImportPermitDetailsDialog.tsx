import { useEffect, useMemo, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAuthContext } from '@/auth';
import { getPermissionsFromToken } from '@/utils/permissions';
import { useMutation, useQuery } from '@apollo/client/react';
import { LOAD_INSPECTORS, LOAD_IMPORT_PERMITS, LOAD_IMPORT_PERMIT } from '@/gql/queries';
import {
  ASSIGN_PERMIT_INSPECTOR,
  HALT_PERMIT,
  REJECT_PERMIT,
  APPROVE_PERMIT
} from '@/gql/mutations';
import { Skeleton } from '@/components/ui/skeleton';
import { _formatDate } from '@/utils/Date';
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/utils';
import { URL_2 } from '@/config/urls';

const LabeledRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 md:gap-y-4 md:gap-x-8 items-start">
    <div className="text-sm text-gray-700 font-medium pt-1">{label}</div>
    <div className="md:col-span-2">
      <div className="form-control">{children}</div>
    </div>
  </div>
);

// Radio Button Group Component
const ActionRadioGroup = ({
  options,
  value,
  onChange
}: {
  options: { value: string; label: string; disabled?: boolean }[];
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="flex flex-wrap gap-4">
    {options.map(
      (option) =>
        !option.disabled && (
          <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              disabled={option.disabled}
              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
            />
            <span className={`text-sm ${option.disabled ? 'text-gray-400' : 'text-gray-700'}`}>
              {option.label}
            </span>
          </label>
        )
    )}
  </div>
);

type ImportPermitDetails = {
  id: string;
  applicantCategory: string;
  status?: string;
  statusComment?: string | null;
  permitNumber?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  stockQuantity: number;
  countryOfOrigin: string;
  supplierName: string;
  supplierAddress?: string;
  inspector?: { id: string; name?: string; email?: string; image?: string } | null;
  createdBy?: { id: string; username?: string; name?: string; email?: string } | null;
  consignment?: string[];
  items?: {
    id: string;
    crop?: { id: string; name: string };
    variety?: { id: string; name: string };
    category: string;
    weight: number;
    measure: string;
  }[];
  attachments?: {
    id: string;
    fileName: string;
    filePath?: string;
    mimeType?: string;
    fileSize?: number | null;
    createdAt?: string;
    updatedAt?: string;
  }[];
  createdAt?: string;
  updatedAt?: string;
};

const ImportPermitDetailsDialog = ({
  open,
  onOpenChange,
  data
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ImportPermitDetails | null;
}) => {
  const d = data || ({} as ImportPermitDetails);
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canAssignInspector = !!perms['qa_can_assign_inspector'];
  const canHalt = !!perms['qa_can_halt'];
  const canReject = !!perms['qa_can_reject'];
  const canApprove = !!perms['qa_can_approve'];

  const [action, setAction] = useState<'assign_inspector' | 'halt' | 'reject' | 'approve' | ''>('');
  const [inspector, setInspector] = useState('');
  const [comment, setComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    data: inspectorsData,
    loading: inspectorsLoading,
    error: inspectorsError,
    refetch
  } = useQuery(LOAD_INSPECTORS, { skip: !open });

  useEffect(() => {
    if (open) {
      setAction('');
      setInspector('');
      setComment('');
      setErrorMsg(null);
    }
  }, [open, d?.id]);

  const [assignInspector, { loading: assigning }] = useMutation(ASSIGN_PERMIT_INSPECTOR, {
    refetchQueries: [
      {
        query: LOAD_IMPORT_PERMITS,
        variables: {
          filter: {
            type: 'export' as const
          },
          pagination: { page: 1, size: 200 }
        }
      }
    ],
    awaitRefetchQueries: true
  });

  const [approvePermit, { loading: approving }] = useMutation(APPROVE_PERMIT, {
    refetchQueries: [
      {
        query: LOAD_IMPORT_PERMITS,
        variables: { filter: { type: 'export' as const }, pagination: { page: 1, size: 200 } }
      },
      {
        query: LOAD_IMPORT_PERMIT,
        variables: { id: d?.id }
      }
    ],
    awaitRefetchQueries: true
  });

  const [haltPermit, { loading: halting }] = useMutation(HALT_PERMIT, {
    refetchQueries: [
      {
        query: LOAD_IMPORT_PERMITS,
        variables: { filter: { type: 'export' as const }, pagination: { page: 1, size: 200 } }
      }
    ],
    awaitRefetchQueries: true
  });

  const [rejectPermit, { loading: rejecting }] = useMutation(REJECT_PERMIT, {
    refetchQueries: [
      {
        query: LOAD_IMPORT_PERMITS,
        variables: { filter: { type: 'export' as const }, pagination: { page: 1, size: 200 } }
      }
    ],
    awaitRefetchQueries: true
  });

  const actionOptions = useMemo(
    () => [
      { value: 'assign_inspector', label: 'Assign Inspector', disabled: !canAssignInspector },
      { value: 'halt', label: 'Halt', disabled: !canHalt },
      { value: 'reject', label: 'Reject', disabled: !canReject },
      { value: 'approve', label: 'Approve', disabled: !canApprove }
    ],
    [canAssignInspector, canHalt, canReject, canApprove]
  );

  const handleConfirm = async () => {
    setErrorMsg(null);
    const id = String(d?.id ?? '');
    try {
      if (action === 'assign_inspector') {
        const res = await assignInspector({
          variables: { payload: { form_id: id, inspector_id: inspector } }
        });
        const ok = res?.data?.assignPermitInspector?.success;
        if (!ok)
          throw new Error(
            res?.data?.assignPermitInspector?.message || 'Failed to assign inspector'
          );
        toast('Inspector assigned');
        onOpenChange(false);
        return;
      }
      if (action === 'approve') {
        const res = await approvePermit({ variables: { payload: { form_id: id } } });
        const ok = res?.data?.approvePermit?.success;
        if (!ok) throw new Error(res?.data?.approvePermit?.message || 'Failed to approve');
        toast('Permit approved');
        onOpenChange(false);
        return;
      }
      if (action === 'halt') {
        const res = await haltPermit({ variables: { payload: { form_id: id, reason: comment } } });
        const ok = res?.data?.haltPermit?.success;
        if (!ok) throw new Error(res?.data?.haltForm?.message || 'Failed to halt');
        toast('Permit halted');
        onOpenChange(false);
        return;
      }
      if (action === 'reject') {
        const res = await rejectPermit({
          variables: { payload: { form_id: id, reason: comment } }
        });
        const ok = res?.data?.rejectPermit?.success;
        if (!ok) throw new Error(res?.data?.rejectForm?.message || 'Failed to reject');
        toast('Permit rejected');
        onOpenChange(false);
        return;
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Action failed');
      toast('Action failed', { description: e?.message || 'Unknown error' });
    }
  };

  const consignmentList = useMemo(
    () =>
      (d?.consignment || []).map((c) =>
        c === 'ISTA_CERTIFICATE' ? 'ISTA Certificate' : 'Phytosanitary certificate'
      ),
    [d?.consignment]
  );

  // const handlePrint = () => {
  //   try {
  //     const win = window.open('', '_blank');
  //     if (!win) return;
  //     const number = d.permitNumber || '—';
  //     const validFrom = d.validFrom ? _formatDate(d.validFrom) : '—';
  //     const validUntil = d.validUntil ? _formatDate(d.validUntil) : '—';
  //     const applicant = d.createdBy?.name || d.createdBy?.username || '—';
  //     const today = _formatDate(new Date().toISOString());
  //     const itemsRows = (d.items || [])
  //       .map(
  //         (it) => `
  //           <tr>
  //             <td>${it.crop?.name || it.crop?.id || it.cropId}</td>
  //             <td>${it.variety?.name || it.variety?.id || it.varietyId}</td>
  //             <td>${it.category}</td>
  //             <td>${it.weight} ${it.measure}</td>
  //           </tr>`
  //       )
  //       .join('');
  //     const consignmentListHtml = (consignmentList.length
  //       ? consignmentList.map((c) => `<li>${c}</li>`).join('')
  //       : '<li>—</li>');
  //     const logo = `${URL_2}/imgs/coat.png`;
  //     const html = `<!DOCTYPE html>
  //     <html lang="en">
  //       <head>
  //         <meta charset="UTF-8" />
  //         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //         <title>Seed Import Permit</title>
  //         <style>
  //           body { font-family: Arial, sans-serif; font-size: 80%; color:#111827; }
  //           header { text-align:center; margin-bottom: 20px; position: relative; }
  //           .permit-number { position:absolute; top:10px; left:10px; }
  //           .r-number { position:absolute; top:10px; right:10px; }
  //           table { border-collapse: collapse; width: 100%; margin-top: 20px; }
  //           th, td { border: 1px solid black; padding: 8px; text-align: left; }
  //           th { background-color: #f2f2f2; }
  //           .signature-container { text-align: right; margin-top: 20px; margin-bottom: 20px; }
  //           .signature-text { text-align: left; margin-left: 300px; }
  //         </style>
  //       </head>
  //       <body>
  //         <header>
  //           <img src="${logo}" alt="logo" style="width: 100px; height: auto" />
  //           <p>THE REPUBLIC OF UGANDA</p>
  //           <p>Ministry of Agriculture, Animal Industry and Fisheries</p>
  //           <p>P.O. Box 102, ENTEBBE</p>
  //           <h2>SEED IMPORT PERMIT</h2>
  //           <p class="permit-number"><strong>No.</strong> ${number}</p>
  //           <p class="r-number">[R.20(1)(c)]</p>
  //         </header>

  //         <h3>The Seeds and Plant Act, 2006</h3>
  //         <p><strong>Permit No:</strong> ${number}</p>
  //         <p><strong>Valid from:</strong> ${validFrom}</p>
  //         <p><strong>Expiry date:</strong> ${validUntil}</p>
  //         <p><strong>Permission is hereby granted to:</strong> ${applicant}</p>
  //         <p><strong>of:</strong> —</p>
  //         <p><strong>to import from:</strong> ${d.supplierName || '—'}, ${d.supplierAddress || '—'} (${d.countryOfOrigin || '—'})</p>
  //         <p><strong>the following seeds</strong></p>

  //         <table>
  //           <thead>
  //             <tr>
  //               <th>Species</th>
  //               <th>Variety</th>
  //               <th>Category</th>
  //               <th>Weight</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //             ${itemsRows || '<tr><td colspan="4">No items</td></tr>'}
  //           </tbody>
  //         </table>

  //         <p>Subject to the following conditions:</p>
  //         <ol>
  //           <li>
  //             The consignment of seed shall be accompanied by:
  //             <ul>
  //               ${consignmentListHtml}
  //             </ul>
  //           </li>
  //           <li>
  //             The consignment shall be subjected to Ugandan plant quarantine regulations and upon arrival in your stores shall be inspected by plant/seed inspectors.
  //           </li>
  //           <li>
  //             The seeds shall not be distributed prior to the release of the result of the tests carried on samples unless with express permission of the head of NSCS.
  //           </li>
  //           <li>
  //             Payment of sampling and testing fees as stipulated in the fifth schedule to seeds regulations shall be honored.
  //           </li>
  //           <li>
  //             Fulfillment of commerce/customs requirements and adherence to regulations pertaining to importation of seed.
  //           </li>
  //           <li>
  //             Additional Conditions: <span>${d.statusComment || '—'}</span>
  //           </li>
  //         </ol>

  //         <div class="signature-container">
  //           <div class="signature-text">
  //             <p>Signature:___________________________</p>
  //             <p>Permanent Secretary</p>
  //             <p>Ministry of Agriculture, Animal Industry and Fisheries</p>
  //             <p>Date: <span>${today}</span></p>
  //           </div>
  //         </div>

  //         <p>cc <span>The Head</span></p>
  //         <p>National Seed Certification Services</p>
  //         <p>P.O.Box 7065</p>
  //         <p>KAMPALA</p>

  //         <script>window.addEventListener('load', () => { setTimeout(() => { window.print(); window.close(); }, 150); });</script>
  //       </body>
  //     </html>`;
  //     win.document.open();
  //     win.document.write(html);
  //     win.document.close();
  //   } catch {}
  // };

  const handlePrint = () => {
    try {
      const win = window.open('', '_blank');
      if (!win) {
        console.error('Popup blocked. Please allow popups for this site.');
        return;
      }

      // Data validation and fallbacks
      const number = d.permitNumber || '—';
      const validFrom = d.validFrom ? _formatDate(d.validFrom) : '—';
      const validUntil = d.validUntil ? _formatDate(d.validUntil) : '—';
      const applicant = d.createdBy?.name || d.createdBy?.username || '—';
      const applicantAddress = d.applicantAddress || '—';
      const inspectorName = d.inspector?.name || '—';
      const today = _formatDate(new Date().toISOString());
      const supplierName = d.supplierName || '—';
      const supplierAddress = d.supplierAddress || '—';
      const countryOfOrigin = d.countryOfOrigin || '—';
      const additionalConditions = d.additionalConditions || 'None';

      // Safely handle items data
      const itemsRows = (d.items || [])
        .map(
          (it, index) => `
        <tr>
          <td style="padding:8px;border:1px solid #000;">${it.crop?.name || it.crop?.id || it.cropId || '—'}</td>
          <td style="padding:8px;border:1px solid #000;">${it.variety?.name || it.variety?.id || it.varietyId || '—'}</td>
          <td style="padding:8px;border:1px solid #000;">${it.category || '—'}</td>
          <td style="padding:8px;border:1px solid #000;">${it.weight || '—'} ${it.measure || ''}</td>
        </tr>`
        )
        .join('');

      const consignmentItems = (consignmentList || []).map((item) => `<li>${item}</li>`).join('');

      const logo = `${URL_2}/imgs/coat.png`;

      const html = `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Seed Export Permit - ${number}</title>
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
          <h2>EXPORT PERMIT</h2>
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
                ${consignmentItems || '<li>No specific requirements</li>'}
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
          <p>Date: <span id="datePlaceholder">${today}</span></p>
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
      console.error('Error generating print document:', error);
      alert('Error generating print document. Please try again.');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[750px] lg:max-w-[710px]">
        <SheetHeader className="mb-2">
          <SheetTitle>Export Permit Details</SheetTitle>
        </SheetHeader>
        {!d?.id ? (
          <div className="p-6">
            <Skeleton className="h-4 w-64 mb-2" />
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
        ) : (
          <div
            className="px-2 space-y-6"
            style={{ height: 'calc(100vh - 75px)', overflow: 'auto' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <LabeledRow label="Applicant">
                <div className="leading-tight">
                  <div className="text-sm font-medium text-gray-800">
                    {d.createdBy?.name || d.createdBy?.username || '—'}
                  </div>
                  <div className="text-[12px] text-gray-600">{d.createdBy?.email || ''}</div>
                </div>
              </LabeledRow>
              <LabeledRow label="Applicant Category">
                <div className="text-gray-800">{d.applicantCategory}</div>
              </LabeledRow>
              <LabeledRow label="Status">
                {(() => {
                  const s = String(d.status || 'pending');
                  const color =
                    s === 'approved' || s === 'recommended'
                      ? 'success'
                      : s === 'rejected' || s === 'halted'
                        ? 'danger'
                        : s === 'assigned_inspector'
                          ? 'orange'
                          : 'primary';
                  return (
                    <span className={`badge badge-${color} badge-outline rounded-[30px]`}>
                      <span className={`size-1.5 rounded-full bg-${color} me-1.5`}></span>
                      {s}
                    </span>
                  );
                })()}
              </LabeledRow>
              <LabeledRow label="Permit Number">
                <div className="text-gray-800">{d.permitNumber || '—'}</div>
              </LabeledRow>
              <LabeledRow label="Valid From">
                <div className="text-gray-800">{d.validFrom ? _formatDate(d.validFrom) : '—'}</div>
              </LabeledRow>
              <LabeledRow label="Valid Until">
                <div className="text-gray-800">
                  {d.validUntil ? _formatDate(d.validUntil) : '—'}
                </div>
              </LabeledRow>
              <LabeledRow label="Stock Quantity">
                <div className="text-gray-800">{d.stockQuantity}</div>
              </LabeledRow>
              <LabeledRow label="Inspector">
                {d?.inspector ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        d.inspector.image
                          ? `${URL_2}/imgs/${d.inspector.image}`
                          : toAbsoluteUrl('/media/avatars/blank.png')
                      }
                      className="rounded-full size-8 shrink-0 object-cover"
                      alt={d.inspector.name || 'Inspector'}
                    />
                    <div className="leading-tight">
                      <div className="text-sm font-medium text-gray-800">{d.inspector.name}</div>
                      <div className="text-[11px] text-gray-600">{d.inspector.email}</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </LabeledRow>
              <LabeledRow label="Country of Origin">
                <div className="text-gray-800">{d.countryOfOrigin}</div>
              </LabeledRow>
              <LabeledRow label="Supplier Name">
                <div className="text-gray-800">{d.supplierName}</div>
              </LabeledRow>
              <LabeledRow label="Supplier Address">
                <div className="text-gray-800">{d.supplierAddress || '-'}</div>
              </LabeledRow>
              <LabeledRow label="Consignment Documents">
                <div className="flex flex-wrap gap-1">
                  {consignmentList.length > 0 ? (
                    consignmentList.map((c, i) => (
                      <span key={i} className="badge badge-light badge-outline rounded-[30px]">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-600">—</span>
                  )}
                </div>
              </LabeledRow>
              <LabeledRow label="Created On">
                <div className="text-gray-800">{_formatDate(d.createdAt || '')}</div>
              </LabeledRow>
              <LabeledRow label="Status Comment">
                <div className="text-gray-800 whitespace-pre-wrap">{d.statusComment || '—'}</div>
              </LabeledRow>
            </div>

            <div>
              <div className="text-lg font-semibold text-gray-800 border-b pb-2">Items</div>
              <div className="mt-3 rounded-lg border overflow-hidden">
                <Table className="text-[13px]">
                  <TableHeader className="bg-light">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[120px]">Crop</TableHead>
                      <TableHead className="min-w-[120px]">Variety</TableHead>
                      <TableHead className="min-w-[140px]">Category</TableHead>
                      <TableHead className="min-w-[100px]">Weight</TableHead>
                      <TableHead className="min-w-[120px]">Measure</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(d.items || []).map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="text-gray-800 font-medium">
                          {it.crop?.name || it.crop?.id || it.cropId}
                        </TableCell>
                        <TableCell className="text-gray-800">
                          {it.variety?.name || it.variety?.id || it.varietyId}
                        </TableCell>
                        <TableCell>
                          <span className="badge badge-light badge-outline rounded-[30px]">
                            {it.category}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-800">{it.weight}</TableCell>
                        <TableCell>
                          <span className="badge badge-outline rounded-[30px]">{it.measure}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(d.items || []).length === 0 && (
                      <TableRow>
                        <TableCell className="text-gray-600" colSpan={5}>
                          No items
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Attachments */}
            <div>
              <div className="text-lg font-semibold text-gray-800 border-b pb-2">Attachments</div>
              <div className="mt-3 rounded-lg border overflow-hidden">
                <Table className="text-[13px]">
                  <TableHeader className="bg-light">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="min-w-[280px]">File</TableHead>
                      <TableHead className="min-w-[140px]">Type</TableHead>
                      <TableHead className="min-w-[120px]">Size</TableHead>
                      <TableHead className="min-w-[160px]">Uploaded</TableHead>
                      <TableHead className="min-w-[120px] text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(d.attachments || []).map((att) => {
                      const size = (() => {
                        const bytes = Number(att.fileSize || 0);
                        if (!bytes) return '—';
                        const kb = bytes / 1024;
                        if (kb < 1024) return `${kb.toFixed(1)} KB`;
                        return `${(kb / 1024).toFixed(1)} MB`;
                      })();
                      const url = `${URL_2}/permits/${att.fileName}`;
                      return (
                        <TableRow key={att.id}>
                          <TableCell className="text-gray-800 font-medium">
                            {att.fileName || att.id}
                          </TableCell>
                          <TableCell className="text-gray-700">{att.mimeType || '—'}</TableCell>
                          <TableCell className="text-gray-700">{size}</TableCell>
                          <TableCell className="text-gray-700">
                            {att.createdAt ? _formatDate(att.createdAt) : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <a href={url} className="btn btn-sm" target="_blank" rel="noreferrer">
                              <KeenIcon icon="arrow-down" /> Download
                            </a>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {(d.attachments || []).length === 0 && (
                      <TableRow>
                        <TableCell className="text-gray-600" colSpan={5}>
                          No attachments
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Action Section (hidden if already approved) */}
            {String(d.status || '') !== 'approved' && actionOptions.length > 0 && (
              <div className="mt-6 border-t pt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Actions</h3>
                  <ActionRadioGroup
                    options={actionOptions}
                    value={action}
                    onChange={(value) => {
                      setAction(value as any);
                      setErrorMsg(null);
                    }}
                  />
                </div>

                {/* Dynamic Action Forms */}
                {action === 'assign_inspector' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Inspector
                    </label>
                    <div className="flex items-center gap-2">
                      {inspectorsLoading && (
                        <div className="text-xs text-gray-600">Loading inspectors…</div>
                      )}
                      {inspectorsError && (
                        <div className="text-xs text-danger flex items-center gap-2">
                          Failed to load inspectors
                          <button className="btn btn-xs btn-light" onClick={() => refetch?.()}>
                            Retry
                          </button>
                        </div>
                      )}
                      <Select
                        value={inspector}
                        onValueChange={setInspector}
                        disabled={inspectorsLoading || !!inspectorsError || assigning}
                      >
                        <SelectTrigger className="w-full max-w-md">
                          <SelectValue placeholder="Choose inspector" />
                        </SelectTrigger>
                        <SelectContent>
                          {inspectorsData?.inspectors?.map((ins: any) => (
                            <SelectItem key={ins.id} value={ins.id}>
                              {ins.name || ins.username || ins.company_initials || 'Unknown'}
                              {ins.district ? ` (${ins.district})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {(action === 'halt' || action === 'reject') && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {action === 'halt' ? 'Reason for Halting' : 'Reason for Rejection'}
                    </label>
                    <Textarea
                      rows={3}
                      placeholder={`Enter ${action === 'halt' ? 'reason for halt' : 'reason for rejection'}...`}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="max-w-2xl"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                  <Button variant="light" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>

                  <div className="flex items-center gap-4">
                    {errorMsg && (
                      <div className="text-xs text-danger bg-danger/10 px-3 py-1 rounded-md">
                        {errorMsg}
                      </div>
                    )}

                    {actionOptions.length > 0 && (
                      <Button
                        onClick={handleConfirm}
                        disabled={
                          !action ||
                          (action === 'assign_inspector' && !inspector) ||
                          ((action === 'halt' || action === 'reject') && !comment) ||
                          assigning ||
                          halting ||
                          rejecting ||
                          approving
                        }
                        className="min-w-[140px]"
                      >
                        <KeenIcon icon="tick-square" className="mr-2" />
                        {assigning || halting || rejecting || approving
                          ? 'Processing…'
                          : 'Confirm Action'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {String(d.status || '') === 'approved' && (
              <div className="mt-6 border-t pt-4 flex items-center justify-end">
                <Button onClick={handlePrint}>
                  <KeenIcon icon="printer" /> Print Certificate
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export { ImportPermitDetailsDialog };
