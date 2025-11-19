import { useEffect, useMemo, useState } from 'react';
import { URL_2 } from '@/config/urls';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useAuthContext } from '@/auth';
import { toast } from 'sonner';
import { getPermissionsFromToken } from '@/utils/permissions';
import { useMutation, useQuery } from '@apollo/client/react';
import { LOAD_INSPECTORS, LOAD_QDS_FORMS} from '@/gql/queries';
import { ASSIGN_INSPECTOR, HALT_FORM, REJECT_FORM, APPROVE_FORM, RECOMMEND } from '@/gql/mutations';
import { _formatDate } from '@/utils/Date';

interface IUserDetailsDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: T;
}

const LabeledRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 md:gap-y-4 md:gap-x-8 items-start">
    <div className="text-sm text-gray-700 font-medium pt-1">{label}</div>
    <div className="md:col-span-2">
      <div className="form-control">{children}</div>
    </div>
  </div>
);

const yesno = (b?: boolean | null) => (b ? 'Yes' : 'No');

const typeLabel = (t?: string) =>
  t === 'seed_exporter_or_importer' ? 'Seed Exporter/Importer' : 'Seed Merchant/Company';

const statusBadge = (s?: string | null) => {
  const color =
    s === 'accepted' || s === 'recommended'
      ? 'success'
      : s === 'rejected' || s === 'halted'
        ? 'danger'
        : 'primary';
  return (
    <span className={`badge badge-${color} badge-outline rounded-[30px]`}>{s || 'pending'}</span>
  );
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  } catch {
    return String(iso);
  }
};

