/* eslint-disable prettier/prettier */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { URL_2 } from '@/config/urls';
import { toast } from 'sonner';
import { useAuthContext } from '@/auth';
import { getPermissionsFromToken } from '@/utils/permissions';
import { Textarea } from '@/components/ui/textarea';
import { ASSIGN_LAB_INSPECTOR, RECEIVE_SEED_LAB_INSPECTION } from '@/gql/mutations';
import { useMutation, useQuery } from '@apollo/client/react';
import { LOAD_INSPECTORS, LOAD_SEED_LABS } from '@/gql/queries';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export type SeedLabInspection = {
  id: string;
  user_id: string | null;
  createdBy: { username: string | null };
  variety_id: string | null;
  variety: { name: string | null };
  stock_examination_id: string | null;
  collection_date: string | null;
  receipt_id: string | null;
  applicant_remark: string | null;
  inspector_id: string | null;
  inspector: { name: string | null; username: string | null };
  status: string | null;
  inspector_report: any | null;
  lab_test_report: any | null;
  deleted: boolean;
  created_at: string | null;
  lab_test_number?: string | null;
};

interface IUserDetailsDialogProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: T;
}

/* ---------------- helpers ---------------- */
const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
};

const timeAgo = (iso?: string | null) => {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
};

/* --- Status styles (emerald palette) --- */
export const STATUS = {
  ACCEPTED: {
    label: 'Accepted',
    icon: 'check-circle',
    badge:
      'text-white bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-sm ring-1 ring-emerald-300/70',
  },
  RECOMMENDED: {
    label: 'Recommended',
    icon: 'verify',
    badge:'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm ring-1 ring-blue-300/70',
  },
  REJECTED: {
    label: 'Rejected',
    icon: 'cross-circle',
    badge:
      'text-white bg-gradient-to-r from-rose-500 to-rose-600 shadow-sm ring-1 ring-rose-300/70',
  },
  HALTED: {
    label: 'Halted',
    icon: 'shield-cross',
    badge:
      'text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-sm ring-1 ring-amber-300/70',
  },
  PENDING: {
    label: 'Pending',
    icon: 'time',
    badge:
      'text-white bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-sm ring-1 ring-yellow-300/70',
  },
  RECEIVED: {
    label: 'Received',
    icon: 'inbox-in',
    badge:
      'text-white bg-gradient-to-r from-yellow-400 to-yellow-500 shadow-sm ring-1 ring-yellow-300/70',
  },
  ASSIGNED_INSPECTOR: {
    label: 'Inspector Assigned',
    icon: 'user-tick',
    badge:'text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-sm ring-1 ring-amber-300/70',
  },
  MARKETABLE: {
    label: 'Marketable',
    icon: 'user-tick',
    badge:'text-white bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm ring-1 ring-blue-300/70',
  },
  NON_MARKETABLE: {
    label: 'Non-Marketable',
    icon: 'block',
    badge:'text-white bg-gradient-to-r from-red-500 to-red-600 shadow-sm ring-1 ring-red-300/70',
  
  },
} as const;

export const getStatusCfg = (s?: string | null) => {
  const key = (s || 'PENDING').toUpperCase() as keyof typeof STATUS;
  return STATUS[key] || STATUS.PENDING;
};

export const StatusBadge = ({ s }: { s?: string | null }) => {
  const cfg = getStatusCfg(s);
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
      <KeenIcon icon={cfg.icon} className="text-sm" />
      {cfg.label}
    </span>
  );
};

const Copy = ({ value, label }: { value?: string | null; label?: string }) => {
  if (!value) return null;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded transition-colors"
      onClick={() => {
        navigator.clipboard.writeText(String(value));
        toast.success(`${label || 'Value'} copied`);
      }}
      title="Copy to clipboard"
    >
      <KeenIcon icon="copy" className="text-sm" />
    </button>
  );
};

