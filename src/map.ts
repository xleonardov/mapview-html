import { encode, decode } from "pluscodes";
import { Note } from "./types";
import L from "leaflet";
import "leaflet.sidepanel";

const map = L.map("map").setView([51.505, -0.09], 11);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

L.tileLayer("https://grid.plus.codes/grid/tms/{z}/{x}/{y}.png", {
  tms: true,
  attribution: "grid by plus codes",
}).addTo(map);

const panelRight = L.control.sidepanel("panelID", {}).addTo(map);

map.on("contextmenu", (event) => {
  console.log("#bG7CWu Right clicked or long pressed");
  const coords = { latitude: event.latlng.lat, longitude: event.latlng.lng };
  const plusCode = encode(coords, 6);
  const createNoteCallback = (content) => {
    // this is where we'd send back to Nostr the event
    const note: Note = {
      plusCode: plusCode!,
      content,
      // TODO - How do we get author name and public key?
      authorName: "me",
      authorPublicKey: "",
    };
    addNoteToMap(note);
  };
  L.popup(event.latlng, {
    content: createPopupHtml(createNoteCallback),
  }).openOn(map);
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

// HELPER SETUP
const notes: Note[] = [
  {
    plusCode: "9C3XGQ00+",
    content: "fun places!",
    authorName: "Callum",
    authorPublicKey: "",
  },
  {
    plusCode: "9C3XGR00+",
    content: "don't go here",
    authorName: "Simon",
    authorPublicKey: "",
  },
  {
    plusCode: "9C3XGW00+",
    content: "good weed!",
    authorName: "Rafa",
    authorPublicKey: "",
  },
  {
    plusCode: "9C3XFX00+",
    content: "amazing music",
    authorName: "Kata",
    authorPublicKey: "",
  },
];

notes.forEach(addNoteToMap);
