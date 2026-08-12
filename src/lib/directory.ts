// Whether the Media Directory (and price comparison) is open to the public.
// While false, the directory sits behind the coming-soon/beta gate and its
// entry points across the site show a "Coming soon" state to anyone without
// beta access. Readable on both the server and the client (NEXT_PUBLIC_).
export function directoryPublic(): boolean {
  return process.env.NEXT_PUBLIC_DIRECTORY_LIVE === "true";
}
