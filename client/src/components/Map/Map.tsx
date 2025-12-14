import { useMemo } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import Map, { Marker } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';

type Props = {
  from?: { lng: number; lat: number };
  to?: { lng: number; lat: number };
  height?: number;
};

export default function CommuteMap({ from, to, height = 360 }: Props) {
  const center = useMemo(() => {
    if (from) return { longitude: from.lng, latitude: from.lat, zoom: 11 };
    return { longitude: 72.8777, latitude: 19.076, zoom: 10 }; // Mumbai default
  }, [from]);

  return (
    <div style={{ borderRadius: 8, overflow: 'hidden' }}>
      <Map
        initialViewState={center}
        style={{ width: '100%', height }}
        mapLib={maplibregl}
        mapStyle={import.meta.env.VITE_MAP_STYLE || 'https://demotiles.maplibre.org/style.json'}
      >
        {from && <Marker longitude={from.lng} latitude={from.lat} color="green" />}
        {to && <Marker longitude={to.lng} latitude={to.lat} color="red" />}
      </Map>
    </div>
  );
}


