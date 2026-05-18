import { redirect } from "next/navigation";

/** siwaky-dashboard deploy: land on the orders app; shop remains under `/[locale]/...`. */
export default function RootPage() {
  redirect("/dashboard");
}
