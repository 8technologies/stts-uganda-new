import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { KeenIcon } from "@/components";
import { LOAD_STOCK_RECORDS } from "@/gql/queries";
import { seedCategory, statusBadge } from "../stock-examination/StockExamination";
import { Input } from "@/components/ui/input";

type StockExam = {
  id: string;
  user_id: string;
  seed_class: string;
  lot_number: string;
  created_at: string;
  is_deposit: boolean;
  is_transfer: boolean;
  quantity?: string;
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "—";

const StockRecordsPage = () => {
  const { data, loading, error, refetch } = useQuery(LOAD_STOCK_RECORDS);
  const [items, setItems] = useState<StockExam[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (data?.stockRecords) {
      setItems(data.stockRecords);
      if (!lastRefreshedAt) setLastRefreshedAt(new Date());
    }
  }, [data]);

  const uniqueStatuses = useMemo(
    () => Array.from(new Set((items ?? []).map((i) => i.is_deposit).filter(Boolean))),
    [items]
  );

  const uniqueCategories = useMemo(
    () =>
      Array.from(
        new Set((items ?? []).map((i) => i.seed_class).filter(Boolean))
      ),
    [items]
  );
  const inStockBadge = (is_deposit: boolean) => {
    const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium';
    if(is_deposit) return <span className={`${base} bg-green-100 text-green-700`}><span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>In Stock</span>;
    return <span className={`${base} bg-red-100 text-red-700`}><span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>Out of stock</span>;
  };

  const filtered = useMemo(() => {
    let rows = items;
    if (q.trim()) {
      const needle = q.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.lot_number?.toLowerCase().includes(needle) ||
          r.location?.toLowerCase().includes(needle)
      );
    }
    if (statusFilter !== "all") {
      rows = rows.filter((r) => r.is_deposit === statusFilter);
    }
    if (categoryFilter !== "all") {
      rows = rows.filter((r) => r.seed_class === categoryFilter);
    }
    return rows;
  }, [items, q, statusFilter, categoryFilter]);

  const handleRefresh = async () => {
    await refetch();
    setLastRefreshedAt(new Date());
    toast.success("Stock records refreshed");
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b">
              {[...Array(6)].map((__, j) => (
                <div key={j} className="h-4 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        <div className="mb-3 font-semibold">Failed to load stock records</div>
        <div className="mb-4 text-sm">{error.message}</div>
        <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700 text-white">
          <KeenIcon icon="refresh" /> Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Stock Records</h2>
          <p className="text-sm text-gray-500">
            View-only list of seed stock records.{" "}
            {lastRefreshedAt && (
              <span className="italic">
                Last refreshed: {lastRefreshedAt.toLocaleString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} className="bg-blue-600 hover:bg-blue-700 text-white">
            <KeenIcon icon="refresh" /> Refresh
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="col-span-1 md:col-span-2">
            <label className="text-xs text-gray-500">Search</label>
            <Input
              placeholder="Search by lot number or location…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All statuses</option>
              {uniqueStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Seed Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        {(q || statusFilter !== "all" || categoryFilter !== "all") && (
          <div className="mt-3">
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700"
              onClick={() => {
                setQ("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
            >
              <KeenIcon icon="close-circle" /> Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Responsive list: cards on small screens, table on md+ */}
      {/* Cards (mobile) */}
      <div className="md:hidden space-y-3">
        {filtered.length ? (
          filtered.map((row) => (
            <div key={row.id} className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900">Lot {row.lot_number}</div>
                <div className="text-xs text-gray-500">{formatDate(row.created_at)}</div>
              </div>
              <div className="text-sm text-gray-700 mb-2">{row.seed_class}</div>
              <div className="text-sm text-gray-600">Owner: {row.user_id || "—"}</div>
              <div className="mt-2">{inStockBadge(row.is_deposit)}</div>
              <div className="mt-1 text-sm text-gray-700">
                Decision: <span className="capitalize">{row.quantity || "—"}</span>
              </div>
            </div>
          ))
        ) : (
          <EmptyState onRefresh={handleRefresh} />
        )}
      </div>

      {/* Table (desktop) */}
      <div className="hidden md:block overflow-x-auto bg-white shadow rounded-lg">
        {filtered.length ? (
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Lot No.</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Seed Class</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Owner</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Quantity</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.lot_number}</td>
                  <td className="px-4 py-3">{row.seed_class}</td>
                  <td className="px-4 py-3">{row.user_id || "—"}</td>
                  <td className="px-4 py-3">{inStockBadge(row.is_deposit)}</td>
                  <td className="px-4 py-3 text-gray-800 capitalize">
                    {row.quantity || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(row.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <EmptyState onRefresh={handleRefresh} />
        )}
      </div>
    </div>
  );
};

const EmptyState = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className="bg-white shadow rounded-lg p-10 text-center">
    <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
      <KeenIcon icon="package-open" />
    </div>
    <div className="text-gray-900 font-semibold mb-1">No stock records found</div>
    <div className="text-gray-500 text-sm mb-4">
      Try adjusting your filters or refresh to fetch the latest data.
    </div>
    <Button onClick={onRefresh} className="bg-blue-600 hover:bg-blue-700 text-white">
      <KeenIcon icon="refresh" /> Refresh
    </Button>
  </div>
);

export default StockRecordsPage;
