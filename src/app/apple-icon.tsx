import { renderIcon } from "@/app/_pwa/icon-art";

// iOS home-screen icon. Next auto-injects
// `<link rel="apple-touch-icon" sizes="180x180" ...>` from this file.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return renderIcon(size.width);
}
