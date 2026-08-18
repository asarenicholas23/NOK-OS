export interface Resource {
  id: string;
  title: string;
  description: string;
  // For available resources: the "make a copy" / download URL, opened on unlock.
  // For comingSoon resources: an internal route (e.g. a waitlist page) instead.
  fileUrl: string;
  category: string;
  // Not yet unlockable — card links out (e.g. to a waitlist) instead of
  // showing the lead-capture form.
  comingSoon?: boolean;
}

export const RESOURCES: Resource[] = [
  {
    id: "leads-tracker",
    title: "Leads Management Tracker",
    description: "A simple sheet to track every lead from first contact to close.",
    // "Make a copy" link (Sheets /copy URL) so visitors get their own editable
    // copy instead of opening the shared master template.
    fileUrl: "https://docs.google.com/spreadsheets/d/1mipCGjB2kIOr1sBMPfdZTp21MjLOP2VKq84Nta6SCVw/copy",
    category: "Sales & Operations"
  },
  {
    id: "ig-health-check",
    title: "Instagram Health Check & Audit Tool",
    description: "An automated audit of your bio conversion, grid rhythm, and engagement consistency.",
    fileUrl: "/ighealthcheck",
    category: "Marketing Tools",
    comingSoon: true
  }
];
