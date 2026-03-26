import TriviaRoom from "@/components/TriviaRoom";

export default async function TriviaCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <TriviaRoom code={code.toUpperCase()} />;
}
