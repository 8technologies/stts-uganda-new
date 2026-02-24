import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";

import { Container } from "@/components/container";
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from "@/partials/toolbar";
import { KeenIcon } from "@/components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useLayout } from "@/providers";
import { useAuthContext } from "@/auth";

import { LOAD_SR6_FORMS } from "@/gql/queries";
import { SAVE_SR6_FORMS } from "@/gql/mutations";

import { SR6CreateDialog } from "../SR6 forms/blocks/SR6CreateDialog";
import { SR6EditDialog } from "../SR6 forms/blocks/SR6EditDialog";
import { SR6DetailsDialog } from "../SR6 forms/blocks/SR6DetailsDialog";
import { _formatDate, formatDateTime } from "@/utils/Date";
import { toast } from "sonner";

// antd timeline + card with ribbon badge
import {
  Badge,
  Card,
  ConfigProvider,
  Descriptions,
  Row,
  Col,
  Timeline,
} from "antd";

type Sr6Application = {
  id: string;
  user_id: string;
  created_at?: string;
  valid_from?: string | null;
  valid_until?: string | null;
  type: "plant_breeder" | "seed_producer";
  status?: string | null;
  previous_grower_number?: string | null;
  years_of_experience?: string | null;
  inspector?: { name?: string; district?: string } | null;
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
  t === "plant_breeder" ? "Plant Breeder" : "Seed Producer";

const statusToColor = (status?: string | null) => {
  switch (status) {
    case "accepted":
    case "approved":
    case "recommended":
      return "success";
    case "rejected":
    case "halted":
      return "danger";
    case "assigned_inspector":
    case "pending":
    default:
      return "primary";
  }
};

const MySr6ApplicationForms = () => {
  const { currentLayout } = useLayout();
  const { currentUser } = useAuthContext();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<Sr6Application | null>(null);

  const { data, loading, error, refetch } = useQuery(LOAD_SR6_FORMS);
  const [saveForm, { loading: saving }] = useMutation(SAVE_SR6_FORMS, {
    refetchQueries: [{ query: LOAD_SR6_FORMS }],
    awaitRefetchQueries: true,
  });

  const myForms = useMemo(() => {
    const forms = ((data?.sr6_applications || []) as Sr6Application[]) || [];
    if (!currentUser?.id) return forms;
    return forms.filter((f) => String(f.user_id) === String(currentUser.id));
  }, [data?.sr6_applications, currentUser?.id]);

  const breedersCount = useMemo(
    () => myForms.filter((f) => f.type === "plant_breeder").length,
    [myForms],
  );

  const handleCreateSave = async (vals: Record<string, any>) => {
    const toBool = (v: any) => String(v).toLowerCase() === "yes";
    const crops = vals.selectedCrops ? vals.selectedCrops.map((c: any) => c.value) : [];
    const payload: any = {
      years_of_experience: vals.yearsOfExperience,
      dealers_in: null,
      previous_grower_number: vals.previousGrowerNumber,
      cropping_history: vals.croppingHistory,
      have_adequate_isolation: toBool(vals.adequateIsolation),
      have_adequate_labor: toBool(vals.adequateLabour),
      aware_of_minimum_standards: toBool(vals.standardSeed),
      signature_of_applicant: null,
      grower_number: null,
      selectedCrops: crops,
      inspector_id: null,
      status_comment: null,
      recommendation: null,
      have_adequate_storage: toBool(vals.adequateStorage),
      seed_grower_in_past: toBool(vals.BeenSeedGrower),
      type: vals.applicationCategory,
      id: vals?.id || null,
      receipt: vals.receipt,
      other_documents: vals.otherDocuments,
    };

    console.log('Payload...', payload);

    try {
      await saveForm({ variables: { payload } });
      toast("SR6 application saved");
      setCreateOpen(false);
    } catch (e: any) {
      toast("Failed to save application", {
        description: e?.message ?? "Unknown error",
      });
    }
  };

  const handleEditSave = async (vals: Record<string, any>) => {
    if (!selectedForm?.id) return;
    const toBool = (v: any) => String(v).toLowerCase() === "yes";
    const crops = vals.selectedCrops ? vals.selectedCrops.map((c: any) => c.value) : [];
    
    const payload: any = {
      id: selectedForm.id,
      years_of_experience: vals.yearsOfExperience,
      dealers_in: null,
      previous_grower_number: vals.previousGrowerNumber,
      cropping_history: vals.croppingHistory,
      have_adequate_isolation: toBool(vals.adequateIsolation),
      have_adequate_labor: toBool(vals.adequateLabour),
      aware_of_minimum_standards: toBool(vals.standardSeed),
      signature_of_applicant: null,
      grower_number: null,
      selectedCrops: crops,
      status: vals.status,
      inspector_id: null,
      status_comment: null,
      recommendation: null,
      have_adequate_storage: toBool(vals.adequateStorage),
      seed_grower_in_past: toBool(vals.BeenSeedGrower),
      type: vals.applicationCategory,
    };

    console.log('Edit Payload...', payload);

    try {
      await saveForm({ variables: { payload } });
      toast("SR6 application updated");
      setEditOpen(false);
    } catch (e: any) {
      toast("Failed to update application", {
        description: e?.message ?? "Unknown error",
      });
    }
  };

  return (
    <>
      <Fragment>
        {currentLayout?.name === "demo1-layout" && (
          <Container>
            <Toolbar>
              <ToolbarHeading>
                <ToolbarPageTitle text="SR6 - Grower/Producer" />
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
                        <span className="text-md text-gray-700">
                          Applications:
                        </span>
                        <span className="text-md text-gray-800 font-medium me-2">
                          {myForms.length}
                        </span>
                        <span className="text-md text-gray-700">
                          Plant Breeders
                        </span>
                        <span className="text-md text-gray-800 font-medium">
                          {breedersCount}
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
                  {saving ? "Saving…" : "Create Application"}
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
                Failed to load SR6 applications
                <button className="btn btn-sm" onClick={() => refetch()}>
                  <KeenIcon icon="arrow-rotate-right" /> Retry
                </button>
              </div>
              <div className="text-xs text-gray-600">
                {String(error.message || "Unknown error")}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && myForms.length === 0 && (
            <div className="card p-8 flex flex-col items-center gap-4">
              <div className="text-gray-800 font-medium">
                No SR6 applications yet
              </div>
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <KeenIcon icon="plus" /> Create Application
              </Button>
            </div>
          )}

          {/* Timeline list (Ant Design) */}
          <ConfigProvider
            key="sr6-timeline"
            theme={{
              components: {
                Timeline: {
                  tailColor: "#E5E7EB", // gray-200
                },
                Card: {
                  headerBg: "#F8FAFC",
                  headerHeightSM: 40,
                },
              },
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
                    f.status === "approved"
                      ? "green"
                      : f.status === "recommended" || f.status === "accepted"
                        ? "blue"
                        : f.status === "rejected" || f.status === "halted"
                          ? "red"
                          : "orange";
                  const ribbonColor = color as any;
                  const inspector = f.inspector
                    ? `${f.inspector?.name ?? ""}${f.inspector?.district ? ` - ${f.inspector.district}` : ""}`
                    : "-";
                  //   const title = `${typeLabel(f.type)}`;
                  const title = `${typeLabel(f.type)} — ${formatDateTime(f.created_at)}`;
                  const niceStatus = (f.status || "pending")
                    .split("_")
                    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
                    .join(" ");
                  return {
                    color,
                    children: (
                      <Badge.Ribbon text={niceStatus} color={ribbonColor}>
                        <Card
                          size="small"
                          title={title}
                          styles={{ body: { paddingTop: 12 } }}
                          style={{
                            borderColor: "#CBD5E1",
                            borderWidth: 1,
                            // borderStyle: 'solid',
                            // borderRadius: 12
                          }}
                        >
                          <Row gutter={[16, 16]}>
                            <Col xs={24} md={16}>
                              <Descriptions
                                size="small"
                                bordered
                                column={{ xs: 2, sm: 2, md: 2, lg: 2, xl: 2 }}
                                items={[
                                  {
                                    key: "cat",
                                    label: "Application Category",
                                    children: typeLabel(f.type),
                                    span: 2,
                                  },
                                  {
                                    key: "created",
                                    label: "Created On",
                                    children: formatDateTime(f.created_at),
                                    span: 2,
                                  },
                                  {
                                    key: "valid",
                                    label: "Valid Until",
                                    children: f.valid_until
                                      ? _formatDate(f.valid_until)
                                      : "-",
                                    span: 2,
                                  },
                                  // { key: 'ins', label: 'Inspector', children: inspector, span: 2 },
                                  {
                                    key: "prev",
                                    label: "Previous Grower No.",
                                    children: f.previous_grower_number || "-",
                                    span: 2,
                                  },
                                  {
                                    key: "yoe",
                                    label: "Years of Experience",
                                    children: f.years_of_experience || "-",
                                    span: 2,
                                  },
                                ]}
                                style={{
                                  borderColor: "#CBD5E1",
                                  //   borderWidth: 1,
                                  //   borderRadius: 10
                                }}
                                labelStyle={{
                                  backgroundColor: "#E2E8F0",
                                  color: "#0F172A",
                                  fontWeight: 600,
                                  width: 200,
                                }}
                                contentStyle={{ textAlign: "left" }}
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
                                {(f.status || "pending") === "pending" && (
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
                                {f.status === "approved" && (
                                  <Button
                                    variant="outline"
                                    // className="w-full text-success-700 border-success-300"
                                    onClick={() => {
                                      setSelectedForm(f);
                                      setDetailsOpen(true);
                                    }}
                                  >
                                    <KeenIcon icon="printer" /> Print
                                    Certificate
                                  </Button>
                                )}
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      </Badge.Ribbon>
                    ),
                  };
                })}
              />
            )}
          </ConfigProvider>
        </Container>
      </Fragment>

      {/* Dialogs */}
      <SR6CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreateSave}
        saving={saving}
      />
      <SR6EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        data={selectedForm || undefined}
        onSave={handleEditSave}
        saving={saving}
      />
      <SR6DetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        data={selectedForm || undefined}
      />
    </>
  );
};

export default MySr6ApplicationForms;
