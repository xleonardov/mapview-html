import { nip19 } from "nostr-tools";

export const getPublicKeyFromUrl = ({
  location = globalThis.document.location,
}: {
  location?: Location;
} = {}): string | undefined => {
  const { hash } = location;
  if (!hash.startsWith("#npub")) {
    return;
  }
  // NOTE: The hash will include the leading # so we trim off the first character
  const npubPublicKey = hash.slice(1);
  const { type, data } = nip19.decode(npubPublicKey);
  if (type !== "npub") {
    return;
  }
  return data as string;
};

export const getUrlFromNpubPublicKey = ({
  npubPublicKey,
  location = globalThis.document.location,
}: {
  npubPublicKey: string;
  location?: Location;
}): string => {
  const { origin, pathname } = location;
  const yourUrl = origin + pathname + "#" + npubPublicKey;
  return yourUrl;
};

export const getUrlFromPublickey = ({
  publicKey,
  location = globalThis.document.location,
}: {
  publicKey: string;
  location?: Location;
}): string => {
  const npubPublicKey = nip19.npubEncode(publicKey);
  const yourUrl = getUrlFromNpubPublicKey({ npubPublicKey });
  return yourUrl;
};
