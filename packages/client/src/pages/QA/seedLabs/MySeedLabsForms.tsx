/* eslint-disable prettier/prettier */
import { Fragment, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';

import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';
import { KeenIcon } from '@/components';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { useLayout } from '@/providers';
import { useAuthContext } from '@/auth';

import { LOAD_SEED_LABS } from '@/gql/queries';
import { SAVE_SEED_LAB_REQUEST } from '@/gql/mutations'; // <-- upsert mutation for seed labs

import { SeedLabCreateDialog } from './blocks/SeedLabCreateDialog';
import { SeedLabEditDialog } from './blocks/SeedLabEditDialog';
import { SeedLabDetailsDialog } from './blocks/SeedLabDetailsDialog';
import { formatDateTime } from '@/utils/Date';
import { toast } from 'sonner';
import { URL_2 } from '@/config/urls';

// antd timeline + card with ribbon badge
import { Badge, Card, ConfigProvider, Descriptions, Row, Col, Timeline } from 'antd';

export type SeedLabInspection = {
  id: string;
  user_id: string | null;
  variety_id: string | null;
  lab_test_number: string | null;
  stock_examination_id: string | null;
  collection_date: string | null;
  receipt_id: string | null;
  applicant_remark: string | null;
  inspector_id: string | null;
  status: string | null; // PENDING | ACCEPTED | REJECTED | HALTED | RECOMMENDED | ASSIGNED_INSPECTOR
  inspector_report: any | null;
  deleted: boolean;
  created_at: string | null;
};

const statusToAntColor = (status?: string | null) => {
  const s = (status || 'PENDING').toUpperCase();
  if (s === 'ACCEPTED' || s === 'APPROVED' || s === 'RECOMMENDED') return 'green';
  if (s === 'REJECTED' || s === 'HALTED') return 'red';
  return 'blue';
};

const niceStatus = (s?: string | null) =>
  (s || 'PENDING')
    .toString()
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const MySeedLabInspections = () => {
  const { currentLayout } = useLayout();
  const { currentUser } = useAuthContext();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SeedLabInspection | null>(null);

  const { data, loading, error, refetch } = useQuery(LOAD_SEED_LABS);
  const [saveLab, { loading: saving }] = useMutation(SAVE_SEED_LAB_REQUEST, {
    refetchQueries: [{ query: LOAD_SEED_LABS }],
    awaitRefetchQueries: true
  });

  // All inspections from API
  const allInspections = (data?.getLabInspections || []) as SeedLabInspection[];

  console.log('MySeedLabInspections: allInspections = ', allInspections);

  // Filter to current user (client-side safeguard)
  const myInspections = useMemo(() => {
    if (!currentUser?.id) return allInspections;
    return allInspections.filter((f) => String(f.user_id || '') === String(currentUser.id));
  }, [allInspections, currentUser?.id]);

  /** CREATE handler (view -> dialog -> save) */
  const handleCreateSave = async (vals: Record<string, any>) => {
    // Expecting dialog to provide these fields (adjust names if your dialog uses different ones)
    // varietyId, stockExamId, collectionDate (ISO), applicantRemark, receipt (file/id)
    const input = {
      id: null,
      stock_examination_id: vals.stockExamId ?? vals.stock_examination_id ?? null,
      collection_date: vals.collectionDate ?? null,
      applicant_remark: vals.applicantRemark ?? null,
      receipt: vals.receipt ?? null, // server should map to receipt_id
    };

    try {
      await saveLab({ variables: { input } });
      toast.success('Seed Lab inspection created');
      setCreateOpen(false);
    } catch (e: any) {
      toast('Failed to create inspection', { description: e?.message ?? 'Unknown error' });
    }
  };

  /** EDIT handler */
  const handleEditSave = async (vals: Record<string, any>) => {
    if (!selectedItem?.id) return;
    const input = {
      id: selectedItem.id,
      stock_examination_id:
        vals.stockExamId ?? vals.stock_examination_id ?? selectedItem.stock_examination_id ?? null,
      collection_date: vals.collectionDate ?? selectedItem.collection_date ?? null,
      applicant_remark: vals.applicantRemark ?? selectedItem.applicant_remark ?? null,
      receipt: vals.receipt ?? null, // optional update
    };

    try {
      await saveLab({ variables: { input } });
      toast.success('Seed Lab inspection updated');
      setEditOpen(false);
    } catch (e: any) {
      toast('Failed to update inspection', { description: e?.message ?? 'Unknown error' });
    }
  };

  return (
    <>
      <Fragment>
        {currentLayout?.name === 'demo1-layout' && (
          <Container>
            <Toolbar>
              <ToolbarHeading>
                <ToolbarPageTitle text="Seed Lab Inspections" />
                <ToolbarDescription>
                  <div className="flex items-center flex-wrap gap-3 font-medium">
                    {loading ? (
                      <>
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-5 w-12" />
                      </>
                    ) : (
                      <>
                        <span className="text-md text-gray-700">Total:</span>
                        <span className="text-md text-gray-800 font-medium">
                          {myInspections.length}
                        </span>
                      </>
                    )}
                  </div>
                </ToolbarDescription>
              </ToolbarHeading>
              <ToolbarActions>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCreateOpen(true);
                  }}
                  className="btn btn-sm btn-primary"
                >
                  {saving ? 'Saving…' : 'Create Inspection'}
                </a>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    refetch();
                    toast.success('Refreshed inspections');
                  }}
                >
                  <KeenIcon icon="arrow-rotate-right" /> Refresh
                </button>
              </ToolbarActions>
            </Toolbar>
          </Container>
        )}

        <Container>
          {/* Error state */}
          {error && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-2 text-red-700">
                Failed to load seed lab inspections
                <button className="btn btn-sm" onClick={() => refetch()}>
                  <KeenIcon icon="arrow-rotate-right" /> Retry
                </button>
              </div>
              <div className="text-xs text-gray-600">{String(error.message || 'Unknown error')}</div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && myInspections.length === 0 && (
            <div className="card p-8 flex flex-col items-center gap-4">
              <div className="text-gray-800 font-medium">No seed lab inspections yet</div>
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <KeenIcon icon="plus" /> Create Inspection
              </Button>
            </div>
          )}

          {/* Timeline list (Ant Design) */}
          <ConfigProvider
            key="seed-labs-timeline"
            theme={{
              components: {
                Timeline: { tailColor: '#E5E7EB' }, // gray-200
                Card: { headerBg: '#F8FAFC', headerHeightSM: 40 }
              }
            }}
          >
            {loading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="grow space-y-3">
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Timeline
                items={myInspections.map((f) => {
                  const color = statusToAntColor(f.status);
                  const ribbonColor = color as any;
                  const title = `Inspection — ${formatDateTime(f.created_at)}`;
                  const statusLabel = niceStatus(f.status);

                  const canEdit = (f.status || 'PENDING').toUpperCase() === 'PENDING';

                  return {
                    color,
                    children: (
                      <Badge.Ribbon text={statusLabel} color={ribbonColor}>
                        <Card
                          size="small"
                          title={title}
                          styles={{ body: { paddingTop: 12 } }}
                          style={{ borderColor: '#CBD5E1', borderWidth: 1 }}
                        >
                          <Row gutter={[16, 16]}>
                            <Col xs={24} md={16}>
                              <Descriptions
                                size="small"
                                bordered
                                column={{ xs: 2, sm: 2, md: 2, lg: 2, xl: 2 }}
                                items={[
                                  // { key: 'inspector', label: 'Inspector (User ID)', children: f.inspector_id || '—', span: 2 },
                                  { key: 'variety', label: 'Variety ID', children: f.variety?.name || '—', span: 2 },
                                  { key: 'stockexam', label: 'Lot Number', children: f.lot_number || '—', span: 2 },
                                  { key: 'collection', label: 'Collection Date', children: f.collection_date ? formatDateTime(f.collection_date) : '—', span: 2 },
                                  {
                                    key: 'receipt',
                                    label: 'Receipt',
                                    children: f.receipt_id ? (
                                      <a
                                        href={`${URL_2}/receipts/${f.receipt_id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary-600 hover:underline"
                                      >
                                        View receipt
                                      </a>
                                    ) : (
                                      '—'
                                    ),
                                    span: 2
                                  },
                                 ]}
                                style={{ borderColor: '#CBD5E1' }}
                                labelStyle={{ backgroundColor: '#E2E8F0', color: '#0F172A', fontWeight: 600, width: 220 }}
                                contentStyle={{ textAlign: 'left' }}
                              />
                            </Col>
                            <Col xs={24} md={8}>
                              <div className="flex flex-col gap-2 mt-0">
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedItem(f);
                                    setDetailsOpen(true);
                                  }}
                                >
                                  <KeenIcon icon="eye" /> View Details
                                </Button>

                                {canEdit && (
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                      setSelectedItem(f);
                                      setEditOpen(true);
                                    }}
                                  >
                                    <KeenIcon icon="note" /> Edit Application
                                  </Button>
                                )}
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      </Badge.Ribbon>
                    )
                  };
                })}
              />
            )}
          </ConfigProvider>
        </Container>
      </Fragment>

      {/* Dialogs (create / edit / details) */}
      <SeedLabCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreateSave}
        saving={saving}
      />

      <SeedLabEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        data={selectedItem || undefined}
        onSave={handleEditSave}
        saving={saving}
      />

      <SeedLabDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        data={selectedItem || undefined}
      />
    </>
  );
};

export default MySeedLabInspections;
