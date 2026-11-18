import { NextRequest, NextResponse } from "next/server";
import {
  createDbBackup,
  getDbDiagnostics,
  readDb,
  resetDbToSeed,
  restoreDbBackup,
} from "@/lib/db";

export async function GET() {
  return NextResponse.json({
    diagnostics: getDbDiagnostics(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, label, fileName } = body as {
      action: "backup" | "restore" | "reset_seed";
      label?: string;
      fileName?: string;
    };

    if (action === "backup") {
      const backup = createDbBackup(label || "manual");
      return NextResponse.json({
        backup,
        diagnostics: getDbDiagnostics(),
        db: readDb(),
      });
    }

    if (action === "restore") {
      if (!fileName) {
        return NextResponse.json(
          { error: "fileName is required to restore a backup" },
          { status: 400 }
        );
      }
      const db = restoreDbBackup(fileName);
      return NextResponse.json({
        restored: fileName,
        diagnostics: getDbDiagnostics(),
        db,
      });
    }

    if (action === "reset_seed") {
      createDbBackup("pre-reset-auto");
      const db = resetDbToSeed();
      return NextResponse.json({
        reset: true,
        diagnostics: getDbDiagnostics(),
        db,
      });
    }

    return NextResponse.json({ error: "Invalid database action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Database operation failed" },
      { status: 500 }
    );
  }
}
