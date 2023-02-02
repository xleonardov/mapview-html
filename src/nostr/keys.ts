import {
  generatePrivateKey,
  getPublicKey as getPublicKeyFromPrivateKey,
} from "nostr-tools";
import { PRIVATE_KEY_STORAGE_KEY } from "../constants";
import { MaybeLocalStorage } from "../types";

export const getPrivateKey = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}) => {
  const privateKeyMaybe = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
  if (privateKeyMaybe === null || privateKeyMaybe.length !== 64) {
    throw new Error("#lvYBhM Cannot find private key");
  }
  return privateKeyMaybe;
};

export const getPublicKey = async ({
  localStorage = globalThis.localStorage,
}: MaybeLocalStorage = {}): Promise<string> => {
  const privateKey = await getPrivateKey({ localStorage });

  const publicKey = getPublicKeyFromPrivateKey(privateKey);

  return publicKey;
};

type SetPrivateKeyParams = {
  /** The private key to store */
  privateKey: string;
};
export const setPrivateKey = async ({
  privateKey,
  localStorage = globalThis.localStorage,
}: SetPrivateKeyParams & MaybeLocalStorage) => {
  if (privateKey.length !== 64) {
    throw new Error("#irpzXh Private key is not 64 characters");
  }
  localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, privateKey);
};

globalThis.getPublicKey = getPublicKey;
globalThis.createPrivateKey = () => {
  const privateKey = generatePrivateKey();
  setPrivateKey({ privateKey });
};
