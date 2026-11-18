import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import {
  ABExperiment,
  BrandKitConfig,
  CalendarScheduleItem,
  GeneratedClip,
  WinningTitleRecord,
} from "@/lib/types";
import { translateWordList } from "@/lib/viral-engine";

export async function GET() {
  const db = readDb();
  return NextResponse.json(db);
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const db = readDb();

    if (body.action === "update_clip" && body.clipId) {
      const idx = db.clips.findIndex((c) => c.id === body.clipId);
      if (idx === -1) {
        return NextResponse.json({ error: "Clip not found" }, { status: 404 });
      }
      const existing = db.clips[idx];
      const updated: GeneratedClip = {
        ...existing,
        ...body.updates,
        subtitleStyle: body.updates?.subtitleStyle
          ? { ...existing.subtitleStyle, ...body.updates.subtitleStyle }
          : existing.subtitleStyle,
        editorSettings: body.updates?.editorSettings
          ? { ...existing.editorSettings, ...body.updates.editorSettings }
          : existing.editorSettings,
      };

      if (
        body.updates?.subtitleStyle?.translateTo !== undefined &&
        body.updates.subtitleStyle.translateTo !== existing.subtitleStyle.translateTo
      ) {
        updated.words = translateWordList(
          updated.words,
          body.updates.subtitleStyle.translateTo
        );
      }

      db.clips[idx] = updated;
      writeDb(db);
      return NextResponse.json({ clip: updated, db });
    }

    if (body.action === "toggle_favorite" && body.clipId) {
      const clip = db.clips.find((c) => c.id === body.clipId);
      if (clip) {
        clip.isFavorite = !clip.isFavorite;
        writeDb(db);
      }
      return NextResponse.json({ db });
    }

    if (body.action === "duplicate_clip" && body.clipId) {
      const orig = db.clips.find((c) => c.id === body.clipId);
      if (orig) {
        const copy: GeneratedClip = {
          ...JSON.parse(JSON.stringify(orig)),
          id: `${orig.id}-copy-${Date.now().toString().slice(-4)}`,
          title: `${orig.title} (Variant B)`,
          createdAt: new Date().toISOString(),
        };
        db.clips.unshift(copy);
        writeDb(db);
      }
      return NextResponse.json({ db });
    }

    if (body.action === "delete_clip" && body.clipId) {
      db.clips = db.clips.filter((c) => c.id !== body.clipId);
      db.projects.forEach((p) => {
        p.clipIds = p.clipIds.filter((id) => id !== body.clipId);
      });
      writeDb(db);
      return NextResponse.json({ db });
    }

    if (body.action === "update_brand_kit" && body.brandKit) {
      const updatedKit: BrandKitConfig = { ...db.brandKit, ...body.brandKit };
      db.brandKit = updatedKit;
      const profiles = db.brandProfiles || [];
      const existingIdx = profiles.findIndex((p) => p.id === updatedKit.id);
      if (existingIdx >= 0) {
        profiles[existingIdx] = updatedKit;
      } else {
        profiles.push(updatedKit);
      }
      db.brandProfiles = profiles;
      writeDb(db);
      return NextResponse.json({ db });
    }

    if (body.action === "create_brand_profile" && body.brandKit) {
      const newProfile: BrandKitConfig = {
        ...body.brandKit,
        id: `bk-${Date.now().toString().slice(-4)}`,
      };
      db.brandKit = newProfile;
      db.brandProfiles = [newProfile, ...(db.brandProfiles || [])];
      writeDb(db);
      return NextResponse.json({ db });
    }

    if (body.action === "save_ab_experiment" && body.experiment) {
      const exp = body.experiment as ABExperiment;
      const list = db.abExperiments || [];
      const idx = list.findIndex((e) => e.id === exp.id);
      if (idx >= 0) {
        list[idx] = exp;
      } else {
        list.unshift(exp);
      }
      db.abExperiments = list;
      writeDb(db);
      return NextResponse.json({ db });
    }

    if (body.action === "delete_ab_experiment" && body.experimentId) {
      db.abExperiments = (db.abExperiments || []).filter(
        (e) => e.id !== body.experimentId
      );
      writeDb(db);
      return NextResponse.json({ db });
    }

    if (body.action === "save_calendar_item" && body.calendarItem) {
      const item = body.calendarItem as CalendarScheduleItem;
      const list = db.calendarItems || [];
      const idx = list.findIndex((c) => c.id === item.id);
      if (idx >= 0) {
        list[idx] = item;
      } else {
        list.unshift(item);
      }
      db.calendarItems = list;
      writeDb(db);
      return NextResponse.json({ db });
    }

    if (body.action === "delete_calendar_item" && body.calendarId) {
      db.calendarItems = (db.calendarItems || []).filter(
        (c) => c.id !== body.calendarId
      );
      writeDb(db);
      return NextResponse.json({ db });
    }

    if (body.action === "log_performance" && body.record) {
      const rec = body.record as WinningTitleRecord;
      db.winningTitles = [rec, ...(db.winningTitles || [])];
      writeDb(db);
      return NextResponse.json({ db });
    }

    if (body.action === "update_settings" && body.settings) {
      db.settings = { ...db.settings, ...body.settings };
      writeDb(db);
      return NextResponse.json({ db });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update state" },
      { status: 500 }
    );
  }
}
