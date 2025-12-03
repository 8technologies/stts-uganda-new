import React, { ChangeEvent, forwardRef, useEffect, useState } from "react";
import { Tab, TabPanel, Tabs, TabsList } from "@/components/tabs";
import { useViewport } from "@/hooks";
import { useLanguage } from "@/i18n";
import {
  IModalSearchDocsItem,
  IModalSearchUsersItem,
  IModalSearchSettingsItem,
  IModalSearchIntegrationsItem,
} from "./";
import {
  Dialog,
  DialogBody,
  DialogContent,
} from "@/components/ui/dialog";
import { useQuery } from "@apollo/client/react";
import { TRACK_TRACE } from "@/gql/queries";
import { _formatDate } from "@/utils/Date";
import { StatusBadge } from "@/pages/QA/seedLabs/blocks/SeedLabDetailsDialog";

interface IModalSearchProps {
  open: boolean;
  onOpenChange: () => void;
  track?: boolean;
  lotNumber?: string;
}

const ModalSearch = forwardRef<HTMLDivElement, IModalSearchProps>(
  ({ open, onOpenChange, track, lotNumber }, ref) => {
    const [scrollableHeight, setScrollableHeight] = useState<number>(0);
    const [viewportHeight] = useViewport();
    
    const [seedDetails, setSeedDetails] = useState<any | null>(null);
    const [seedLab, setSeedLab] = useState<any | null>(null);
    const [motherLot, setMotherLot] = useState<any | null>(null);

    const { isRTL } = useLanguage();
    const offset = 300;
    const [searchInput, setSearchInput] = useState("");

    useEffect(() => {
      setScrollableHeight(viewportHeight - offset);
    }, [viewportHeight]);

    console.log("lotNumber", lotNumber);
    const { data, loading, error, refetch } = useQuery(TRACK_TRACE, {
      variables: { lotNumber: String(lotNumber) }
    });

    useEffect(() => {
        if (data?.trackTrace) {
          setSeedDetails(data.trackTrace.seedDetails);
          setSeedLab(data.trackTrace.seedLab);
          setMotherLot(data.trackTrace.motherLot);
          // if (!lastRefreshedAt) setLastRefreshedAt(new Date());
        }
      }, [data]);
 

    return !track ? (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-[600px] top-[5%] lg:top-[15%] translate-y-0 [&>button]:top-4 [&>button]:end-7"
          ref={ref}
        >
          {/* <DialogHeader className="py-4">
            <DialogTitle>Track and Trace</DialogTitle>
            <DialogDescription></DialogDescription>
            <KeenIcon icon="magnifier" className="text-gray-700 text-xl" />
            <input
              type="text"
              name="query"
              value={searchInput}
              className="input px-0 border-none bg-transparent shadow-none ms-2.5"
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Please enter a Lot Number"
            />
            <Button>Track</Button>
          </DialogHeader> */}
          <DialogBody className="p-0 pb-5">
            <Tabs defaultValue={1} className="">
              <TabsList className="justify-between px-5 mb-2.5">
                <div className="flex items-center gap-5">
                  <Tab value={1}>Seed Details</Tab>
                  <Tab value={2}>Seed Lab Details</Tab>
                  <Tab value={3}>Mother Lot</Tab>
                  {/* <Tab value={4}>Users</Tab>
                  <Tab value={5}>Docs</Tab>
                  <Tab value={6}>Empty</Tab>
                  <Tab value={7}>No Results</Tab> */}
                </div>
                {/* <Menu className="items-stretch">
                  <MenuItem
                    toggle="dropdown"
                    trigger="click"
                    dropdownProps={{
                      placement: isRTL() ? "bottom-start" : "bottom-end",
                      modifiers: [
                        {
                          name: "offset",
                          options: {
                            offset: [0, 0], // [skid, distance]
                          },
                        },
                      ],
                    }}
                  >
                    <MenuToggle className="btn btn-sm btn-icon btn-light btn-clear">
                      <KeenIcon icon="setting-2" />
                    </MenuToggle>
                    {DropdownCrud2()}
                  </MenuItem>
                </Menu> */}
              </TabsList>
              <div
                className="scrollable-y-auto"
                style={{ maxHeight: `${scrollableHeight}px` }}
              >
                <TabPanel value={1}>
                  <div className="menu-item" style={{ padding: "8px 25px" }}>
                    <div className="menu-link flex items-center justify-between gap-10 py-1">
                      <div className="flex items-center grow gap-2 ">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Crop
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          {seedDetails?.crop || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="menu-link flex items-center justify-between gap-10 py-1 border-t">
                      <div className="flex items-center grow gap-2 ">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Crop Variety
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          {seedDetails?.variety || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="menu-link flex items-center justify-between gap-10 py-1 border-t">
                      <div className="flex items-center grow gap-2 ">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Seed Class
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          Certified
                        </span>
                      </div>
                    </div>
                    <div className="menu-link flex items-center justify-between gap-10 py-1 border-t">
                      <div className="flex items-center grow gap-2 ">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Lot Number:
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          {data?.trackTrace?.lotNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel value={2}>
                  {/* <ModalSearchSettings items={settingsItems} /> */}
                  <div className="menu-item" style={{ padding: "12px 25px" }}>
                    <div className="menu-link flex items-center justify-between gap-10 py-1 border-t">
                      <div className="flex items-center grow gap-2 ">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Lab Test Number
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          {seedLab?.labTestNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="menu-link flex items-center justify-between gap-2 py-1 border-t">
                      <div className="flex items-center grow gap-2">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Germination capacity
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>

                      {/* Team avatars */}
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          {seedLab?.testResults?.germination?.capacity || "N/A"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="menu-link flex items-center justify-between gap-2 py-1 border-t">
                      <div className="flex items-center grow gap-2">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Purity
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>

                      {/* Team avatars */}
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          {seedLab?.testResults?.purity?.pure_seed || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="menu-link flex items-center justify-between gap-2 py-1 border-t">
                      <div className="flex items-center grow gap-2">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            P_x_G
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>

                      {/* Team avatars */}
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          80
                        </span>
                      </div>
                    </div>
                    <div className="menu-link flex items-center justify-between gap-2 py-1 border-t">
                      <div className="flex items-center grow gap-2">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Testing Method
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>

                      {/* Team avatars */}
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          {seedLab?.testResults?.testingMethod || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="menu-link flex items-center justify-between gap-2 py-1 border-t">
                      <div className="flex items-center grow gap-2">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Moisture content
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>

                      {/* Team avatars */}
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          {seedLab?.testResults?.moisture?.moisture || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="menu-link flex items-center justify-between gap-2 py-1 border-t">
                      <div className="flex items-center grow gap-2">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Test date
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>

                      {/* Team avatars */}
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          {_formatDate(seedLab?.receivedAt) || "N/A"}
                        </span>
                      </div>
                    </div>
                    <div className="menu-link flex items-center justify-between gap-2 py-1 border-t">
                      <div className="flex items-center grow gap-2">
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Status
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>

                      {/* Team avatars */}
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm text-gray-900 hover:text-primary-active">
                          {/* {get(seedLab?.status) || "N/A"} */}
                          <StatusBadge s={seedLab?.status} />
                        </span>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel value={3}>
                  {/* <ModalSearchIntegrations items={integrationsItems} /> */}
                  <div className="menu-item" style={{ padding: "12px 25px" }}>
                    <div className="menu-link flex items-center justify-between gap-2">
                      <div className="flex items-center grow gap-2">
                        {/* Logo */}

                        {/* Name and description */}
                        <div className="flex flex-col gap-0.5">
                          <a
                            href="#"
                            className="text-2sm font-semibold text-gray-900 hover:text-primary-active"
                          >
                            Mother Lot
                          </a>
                          {/* <span className="text-2xs font-medium text-gray-600">
                                    {item.description}
                                  </span> */}
                        </div>
                      </div>

                      {/* Team avatars */}
                      <div className="flex justify-end shrink-0">
                        {/* <CommonAvatars size="size-[30px]" group={item.team} /> */}
                        <span className="text-2sm font-semibold text-gray-900 hover:text-primary-active">
                          {motherLot?.motherLot || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </TabPanel>
                {/* <TabPanel value={4}>
                  <ModalSearchUsers items={usersItems} />
                </TabPanel>
                <TabPanel value={5}>
                  <ModalSearchDocs items={docsItems} />
                </TabPanel>
                <TabPanel value={6}>
                  <ModalSearchEmpty />
                </TabPanel>
                <TabPanel value={7}>
                  <ModalSearchNoResults />
                </TabPanel> */}
              </div>
            </Tabs>
          </DialogBody>
        </DialogContent>
      </Dialog>
    ) : (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-w-[600px] top-[5%] lg:top-[15%] translate-y-0 [&>button]:top-4 [&>button]:end-7"
          ref={ref}
        >
          {/* <DialogHeader className="py-4">
            <DialogTitle>Track and Trace</DialogTitle>
            <DialogDescription></DialogDescription>
            <KeenIcon icon="magnifier" className="text-gray-700 text-xl" />
            <input
              type="text"
              name="query"
              value={searchInput}
              className="input px-0 border-none bg-transparent shadow-none ms-2.5"
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Please enter a Lot Number"
            />
            <Button>Track</Button>
          </DialogHeader> */}
          <DialogBody className="p-0 pb-5">
            <Tabs defaultValue={1} className="">
              <TabsList className="justify-between px-5 mb-2.5">
                <div className="flex items-center gap-5">
                  <Tab value={1}>Seed Details</Tab>
                </div>
              </TabsList>
              <div
                className="scrollable-y-auto"
                style={{ maxHeight: `${scrollableHeight}px` }}
              >
                <TabPanel value={1}>
                  <table>
                    <thead>
                      <th>Mother Lot</th>
                      <th>Child Lot</th>
                    </thead>
                  </table>
                </TabPanel>
              </div>
            </Tabs>
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }
);

export { ModalSearch };
