import L from "leaflet";
import "leaflet.sidepanel";
import { decode, encode } from "pluscodes";
import { hasPrivateKey } from "./nostr/keys";
import { createNote } from "./nostr/notes";
import { _initRelays } from "./nostr/relays";
import { subscribe } from "./nostr/subscribe";
import { Note } from "./types";

const map = L.map("map").setView([51.505, -0.09], 11);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

L.tileLayer("https://grid.plus.codes/grid/tms/{z}/{x}/{y}.png", {
  tms: true,
  attribution: "grid by plus codes",
}).addTo(map);

// NOTE: The leaflet sidepanel plugin doesn't have types in `@types/leaflet` and
// so we need to cast to any here.
const PANEL_CONTAINER_ID = "panelID";
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

map.on("contextmenu", (event) => {
  console.log("#bG7CWu Right clicked or long pressed");
  const coords = { latitude: event.latlng.lat, longitude: event.latlng.lng };
  const plusCode = encode(coords, 6)!;

  hasPrivateKey().then((isLoggedIn) => {
    if (!isLoggedIn) {
      hackSidePanelOpen();
      return;
    }

    const createNoteCallback = async (content) => {
      createNote({ content, plusCode });
    };

    L.popup()
      .setLatLng(event.latlng)
      .setContent(createPopupHtml(createNoteCallback))
      .openOn(map);
  });
});

function addNoteToMap(note: Note) {
  const decoded = decode(note.plusCode);
  const { resolution: res, longitude: cLong, latitude: cLat } = decoded!;
  const latlngs = [
    L.latLng(cLat + res / 2, cLong + res / 2),
    L.latLng(cLat - res / 2, cLong + res / 2),
    L.latLng(cLat - res / 2, cLong - res / 2),
    L.latLng(cLat + res / 2, cLong - res / 2),
  ];
  const poly = L.polygon(latlngs).addTo(map);

  const content = `${note.content} – by ${note.authorName}`;

  poly.bindPopup(content);
  poly.on("click", () => poly.openPopup());
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

const getPublicKeyFromUrl = () => {
  const hash = document.location.hash;
  if (hash.length !== 65) {
    return;
  }
  // NOTE: The hash will include the leading # so we trim off the first character
  return hash.slice(1);
};

const mapStartup = async () => {
  const publicKey = getPublicKeyFromUrl();
  await _initRelays();
  subscribe({ publicKey, onNoteReceived: addNoteToMap });
};
mapStartup();
