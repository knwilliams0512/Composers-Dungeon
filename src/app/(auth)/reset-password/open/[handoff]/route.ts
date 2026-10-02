import { NextResponse } from "next/server";
import { isLoopbackHost, redeemResetHandoff } from "@/lib/reset-handoff";

/**
 * Follows a local hand-over to the reset form.
 *
 * A route handler rather than a page, because the whole job is the redirect:
 * the token exists for the length of one Location header and never appears in
 * anything rendered. Redeeming happens here, on the server, so the handle in
 * the page is worth nothing on another machine and nothing twice.
 */
export async function GET(
  request: Request,
  { params }: { params: { handoff: string } }
) {
  const headers = request.headers;
  if (
    !isLoopbackHost(headers.get("host"), {
      for: headers.get("x-forwarded-for"),
      host: headers.get("x-forwarded-host"),
      raw: headers.get("forwarded"),
    })
  ) {
    return NextResponse.redirect(new URL("/forgot-password?handoff=remote", request.url));
  }

  const path = await redeemResetHandoff(params.handoff);
  if (!path) {
    // Expired, already used, or never real — the three are deliberately one
    // answer, since telling them apart tells somebody which addresses exist.
    return NextResponse.redirect(new URL("/forgot-password?handoff=spent", request.url));
  }
  return NextResponse.redirect(new URL(path, request.url));
}

/** Nothing here is cacheable: each visit spends a different single-use handle. */
export const dynamic = "force-dynamic";
