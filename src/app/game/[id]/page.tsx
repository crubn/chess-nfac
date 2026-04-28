import { ChessApp } from "@/components/chess/ChessApp";

export default async function GameRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ChessApp roomId={id} />;
}

