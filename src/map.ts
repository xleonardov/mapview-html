import L from "leaflet";
import { encode, decode } from "pluscodes";

type Note = {
  olc: string;
  content: string;
};

console.log("leaflet started");
const map = L.map("map").setView([51.505, -0.09], 11);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

L.tileLayer("https://grid.plus.codes/grid/tms/{z}/{x}/{y}.png", {
  tms: true,
  attribution: "grid by plus codes",
}).addTo(map);

map.on("click", (e) => {
  const coords = { latitude: e.latlng.lat, longitude: e.latlng.lng };
  const encoded = encode(coords, 6);
  const decoded = decode(encoded!);
  const { resolution: res, longitude: cLong, latitude: cLat } = decoded!;
  const latlngs = [
    L.latLng(cLat + res / 2, cLong + res / 2),
    L.latLng(cLat - res / 2, cLong + res / 2),
    L.latLng(cLat - res / 2, cLong - res / 2),
    L.latLng(cLat + res / 2, cLong - res / 2),
  ];
  L.polygon(latlngs).addTo(map);
});

function addNote(note: Note) {
  // tbd
}
