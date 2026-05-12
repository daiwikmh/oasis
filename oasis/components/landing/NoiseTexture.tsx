export function NoiseTexture() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-screen w-screen opacity-[0.04] mix-blend-overlay"
    >
      <title>Noise</title>
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </svg>
  );
}
