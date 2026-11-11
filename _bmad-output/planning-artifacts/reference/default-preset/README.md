# Default preset: approved look

Approved by the owner on 2026-11-11. Every new client's first preset (Story 2.1) starts with these settings, so codes drawn in production by `packages/render` look like `approved-reference.png`. A client can change its preset later through the preset editor (Story 2.3).

`approved-reference.png` was made outside Chhaap with a one-off script, for a static code. It shows the look, not the exact pixels: Chhaap's codes encode a different URL (`https://chhaap.link/<slug>`), and qr-code-styling may choose a different mask pattern. "Consistent" means the same style, not identical images.

## The look

| Part | Approved look |
| --- | --- |
| Data modules | Round dots, slightly smaller than a module so they don't touch |
| Corner markers (finder patterns) | Rounded-square outer ring, rounded-square centre |
| Colours | Black `#000000` on white `#ffffff` |
| Error correction | H (always, so a logo can be added without changing the default) |
| Quiet zone | 4 modules on every side (AD-2) |
| Logo | Centred on a cleared white area; no dots behind it; covers well under 30% of the code (FR-5) |

## qr-code-styling 1.9.2 settings

```js
{
  qrOptions: { errorCorrectionLevel: 'H' },
  dotsOptions: { type: 'dots', color: '#000000' },
  cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
  cornersDotOptions: { type: 'rounded', color: '#000000' }, // confirm the closest rounded-square type in 1.9.2 (Story 2.2)
  backgroundOptions: { color: '#ffffff' },
  imageOptions: { hideBackgroundDots: true, imageSize: 0.3, margin: 4 },
}
```

The 4-module quiet zone is set by `packages/render` (AD-2), not by the preset.

## Sumo Computers logo

`sumo-computers-logo-bw.png` is Sumo Computers' logo turned into a solid black silhouette on a transparent background (1040 × 1184 px, smoothed from the 65 × 74 px original). Upload it to Sumo Computers' preset (Story 2.4) once that client is created. The approved reference render uses it.
