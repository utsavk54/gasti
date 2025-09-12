import GastiRoom from "@/components/Gasti-Room"

interface PageProps {
  params: { id: string };
}

export default async function Gasti({ params }: PageProps) {
  const gastiId = await params.id; // get gasti_id from URL

  return <GastiRoom gastiId={gastiId} />;
}