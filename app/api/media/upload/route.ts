import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getServerSession } from "@/lib/auth/session";
import { getDataProvider } from "@/lib/data";

const BUCKET_CONFIG: Record<
  string,
  { maxBytes: number; allowedMimes: string[] }
> = {
  "post-covers": {
    maxBytes: 5_242_880,
    allowedMimes: ["image/jpeg", "image/png", "image/webp"],
  },
  "post-content": {
    maxBytes: 10_485_760,
    allowedMimes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
    ],
  },
  avatars: {
    maxBytes: 2_097_152,
    allowedMimes: ["image/jpeg", "image/png", "image/webp"],
  },
};

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart body" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  const bucket = formData.get("bucket");
  const altText = formData.get("altText");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  if (!bucket || typeof bucket !== "string" || !BUCKET_CONFIG[bucket]) {
    return NextResponse.json(
      {
        error:
          "Invalid bucket. Must be post-covers, post-content, or avatars.",
      },
      { status: 400 }
    );
  }

  const config = BUCKET_CONFIG[bucket];

  if (!config.allowedMimes.includes(file.type)) {
    return NextResponse.json(
      {
        error: `Unsupported MIME type "${file.type}" for bucket "${bucket}". Allowed: ${config.allowedMimes.join(", ")}`,
      },
      { status: 400 }
    );
  }

  if (file.size > config.maxBytes) {
    return NextResponse.json(
      {
        error: `File size ${file.size} bytes exceeds the ${config.maxBytes}-byte limit for bucket "${bucket}"`,
      },
      { status: 413 }
    );
  }

  const timestamp = Date.now();
  const storagePath = `${bucket}/${session.user.id}/${timestamp}-${file.name}`;

  // -------------------------------------------------------------------------
  // Phase 2: upload to Supabase Storage
  // -------------------------------------------------------------------------
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase") {
    const { supabaseAdmin } = await import("@/lib/supabase/service");

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(storagePath);

    const provider = getDataProvider();
    const mediaItem = await provider.createMediaItem({
      filename: file.name,
      storagePath,
      url: publicUrl,
      mimeType: file.type,
      sizeBytes: file.size,
      altText:
        typeof altText === "string" && altText.length > 0 ? altText : undefined,
      uploadedBy: session.user.id,
    });

    return NextResponse.json(mediaItem, { status: 201 });
  }

  // -------------------------------------------------------------------------
  // Phase 1 mock: generate a Picsum placeholder using the filename as seed
  // -------------------------------------------------------------------------
  const seed = encodeURIComponent(
    file.name.replace(/\.[^.]+$/, "") || uuidv4()
  );
  const mockUrl = `https://picsum.photos/seed/${seed}/1200/630`;

  const provider = getDataProvider();
  const mediaItem = await provider.createMediaItem({
    filename: file.name,
    storagePath,
    url: mockUrl,
    mimeType: file.type,
    sizeBytes: file.size,
    altText:
      typeof altText === "string" && altText.length > 0 ? altText : undefined,
    uploadedBy: session.user.id,
  });

  return NextResponse.json(mediaItem, { status: 201 });
}
