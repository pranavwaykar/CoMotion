import { useMemo } from 'react';

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

  return <div style={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #ccc', borderRadius: 8 }}>Map preview disabled for this demo; UI is live.</div>;
}


