import * as L from "leaflet";
import { getPublicKey, hasPrivateKey } from "./nostr/keys";

export const startup = async () => {
  const isLoggedIn = await hasPrivateKey();

  const loggedIn = L.DomUtil.get("loggedIn")!;
  const loggedOut = L.DomUtil.get("loggedOut")!;

  if (isLoggedIn) {
    L.DomUtil.addClass(loggedIn, "show");
    L.DomUtil.addClass(loggedOut, "hide");

    const publicKey = await getPublicKey();

    const publicKeySpan = globalThis.document.getElementById("publicKey")!;
    publicKeySpan.innerText = publicKey;
  } else {
    L.DomUtil.addClass(loggedIn, "hide");
    L.DomUtil.addClass(loggedOut, "show");
  }
};
startup();
