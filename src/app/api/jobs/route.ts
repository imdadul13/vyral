import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import {
  cancelProcessingJob,
  enqueueProcessingJob,
  getWorkerQueueHealth,
  recoverFailedJobs,
  retryProcessingJob,
  updateJobProgress,
} from "@/lib/worker-queue";
import { ProcessingJob } from "@/lib/types";

export async function GET() {
  const db = readDb();
  return NextResponse.json({
    health: getWorkerQueueHealth(),
    jobs: db.jobs,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, jobId, projectId, projectTitle, clipId, jobType, progress, status, logLine } =
      body as {
        action: "enqueue" | "progress" | "retry" | "cancel" | "recover_all";
        jobId?: string;
        projectId?: string;
        projectTitle?: string;
        clipId?: string;
        jobType?: ProcessingJob["jobType"];
        progress?: number;
        status?: ProcessingJob["status"];
        logLine?: string;
      };

    if (action === "enqueue") {
      if (!projectId || !projectTitle || !jobType) {
        return NextResponse.json(
          { error: "projectId, projectTitle, and jobType are required" },
          { status: 400 }
        );
      }
      const result = enqueueProcessingJob({
        projectId,
        projectTitle,
        clipId,
        jobType,
        initialLog: logLine,
      });
      return NextResponse.json({
        ...result,
        health: getWorkerQueueHealth(),
        db: readDb(),
      });
    }

    if (action === "progress" && jobId) {
      const updated = updateJobProgress(jobId, { status, progress, logLine });
      if (!updated) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({ job: updated, db: readDb() });
    }

    if (action === "retry" && jobId) {
      const retried = retryProcessingJob(jobId);
      if (!retried) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({ job: retried, db: readDb() });
    }

    if (action === "cancel" && jobId) {
      const cancelled = cancelProcessingJob(jobId);
      if (!cancelled) {
        return NextResponse.json({ error: "Job not found" }, { status: 404 });
      }
      return NextResponse.json({ job: cancelled, db: readDb() });
    }

    if (action === "recover_all") {
      const result = recoverFailedJobs();
      return NextResponse.json({ ...result, db: readDb() });
    }

    return NextResponse.json({ error: "Unsupported job action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Worker queue error" },
      { status: 500 }
    );
  }
}
