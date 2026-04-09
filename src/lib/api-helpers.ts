import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function serverError(message = "Internal server error") {
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return badRequest(
      err.issues
        .map((e) => `${e.path.map(String).join(".")}: ${e.message}`)
        .join("; ")
    );
  }
  console.error(err);
  return serverError();
}

/**
 * Demo user ID used in dev/demo mode.
 * In production, replace with real auth (NextAuth, Clerk, etc.).
 */
export const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "demo-user-001";

/**
 * Gets the current user ID from the request.
 * TODO: Replace with proper session/auth middleware.
 */
export function getUserId(_req: Request): string {
  return DEMO_USER_ID;
}