const QDSDetailsDialog = ({ open, onOpenChange, data }: IUserDetailsDialogProps<any>) => {
  const d = data || {};
  const [action, setAction] = useState<'assign_inspector' | 'halt' | 'reject' | 'recommend' | ''>(
    ''
  );
  const [inspector, setInspector] = useState('');
  const [comment, setComment] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const { auth } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  console.log('perms', perms);
  const canApprove = !!perms['can_approve'];
  const canAssignInspector = !!perms['can_assign_inspector'];
  const canReject = !!perms['can_reject'];
  const canHalt = !!perms['can_halt'];
  const canRecommend = !!perms['can_recommend'];
  const permittedActions = useMemo(
    () =>
      [
        {
          value: 'assign_inspector' as const,
          label: 'Assign Inspector',
          allowed: canAssignInspector
        },
        { value: 'halt' as const, label: 'Halt', allowed: canHalt },
        { value: 'reject' as const, label: 'Reject', allowed: canReject },
        { value: 'approve' as const, label: 'Approve', allowed: canApprove },
        { value: 'recommend' as const, label: 'Recommend', allowed: canRecommend }
      ].filter((a) => a.allowed),
    [canAssignInspector, canHalt, canReject, canApprove, canRecommend]
  );

  const isActionPermitted = permittedActions.some((a) => a.value === action);
  const isConfirmDisabled =
    !action ||
    (action === 'assign_inspector' && !inspector) ||
    ((action === 'halt' || action === 'reject' || action === 'recommend') && !comment) ||
    !isActionPermitted;

  // Load inspectors when drawer is open
  const {
    data: inspectorsData,
    loading: inspectorsLoading,
    error: inspectorsError,
    refetch: refetchInspectors
  } = useQuery(LOAD_INSPECTORS, { skip: !open });

  // Preselect existing inspector if present
  useEffect(() => {
    if (!open) return;
    const preselected = (d as any)?.inspector?.id || (d as any)?.inspector_id || '';
    setInspector(preselected || '');
    setAssignError(null);
  }, [open, d]);

  const [assignInspector, { loading: assigning }] = useMutation(ASSIGN_INSPECTOR, {
    refetchQueries: [{ query: LOAD_QDS_FORMS }],
    awaitRefetchQueries: true
  });
  const [approveForm, { loading: approving }] = useMutation(APPROVE_FORM, {
    refetchQueries: [{ query: LOAD_QDS_FORMS }],
    awaitRefetchQueries: true
  });
  const [haltForm, { loading: halting }] = useMutation(HALT_FORM, {
    refetchQueries: [{ query: LOAD_QDS_FORMS }],
    awaitRefetchQueries: true
  });
  const [rejectForm, { loading: rejecting }] = useMutation(REJECT_FORM, {
    refetchQueries: [{ query: LOAD_QDS_FORMS }],
    awaitRefetchQueries: true
  });
  const [recommendForm, { loading: recommending }] = useMutation(RECOMMEND, {
    refetchQueries: [{ query: LOAD_QDS_FORMS }],
    awaitRefetchQueries: true
  });
  const handleConfirm = async () => {
    setAssignError(null);
    if (action === 'assign_inspector') {
      try {
        const res = await assignInspector({
          variables: { payload: { form_id: String(d?.id ?? ''), inspector_id: inspector } }
        });
        const ok = res?.data?.assignInspector?.success;
        if (!ok) {
          setAssignError(res?.data?.assignInspector?.message || 'Failed to assign inspector');
          toast('Failed to assign inspector', {
            description: res?.data?.assignInspector?.message || 'Unknown error'
          });
          return;
        }
        toast(res?.data?.assignInspector?.message || 'Inspector assigned successfully');
        onOpenChange(false);
      } catch (e: any) {
        setAssignError(e?.message || 'Failed to assign inspector');
        toast('Failed to assign inspector', { description: e?.message || 'Unknown error' });
      }
      return;
    }
    if (action === 'approve') {
      try {
        const res = await approveForm({
          variables: { payload: { form_id: String(d?.id ?? ''), form_type: 'qds' } }
        });
        const ok = res?.data?.approveForm?.success;
        if (!ok) {
          setAssignError(res?.data?.approveForm?.message || 'Failed to approve form');
          toast('Failed to approve form', {
            description: res?.data?.approveForm?.message || 'Unknown error'
          });
          return;
        }
        toast(res?.data?.approveForm?.message || 'Form approved successfully');
        onOpenChange(false);
      } catch (e: any) {
        setAssignError(e?.message || 'Failed to approve form');
        toast('Failed to approve form', { description: e?.message || 'Unknown error' });
      }
      return;
    }
    if (action === 'halt') {
      try {
        const res = await haltForm({
          variables: { payload: { form_id: String(d?.id ?? ''), reason: comment } }
        });
        const ok = res?.data?.haltForm?.success;
        if (!ok) {
          setAssignError(res?.data?.haltForm?.message || 'Failed to halt form');
          toast('Failed to halt form', {
            description: res?.data?.haltForm?.message || 'Unknown error'
          });
          return;
        }
        toast(res?.data?.haltForm?.message || 'Form halted successfully');
        setComment('');
        onOpenChange(false);
      } catch (e: any) {
        setAssignError(e?.message || 'Failed to halt form');
        toast('Failed to halt form', { description: e?.message || 'Unknown error' });
      }
      return;
    }
    if (action === 'recommend') {
      try {
        const res = await recommendForm({
          variables: { payload: { form_id: String(d?.id ?? ''), reason: comment } }
        });
        const ok = res?.data?.recommend?.success;
        if (!ok) {
          setAssignError(res?.data?.recommend?.message || 'Failed to recommend form');
          toast('Failed to recommend form', {
            description: res?.data?.recommend?.message || 'Unknown error'
          });
          return;
        }
        toast(res?.data?.recommend?.message || 'Form recommended successfully');
        setComment('');
        onOpenChange(false);
      } catch (e: any) {
        setAssignError(e?.message || 'Failed to recommend form');
        toast('Failed to recommend form', { description: e?.message || 'Unknown error' });
      }
      return;
    }
    if (action === 'reject') {
      try {
        const res = await rejectForm({
          variables: { payload: { form_id: String(d?.id ?? ''), reason: comment } }
        });
        const ok = res?.data?.rejectForm?.success;
        if (!ok) {
          setAssignError(res?.data?.rejectForm?.message || 'Failed to reject form');
          toast('Failed to reject form', {
            description: res?.data?.rejectForm?.message || 'Unknown error'
          });
          return;
        }
        toast(res?.data?.rejectForm?.message || 'Form rejected successfully');
        setComment('');
        onOpenChange(false);
      } catch (e: any) {
        setAssignError(e?.message || 'Failed to reject form');
        toast('Failed to reject form', { description: e?.message || 'Unknown error' });
      }
      return;
    }
    // Other actions not yet implemented
    console.log('Confirm action', { id: d?.id, action, inspector, comment });
    onOpenChange(false);
  };
  const u = d?.user || {};

  const handlePrint = (formDetails: any) => {
    const serialNo = String(Math.floor(1000 + Math.random() * 9000));
    const registrationNumber = formDetails.seed_board_registration_number;
    const growerNumber = formDetails.grower_number;
    const validFrom = _formatDate(formDetails.valid_from);
    const validUntil = _formatDate(formDetails.valid_until);
    const applicantName = formDetails.user?.name || formDetails.user?.company_initials || '';
    const companyInitials = formDetails.user?.company_initials || '';
    const address = formDetails.user?.address || formDetails.user?.premises_location || '';
    const premisesLocation = formDetails.user?.premises_location || '';
    const phoneNumber = formDetails.user?.phone_number || '';
    const category = formDetails.marketing_of || '';
    const issueDate = _formatDate(new Date());
    const verifyUrl = `${URL_2}/certificates/qds/${String(formDetails?.id ?? '')}`;

    const formHTML = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Certificate of Registration</title>
    <style>
      :root {
        --text: #0f172a;
        --muted: #475569;
        --border: #e2e8f0;
        --brand: #14532d;
        --accent: #16a34a;
        --bg: #ffffff;
      }
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif;
        color: var(--text);
        background: var(--bg);
      }
      .page {
        max-width: 900px;
        margin: 24px auto;
        padding: 32px;
        border: 1px solid var(--border);
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
        background: #fff;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 16px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 16px;
        margin-bottom: 20px;
      }
      .brand {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .brand h1 {
        font-size: 20px;
        margin: 0;
        letter-spacing: .2px;
      }
      .brand p { margin: 0; color: var(--muted); font-size: 12px; }
      .title {
        margin: 8px 0 0;
        font-size: 28px;
        text-align: center;
        letter-spacing: .4px;
      }
      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        color: var(--muted);
        font-size: 12px;
      }
      .badge {
        border: 1px solid var(--border);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        color: var(--brand);
        background: #f0fdf4;
      }
      .details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px 24px;
        margin-top: 16px;
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 16px;
      }
      .field { display: flex; gap: 8px; }
      .label { color: var(--muted); width: 48%; font-size: 13px; }
      .value { font-weight: 600; font-size: 14px; }
      .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px dashed var(--border);
      }
      .sign {
        display: flex; flex-direction: column; gap: 6px; max-width: 60%;
      }
      .sign .line { width: 260px; height: 1px; background: var(--border); }
      .qr { text-align: right; }
      .qr small { display: block; color: var(--muted); margin-top: 6px; }
      @media print {
        body { background: #fff; }
        .page { box-shadow: none; border: none; margin: 0; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <div class="header">
        <img src="${URL_2}/imgs/coat.png" alt="logo" style="width:84px;height:auto;" />
        <div class="brand">
          <h1>Ministry of Agriculture, Animal Industry and Fisheries</h1>
          <p>P.O. Box 102, Entebbe</p>
          <div class="meta">
            <span>Serial No: <strong>${serialNo}</strong></span>
            <span class="badge">[R.20(1)(c)]</span>
          </div>
        </div>
      </div>
      <h2 class="title">Certificate of Registration</h2>

      <div class="details">
        <div class="field"><div class="label">Registration Number</div><div class="value">${registrationNumber}</div></div>
        <div class="field"><div class="label">Applicant</div><div class="value">${applicantName}</div></div>
        <div class="field"><div class="label">Grower Number</div><div class="value">${growerNumber}</div></div>
        <div class="field"><div class="label">Company</div><div class="value">${companyInitials}</div></div>
        <div class="field"><div class="label">Valid From</div><div class="value">${validFrom}</div></div>
        <div class="field"><div class="label">Valid Until</div><div class="value">${validUntil}</div></div>
        <div class="field"><div class="label">Address</div><div class="value">${address}</div></div>
        <div class="field"><div class="label">Premises</div><div class="value">${premisesLocation}</div></div>
        <div class="field"><div class="label">Telephone</div><div class="value">${phoneNumber}</div></div>
        <div class="field"><div class="label">Issued On</div><div class="value">${issueDate}</div></div>
      </div>

      <div class="footer">
        <div class="sign">
          <div class="line"></div>
          <div><strong>National Seed Certification Service</strong></div>
          <small>Authorized Signature</small>
        </div>
        <div class="qr">
          <div id="qrcode"></div>
          <small>Scan to verify: ${verifyUrl}</small>
        </div>
      </div>
    </div>

    <script>
      // Load QRCode library from CDN and render QR
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
            if (el2) el2.innerHTML = '<div style="font-size:12px;color:#64748b">QR code unavailable</div>';
          }
        };
        s.onerror = function() {
          var el = document.getElementById('qrcode');
          if (el) el.innerHTML = '<div style="font-size:12px;color:#64748b">QR code unavailable</div>';
        };
        document.head.appendChild(s);
      })();
    </script>
  </body>
