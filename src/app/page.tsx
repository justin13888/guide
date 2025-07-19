import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import UI from "~/app/_components/ui";

export default async function Home() {
  // const hello = await api.planner.hello({ text: "from f" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <div className="flex min-h-full absolute inset-0">
      <UI></UI>
    </div>
  );
}
