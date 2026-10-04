// app/(customer)/my-requests/page.tsx
// Seamlessly redirects to the unified Custom Project & Requests page.

import { redirect } from "next/navigation";

export default function MyRequestsPage() {
  redirect("/custom-project?tab=requests");
}

