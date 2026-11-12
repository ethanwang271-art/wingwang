// app/api/albums/route.ts
// Gives the home page the list of your photo albums (read from public/photos), for the photos part after the zoom.
// With ?album=...&photo=... it instead gives the settings that one photo was shot with (shown when you hover its preview).
import { NextResponse, type NextRequest } from "next/server";
import { getFolders, getPhotoSettings } from "../../photos/data";

export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const album = q.get("album"), photo = q.get("photo");
  if (album && photo) return NextResponse.json(getPhotoSettings(album, photo));
  return NextResponse.json(getFolders());
}
