# 07 — Send & Receive

**Platform: web (Next.js 15 App Router) + Privy web SDK.** See spec 01.

> Goal: ship the full send flow (recipient → amount → confirm → success), the receive flow (QR + copy/share), and transaction detail.

**Note:** Step body uses Expo Router modal routes and `expo-local-authentication` for biometric confirm. The web equivalent is a shadcn `<Dialog>` for send/receive screens, and Privy passkey (WebAuthn) for transaction confirm. `expo-clipboard` → `navigator.clipboard.writeText`. `Share` → `navigator.share` with copy fallback. QR rendering uses `qrcode.react`.

## Prereqs
- `01`–`05`. Uses `useTransfer` from spec 04.

## Acceptance criteria
- Send: paste address or pick from quick-send → enter amount → review fee → passkey prompt → broadcast → success → linked to transaction detail
- Receive: QR scannable from another wallet, address copyable, native share sheet (mobile web) with copy fallback (desktop)
- Transaction detail: full info + Solscan link
- Send dialog is keyboard-navigable; amount input handles paste of "$1,234.56" cleanly

---

## Step 1 — Send modal stack

`app/send/_layout.tsx`:
```tsx
import { Stack } from "expo-router";
export default function SendLayout() {
  return <Stack screenOptions={{ headerShown: false, presentation: "modal" }} />;
}
```

## Step 2 — Recipient picker

`app/send/index.tsx`:
```tsx
import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { ScanLine, X } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { QuickSendList } from "@/components/wallet/QuickSendList";
import { isValidSolanaAddress } from "@/lib/utils/validators";

export default function SendIndex() {
  const [addr, setAddr] = useState("");
  const valid = isValidSolanaAddress(addr);

  return (
    <ScreenContainer>
      <View className="flex-row items-center justify-between py-3">
        <Pressable onPress={() => router.back()} className="bg-surface rounded-full w-10 h-10 items-center justify-center">
          <X size={20} color="#0E1410" />
        </Pressable>
        <Text className="text-h3">Send PUSD</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <Input
          label="Recipient address"
          placeholder="Solana address"
          value={addr} onChangeText={setAddr}
          autoCapitalize="none"
        />
        <Pressable className="flex-row items-center gap-2 mt-3">
          <ScanLine size={18} color="#0E1410" />
          <Text className="text-body">Scan QR code</Text>
        </Pressable>

        <Text className="text-h3 mt-6 mb-3">Quick Send</Text>
        <QuickSendList />
      </ScrollView>

      <Button
        disabled={!valid}
        onPress={() => router.push({ pathname: "/send/amount", params: { to: addr } })}
      >
        Continue
      </Button>
    </ScreenContainer>
  );
}
```

## Step 3 — Amount entry

`app/send/amount.tsx`:
```tsx
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { usePusdBalance } from "@/hooks/usePusdBalance";
import { parseAmount, formatRaw } from "@/lib/chains/solana";

export default function Amount() {
  const { to } = useLocalSearchParams<{ to: string }>();
  const { data: balance } = usePusdBalance();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  const raw = amount ? parseAmount(amount) : 0n;
  const insufficient = balance ? raw > balance.raw : false;
  const valid = raw > 0n && !insufficient;

  return (
    <ScreenContainer>
      <Header title="Amount" />
      <View className="flex-1 mt-4">
        <View className="bg-surface rounded-full self-center px-4 py-2">
          <Text className="text-muted text-xs">
            Available: ${balance?.formatted ?? "—"} PUSD
          </Text>
        </View>

        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">PUSD</Text>
          <View className="flex-row items-center">
            <Text className="text-display">$</Text>
            <Input
              placeholder="0"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              style={{ minWidth: 120 }}
            />
          </View>
          <Pressable
            onPress={() => balance && setAmount(formatRaw(balance.raw))}
            className="bg-lime rounded-full px-3 py-1 mt-2"
          >
            <Text className="text-ink text-xs font-semi">Max</Text>
          </Pressable>
          {insufficient && (
            <Text className="text-danger mt-2">Insufficient balance</Text>
          )}
        </View>

        <Input label="Memo (optional)" placeholder="What's this for?" value={memo} onChangeText={setMemo} />

        <View className="h-4" />
        <Button
          disabled={!valid}
          onPress={() => router.push({ pathname: "/send/confirm", params: { to, amount, memo } })}
        >
          Continue
        </Button>
      </View>
    </ScreenContainer>
  );
}
```

## Step 4 — Confirm + sign

