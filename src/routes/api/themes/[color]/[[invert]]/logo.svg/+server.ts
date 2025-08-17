import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ params }) => {
  const color = atob(params.color) ?? "oklch(0 0 0)";
  const invert = params.invert;

  const background = invert ? "oklch(100 0 0)" : color;
  const foreground = invert ? color : "oklch(100 0 0)";

  const svg = ` <svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
    <title>SkyCrypt Logo</title>
    <rect rx="16" height="120" width="120" y="0" x="0" fill="${background}" />
    <g fill="${foreground}">
      <rect rx="4" height="28" width="19" y="69" x="22" />
      <rect rx="4" height="75" width="19" y="22" x="50" />
      <rect rx="4" height="47" width="19" y="50" x="79" />
    </g>
  </svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
};
