// app/api/albums/route.ts
// Gives the home page the list of your photo albums (read from public/photos), for the photos part after the zoom.
import { NextResponse } from "next/server";
import { getFolders } from "../../photos/data";

export function GET() {
  return NextResponse.json(getFolders());
}
