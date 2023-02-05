import L from "leaflet";
import "leaflet.sidepanel";
import { decode, encode } from "pluscodes";
import { getPublicKey, hasPrivateKey } from "./nostr/keys";
import { createNote } from "./nostr/notes";
import { _initRelays } from "./nostr/relays";
import { subscribe } from "./nostr/subscribe";
import {
  getPublicKeyFromUrl,
  getUrlFromNpubPublicKey,
  getUrlFromPublicKeyAndView,
} from "./router";
import {
  PANEL_CONTAINER_ID,
  BADGE_CONTAINER_ID,
  CURRENT_PUBLIC_KEY_ID,
} from "./constants";
import { Note } from "./types";

const map = L.map("map", {
  zoomControl: false,
}).setView([51.505, -0.09], 11);

L.control
  .zoom({
    position: "bottomright",
  })
  .addTo(map);

// this lets us add multiple notes to a single area
const plusCodesWithPopupsAndNotes: {
  [key: string]: { popup: L.Popup; notes: [Note] };
} = {};

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// NOTE: The leaflet sidepanel plugin doesn't have types in `@types/leaflet` and
// so we need to cast to any here.

(L.control as any).sidepanel(PANEL_CONTAINER_ID, { hasTabs: true }).addTo(map);

// The leaflet sidepanel plugin doesn't export an API, so we've written our own
const hackSidePanelOpen = () => {
  const panel = L.DomUtil.get(PANEL_CONTAINER_ID);
  L.DomUtil.removeClass(panel!, "closed");
  L.DomUtil.addClass(panel!, "opened");
};

// The leaflet sidepanel plugin doesn't export an API, so we've written our own
const hackSidePanelClosed = () => {
  const panel = L.DomUtil.get(PANEL_CONTAINER_ID);
  L.DomUtil.removeClass(panel!, "opened");
  L.DomUtil.addClass(panel!, "closed");
};

map.on("contextmenu", async (event) => {
  console.log("#bG7CWu Right clicked or long pressed");
  const isLoggedIn = await hasPrivateKey();
  if (!isLoggedIn) {
    hackSidePanelOpen();
    return;
  }

  const coords = { latitude: event.latlng.lat, longitude: event.latlng.lng };
  const plusCode = encode(coords, 6)!;

  const { publicKey: viewingCurrentPublicKey } = getPublicKeyFromUrl();
  const myPublicKey = await getPublicKey();
  const viewingMyOwnMap =
    typeof viewingCurrentPublicKey === "undefined" ||
    viewingCurrentPublicKey === myPublicKey;

  const selectedPlusCodePoly = generatePolygonFromPlusCode(plusCode);

  selectedPlusCodePoly.setStyle({ color: "grey" });
  selectedPlusCodePoly.addTo(map);

  const createNoteCallback = async (content) => {
    createNote({ content, plusCode });
  };

  const popupContent = viewingMyOwnMap
    ? createPopupHtml(createNoteCallback)
    : `View <a href="${getUrlFromPublicKeyAndView({
        publicKey: myPublicKey,
      })}">your own map</a> to add notes.`;

  L.popup()
    .setLatLng(event.latlng)
    .setContent(popupContent)
    .openOn(map)
    .on("remove", (e) => selectedPlusCodePoly.remove());
});

async function updateUrl() {
  const center = map.getCenter();
  const zoom = map.getZoom();
  const view = {
    lat: center.lat,
    lng: center.lng,
    zoom,
  };
  const publicKey = await getPublicKey();
  if (!publicKey) return;

  const yourUrl = getUrlFromPublicKeyAndView({ publicKey, view });
  const yourUrlHref = globalThis.document.getElementById(
    "yourUrl"
  ) as HTMLLinkElement;
  yourUrlHref.href = yourUrl;
  yourUrlHref.innerText = yourUrl;
}

map.on("moveend", updateUrl);
map.on("zoomend", updateUrl);

function generatePolygonFromPlusCode(plusCode: string) {
  const decoded = decode(plusCode);
  const { resolution: res, longitude: cLong, latitude: cLat } = decoded!;
  const latlngs = [
    L.latLng(cLat + res / 2, cLong + res / 2),
    L.latLng(cLat - res / 2, cLong + res / 2),
    L.latLng(cLat - res / 2, cLong - res / 2),
    L.latLng(cLat + res / 2, cLong - res / 2),
  ];
  const poly = L.polygon(latlngs);
  return poly;
}

// TODO - Can we restart our code instead of reloading the whole window?
globalThis.addEventListener("popstate", (event) => {
  globalThis.document.location.reload();
});

function generateContentFromNotes(notes: Note[]) {
  let content = "";
  for (const note of notes) {
    const url = getUrlFromNpubPublicKey({
      npubPublicKey: note.authorNpubPublicKey,
    });
    content += `${note.content} – by <a href="${url}">${
      note.authorName || note.authorPublicKey.substring(0, 5) + "..."
    }</a><br>`;
  }
  return content;
}

function addNoteToMap(note: Note) {
  let existing = plusCodesWithPopupsAndNotes[note.plusCode];

  if (existing) {
    const popup = existing.popup;

    // When using multiple NOSTR relays, deduplicate the notes by ID to ensure
    // that we don't show the same note multiple times.
    const noteAlreadyOnTheMap = existing.notes.find((n) => n.id === note.id);
    if (typeof noteAlreadyOnTheMap !== "undefined") {
      return;
    }

    const notes = [...existing.notes, note];
    popup.setContent(generateContentFromNotes(notes));
  } else {
    const poly = generatePolygonFromPlusCode(note.plusCode);
    poly.setStyle({ color: "blue" });
    poly.addTo(map);

    const content = generateContentFromNotes([note]);
    const popup = L.popup().setContent(content);
    poly.bindPopup(popup);
    poly.on("click", () => poly.openPopup());
    plusCodesWithPopupsAndNotes[note.plusCode] = {
      popup,
      notes: [note],
    };
  }
}

function createPopupHtml(createNoteCallback) {
  const popupContainer = document.createElement("div");
  popupContainer.className = "popup-container";
  const contentInput = document.createElement("input");
  contentInput.id = "content";
  contentInput.type = "text";
  contentInput.required = true;
  contentInput.placeholder = "What do you want to say about this area?";
  const submitButton = document.createElement("button");
  submitButton.innerText = "Add Note!";
  submitButton.onclick = () => {
    const content = contentInput.value;
    createNoteCallback(content);
    map.closePopup();
  };
  popupContainer.appendChild(contentInput);
  popupContainer.appendChild(submitButton);
  return popupContainer;
}

const mapStartup = async () => {
  const { publicKey, view } = getPublicKeyFromUrl();
  if (view) map.setView([view.lat, view.lng], view.zoom);
  const badge = L.DomUtil.get(BADGE_CONTAINER_ID) as HTMLElement;
  if (publicKey) {
    L.DomUtil.addClass(badge, "show");
    L.DomUtil.removeClass(badge, "hide");
    const publicKeyElement = L.DomUtil.get(
      CURRENT_PUBLIC_KEY_ID
    ) as HTMLSpanElement;
    publicKeyElement.innerText = publicKey.substring(0, 5) + "...";
  } else {
    L.DomUtil.addClass(badge, "hide");
    L.DomUtil.removeClass(badge, "show");
  }
  await _initRelays();
  subscribe({ publicKey, onNoteReceived: addNoteToMap });
};
mapStartup();
