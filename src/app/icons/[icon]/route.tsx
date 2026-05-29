import { renderIcon } from "@/app/_pwa/icon-art";
import { PWA_ICONS } from "@/app/_pwa/icons";

// Android manifest icons, served at stable URLs (e.g. `/icons/192.png`).
// The `.png` suffix also keeps these out of the auth middleware via the
// file-extension exclusion in `src/proxy.ts`.
export function generateStaticParams() {
  return PWA_ICONS.map(({ file }) => ({ icon: file }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ icon: string }> },
) {
  const { icon } = await params;
  const spec = PWA_ICONS.find((entry) => entry.file === icon);
  if (!spec) {
    return new Response("Not found", { status: 404 });
  }
  return renderIcon(spec.size, { maskable: spec.maskable });
}
