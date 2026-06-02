import { ReviewsDashboard } from "@/components/dashboard/ReviewsDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function ReviewsPage() {
  return <ReviewsDashboard />;
}
