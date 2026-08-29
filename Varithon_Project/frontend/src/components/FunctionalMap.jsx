import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../api';

const PIN_COLORS = ['#EA4335', '#FBBC05', '#34A853', '#4285F4', '#FF6F00', '#A142F4', '#0097A7'];

function createPinIcon(color, label) {
  const safeColor = /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#EA4335';
  return L.divIcon({
    className: 'google-maps-pin',
    html: `<svg width="32" height="44" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 48 18 48C18 48 36 31.5 36 18C36 8.06 27.94 0 18 0Z" fill="${safeColor}"/><circle cx="18" cy="17" r="7" fill="white"/><text x="18" y="21" text-anchor="middle" font-size="9" font-weight="bold" fill="${safeColor}" font-family="sans-serif">${label}</text></svg>`,
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -42],
  });
}

function createStopIcon() {
  return L.divIcon({
    className: 'schedule-stop',
    html: `<div style="width:12px;height:12px;background:#fff;border:3px solid #1a73e8;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

async function fetchOSRMRoute(coords) {
  const osrmCoords = coords.map(c => `${c[1]},${c[0]}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${osrmCoords}?overview=full&geometries=geojson`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('OSRM request failed');
  const data = await response.json();
  if (data.routes && data.routes.length > 0) {
    return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
  }
  throw new Error('No route found');
}

export default function FunctionalMap({ selectedSector, onSectorSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({ polylines: [], markers: [], stops: [] });
  const [palkhiList, setPalkhiList] = useState([]);
  const [selectedPalkhi, setSelectedPalkhi] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([18.35, 74.05], 7);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: 'topright' }).addTo(map);
    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    api.palkhiList().then((res) => {
      if (res.data && res.data.length) {
        setPalkhiList(res.data);
        setSelectedPalkhi(res.data[0].key);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedPalkhi) return;
    setLoading(true);
    api.palkhiSchedule(selectedPalkhi, year).then((res) => {
      setSchedule(res.data || null);
    }).catch(() => {
      setSchedule(null);
    }).finally(() => setLoading(false));
  }, [selectedPalkhi, year]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    layersRef.current.polylines.forEach((l) => map.removeLayer(l));
    layersRef.current.markers.forEach((m) => map.removeLayer(m));
    layersRef.current.stops.forEach((s) => map.removeLayer(s));
    layersRef.current = { polylines: [], markers: [], stops: [] };

    if (!schedule || !schedule.schedule || schedule.schedule.length === 0) return;

    const palkhi = palkhiList.find((p) => p.key === selectedPalkhi);
    const routeColor = palkhi ? palkhi.color : '#1a73e8';
    const coords = schedule.schedule.map((s) => [s.lat, s.lng]);

    const straightRoute = L.polyline(coords, {
      color: routeColor,
      weight: 4,
      opacity: 0.85,
      dashArray: '8 6',
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);
    layersRef.current.polylines.push(straightRoute);

    schedule.schedule.forEach((stop) => {
      const isPandharpur = stop.locationName.toLowerCase().includes('pandharpur');
      const marker = L.marker([stop.lat, stop.lng], {
        icon: isPandharpur
          ? createPinIcon(routeColor, 'P')
          : createStopIcon(),
      }).addTo(map);

      const dateObj = new Date(stop.date + 'T00:00:00');
      const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      marker.bindPopup(
        `<strong style="color:#333;font-size:13px;">Day ${stop.dayNumber} — ${stop.locationName}</strong>
         <br><span style="color:#666;font-size:12px;">📅 ${dateStr}</span>
         <br><span style="color:#888;font-size:11px;">${schedule.palkhiName}</span>`
      );

      layersRef.current.markers.push(marker);

      if (!isPandharpur) {
        const stopDot = L.circleMarker([stop.lat, stop.lng], {
          radius: 4,
          color: routeColor,
          fillColor: '#fff',
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);
        layersRef.current.stops.push(stopDot);
      }
    });

    if (coords.length > 0) {
      map.fitBounds(straightRoute.getBounds(), { padding: [40, 40], maxZoom: 12 });
    }

    let cancelled = false;
    const fetchRoadRoute = async () => {
      try {
        const roadCoords = await fetchOSRMRoute(coords);
        if (cancelled) return;
        map.removeLayer(straightRoute);
        layersRef.current.polylines = layersRef.current.polylines.filter(l => l !== straightRoute);
        const roadRoute = L.polyline(roadCoords, {
          color: routeColor,
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
        layersRef.current.polylines.push(roadRoute);
      } catch (e) {
        if (!cancelled) console.warn('OSRM routing failed, using straight-line fallback:', e);
      }
    };

    fetchRoadRoute();

    return () => { cancelled = true; };
  }, [schedule, selectedPalkhi, palkhiList]);

  const currentYear = useMemo(() => year, [year]);

  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={selectedPalkhi}
          onChange={(e) => setSelectedPalkhi(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', background: '#fff' }}
        >
          {palkhiList.map((p) => (
            <option key={p.key} value={p.key}>{p.name}</option>
          ))}
        </select>
        <input
          type="number"
          value={currentYear}
          onChange={(e) => setYear(Number(e.target.value))}
          min="2020"
          max="2030"
          style={{ width: '80px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
        />
        {loading && <span style={{ fontSize: '12px', color: '#6b7280' }}>Loading...</span>}
        {schedule && (
          <span style={{ fontSize: '12px', color: '#374151', marginLeft: 'auto' }}>
            📅 {schedule.day1Date} → {schedule.ashadhiEkadashiDate} &nbsp;|&nbsp; {schedule.schedule.length} stops
          </span>
        )}
      </div>
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
