import { _createPrivateKey } from "./keys";
import { _createRelays } from "./relays";

export { getPrivateKey, getPublicKey, setPrivateKey } from "./keys";
export { createNote } from "./notes";
export { getProfile, setProfile } from "./profiles";
export { getRelays, setRelays } from "./relays";
export { subscribe } from "./subscribe";

export const createNostrAccount = async () => {
  await _createPrivateKey();
  await _createRelays();
};
