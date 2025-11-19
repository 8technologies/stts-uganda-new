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

import { LOAD_SR4_FORMS } from '@/gql/queries';
import { SAVE_SR4_FORMS } from '@/gql/mutations';

import { UserCreateDialog } from '../blocks/UserCreateDialog';
import { UserEditDialog } from '../blocks/UserEditDialog';
import { UserDetailsDialog } from '../blocks/UserDetailsDialog';
import { _formatDate, formatDateTime } from '@/utils/Date';
import { toast } from 'sonner';

// antd timeline + card with ribbon badge
import { Badge, Card, ConfigProvider, Descriptions, Row, Col, Timeline } from 'antd';
import { URL_2 } from '@/config/urls';

type Sr4Application = {
  id: string;
  user_id: string;
  created_at?: string;
  valid_until?: string | null;
  type: 'seed_merchant' | 'seed_exporter_or_importer';
  status?: string | null;
  inspector?: { name?: string; district?: string } | null;
  seed_board_registration_number?: string | null;
  user?: {
    name?: string;
    username?: string;
    company_initials?: string;
    email?: string;
    district?: string;
    premises_location?: string;
    phone_number?: string;
  };
};

const typeLabel = (t?: string) =>
  t === 'seed_exporter_or_importer' ? 'Seed Exporter/Importer' : 'Seed Merchant/Company';

const statusToColor = (status?: string | null) => {
  switch (status) {
    case 'accepted':
    case 'approved':
    case 'recommended':
      return 'success';
    case 'rejected':
    case 'halted':
      return 'danger';
    case 'assigned_inspector':
    case 'pending':
    default:
      return 'primary';
  }
};

