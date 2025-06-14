import Link from "next/link";

import { LatestPost } from "~/app/_components/post";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";


import SideBar from "~/app/_components/sidebar";
import Planner from "~/app/_components/planner";

export default async function Home() {
  const hello = await api.planner.hello({ text: "from f" });
  const session = await auth();

  if (session?.user) {
    void api.post.getLatest.prefetch();
  }

  return (
    <div className="flex min-h-full absolute inset-0">
      <div className="flex-1">
        <Planner/>
      </div>
      <SideBar />
    </div>
  );
}
