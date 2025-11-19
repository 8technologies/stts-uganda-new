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
import { SR6CreateDialog } from './blocks/SR6CreateDialog';
import { LOAD_SR6_FORMS } from '@/gql/queries';
import { useMutation, useQuery } from '@apollo/client/react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { SAVE_SR6_FORMS } from '@/gql/mutations';

const SR6ListPage = () => {
  const { currentLayout } = useLayout();
  const [createOpen, setCreateOpen] = useState(false);
  const { data: listData, loading: listLoading, error } = useQuery(LOAD_SR6_FORMS);

  const [saveForm, { loading: saving }] = useMutation(SAVE_SR6_FORMS, {
    refetchQueries: [{ query: LOAD_SR6_FORMS }],
    awaitRefetchQueries: true
  });

  const handleSave = async (vals: Record<string, any>) => {
    const toBool = (v: any) => String(v).toLowerCase() === 'yes';
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
      other_documents: vals.otherDocuments
    };

    try {
      await saveForm({ variables: { payload } });
      toast('SR6 application saved');
      setCreateOpen(false);
    } catch (e: any) {
      toast('Failed to save application', { description: e?.message ?? 'Unknown error' });
    }
  };

  // return (
  //   <>
  //   <Fragment>
  //     {currentLayout?.name === 'demo1-layout' && (
  //       <Container>
  //         <Toolbar>
  //           <ToolbarHeading>
  //             <ToolbarPageTitle />
  //             <ToolbarDescription>
  //               <div className="flex items-center flex-wrap gap-1.5 font-medium">
  //                 <span className="text-md text-gray-700">All Members:</span>
  //                 <span className="text-md text-gray-800 font-medium me-2">49,053</span>
  //                 <span className="text-md text-gray-700">Pro Licenses</span>
  //                 <span className="text-md text-gray-800 font-medium">724</span>
  //               </div>
  //             </ToolbarDescription>
  //           </ToolbarHeading>
  //           <ToolbarActions>
  //             <a href="#" className="btn btn-sm btn-light">
  //               Import CSV
  //             </a>
  //             <a href="#" onClick={() => {setCreateOpen(true); }} className="btn btn-sm btn-primary">
  //               Add Member
  //             </a>
  //           </ToolbarActions>
  //         </Toolbar>
  //       </Container>
  //     )}

  //     <Container>
  //       <NetworkUserTableTeamCrewContent />
  //     </Container>
  //   </Fragment>
  //   <SR6CreateDialog
  //       open={createOpen}
  //       onOpenChange={setCreateOpen}
  //       // data={selected || undefined}
  //       onSave={(vals) => console.log('Save edit', {vals })}
  //   />
  //   </>
  // );

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
                          {(listData?.sr6_applications?.length ?? 0) as number}
                        </span>
                        <span className="text-md text-gray-700">Seed Merchants</span>
                        <span className="text-md text-gray-800 font-medium">
                          {
                            ((listData?.sr6_applications || []) as any[]).filter(
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

      <SR6CreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        // data={selected || undefined}
        onSave={handleSave}
        saving={saving}
      />
    </>
  );
};

export { SR6ListPage };