/* --- Pretty JSON viewer --- */
const JsonBlock = ({ value }: { value: any }) => {
  const [open, setOpen] = useState(true);
  const content = useMemo(() => {
    if (value == null) return null;
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return typeof value === 'string' ? value : String(value);
    }
  }, [value]);

  if (!content) return null;

  return (
    <div className="rounded-xl border overflow-hidden bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-700 text-white">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <KeenIcon icon="code" />
          Inspector Report
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          onClick={() => setOpen((v) => !v)}
          type="button"
        >
          <KeenIcon icon={open ? 'chevron-up' : 'chevron-down'} />
          {open ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {open && (
        <pre className="text-xs bg-slate-50 p-4 overflow-auto max-h-96 font-mono leading-relaxed text-slate-800">
{content}
        </pre>
      )}
    </div>
  );
};

/* --- Reusable blocks --- */
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
    {children}
  </span>
);

const StatCard = ({
  icon,
  title,
  value,
  hint,
}: {
  icon: string;
  title: string;
  value: React.ReactNode;
  hint?: string;
}) => (
  <div className="group rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
        <KeenIcon icon={icon} className="text-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-emerald-800/80 mb-1">{title}</div>
        <div className="text-sm font-semibold text-slate-900 break-words">{value}</div>
        {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
      </div>
    </div>
  </div>
);

const RowItem = ({
  label,
  value,
  copyValue,
}: {
  label: string;
  value: React.ReactNode;
  copyValue?: string;
}) => (
  <div className="flex items-start justify-between gap-4 py-2 px-3 -mx-3 rounded-lg transition-colors hover:bg-emerald-50/50">
    <div className="text-sm font-medium text-slate-600 min-w-[160px]">{label}</div>
    <div className="flex items-center gap-2 flex-1 justify-end text-right">
      <div className="text-sm text-slate-900">{value}</div>
      {copyValue && <Copy value={copyValue} label={label} />}
    </div>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
        <KeenIcon icon="element-equal" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 tracking-wide">{title}</h3>
    </div>
    {children}
  </div>
);

/* ---------------- component ---------------- */
const SeedLabDetailsDialog = ({
  open,
  onOpenChange,
  data,
}: IUserDetailsDialogProps<SeedLabInspection>) => {
  const d = data as SeedLabInspection | undefined;

  const [action, setAction] = useState<'assign_inspector' | 'halt' | 'reject' | 'recommend' |'receive_sample'|'reject_sample' |''>('');
  const [inspector, setInspector] = useState('');
  const [comment, setComment] = useState('');
  const [assignError, setAssignError] = useState<string | null>(null);

  const { auth, currentUser } = useAuthContext();
  const perms = getPermissionsFromToken(auth?.access_token);
  const canAssignInspector = !!perms['can_assign_inspector'];
  const canPerfomLabTest = !!perms['can_perform_seed_lab_tests'];

  const {
    data: inspectorsData,
    loading: inspectorsLoading,
    error: inspectorsError,
    refetch: refetchInspectors,
  } = useQuery(LOAD_INSPECTORS, { skip: !open });

  const [assignInspector, { loading: assigning }] = useMutation(ASSIGN_LAB_INSPECTOR, {
    refetchQueries: [{ query: LOAD_SEED_LABS }],
    awaitRefetchQueries: true,
  });

  const [receiveRequest, { loading: receiving }] = useMutation(RECEIVE_SEED_LAB_INSPECTION, {
    refetchQueries: [{ query: LOAD_SEED_LABS }],
    awaitRefetchQueries: true,
  });

  const permittedActions = useMemo(
    () =>
      [
        {
          value: 'assign_inspector' as const,
          label: 'Assign Inspector',
          allowed: canAssignInspector,
        },
      ].filter((a) => a.allowed),
    [canAssignInspector]
  );

  // Reception actions shown when status is "accepted"
  const receptionActions = useMemo(
    () =>
      (d?.status === 'accepted'
        ? [
            { value: 'receive_sample' as const, label: 'Receive Sample' },
            { value: 'reject_sample' as const, label: 'Reject Reception' },
          ]
        : []),
    [d?.status]
  );

  const isActionPermitted =
    permittedActions.some((a) => a.value === action) ||
    receptionActions.some((a) => a.value === action);

  // require comment when receiving/rejecting sample
  const isConfirmDisabled =
    !action ||
    (action === 'assign_inspector' && !inspector) ||
    ((action === 'receive_sample' || action === 'reject_sample') && !comment.trim()) ||
    !isActionPermitted;

  // show comment input for reception actions (and existing status-based flows)
  const showCommentInput =
    action === 'halt' ||
    action === 'reject' ||
    action === 'recommend' ||
    action === 'receive_sample' ||
    action === 'reject_sample' ||
    d?.status === 'assigned_inspector' ||
    d?.status === 'inspector_assigned';

  const handleConfirm = async () => {
    setAssignError(null);

    // Assign inspector flow
    if (action === 'assign_inspector') {
      try {
        const res = await assignInspector({
          variables: { input: { form_id: String(d?.id ?? ''), inspector_id: inspector } },
        });
        const payload = res?.data && Object.values(res.data)[0];
        const ok = payload?.success;
        if (!ok) {
          setAssignError(payload?.message || 'Failed to assign inspector');
          toast('Failed to assign inspector', { description: payload?.message || 'Unknown error' });
          return;
        }
        toast(payload?.message || 'Inspector assigned successfully');
        onOpenChange(false);
      } catch (e: any) {
        setAssignError(e?.message || 'Failed to assign inspector');
        toast('Failed to assign inspector', { description: e?.message || 'Unknown error' });
      }
      return;
    }

    // Reception flow (receive or reject)
    if (action === 'receive_sample' || action === 'reject_sample') {
      try {
        const decision = action === 'receive_sample' ? 'received' : 'halted';
        const res = await receiveRequest({
          variables: {
            input: { id: String(d?.id ?? ''), decision, receptionist_comment: comment },
          },
        });
        const payload = res?.data && Object.values(res.data)[0];
        const ok = payload?.success;
        if (!ok) {
          setAssignError(payload?.message || 'Failed to perform reception');
          toast('Failed to update reception', { description: payload?.message || 'Unknown error' });
          return;
        }
        toast(payload?.message || (decision === 'receive' ? 'Sample received' : 'Reception rejected'));
        onOpenChange(false);
      } catch (e: any) {
        setAssignError(e?.message || 'Failed to perform reception');
        toast('Failed to update reception', { description: e?.message || 'Unknown error' });
      }
      return;
    }

    onOpenChange(false);
  };

  /* ----- Visibility for "Open Inspection" button ----- */
  const statusLower = (d?.status || '').toLowerCase();
  const isInspectorAssigned =
    statusLower === 'inspector_assigned' || statusLower === 'assigned_inspector';
  const isReceivedbyLab = statusLower === 'received';

  const meIsInspector =
    !!currentUser &&
    !!d?.inspector_id &&
    (String(d.inspector_id) === String((currentUser as any).id) ||
      (!!d.inspector?.username && !!(currentUser as any).username &&
        d.inspector.username === (currentUser as any).username));

  const meIsTechnician = !!currentUser && canPerfomLabTest;
     
  const showOpenInspection = !!d?.id && isInspectorAssigned && meIsInspector;
  const showOpenlabtest = !!d?.id && isReceivedbyLab && meIsTechnician;
  const inspectionPath = `/qa/labs/${d?.id}/inspection`;
  const labTestPath = `/qa/labs/${d?.id}/test`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[900px] h-full flex flex-col p-0 bg-white"
      >
        {/* HERO HEADER */}
        <SheetHeader className="px-6 pt-6 pb-5 border-b bg-gradient-to-r from-emerald-600 to-green-700 text-white">
          <div className="flex items-center justify-between mb-3">
            <SheetTitle className="flex items-center gap-3 text-xl text-white">
              <div className="p-2 rounded-xl bg-white/15">
                <KeenIcon icon="flask" className="text-xl" />
              </div>
              Seed Lab Inspection
            </SheetTitle>
            {d && <StatusBadge s={d.status} />}
          </div>

          {d && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Pill>
                <KeenIcon icon="fingerprint-scanning" />
                {d.id}
              </Pill>
              <span className="text-white/70">•</span>
              <span className="flex items-center gap-1 text-white/90">
                <KeenIcon icon="calendar-tick" />
                {formatDate(d.created_at)}
              </span>
              <span className="flex items-center gap-1 text-white/80">
                ({timeAgo(d.created_at)})
              </span>
              {d.deleted && (
                <span className="ml-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-700 ring-1 ring-rose-200">
                  <KeenIcon icon="information" />
                  Deleted
                </span>
              )}
            </div>
          )}
        </SheetHeader>

        {/* BODY */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-8">
          {!d ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <KeenIcon icon="file-deleted" className="text-5xl mb-3" />
              <p className="text-sm font-medium">No record selected</p>
            </div>
          ) : (
            <>
              {/* STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <StatCard
                  icon="test-tube"
                  title="Variety"
                  value={d.variety?.name || 'Not specified'}
                />
                <StatCard
                  icon="user-tick"
                  title="Inspector"
                  value={d.inspector?.username || d.inspector?.name || 'Not assigned'}
                />
                <StatCard
                  icon="calendar-2"
                  title="Collection Date"
                  value={formatDate(d.collection_date) || 'Not recorded'}
                />
              </div>

              {/* DETAILS GRID */}
              <Section title="Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <RowItem label="Status" value={<StatusBadge s={d.status} />} />
                  <RowItem
                    label="Applicant"
                    value={<span className="font-mono">{d.createdBy?.username || '—'}</span>}
                    copyValue={d.createdBy?.username || undefined}
                  />
                  <RowItem
                    label="Stock Examination"
                    value={<span className="font-mono text-xs">{d.stock_examination_id || '—'}</span>}
                    copyValue={d.stock_examination_id || undefined}
                  />
                  {d.receipt_id && (
                    <RowItem
                      label="Receipt"
                      value={
                        <a
                          href={`${URL_2}/receipts/${d.receipt_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-800 font-medium hover:underline"
                        >
                          <KeenIcon icon="document" />
                          View Receipt
                          <KeenIcon icon="arrow-up-right" className="text-xs" />
                        </a>
                      }
                    />
                  )}
                </div>
              </Section>

              {/* REMARKS */}
              {d.applicant_remark && (
                <Section title="Applicant Remarks">
                  <div className="rounded-xl border bg-emerald-50/50 p-4">
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {d.applicant_remark}
                    </p>
                  </div>
                </Section>
              )}

              {/* TECH REPORT */}
              {/* {d.inspector_report && (
                <Section title="Technical Report">
                  <JsonBlock value={d.inspector_report} />
                </Section>
              )} */}
              {d.inspector_report && (
                <Section title="Technical Report">
                  <div className="bg-white rounded-xl shadow p-6 mt-4 border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Inspection Summary
                    </h3>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      {Object.entries(d.inspector_report).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex flex-col bg-gray-50 p-3 rounded-lg border border-gray-100"
                        >
                          <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</span>
                          <span className="font-medium text-gray-900">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>
              )}

              {d.lab_test_report && (
  <Section title="Technical Report">
    <div className="bg-white rounded-xl shadow-sm p-6 mt-4 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-2">
        Lab Test Summary
      </h3>

      <div className="space-y-6">
        {Object.entries(d.lab_test_report).map(([category, values]) => (
          <div key={category} className="bg-gray-50 rounded-lg border border-gray-100 p-4">
            <h4 className="text-md font-semibold text-gray-700 mb-3 capitalize">
              {category}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {Object.entries(values as Record<string, any>).map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col bg-white p-3 rounded-md border border-gray-100 hover:shadow-sm transition"
                >
                  <span className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="font-medium text-gray-900 truncate">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </Section>
)}



              {/* ACTIONS */}
              <div className="space-y-4">
                {permittedActions.length > 0 &&
                  (d.status === 'pending' ||
                    d.status === 'recommended' ||
                    d.status === 'assigned_inspector' ||
                    d.status === 'inspector_assigned') && (
                    <div className="text-sm font-semibold text-gray-900">Take Action</div>
                  )}

                {permittedActions.length > 0 &&
                  (d.status === 'pending' ||
                    d.status === 'recommended' ||
                    d.status === 'assigned_inspector' ||
                    d.status === 'inspector_assigned') && (
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
                            name="lab-action"
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

                {receptionActions.length > 0 && (
                  <>
                    <div className="text-sm font-semibold text-gray-900">Reception</div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {receptionActions.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            action === opt.value ? 'border-primary-500' : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name="lab-action"
                            value={opt.value}
                            checked={action === opt.value}
                            onChange={() => setAction(opt.value)}
                            className="text-primary-600"
                          />
                          <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </>
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
                      <SelectContent className="w-full border-gray-300">
                        {inspectorsLoading && (
                          <SelectItem value="__loading" disabled>
                            Loading…
                          </SelectItem>
                        )}
                        {inspectorsError && (
                          <SelectItem value="__error" disabled>
                            Failed to load inspectors
                          </SelectItem>
                        )}
                        {!inspectorsLoading &&
                          !inspectorsError &&
                          (!inspectorsData?.inspectors || inspectorsData.inspectors.length === 0) && (
                            <SelectItem value="__none" disabled>
                              No inspectors found
                            </SelectItem>
                          )}
                        {inspectorsData?.inspectors?.map((ins: any) => (
                          <SelectItem key={ins.id} value={String(ins.id)}>
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
                  action === 'recommend' ||
                  action === 'receive_sample' ||
                  action === 'reject_sample' ||
                  d.status === 'assigned_inspector' ||
                  d.status === 'inspector_assigned') &&
                  (d.status === 'pending' ||
                    d.status === 'recommended' ||
                    d.status === 'assigned_inspector' ||
                    d.status === 'inspector_assigned') && (
                    <div className="max-w-xl">
                      <label className="form-label text-sm">Status comment</label>
                      <Textarea
                        className="mt-2"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={`Provide a reason for ${action || 'this update'}…`}
                        disabled={assigning}
                      />
                    </div>
                  )
                  }
                {showCommentInput &&
                  (d.status === 'pending' ||
                    d.status === 'recommended' ||
                    d.status === 'assigned_inspector' ||
                    d.status === 'inspector_assigned' ||
                    d.status === 'accepted') && (
                    <div className="max-w-xl">
                      <label className="form-label text-sm">Status comment</label>
                      <Textarea
                        className="mt-2"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={`Provide a reason for ${action || 'this update'}…`}
                        disabled={assigning || receiving}
                      />
                      
                    </div>
                  )
                }
              </div>
            </>
          )}
        </div>

        {/* STICKY FOOTER */}
        <div className="border-t px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <Button variant="light" onClick={() => onOpenChange(false)} className="px-5">
              <KeenIcon icon="cross" />
              Close
            </Button>

            <div className="flex items-center gap-3">
              {/* Open Inspection: only visible to assigned inspector when status is inspector_assigned */}
              {showOpenInspection && (
                <Link to={inspectionPath} onClick={() => onOpenChange(false)}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <KeenIcon icon="geolocation" /> Open Inspection
                  </Button>
                </Link>
              )}
              {showOpenlabtest && (
                <Link to={labTestPath} onClick={() => onOpenChange(false)}>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <KeenIcon icon="geolocation" /> Open lab test form
                  </Button>
                </Link>
              )}
              {receptionActions.length > 0 && (
                <Button onClick={handleConfirm} disabled={isConfirmDisabled || receiving}>
                  <KeenIcon icon="tick-square" />
                  {action === 'receive_sample' ? ' Receive Sample' : action === 'reject_sample' ? ' Reject Reception' : ' Confirm'}
                </Button>
              )}

              {/* Confirm Action (assign inspector) */}
              {permittedActions.length > 0 &&
                (d?.status === 'pending' ||
                  d?.status === 'assigned_inspector' ||
                  d?.status === 'inspector_assigned') && (
                  <Button onClick={handleConfirm} disabled={isConfirmDisabled || assigning}>
                    <KeenIcon icon="tick-square" />
                    {action === 'assign_inspector' && assigning ? ' Assigning…' : ' Confirm Action'}
                  </Button>
                )}
              
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export { SeedLabDetailsDialog };
