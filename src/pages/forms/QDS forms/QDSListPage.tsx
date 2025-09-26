import { Fragment, useState } from 'react';

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
import { LOAD_QDS_FORMS} from '@/gql/queries';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { SAVE_QDS_FORMS,  } from '@/gql/mutations';
import { QDSFormDialog } from './blocks/QDSFormDialog';

type Qds = {
  id: string | number;
  certification: string
  years_of_experience: string
  dealers_in: string
  previous_grower_number: string
  cropping_history: string
  have_adequate_isolation: boolean
  have_adequate_labor: boolean
  aware_of_minimum_standards: boolean
  signature_of_applicant: string
  grower_number: string
  registration_number: string
  status: any
  have_been_qds:boolean
  isolation_distance: number
  number_of_labors: number
  have_adequate_storage_facility: boolean
  is_not_used: boolean
  examination_category: number
}

const QDSListPage = () => {
  const { currentLayout } = useLayout();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingQds, setEditingQds] = useState<Qds | null>(null);
  const { data: listData, loading: listLoading, error } = useQuery(LOAD_QDS_FORMS);

  const [saveForm, { loading: saving }] = useMutation(SAVE_QDS_FORMS, {
    refetchQueries: [{ query: LOAD_QDS_FORMS }],
    awaitRefetchQueries: true
  });

  const handleSave = async (vals: Record<string, any>) => {
    const toBool = (v: any) => String(v).toLowerCase() === 'yes';
    const payload: any = {
    
      certification: vals.otherDocuments,
      receipt: vals.receipt,
      recommendation_id: vals.recommendationLetter,
      years_of_experience: vals.yearsOfExperience,
      dealers_in: null,
      previous_grower_number: vals.previousGrowerNumber,
      cropping_history: vals.croppingHistory,
      have_adequate_isolation: toBool(vals.adequateIsolation),
      have_adequate_labor: toBool(vals.adequateLabour),
      aware_of_minimum_standards: toBool(vals.standardSeed),
      signature_of_applicant: null,
      grower_number: null,
      registration_number: vals.previousGrowerNumber,
      have_been_qds: toBool(vals.BeenQdsProducer),
      isolation_distance: vals.isolationDistance ? parseInt(vals.isolationDistance, 10) : 0,
      status: null,
      number_of_labors: vals.numberOfLabours ? parseInt(vals.numberOfLabours, 10) : 0,
      have_adequate_storage_facility: toBool(vals.adequateStorage),
      is_not_used: null,
      examination_category: null


    };

    console.log(payload);

    try {
      await saveForm({ variables: { payload } });
      toast('QDS application saved');
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
                          {(listData?.qds_applications?.length ?? 0) as number}
                        </span>
                        <span className="text-md text-gray-700">Seed Merchants</span>
                        <span className="text-md text-gray-800 font-medium">
                          {
                            ((listData?.qds_applications || []) as any[]).filter(
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

      <QDSFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        data={
          editingQds ? editingQds : null
        }
        // data={selected || undefined}
        onSave={handleSave}
        saving={saving}
      />
    </>
  );
};

export { QDSListPage };
