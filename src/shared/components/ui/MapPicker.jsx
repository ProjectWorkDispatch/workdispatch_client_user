import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Marker icon con URL absoluta (evita el problema de Leaflet + Vite)
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Centra el mapa cuando cambia la posición seleccionada
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom());
    }
  }, [position, map]);
  return null;
};

// Captura clics en el mapa
const MapClickHandler = ({ onLocationChange }) => {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Guatemala City como centro inicial
const DEFAULT_CENTER = [14.6349, -90.5069];
const DEFAULT_ZOOM = 13;

export const MapPicker = ({ lat, lng, onLocationChange, readOnly = false }) => {
  const position = lat && lng ? [parseFloat(lat), parseFloat(lng)] : null;

  return (
    <div className="rounded-lg border border-gray-300 overflow-hidden">
      <MapContainer
        center={position || DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-64"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!readOnly && <MapClickHandler onLocationChange={onLocationChange} />}
        <RecenterMap position={position} />
        {position && <Marker position={position} icon={markerIcon} />}
      </MapContainer>
      {position ? (
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50">
          <p className="text-xs text-gray-500">
            Ubicación: {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={() => onLocationChange(null, null)}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Quitar ubicación
            </button>
          )}
        </div>
      ) : (
        !readOnly && (
          <p className="text-xs text-gray-400 px-3 py-1.5 bg-gray-50">
            Haz clic en el mapa para seleccionar la ubicación
          </p>
        )
      )}
    </div>
  );
};
