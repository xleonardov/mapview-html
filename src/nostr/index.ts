import { createRelays } from "./relays";

export { getPrivateKey, getPublicKey, setPrivateKey } from "./keys";
export { createNote } from "./notes";
export { subscribeAndGetProfile, setProfile } from "./profiles";
export { getRelays, setRelays } from "./relays";
export { subscribe } from "./subscribe";

createRelays();
