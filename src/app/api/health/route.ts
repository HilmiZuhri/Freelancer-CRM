import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        usersCount: userCount,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        message: "Failed to connect to PostgreSQL database.",
      },
      { status: 500 }
    );
  }
}