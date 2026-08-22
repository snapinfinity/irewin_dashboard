import { redirect } from "next/navigation";

/**
 * This project is the admin dashboard only — the public job board lives in a
 * separate project. Anyone hitting the site root goes to the dashboard, and
 * the guard in `admin/layout.tsx` bounces them to /login if they aren't a
 * signed-in admin.
 */
export default function RootPage() {
  redirect("/admin");
}
