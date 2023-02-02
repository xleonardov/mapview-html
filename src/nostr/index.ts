import { _connectRelays, _initRelays } from "./relays";
import { subscribe } from "./subscribe";
export { getPrivateKey, getPublicKey, setPrivateKey } from "./keys";
export { createNote } from "./notes";
export { getProfile, setProfile } from "./profiles";
export { getRelays, setRelays } from "./relays";
export { subscribe } from "./subscribe";

const devStartup = async () => {
  console.log("#5gBWID Starting nostr");
  await _initRelays();

  subscribe({
    onNoteReceived: (note) => {
      console.log("#5UyqmR Got note", note);
    },
  });
};

globalThis.devStartup = devStartup;
devStartup();
