import * as L from "leaflet";
import { createPrivateKey, getPublicKey, hasPrivateKey } from "./nostr/keys";
import { setProfile } from "./nostr/profiles";

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

  const signupSubmit = document.getElementById("signup_submit")!;
  signupSubmit.onclick = (event) => {
    event.preventDefault();
    signupSubmit.setAttribute("disabled", "disabled");
    const name = (document.getElementById("signup_name") as HTMLInputElement)
      .value;
    const about = (document.getElementById("signup_about") as HTMLInputElement)
      .value;
    createPrivateKey().then(() => {
      setProfile({ name, about }).then(() => {
        globalThis.alert("Your account was created.");
        globalThis.document.location.reload();
      });
    });
  };
};
startup();
