import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: any;
  onOrder?: () => void;
}

const fmt = (iso?: string) => (iso ? new Date(iso).toLocaleString() : '-');

const MarketableSeedDetailsDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  data,
  onOrder
}) => {
  const d = data || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Seed Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[65vh] overflow-y-auto text-sm text-gray-700">
          <div>
            <div className="font-semibold text-base">
              Crop: {d.Crop?.name ?? d.varietyName ?? d.name}
            </div>
            <div className="font-semibold text-base">
              Variety: {d.CropVariety?.name ?? d.varietyName ?? d.name}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Lot number: {d.motherLot ?? d.name}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3">
            <div>
              <span className="font-medium">Seller:</span> {d.Seller?.name ?? d.sellerName}
            </div>
            <div>
              <span className="font-medium">Quantity:</span> {d.quantity ?? '—'} kg
            </div>
            <div>
              <span className="font-medium">Available stock:</span> {d.stock ?? '—'} bags
            </div>
            <div>
              <span className="font-medium">Price:</span>{' '}
              {d.price ? `UGX ${d.price}` : 'Contact'}
            </div>
            <div>
              <span className="font-medium">Listed:</span> {fmt(d.created_at)}
            </div>
          </div>

          <div className="pt-3">
            <div className="font-medium mb-1">Description</div>
            <div className="whitespace-pre-wrap text-gray-600">
              {d.description ?? '-'}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="light" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onOrder}>Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MarketableSeedDetailsDialog;
