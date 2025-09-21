import { DashboardClient } from "./DashboardClient";

interface DashboardPageProps {
  searchParams: { error?: string };
}

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return <DashboardClient error={searchParams.error} />;
}