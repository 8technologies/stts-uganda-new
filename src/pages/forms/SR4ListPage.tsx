import { Fragment, useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';

import { Container } from '@/components/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarPageTitle
} from '@/partials/toolbar';

import { NetworkUserTableTeamCrewContent } from './NetworkUserTableTeamCrewContent';
import { useLayout } from '@/providers';
import { UserCreateDialog } from './blocks/UserCreateDialog';

import { LOAD_SR4_FORMS } from '@/gql/queries';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { SAVE_SR4_FORMS } from '@/gql/mutations';

const SR4ListPage = () => {
  const { currentLayout } = useLayout();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: listData, loading: listLoading } = useQuery(LOAD_SR4_FORMS);
  const [saveForm, { loading: saving }] = useMutation(SAVE_SR4_FORMS, {
    refetchQueries: [{ query: LOAD_SR4_FORMS }],
    awaitRefetchQueries: true
  });

  const handleSave = async (vals: Record<string, any>) => {
    const toBool = (v: any) => String(v).toLowerCase() === 'yes';
    const payload: any = {
      name_of_applicant: vals.applicantName,
      address: vals.address,
      phone_number: vals.phone,
      company_initials: vals.initials,
      premises_location: vals.premises,
      years_of_experience: vals.yearsOfExperience || undefined,
      experienced_in: vals.experienceIn || undefined,
      dealers_in: vals.dealersIn || undefined,
      marketing_of: vals.marketingOf || undefined,
      have_adequate_land: toBool(vals.adequateLand),
      land_size: vals.landSize || undefined,
      have_adequate_equipment: toBool(vals.adequateEquipment),
      have_contractual_agreement: toBool(vals.contractualAgreement),
      have_adequate_field_officers: toBool(vals.fieldOfficers),
      have_conversant_seed_matters: toBool(vals.conversantSeedMatters),
      have_adequate_land_for_production: toBool(vals.adequateLandForProduction),
      have_internal_quality_program: toBool(vals.internalQualityProgram),
      have_adequate_storage: toBool(vals.adequateStorage),
      source_of_seed: vals.sourceOfSeed || undefined,
      seed_board_registration_number: vals.registrationNumber || undefined,
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

  return (
    <>
      <Fragment>
        {currentLayout?.name === 'demo1-layout' && (
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
                        <span className="text-md text-gray-700">Applications:</span>
                        <span className="text-md text-gray-800 font-medium me-2">
                          {(listData?.sr4_applications?.length ?? 0) as number}
                        </span>
                        <span className="text-md text-gray-700">Seed Merchants</span>
                        <span className="text-md text-gray-800 font-medium">
                          {
                            ((listData?.sr4_applications || []) as any[]).filter(
                              (f) => f.type === 'seed_merchant'
                            ).length
                          }
                        </span>
                      </>
                    )}
                  </div>
                </ToolbarDescription>
              </ToolbarHeading>
              <ToolbarActions>
                {/* <a href="#" className="btn btn-sm btn-light">
                  Import CSV
                </a> */}
                <a
                  href="#"
                  onClick={() => {
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
          <NetworkUserTableTeamCrewContent />
        </Container>
      </Fragment>
      <UserCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        // data={selected || undefined}
        onSave={handleSave}
        saving={saving}
      />
    </>
  );
};

export { SR4ListPage };
