import ProjectorClient from "./ProjectorClient";

export default function ProjectorPage({
  searchParams,
}: {
  searchParams?: Record<string, string>;
}) {
  const gameId = searchParams?.game ?? null;
  return <ProjectorClient initialGameId={gameId} />;
}
