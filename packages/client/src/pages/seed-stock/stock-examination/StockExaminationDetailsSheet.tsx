import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components';
import { Link } from 'react-router-dom';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInspectionOpen?: (stockId: string) => void;
  // stockId?: string;
  data?: any;
}

const fmtDate = (iso?: string) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
};

const DetailRow: React.FC<{ 
  icon: string; 
  label: string; 
  value: React.ReactNode;
}> = ({ icon, label, value }) => (
  <div className="flex gap-4 p-4 rounded-lg border hover:border-green-300 hover:shadow-sm transition-all">
    <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
      <KeenIcon icon={icon} className="text-green-600" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-xs font-medium text-green-700 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-sm text-gray-900 font-medium break-words">{value || '—'}</div>
    </div>
  </div>
);

const SectionHeader: React.FC<{ icon: string; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-50">
      <KeenIcon icon={icon} className="text-green-600" />
    </div>
    <div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
  </div>
);

const StockExaminationDetailsSheet: React.FC<Props> = ({ open, onOpenChange, onInspectionOpen, data }) => {
  const d = data || {};

  const seedType = d.seedType || d.category?.toLowerCase?.() || 'unknown';

  const getCategoryInfo = () => ({
    icon: 'leaf',
    label: d.category || 'Unknown Seed',
    color: 'text-green-600',
    bg: 'bg-green-100'
  });

  const getStatusInfo = () => {
    const status = (d.status || '').toLowerCase();
    if (status.includes('approved')) {
      return { color: 'text-green-700', bg: 'bg-green-100', dot: 'bg-green-600' };
    }
    if (status.includes('pending')) {
      return { color: 'text-yellow-700', bg: 'bg-yellow-100', dot: 'bg-yellow-600' };
    }
    if (status.includes('rejected') || status.includes('failed')) {
      return { color: 'text-red-700', bg: 'bg-red-100', dot: 'bg-red-600' };
    }
    return { color: 'text-gray-700', bg: 'bg-gray-100', dot: 'bg-gray-600' };
  };

  const categoryInfo = getCategoryInfo();
  const statusInfo = getStatusInfo();
  const report = d.report || {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[800px] h-full flex flex-col bg-gray-50">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-5 bg-white border-b shadow-sm">
          <SheetTitle className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-600">
                <KeenIcon icon="information-2" className="text-xl" />
              </div>
              <div>
                <div className="text-xl font-semibold text-gray-900">Examination Details</div>
                <div className="text-sm text-gray-500 font-normal mt-1">
                  Complete examination record information
                </div>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Category & Status */}
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-14 h-14 ${categoryInfo.bg} rounded-xl`}>
                    <KeenIcon icon={categoryInfo.icon} className={`${categoryInfo.color} text-xl`} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Category</div>
                    <div className="text-lg font-semibold text-gray-900 mt-1">{categoryInfo.label}</div>
                  </div>
                </div>
                {d.status && (
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${statusInfo.bg} ${statusInfo.color}`}>
                    <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`}></span>
                    {d.status}
                  </div>
                )}
              </div>
            </div>

            {/* General Information */}
            <div className="bg-white rounded-xl border p-5 shadow-sm">
              <SectionHeader icon="information" title="General Information" subtitle="Basic examination details" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DetailRow icon="calendar" label="Created On" value={fmtDate(d.created_at)} />
                <DetailRow icon="user" label="Created By" value={d.user?.username} />
                <DetailRow icon="hash" label="Lot Number" value={d.mother_lot} />
                <DetailRow icon="profile-user" label="Inspector" value={d.inspector?.username} />
              </div>
            </div>

            {/* Inspection Report */}
            {report && Object.keys(report).length > 0 && (
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader icon="document" title="Inspection Report" subtitle="Detailed inspection results" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DetailRow icon="map" label="Field Size (acres)" value={d.field_size} />
                  <DetailRow icon="scale" label="Yield (kg)" value={d.yield} />
                  <DetailRow icon="book" label="Seed Class" value={d.seed_class} />
                  <DetailRow icon="activity" label="Purity (%)" value={report.purity} />
                  <DetailRow icon="droplet" label="Moisture Content (%)" value={report.moisture_content} />
                  <DetailRow icon="bug" label="Insect Damage" value={report.insect_damage} />
                  <DetailRow icon="alert" label="Moldiness" value={report.moldiness} />
                  <DetailRow icon="leaf" label="Weeds" value={report.weeds} />
                  <DetailRow icon="sprout" label="Germination (%)" value={report.germination} />
                </div>
              </div>
            )}

            {/* Remarks */}
            {d.remarks && (
              <div className="bg-white rounded-xl border p-5 shadow-sm">
                <SectionHeader icon="note" title="Remarks" subtitle="Additional notes or comments" />
                <div className="p-4 rounded-lg border">
                  <div className="flex items-start gap-2 mb-2">
                    <KeenIcon icon="message-text" className="text-green-600 mt-0.5" />
                    <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Remarks</div>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap pl-6">{d.remarks}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        

        {/* Footer */}
<div className="border-t bg-white px-6 py-4 flex items-center justify-between shadow-sm">
  <Button variant="light" onClick={() => onOpenChange(false)} className="px-6">
    Close
  </Button>
  <div className="flex items-center gap-3">
    {d.reportUrl && (
      <a href={d.reportUrl} target="_blank" rel="noreferrer">
        <Button variant="outline" className="gap-2 hover:bg-green-50 text-green-700 border-green-300">
          <KeenIcon icon="printer" />
          Print Report
        </Button>
      </a>
    )}

    {/* Open Inspection button */}
    <Button
      className="bg-green-600 hover:bg-green-700 text-white gap-2"
      onClick={() => {
        // Close this detail sheet
        onOpenChange(false);

        // Open the inspection sheet after a small delay to ensure smooth animation
        setTimeout(() => {
          onInspectionOpen?.(d.id);
        }, 200);
      }}
    >
      <KeenIcon icon="geolocation" /> Open Inspection
    </Button>
  </div>
</div>

      </SheetContent>
    </Sheet>
  );
};

export default StockExaminationDetailsSheet;
