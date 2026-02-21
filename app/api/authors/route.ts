import { NextResponse } from "next/server";
import { getDataProvider } from "@/lib/data";

export async function GET() {
  const provider = getDataProvider();
  const authors = await provider.listAuthors();
  return NextResponse.json(authors);
}