const handlePrint = (formDetails: any) => {
  const serialNo = String(Math.floor(1000 + Math.random() * 9000));
  const registrationNumber = formDetails.seed_board_registration_number;
  const validFrom = _formatDate(formDetails.valid_from);
  const validUntil = _formatDate(formDetails.valid_until);
  const applicantName = formDetails.user?.name || formDetails.user?.company_initials || '';
  const companyInitials = formDetails.user?.company_initials || '';
  const address = formDetails.user?.address || formDetails.user?.premises_location || '';
  const premisesLocation = formDetails.user?.premises_location || '';
  const phoneNumber = formDetails.user?.phone_number || '';
  const category = formDetails.marketing_of || '';
  const issueDate = _formatDate(new Date());
  const verifyUrl = `${URL_2}/certificates/sr4/${String(formDetails?.id ?? '')}`;

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
        <div class="field"><div class="label">Valid From</div><div class="value">${validFrom}</div></div>
        <div class="field"><div class="label">Valid Until</div><div class="value">${validUntil}</div></div>
        <div class="field"><div class="label">Company</div><div class="value">${companyInitials}</div></div>
        <div class="field"><div class="label">Category</div><div class="value">${category}</div></div>
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

const MySr4ApplicationForms = () => {
  const { currentLayout } = useLayout();
  const { currentUser } = useAuthContext();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Sr4Application | null>(null);

  const { data, loading, error, refetch } = useQuery(LOAD_SR4_FORMS);
  const [saveForm, { loading: saving }] = useMutation(SAVE_SR4_FORMS, {
    refetchQueries: [{ query: LOAD_SR4_FORMS }],
    awaitRefetchQueries: true
  });

  const myForms = useMemo(() => {
    const forms = ((data?.sr4_applications || []) as Sr4Application[]) || [];
    if (!currentUser?.id) return forms;
    return forms.filter((f) => String(f.user_id) === String(currentUser.id));
  }, [data?.sr4_applications, currentUser?.id]);

  const merchantsCount = useMemo(
    () => myForms.filter((f) => f.type === 'seed_merchant').length,
    [myForms]
  );

  const handleCreateSave = async (vals: Record<string, any>) => {
    const toBool = (v: any) => String(v).toLowerCase() === 'yes';
    const payload: any = {
      years_of_experience: vals.yearsOfExperience || null,
      experienced_in: vals.experienceIn || null,
      dealers_in: vals.dealersIn || null,
      marketing_of: vals.marketingOf || null,
      marketing_of_other: vals.otherMarketingOf || null,
      dealers_in_other: vals.otherDealersIn || null,
      status: null,
      have_adequate_land: toBool(vals.adequateLand),
      land_size: vals.landSize || null,
      receipt: vals?.receipt || null,
      have_adequate_equipment: toBool(vals.adequateEquipment),
      equipment: null,
      have_contractual_agreement: toBool(vals.contractualAgreement),
      have_adequate_field_officers: toBool(vals.fieldOfficers),
      have_conversant_seed_matters: toBool(vals.conversantSeedMatters),
      have_adequate_land_for_production: toBool(vals.adequateLandForProduction),
      have_internal_quality_program: toBool(vals.internalQualityProgram),
      have_adequate_storage: toBool(vals.adequateStorage),
      source_of_seed: vals.sourceOfSeed || null,
      type: vals.applicationCategory
    };

    try {
      await saveForm({ variables: { payload } });
      toast('SR4 application saved');
      setCreateOpen(false);
    } catch (e: any) {
      toast('Failed to save application', { description: e?.message ?? 'Unknown error' });
    }
  };

  const handleEditSave = async (vals: Record<string, any>) => {
    if (!selectedForm?.id) return;
    const toBool = (v: any) => String(v).toLowerCase() === 'yes';
    const payload: any = {
      id: selectedForm.id,
      years_of_experience: vals.yearsOfExperience || null,
      experienced_in: vals.experienceIn || null,
      dealers_in: vals.dealersIn || null,
      marketing_of: vals.marketingOf || null,
      marketing_of_other: vals.otherMarketingOf || null,
      dealers_in_other: vals.otherDealersIn || null,
      status: null,
      have_adequate_land: toBool(vals.adequateLand),
      land_size: vals.landSize || null,
      have_adequate_equipment: toBool(vals.adequateEquipment),
      equipment: null,
      have_contractual_agreement: toBool(vals.contractualAgreement),
      have_adequate_field_officers: toBool(vals.fieldOfficers),
      have_conversant_seed_matters: toBool(vals.conversantSeedMatters),
      have_adequate_land_for_production: toBool(vals.adequateLandForProduction),
      have_internal_quality_program: toBool(vals.internalQualityProgram),
      have_adequate_storage: toBool(vals.adequateStorage),
      source_of_seed: vals.sourceOfSeed || null,
      type: vals.applicationCategory
    };

    try {
      await saveForm({ variables: { payload } });
      toast('SR4 application updated');
      setEditOpen(false);
    } catch (e: any) {
      toast('Failed to update application', { description: e?.message ?? 'Unknown error' });
    }
  };

  return (
    <>
      <Fragment>
        {currentLayout?.name === 'demo1-layout' && (
          <Container>
            <Toolbar>
              <ToolbarHeading>
                <ToolbarPageTitle text="SR4 - Stockist/Company" />
                <ToolbarDescription>
                  <div className="flex items-center flex-wrap gap-3 font-medium">
                    {loading ? (
                      <>
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-5 w-12" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-12" />
                      </>
                    ) : (
                      <>
                        <span className="text-md text-gray-700">Applications:</span>
                        <span className="text-md text-gray-800 font-medium me-2">
                          {myForms.length}
                        </span>
                        <span className="text-md text-gray-700">Seed Merchants</span>
                        <span className="text-md text-gray-800 font-medium">{merchantsCount}</span>
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
                  {saving ? 'Saving…' : 'Create Application'}
                </a>
              </ToolbarActions>
            </Toolbar>
          </Container>
        )}

        <Container>
          {/* Error state */}
          {error && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-2 text-red-700">
                Failed to load SR4 applications
                <button className="btn btn-sm" onClick={() => refetch()}>
                  <KeenIcon icon="arrow-rotate-right" /> Retry
                </button>
              </div>
              <div className="text-xs text-gray-600">
                {String(error.message || 'Unknown error')}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && myForms.length === 0 && (
            <div className="card p-8 flex flex-col items-center gap-4">
              <div className="text-gray-800 font-medium">No SR4 applications yet</div>
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <KeenIcon icon="plus" /> Create Application
              </Button>
            </div>
          )}

          {/* Timeline list (Ant Design) */}
          <ConfigProvider
            key="sr4-timeline"
            theme={{
              components: {
                Timeline: {
                  tailColor: '#E5E7EB' // gray-200
                },
                Card: {
                  headerBg: '#F8FAFC', // slate-50
                  headerHeightSM: 40
                }
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
                items={myForms.map((f) => {
                  const color =
                    f.status === 'approved'
                      ? 'green'
                    : f.status === 'recommended'
                        ? 'blue'
                      : f.status === 'rejected' || f.status === 'halted'
                        ? 'red'
                        : 'yellow';
                  const ribbonColor = color as any;
                  const inspector = f.inspector
                    ? `${f.inspector?.name ?? ''}${f.inspector?.district ? ` - ${f.inspector.district}` : ''}`
                    : '-';
                  const title = `${typeLabel(f.type)} — ${formatDateTime(f.created_at)}`;
                  const niceStatus = (f.status || 'pending')
                    .split('_')
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(' ');
                  return {
                    color,
                    children: (
                      <Badge.Ribbon text={niceStatus} color={ribbonColor}>
                        <Card
                          size="small"
                          title={title}
                          styles={{ body: { paddingTop: 12 } }}
                          style={{
                            borderColor: '#CBD5E1', // slate-300 for stronger contrast
                            borderWidth: 1
                            // borderStyle: 'solid'
                            // borderRadius: 12
                          }}
                        >
                          <Row gutter={[16, 16]}>
                            <Col xs={24} md={16}>
                              <Descriptions
                                size="small"
                                bordered
                                // Enforce two columns even on mobile
                                column={{ xs: 2, sm: 2, md: 2, lg: 2, xl: 2 }}
                                items={[
                                  {
                                    key: 'cat',
                                    label: 'Application Category',
                                    children: typeLabel(f.type),
                                    span: 2
                                  },
                                  {
                                    key: 'created',
                                    label: 'Created On',
                                    children: formatDateTime(f.created_at),
                                    span: 2
                                  },
                                  {
                                    key: 'valid',
                                    label: 'Valid Until',
                                    children: f.valid_until ? _formatDate(f.valid_until) : '-',
                                    span: 2
                                  },
                                  // { key: 'ins', label: 'Inspector', children: inspector, span: 2 },
                                  {
                                    key: 'reg',
                                    label: 'Registration No.',
                                    children: f.seed_board_registration_number || '-',
                                    span: 2
                                  }
                                ]}
                                className="custom-descriptions"
                                style={
                                  {
                                    // borderColor: '#CBD5E1'
                                    // borderWidth: 1
                                    // borderRadius: 10
                                  }
                                }
                                labelStyle={{
                                  backgroundColor: '#E2E8F0', // slate-200
                                  color: '#0F172A', // slate-900
                                  fontWeight: 600
                                }}
                                contentStyle={{
                                  textAlign: 'left'
                                }}
                              />
                            </Col>
                            <Col xs={24} md={8}>
                              <div className="flex flex-col gap-2 mt-0">
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedForm(f);
                                    setDetailsOpen(true);
                                  }}
                                >
                                  <KeenIcon icon="eye" /> View Details
                                </Button>
                                {(f.status || 'pending') === 'pending' && (
                                  <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                      setSelectedForm(f);
                                      setEditOpen(true);
                                    }}
                                  >
                                    <KeenIcon icon="note" /> Edit Application
                                  </Button>
                                )}
                                {f.status === 'approved' && (
                                  <Button
                                    variant="outline"
                                    // className="w-full text-success-700 border-success-300"
                                    onClick={() => {
                                      handlePrint(f);
                                    }}
                                  >
                                    <KeenIcon icon="printer" /> Print Certificate
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

      {/* Dialogs */}
      <UserCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreateSave}
        saving={saving}
      />
      <UserEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        data={selectedForm || undefined}
        onSave={handleEditSave}
        saving={saving}
      />
      <UserDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        data={selectedForm || undefined}
      />
    </>
  );
};

export default MySr4ApplicationForms;
