import L from "leaflet";
import { encode, decode } from "pluscodes";

type Note = {
  olc: string;
  content: string;
  author: string;
};

const map = L.map("map").setView([51.505, -0.09], 11);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

L.tileLayer("https://grid.plus.codes/grid/tms/{z}/{x}/{y}.png", {
  tms: true,
  attribution: "grid by plus codes",
}).addTo(map);

map.on("contextmenu", (e) => {
  console.log("right clickd");
  const coords = { latitude: e.latlng.lat, longitude: e.latlng.lng };
  const encoded = encode(coords, 6);
  const cb = (content) => {
    // this is where we'd send back to Nostr the event
    const note = {
      author: "me",
      olc: encoded!,
      content,
    };
    addNote(note);
  };
  const popup = L.popup(e.latlng, { content: createPopupHtml(cb) }).openOn(map);
});

function addNote(note: Note) {
  const decoded = decode(note.olc);
  const { resolution: res, longitude: cLong, latitude: cLat } = decoded!;
  const latlngs = [
    L.latLng(cLat + res / 2, cLong + res / 2),
    L.latLng(cLat - res / 2, cLong + res / 2),
    L.latLng(cLat - res / 2, cLong - res / 2),
    L.latLng(cLat + res / 2, cLong - res / 2),
  ];
  const poly = L.polygon(latlngs).addTo(map);

  const content = `${note.content} – by ${note.author}`;

  poly.bindPopup(content);
  poly.on("click", () => poly.openPopup());
}

function createPopupHtml(cb) {
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
    cb(content);
    map.closePopup();
  };
  popupContainer.appendChild(contentInput);
  popupContainer.appendChild(submitButton);
  return popupContainer;
}

// HELPER SETUP
const notes = [
  {
    olc: "9C3XGQ00+",
    content: "fun places!",
    author: "Callum",
  },
  {
    olc: "9C3XGR00+",
    content: "don't go here",
    author: "Simon",
  },
  {
    olc: "9C3XGW00+",
    content: "good weed!",
    author: "Rafa",
  },
  {
    olc: "9C3XFX00+",
    content: "amazing music",
    author: "Kata",
  },
];

notes.forEach(addNote);
