import L from "leaflet";
import "leaflet.sidepanel";
import { decode, encode } from "pluscodes";
import { hasPrivateKey } from "./nostr/keys";
import { createNote } from "./nostr/notes";
import { _initRelays } from "./nostr/relays";
import { subscribe } from "./nostr/subscribe";
import { getPublicKeyFromUrl } from "./router";
import { Note } from "./types";

const map = L.map("map").setView([51.505, -0.09], 11);

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

  const selectedPlusCodePoly = generatePolygonFromPlusCode(plusCode);

  selectedPlusCodePoly.setStyle({ color: "red" });
  selectedPlusCodePoly.addTo(map);

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
      .openOn(map)
      .on("remove", (e) => selectedPlusCodePoly.remove());
  });
});

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

function generateContentFromNotes(notes: Note[]) {
  let content = "";
  for (let note of notes) {
    content += `${note.content} – by ${note.authorName}<br>`;
  }
  return content;
}

function addNoteToMap(note: Note) {
  let existing = plusCodesWithPopupsAndNotes[note.plusCode];
  if (existing) {
    const popup = existing.popup;
    const notes = [...existing.notes, note];
    popup.setContent(generateContentFromNotes(notes));
  } else {
    const poly = generatePolygonFromPlusCode(note.plusCode);
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
  const publicKey = getPublicKeyFromUrl();
  await _initRelays();
  subscribe({ publicKey, onNoteReceived: addNoteToMap });
};
mapStartup();
