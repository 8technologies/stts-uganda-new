import React, { useMemo, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { PRODUCTS } from '@/gql/queries';
import MarketableSeedDetailsDialog from './MarketableSeedDetailsSheet';
import OrderFormDialog from './OrderFormSheet';
import { KeenIcon } from '@/components';
import { URL_2 } from '@/config/urls';

const MarketplacePage: React.FC = () => {
  const { data, loading, error, refetch } = useQuery(PRODUCTS, { fetchPolicy: 'cache-and-network' });
  // resolver returns products shaped as: { id, name, description, price, stock, image_url, seller_id, category_id, metadata }
  const seeds: any[] = data?.products ?? [];

  const [search, setSearch] = useState('');
  const [detailsItem, setDetailsItem] = useState<any | null>(null);
  const [orderSeed, setOrderSeed] = useState<any | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return seeds;
    return seeds.filter(s => {
      const name = String(s.name ?? '').toLowerCase();
      const desc = String(s.description ?? '').toLowerCase();
      // metadata may contain nested values like varietyName or sellerName
      const meta = typeof s.metadata === 'string' ? ( (() => { try { return JSON.parse(s.metadata); } catch { return {}; } })() ) : (s.metadata || {});
      const variety = String(s.CropVariety?.name ?? meta.variety?.name ?? '').toLowerCase();
      const cropName = String(s.Crop?.name ?? meta.variety?.name ?? '').toLowerCase();
      const seller = String(s.Seller?.name ?? meta.seller?.name ?? '').toLowerCase();
      return name.includes(q) || desc.includes(q) || variety.includes(q) || seller.includes(q)|| cropName.includes(q);
    });
  }, [seeds, search]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-xl font-semibold">Marketplace</h2>
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><KeenIcon icon="magnifier" /></span>
            <input
              className="w-full pl-10 pr-3 py-2 rounded-lg border bg-white"
              placeholder="Search seed lot, variety or seller"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => refetch()}>Refresh</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <div>Loading…</div>}
        {!loading && filtered.length === 0 && <div className="text-sm text-gray-600">No marketable seed found.</div>}
        {filtered.map((s) => {
          // helper display values
          // const sellerName = s.metadata?.sellerName ?? s.metadata?.seller?.name ?? 'Seller';
          const sellerName = s.Seller?.name ?? s.metadata?.seller?.name ?? 'Seller';
          const cropName = s.Crop?.name ?? s.name;
          const varietyName = s.CropVariety?.name ?? s.name;
          const lot = s.metadata?.lotNumber ?? s.name ?? '-';
          const priceText = s.price ? `UGX ${s.price}` : 'Price not set';
          const qtyText = s.quantity != null ? `${s.quantity} kg` : '—';
          const imageSrc = s.image_url || s.metadata?.image_url || '/imgs/seed-placeholder.png';

          return (
            <div key={s.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border">
                    <img
                      // src={imageSrc}
                      src={`${URL_2}${imageSrc}`}
                      alt={varietyName}
                      className="w-full h-full object-cover"
                      onError={(e: any) => { e.currentTarget.src = `${URL_2}/imgs/seed-placeholder.png`; }}
                    />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{cropName}</div>
                    <div className="font-medium">{varietyName}</div>
                    <div className="text-xs text-gray-500">{lot}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-medium font-semibold">{priceText}</div>
                  <div className="text-xs text-gray-500">{qtyText}</div>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button className="btn btn-sm" onClick={() => setDetailsItem(s)}>Details</button>
                <button className="btn btn-primary btn-sm" onClick={() => setOrderSeed(s)}>Order</button>
              </div>
            </div>
          );
        })}
      </div>

      {detailsItem && (
        <MarketableSeedDetailsDialog open={!!detailsItem} onOpenChange={() => setDetailsItem(null)} data={detailsItem} onOrder={() => { setOrderSeed(detailsItem); setDetailsItem(null); }} />
      )}

      {orderSeed && (
        <OrderFormDialog
          open={!!orderSeed}
          onOpenChange={() => setOrderSeed(null)}
          seed={orderSeed}
          onOrdered={() => { setOrderSeed(null); refetch(); }}
        />
      )}
    </div>
  );
};

export default MarketplacePage;