</html>`;

    const popup = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
    if (popup) {
      popup.document.open();
      popup.document.write(formHTML);
      popup.document.close();
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[750px] h-full flex flex-col">
        <SheetHeader className="mb-0 px-2 pt-0">
          <SheetTitle className="flex items-center gap-2">
            <KeenIcon icon="information-2" /> Application Details
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-6">
          {/* Applicant Information */}
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-900">Applicant Information</div>
            <LabeledRow label="Name of Applicant">{u.name || u.username || '-'}</LabeledRow>
            <LabeledRow label="Phone No">{u.phone_number || d?.phone_number || '-'}</LabeledRow>
            <LabeledRow label="Company Initials">{u.company_initials || '-'}</LabeledRow>
            <LabeledRow label="Email">{u.email || '-'}</LabeledRow>
            <LabeledRow label="District">{u.district || '-'}</LabeledRow>
            <LabeledRow label="Premises Location">{u.premises_location || '-'}</LabeledRow>
          </div>

          <div className="space-y-4">
            {/* <LabeledRow label="Application Category">{typeLabel(d.type)}</LabeledRow> */}
            <LabeledRow label="Seed board registration number">
              {d.seed_board_registration_number || '-'}
            </LabeledRow>
            <LabeledRow label="Grower number">
              {d.grower_number || '-'}
            </LabeledRow>
            {/* <LabeledRow label="Experience in">{d.experienced_in || '-'}</LabeledRow> */}
            <LabeledRow label="Years of experience">{d.years_of_experience || '-'}</LabeledRow>
            <LabeledRow label="Cropping histroy">{d.cropping_history || '-'}</LabeledRow>
            <LabeledRow label="Have adequate isolation?">
              {yesno(d.have_adequate_isolation)}
            </LabeledRow>
            {d.have_adequate_isolation == true && (
              <LabeledRow label="Isolation distance">{d.isolation_distance || '-'}</LabeledRow>
            )}
            
            <LabeledRow label="Have adequate labor?">
              {yesno(d.have_adequate_labor)}
            </LabeledRow>
            {d.have_adequate_labor == true && (
              <LabeledRow label="Isolation distance">{d.number_of_labors || '-'}</LabeledRow>
            )}
            <LabeledRow label="Are you aware of minimum standards">
              {yesno(d.aware_of_minimum_standards)}
            </LabeledRow>

            <LabeledRow label="Recommendation letter">
              {d.recommendation_id ? (
                <a
                  href={`${URL_2}/form_attachments/${d.recommendation_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  View recommendation letter
                </a>
              ) : (
                '-'
              )}
            </LabeledRow>
            <LabeledRow label="Certificate of registration">
              {d.certification ? (
                <a
                  href={`${URL_2}/form_attachments/${d.certification}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  View Certificate of registration.
                </a>
              ) : (
                '-'
              )}
            </LabeledRow>
  
            <LabeledRow label="Receipt">
              {d.receipt_id ? (
                <a
                  href={`${URL_2}/form_attachments/${d.receipt_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  View receipt
                </a>
              ) : (
                '-'
              )}
            </LabeledRow>
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="text-sm text-gray-700 font-medium">Status</div>
            <div className="md:col-span-2">{statusBadge(d.status)}</div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="text-sm text-gray-700 font-medium">Status comment</div>
            <div className="md:col-span-2">
              <div className="form-control">{d.status_comment || '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <div className="text-sm text-gray-700 font-medium">Inspector comment</div>
            <div className="md:col-span-2">
              <div className="form-control">{d.inspector_comment || '-'}</div>
            </div>
          </div>
          <div className="space-y-4">
            <LabeledRow label="Valid From">{formatDate(d.valid_from)}</LabeledRow>
            <LabeledRow label="Valid Until">{formatDate(d.valid_until)}</LabeledRow>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            {permittedActions.length > 0 &&
              (d.status == 'pending' ||
                d.status == 'recommended' ||
                d.status == 'assigned_inspector') && (
                <div className="text-sm font-semibold text-gray-900">Take Action</div>
              )}
            {permittedActions.length > 0 &&
              (d.status == 'pending' ||
                d.status == 'recommended' ||
                d.status == 'assigned_inspector') && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {permittedActions.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        action === opt.value ? 'border-primary-500' : 'border-gray-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="qds-action"
                        value={opt.value}
                        checked={action === opt.value}
                        onChange={() => setAction(opt.value)}
                        className="text-primary-600"
                      />
                      <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}

            {action === 'assign_inspector' && (
              <div className="max-w-sm">
                <label className="form-label text-sm">Select Inspector</label>
                {inspectorsError && (
                  <div className="text-xs text-red-600 mb-2 flex items-center gap-2">
                    Failed to load inspectors.
                    <button className="btn btn-xs btn-light" onClick={() => refetchInspectors()}>
                      <KeenIcon icon="arrow-rotate-right" /> Retry
                    </button>
                  </div>
                )}
                <Select
                  value={inspector}
                  onValueChange={(v) => {
                    setInspector(v);
                    setAssignError(null);
                  }}
                  disabled={inspectorsLoading || !!inspectorsError || assigning}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={inspectorsLoading ? 'Loading inspectors…' : 'Choose inspector'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {inspectorsLoading && (
                      <SelectItem value="" disabled>
                        Loading…
                      </SelectItem>
                    )}
                    {inspectorsError && (
                      <SelectItem value="" disabled>
                        Failed to load inspectors
                      </SelectItem>
                    )}
                    {!inspectorsLoading &&
                      !inspectorsError &&
                      (!inspectorsData?.inspectors || inspectorsData.inspectors.length === 0) && (
                        <SelectItem value="" disabled>
                          No inspectors found
                        </SelectItem>
                      )}
                    {inspectorsData?.inspectors?.map((ins: any) => (
                      <SelectItem key={ins.id} value={ins.id}>
                        {ins.name || ins.username || ins.company_initials || 'Unknown'}
                        {ins.district ? ` (${ins.district})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {assignError && <div className="text-xs text-red-600 mt-2">{assignError}</div>}
              </div>
            )}

            {(action === 'halt' ||
              action === 'reject' ||
              action == 'recommend' ||
              d.status == 'assigned_inspector') &&
              (d.status == 'pending' ||
                d.status == 'recommended' ||
                d.status == 'assigned_inspector') && (
                <div className="max-w-xl">
                  <label className="form-label text-sm">Status comment</label>
                  <Textarea
                    className="mt-2"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Provide a reason for ${action}…`}
                    disabled={
                      (action === 'halt' && halting) ||
                      (action === 'reject' && rejecting) ||
                      (action === 'recommend' && recommending)
                    }
                  />
                  {assignError && <div className="text-xs text-red-600 mt-2">{assignError}</div>}
                </div>
              )}
          </div>
        </div>
        <div className="mt-0 border-t px-2 py-4 flex items-center justify-between pb-0">
          <div className="flex gap-2">
           <Button variant="light" className='hover:bg-red-800' onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
          {permittedActions.length > 0 &&
            (d.status == 'pending' ||
              d.status == 'recommended' ||
              d.status == 'assigned_inspector') && (
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirm}
                  disabled={
                    isConfirmDisabled || assigning || halting || rejecting || approving || recommending
                  }
                >
                  <KeenIcon icon="tick-square" />
                  {action === 'assign_inspector' && assigning
                    ? ' Assigning…'
                    : action === 'halt' && halting
                      ? ' Halting…'
                      : action === 'reject' && rejecting
                        ? ' Rejecting…'
                        : action === 'recommend' && recommending
                          ? ' Recommending…'
                        : action === 'approve' && approving
                          ? ' Approving…'
                          : ' Confirm Action'}
                </Button>
              </div>
            )}
          {d.status === 'approved' && (
            <div className="flex gap-2">
              <Button onClick={() => handlePrint(d)}>
                <KeenIcon icon="printer" /> Print Certificate
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { QDSDetailsDialog };
