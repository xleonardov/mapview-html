import * as L from "leaflet";
import { createNostrAccount, getRelays, setRelays } from "./nostr";
import {
  _createPrivateKey,
  getPublicKey,
  hasPrivateKey,
  setPrivateKey,
} from "./nostr/keys";
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

    const { origin, pathname } = globalThis.document.location;
    const yourUrl = origin + pathname + "#" + publicKey;
    const yourUrlHref = globalThis.document.getElementById(
      "yourUrl"
    ) as HTMLLinkElement;
    yourUrlHref.href = yourUrl;
    yourUrlHref.innerText = yourUrl;

    const relaysInput = document.getElementById("relays") as HTMLInputElement;
    getRelays().then((relays) => {
      const relaysJson = JSON.stringify(relays);
      relaysInput.value = relaysJson;
    });

    const relaySubmitButton = document.getElementById("relays_submit")!;
    relaySubmitButton.onclick = async (event) => {
      event.preventDefault();
      relaySubmitButton.setAttribute("disabled", "disabled");

      const relaysJson = relaysInput.value;
      try {
        const relays = JSON.parse(relaysJson) as string[];
        if (!Array.isArray(relays) || relays.length === 0) {
          relaySubmitButton.removeAttribute("disabled");
          globalThis.alert("Invalid relays submitted. Please try again.");
          return;
        }
        await setRelays({ relays });
        globalThis.alert("Relays saved.");
        globalThis.document.location.reload();
      } catch (error) {
        relaySubmitButton.removeAttribute("disabled");
        globalThis.alert(`#vRuf1N Error saving relays\n${error.toString()}`);
      }
    };
  } else {
    L.DomUtil.addClass(loggedIn, "hide");
    L.DomUtil.addClass(loggedOut, "show");

    const signupSubmit = document.getElementById("signup_submit")!;
    signupSubmit.onclick = (event) => {
      event.preventDefault();
      signupSubmit.setAttribute("disabled", "disabled");
      const name = (document.getElementById("signup_name") as HTMLInputElement)
        .value;
      const about = (
        document.getElementById("signup_about") as HTMLInputElement
      ).value;

      createNostrAccount()
        .then(() => {
          setProfile({ name, about }).then(() => {
            globalThis.alert("Your account was created.");
            globalThis.document.location.reload();
          });
        })
        .catch(() => {
          signinSubmit.removeAttribute("disabled");
        });
    };

    const signinSubmit = document.getElementById("signin_submit")!;
    signinSubmit.onclick = (event) => {
      event.preventDefault();
      signupSubmit.setAttribute("disabled", "disabled");
      const privateKey = (
        document.getElementById("signin_privateKey") as HTMLInputElement
      ).value;

      setPrivateKey({ privateKey })
        .then(() => {
          globalThis.alert("You were signed in successfully.");
          globalThis.document.location.reload();
        })
        .catch(() => {
          signinSubmit.removeAttribute("disabled");
        });
    };
  }
};
startup();
