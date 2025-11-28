import { Fragment, useState } from "react";

import { Container } from "@/components/container";
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle,
} from "@/partials/toolbar";

import { NetworkUserTableTeamCrewContent } from "./NetworkUserTableTeamCrewContent";
import { useLayout } from "@/providers";
import { SeedLabCreateDialog } from "./blocks/SeedLabCreateDialog";
import { LOAD_SEED_LABS, LOAD_SR6_FORMS } from "@/gql/queries";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SAVE_SR6_FORMS } from "@/gql/mutations";

const SeedLabListPage = () => {
  const { currentLayout } = useLayout();
  const [createOpen, setCreateOpen] = useState(false);
  // const { data: listData, loading: listLoading, error } = useQuery(LOAD_SR6_FORMS);
  const {
    data: listData,
    loading: listLoading,
    error,
  } = useQuery(LOAD_SEED_LABS);

  const [saveForm, { loading: saving }] = useMutation(SAVE_SR6_FORMS, {
    refetchQueries: [{ query: LOAD_SEED_LABS }],
    awaitRefetchQueries: true,
  });

  const handleSave = async (vals: Record<string, any>) => {
    const toBool = (v: any) => String(v).toLowerCase() === "yes";
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

  return (
    <>
      <Fragment>
        {currentLayout?.name === "demo1-layout" && (
          <Container>
            <Toolbar>
              <ToolbarHeading>
                <ToolbarPageTitle />
                <ToolbarDescription>
                  <div className="flex items-center flex-wrap gap-3 font-medium">
                    {listLoading ? (
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
                          {(listData?.getLabInspections?.length ?? 0) as number}
                        </span>
                      </>
                    )}
                  </div>
                </ToolbarDescription>
              </ToolbarHeading>
            </Toolbar>
          </Container>
        )}

        <Container>
          <NetworkUserTableTeamCrewContent />
        </Container>
      </Fragment>

      <SeedLabCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        // data={selected || undefined}
        onSave={handleSave}
        saving={saving}
      />
    </>
  );
};

export { SeedLabListPage };
