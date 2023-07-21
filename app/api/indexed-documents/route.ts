import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const dir = path.join(process.cwd(), "./public/documents");
  const filenames = fs.readdirSync(dir);

  return NextResponse.json({
    data: filenames,
  });
}
