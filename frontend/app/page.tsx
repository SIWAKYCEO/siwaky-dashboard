import { redirect } from "next/navigation";

/** Dashboard project only — land on the operator app. */
export default function RootPage() {
  redirect("/dashboard");
}
