import {
  Event,
  getEventHash,
  getPublicKey as getPublicKeyFromPrivateKey,
  Kind,
  signEvent,
} from "nostr-tools";
import { MaybeLocalStorage, Profile, UnsignedEvent } from "../types";
import { getPrivateKey } from "./keys";
import { _publish, _subscribe } from "./relays";
import {
  dateToUnix,
  getProfileFromEvent,
  signEventWithPrivateKey,
} from "./utils";

type SetProfileParams = {
  /** The user's name to be sent to all relays */
  name: string;
  /** A longer string that may (later) be shown on the user's profile page */
  about: string;
  /** The private key of the user, optionally fetched from localStorage */
  privateKey?: string;
} & MaybeLocalStorage;
export const setProfile = async ({
  name,
  about,
  privateKey,
  localStorage,
}: SetProfileParams) => {
  const key =
    typeof privateKey !== "undefined"
      ? privateKey
      : await getPrivateKey({ localStorage });
  const content = JSON.stringify({ name, about });
  const unsignedEvent: UnsignedEvent = {
    kind: Kind.Metadata,
    content,
    tags: [],
  };
  const signedEvent = signEventWithPrivateKey({
    unsignedEvent,
    privateKey: key,
  });
  try {
    const publishPromises = _publish(signedEvent);
    await Promise.all(publishPromises);
  } catch (error) {
    const message = "#mkox3R Error saving profile";
    console.error(message, error);
    throw error;
  }
};

type GetProfileParams = {
  /** The public key of the user to fetch their profile */
  publicKey: string;
};
export const getProfile = async ({ publicKey }: GetProfileParams) => {
  return new Promise<Profile>((resolve, reject) => {
    const subscriptions = _subscribe({
      filters: [
        {
          kinds: [Kind.Metadata],
          authors: [publicKey],
        },
      ],
      onEvent: (event) => {
        try {
          const profile = getProfileFromEvent({ event });
          // NOTE: This will be called multiple times, but any calls after the
          // first are ignored
          resolve(profile);
        } catch (error) {
          console.error("#P0haKt Failed to get profile from event", error);
        }
      },
    });
    // Timeout after 2s. This is a no-op if the promise already resolved above.
    setTimeout(reject, 2e3);
  });
};

globalThis.setProfile = setProfile;
globalThis.getProfile = getProfile;
