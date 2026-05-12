export const PUSD_DECIMALS = 6;
export const PUSD_SYMBOL = "PUSD";

export const PUSD_ADDRESSES = {
  ethereum: "0xfaf0cee6b20e2aaa4b80748a6af4cd89609a3d78",
  solana:   "CZzgUBvxaMLwMhVSLgqJn3npmxoTo6nzMNQPAnwtHF3s",
  bnb:      "" as string,
  tron:     "" as string,
  adi:      "" as string,
} as const;

export type SupportedChain = keyof typeof PUSD_ADDRESSES;

export const CIRCULATION_API = "https://www.palmusd.com/api/v1/circulation";

export function formatPusd(raw: bigint, decimals = PUSD_DECIMALS): string {
  const divisor = BigInt(10 ** decimals);
  const whole = raw / divisor;
  const frac = raw % divisor;
  const fracStr = frac.toString().padStart(decimals, "0").slice(0, 2);
  return `${whole.toLocaleString()}.${fracStr}`;
}

export function parsePusd(human: string, decimals = PUSD_DECIMALS): bigint {
  const [whole = "0", frac = ""] = human.replace(/,/g, "").split(".");
  const fracPadded = frac.slice(0, decimals).padEnd(decimals, "0");
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(fracPadded);
}
