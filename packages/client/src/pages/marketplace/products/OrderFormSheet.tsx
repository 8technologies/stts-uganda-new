import React, { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { CREATE_ORDER } from '@/gql/mutations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seed: any;
  onOrdered?: () => void;
}

const OrderFormDialog: React.FC<Props> = ({
  open,
  onOpenChange,
  seed,
  onOrdered
}) => {
  const [qty, setQty] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [createOrder, { loading }] = useMutation(CREATE_ORDER);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const payload = {
        seedId: seed.id,
        quantity: qty,
        notes,
        sellerId: seed.seller?.id ?? seed.sellerId
      };

      const { data } = await createOrder({ variables: { payload } });

      if (data?.createOrder?.success) {
        toast.success('Order placed successfully');
        onOrdered?.();
      } else {
        toast.error(data?.createOrder?.message ?? 'Failed to place order');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message ?? 'Error placing order');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Create Order45678</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Seed name */}
          <div>
            <div className="text-sm text-gray-600">Seed</div>
            <div className="font-medium text-base">
              {seed.variety?.name ?? seed.varietyName ?? seed.name}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Quantity (bags)</label>
            <input
              type="number"
              min={1}
              className="form-input w-full border rounded-md px-3 py-2"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium">Notes</label>
            <textarea
              rows={3}
              className="form-textarea w-full border rounded-md px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="light"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Placing…' : 'Place Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderFormDialog;
