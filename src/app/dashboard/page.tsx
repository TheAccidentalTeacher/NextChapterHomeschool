import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import StudentDashboardClient from "./StudentDashboardClient";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return <StudentDashboardClient userId={user.id} displayName={user.firstName ?? "Explorer"} />;
}
