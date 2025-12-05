import React, { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { KeenIcon } from '@/components';
// import { findNumber, parseMaybeJSON } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order?: any;
  labs?: any[]; // pass all labs from parent
}

const StockDetailsSheet: React.FC<Props> = ({ open, onOpenChange, order, labs = [] }) => {
  const stock = order || {};
  const stockExamId = stock.stock_examination_id ?? stock.stockExaminationId ?? null;

  // compute marketable/non-marketable by filtering the provided labs array
  const [computedMarketable, setComputedMarketable] = useState<number | null>(null);
  const [computedNonMarketable, setComputedNonMarketable] = useState<number | null>(null);

  useEffect(() => {
    if (!stockExamId) {
      setComputedMarketable(null);
      setComputedNonMarketable(null);
      return;
    }
    const matched = (labs || []).filter(
      (l: any) => String(l.stock_examination_id ?? l.stockExaminationId ?? '') === String(stock.id)
    );
    console.log('matched', matched, labs);
    let m = 0;
    let n = 0;
    for (const lab of matched) {
        const status = lab.status ?? "";
        const qty = lab.inspector_report?.quantity_represented_kg ?? 0; // or whatever field holds the numeric value
        
        console.log('Lab Status:', status, lab, qty);

        if (["marketable", "pass"].includes(status.toLowerCase())) {
            m += qty;
        }

        if (["not_marketable", "not_maketable"].includes(status.toLowerCase())) {
            n += qty;
        }
    }

    setComputedMarketable(m);
    setComputedNonMarketable(n);
  }, [labs, stockExamId]);

  console.log('Computed Marketable:', computedMarketable);
  console.log('Computed Non-Marketable:', computedNonMarketable);

  // original total
  const totalQuantity = Number(stock.quantity ?? stock.total_quantity ?? 0) || 0;

  const formatDate = (isoDate?: string) => {
    if (!isoDate) return '-';
    const d = new Date(isoDate);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (is_deposit: boolean) => {
    const base = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium';
    if (is_deposit)
      return <span className={`${base} bg-green-100 text-green-700`}><span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>In Stock</span>;
    return <span className={`${base} bg-red-100 text-red-700`}><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>Out of Stock</span>;
  };

  // Calculate lab testing breakdown
  const marketableQty = computedMarketable ?? (stock.metadata?.marketable_qty || stock.marketable_qty || 0);
  const nonMarketableQty = computedNonMarketable ?? (stock.metadata?.non_marketable_qty || stock.non_marketable_qty || 0);
  const testedQty = marketableQty + nonMarketableQty;
  const remainingQty = totalQuantity - testedQty;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[600px] h-full flex flex-col p-0 bg-white">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Stock Details</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Stock ID & Status */}
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Lot Number</div>
            <div className="text-2xl font-bold">#{stock.lot_number || '-'}</div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              {getStatusBadge(stock.is_deposit)}
            </div>
            <div>
              <div className="text-sm text-gray-600">Record Date</div>
              <div className="text-sm font-medium">{formatDate(stock.created_at)}</div>
            </div>
          </div>

          {/* Owner Info */}
          <div className="border-t pt-4">
            <div className="text-sm font-semibold text-gray-900 mb-3">Owner Information</div>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-600">Owner Name</span>
                <div className="text-sm font-medium">{stock.Owner?.name || '-'}</div>
              </div>
              <div className='grid grid-cols-2 gap-3 '>
                <div >
                    <span className="text-xs text-gray-600">Seed Class</span>
                    <div className="text-sm font-medium">{stock.seed_class || '-'}</div>
                </div>
                <div>
                    <span className="text-xs text-gray-600">Crop Variety</span>
                    <div className="text-sm font-medium">{stock.CropVariety?.name || '-'}</div>
                </div>
              </div>
              
            </div>
          </div>

          {/* Stock Quantity Breakdown */}
          <div className="border-t pt-4">
            <div className="text-sm font-semibold text-gray-900 mb-4">Stock Quantity Breakdown</div>
            <div className="grid grid-cols-2 gap-3">
              {/* Total Quantity */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-600 font-medium mb-1">Total Quantity</div>
                <div className="text-2xl font-bold text-blue-900">{totalQuantity} kg</div>
              </div>

              {/* Tested Quantity */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 font-medium mb-1">Sent for Lab Testing</div>
                <div className="text-2xl font-bold text-purple-900">{testedQty} kg</div>
              </div>

              {/* Marketable */}
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-xs text-green-600 font-medium mb-1">Marketable</div>
                <div className="text-2xl font-bold text-green-900">{marketableQty} kg</div>
              </div>

              {/* Non-Marketable */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-xs text-red-600 font-medium mb-1">Non-Marketable</div>
                <div className="text-2xl font-bold text-red-900">{nonMarketableQty} kg</div>
              </div>

              {/* Remaining (not tested) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 col-span-2">
                <div className="text-xs text-gray-600 font-medium mb-1">Remaining (Not Tested)</div>
                <div className="text-2xl font-bold text-gray-900">{remainingQty} kg</div>
              </div>
            </div>
          </div>

          {/* Lab Test Results Summary */}
          {testedQty > 0 && (
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Lab Test Summary</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Marketable %</span>
                  <span className="text-sm font-bold text-green-700">
                    {testedQty > 0 ? ((marketableQty / testedQty) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-700">Non-Marketable %</span>
                  <span className="text-sm font-bold text-red-700">
                    {testedQty > 0 ? ((nonMarketableQty / testedQty) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info */}
          {stock.metadata && (
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Additional Information</div>
              <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                <pre className="whitespace-pre-wrap break-words text-xs">
                  {JSON.stringify(stock.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex gap-2">
          <button className="flex-1 btn btn-ghost" onClick={() => onOpenChange(false)}>
            Close
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StockDetailsSheet;