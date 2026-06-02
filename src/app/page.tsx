import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RootPage(): Promise<never> {
  const session = await getSession();
  redirect(session ? "/chat" : "/login");
}
