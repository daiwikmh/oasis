// PostHog browser SDK wiring lands with spec 13 (web deploy).
// Stubbed for now so callsites compile and behave as no-ops without a key.

type Props = Record<string, string | number | boolean | null>;

export function track(_event: string, _props?: Props) {
  // no-op until PostHog browser SDK is wired
}

export function identify(_userId: string, _props?: Props) {
  // no-op until PostHog browser SDK is wired
}
