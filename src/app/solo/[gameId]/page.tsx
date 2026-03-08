import SoloGameClient from "./SoloGameClient";

export default async function SoloGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  return <SoloGameClient gameId={gameId} />;
}
