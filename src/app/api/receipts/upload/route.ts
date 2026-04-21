import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOAD_DIR = process.env.RECEIPTS_DIR || path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const formData = await request.formData();
    const file = formData.get("receipt") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPG, PNG, WebP, PDF" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = path.extname(file.name) || `.${file.type.split("/")[1]}`;
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;

    // Ensure upload directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    // Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(UPLOAD_DIR, uniqueName), buffer);

    return NextResponse.json({ filename: uniqueName });
  } catch (err) {
    console.error("Receipt upload failed:", err);
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
