import { Sub, relayInit, Relay, Event, Filter } from "nostr-tools";
import { RELAYS_STORAGE_KEY } from "../constants";
import { MaybeLocalStorage, NostrEvent } from "../types";

const relays: Relay[] = [];
globalThis.relays = relays;

/**
 * Get the list of relays we're connecting to
 */
export const getRelays = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}): Promise<string[]> => {
  const relaysJSONMaybe = localStorage.getItem(RELAYS_STORAGE_KEY);
  if (relaysJSONMaybe === null || relaysJSONMaybe.length === 0) {
    throw new Error("#we8Qt4 No relays configured");
  }
  try {
    const relays = JSON.parse(relaysJSONMaybe);
    if (!Array.isArray(relays)) {
      throw new Error("#kSt3oN Relays is not an array of relays");
    }
    return relays as string[];
  } catch (error) {
    console.error("#TKE6Vm Error during JSON.parse()", error);
    throw error;
  }
};

type SetRelaysParams = {
  /** The relay URLs. NOTE: This overwrites ALL existing relays. */
  relays: string[];
};
export const setRelays = async ({
  relays,
  localStorage = globalThis.localStorage,
}: SetRelaysParams & MaybeLocalStorage): Promise<void> => {
  debugger;
  const relaysString = JSON.stringify(relays);
  localStorage.setItem(RELAYS_STORAGE_KEY, relaysString);
  return;
};

export const _connectRelays = async () => {
  const connectionPromises = relays.map((relay) => relay.connect());
  await Promise.all(connectionPromises);
  return;
};

export const _initRelays = async ({
  urls = [],
}: { urls?: string[] } = {}): Promise<void> => {
  // Ensure this is only invoked once
  if (relays.length > 0) {
    return;
  }

  // Use the result from `getRelays()` if `urls` is not provided
  const realUrls = urls.length === 0 ? await getRelays() : urls;

  realUrls.forEach((url) => {
    const relay = relayInit(url);
    relays.push(relay);
  });

  await _connectRelays();
};

export const _publish = (event: Event): Promise<void>[] => {
  const publishPromises = relays.map((relay) => {
    return new Promise<void>((resolve, reject) => {
      const pub = relay.publish(event);
      pub.on("ok", () => resolve());
      pub.on("failed", (reason) => reject(reason));
    });
  });
  return publishPromises;
};

type SubscribeParams = {
  filters: Filter[];
  onEvent: (event: NostrEvent) => void;
};
export const _subscribe = ({
  filters,
  onEvent,
}: SubscribeParams): Promise<Sub>[] => {
  const subscriptions = relays.map(
    (relay) =>
      new Promise<Sub>((resolve, reject) => {
        const subscription = relay.sub(filters);
        subscription.on("event", onEvent);
        subscription.on("eose", () => {
          resolve(subscription);
        });
      })
  );

  return subscriptions;
};

globalThis.getRelays = getRelays;
globalThis.setRelays = setRelays;