`app/send/confirm.tsx`:
```tsx
import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTransfer } from "@/hooks/useTransfer";
import { parseAmount } from "@/lib/chains/solana";
import { shortAddr } from "@/lib/utils/format";

export default function Confirm() {
  const { to, amount, memo } = useLocalSearchParams<{ to: string; amount: string; memo: string }>();
  const transfer = useTransfer();

  const submit = async () => {
    const auth = await LocalAuthentication.authenticateAsync({ promptMessage: "Confirm Send" });
    if (!auth.success) return;
    try {
      const sig = await transfer.mutateAsync({ to, amount: parseAmount(amount) });
      router.replace({ pathname: "/send/success", params: { sig, amount, to } });
    } catch (e: any) {
      // TODO: surface via toast (spec 11 stub)
      console.error(e);
    }
  };

  return (
    <ScreenContainer>
      <Header title="Confirm" />
      <View className="flex-1 mt-4">
        <Card>
          <Text className="text-muted text-xs">You're sending</Text>
          <Text className="text-h1 mt-1">${amount}</Text>
          <Text className="text-muted text-xs mt-2">to</Text>
          <Text className="text-body">{shortAddr(to)}</Text>
        </Card>

        <Card className="mt-3">
          <View className="flex-row justify-between"><Text className="text-muted">Network fee</Text><Text>~$0.00025</Text></View>
          <View className="flex-row justify-between mt-2"><Text className="text-muted">Network</Text><Text>Solana</Text></View>
          {memo ? (
            <View className="flex-row justify-between mt-2"><Text className="text-muted">Memo</Text><Text>{memo}</Text></View>
          ) : null}
        </Card>

        <View className="flex-1" />
        <Button onPress={submit} loading={transfer.isPending}>Sign & Send</Button>
      </View>
    </ScreenContainer>
  );
}
```

## Step 5 — Success

`app/send/success.tsx`:
```tsx
import { View, Text, Pressable, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Check, ExternalLink } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import * as Clipboard from "expo-clipboard";

export default function Success() {
  const { sig, amount, to } = useLocalSearchParams<{ sig: string; amount: string; to: string }>();

  return (
    <ScreenContainer>
      <View className="flex-1 items-center justify-center gap-4">
        <View className="bg-lime rounded-full w-24 h-24 items-center justify-center">
          <Check size={48} color="#0E1410" strokeWidth={3} />
        </View>
        <Text className="text-h1">${amount} sent</Text>
        <Card className="w-full">
          <Text className="text-muted text-xs">Signature</Text>
          <Pressable onPress={() => Clipboard.setStringAsync(sig)}>
            <Text className="text-body" numberOfLines={1}>{sig}</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(`https://solscan.io/tx/${sig}`)}
            className="flex-row items-center gap-1 mt-3"
          >
            <Text className="text-body">View on Solscan</Text>
            <ExternalLink size={14} color="#0E1410" />
          </Pressable>
        </Card>
      </View>
      <Button onPress={() => router.dismissAll()}>Done</Button>
    </ScreenContainer>
  );
}
```

## Step 6 — Receive

`app/receive.tsx`:
```tsx
import { View, Text, Pressable, Share } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { Copy } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/hooks/useWallet";
import { shortAddr } from "@/lib/utils/format";

export default function Receive() {
  const { address } = useWallet();
  if (!address) return null;

  return (
    <ScreenContainer>
      <Header title="Receive PUSD" />
      <View className="flex-1 items-center mt-6 gap-5">
        <Card tone="white" className="p-6">
          <QRCode value={address} size={220} color="#0E1410" backgroundColor="#FFFFFF" />
        </Card>

        <Card className="w-full flex-row items-center justify-between">
          <Text className="text-body flex-1">{shortAddr(address, 8, 8)}</Text>
          <Pressable onPress={() => Clipboard.setStringAsync(address)}>
            <Copy size={18} color="#0E1410" />
          </Pressable>
        </Card>

        <Text className="text-muted text-xs text-center">
          Solana network only. Sending other assets to this address may result in loss.
        </Text>
      </View>
      <Button variant="dark" onPress={() => Share.share({ message: address })}>Share address</Button>
    </ScreenContainer>
  );
}
```

## Step 7 — Transaction detail

`app/transaction/[id].tsx`:
```tsx
import { View, Text, Pressable, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ExternalLink, Check } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { useTransactions } from "@/hooks/useTransactions";
import { formatRaw } from "@/lib/chains/solana";
import { shortAddr, relTime } from "@/lib/utils/format";

export default function TxDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useTransactions(200);
  const tx = data?.find((t) => t.hash === id);
  if (!tx) return null;
  const isOut = tx.direction === "out";

  return (
    <ScreenContainer>
      <Header title="Transaction" />
      <View className="items-center my-6 gap-2">
        <View className="bg-lime rounded-full w-16 h-16 items-center justify-center">
          <Check size={32} color="#0E1410" strokeWidth={3} />
        </View>
        <Text className="text-muted">Confirmed</Text>
        <Text className="text-h1">{isOut ? "-" : "+"}${formatRaw(tx.amount)}</Text>
      </View>

      <Card>
        <Row label="Type" value={isOut ? "Sent" : "Received"} />
        <Row label={isOut ? "To" : "From"} value={shortAddr(isOut ? tx.to : tx.from, 6, 6)} />
        <Row label="Time" value={relTime(tx.timestamp)} />
        <Row label="Network" value="Solana" />
        <Pressable
          onPress={() => Clipboard.setStringAsync(tx.hash)}
          className="flex-row justify-between py-2.5"
        >
          <Text className="text-muted">Signature</Text>
          <Text>{shortAddr(tx.hash, 6, 6)}</Text>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(`https://solscan.io/tx/${tx.hash}`)}
          className="flex-row justify-between items-center py-2.5"
        >
          <Text className="text-muted">View on Solscan</Text>
          <ExternalLink size={14} color="#0E1410" />
        </Pressable>
      </Card>
    </ScreenContainer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2.5">
      <Text className="text-muted">{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}
```

## Done when
- Full send flow completes end-to-end on devnet
- Recipient ATA auto-created if it didn't exist (no error)
- QR scannable from another wallet (Phantom, Solflare)
- Tapping a recent activity row opens the correct transaction detail
