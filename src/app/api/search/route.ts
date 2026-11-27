import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ clients: [], projects: [], invoices: [] });
  }

  const userId = session.user.id;

  const [clients, projects, invoices] = await Promise.all([
    prisma.client.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { company: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take: 3,
      select: { id: true, name: true, company: true },
    }),
    prisma.project.findMany({
      where: {
        userId,
        title: { contains: query, mode: "insensitive" },
      },
      take: 3,
      select: {
        id: true,
        title: true,
        client: { select: { name: true } },
      },
    }),
    prisma.invoice.findMany({
      where: {
        userId,
        invoiceNumber: { contains: query, mode: "insensitive" },
      },
      take: 3,
      select: {
        id: true,
        invoiceNumber: true,
        client: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({ clients, projects, invoices });
}