import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserReservationsWithDetails } from "@/lib/reservations";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reservations = await getUserReservationsWithDetails(session.user.id);

  return NextResponse.json({ data: reservations });
}