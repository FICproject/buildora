import React, { useEffect, useRef, useState } from 'react';
import { Navigation, Plus, Minus, X, Crosshair, MapPin } from 'lucide-react';
import { locationService, GeocodedLocation } from '../../services/locationService';

interface DeliveryLocationMapProps {
  lat: number;
  lng: number;
  selectedAddressText: string;
  localityBadgeText: string;
  onLocationChange: (loc: GeocodedLocation) => void;
  onClearSearch?: () => void;
  className?: string;
}

export const DeliveryLocationMap: React.FC<DeliveryLocationMapProps> = ({
  lat,
  lng,
  selectedAddressText,
  localityBadgeText,
  onLocationChange,
  onClearSearch,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentLat, setCurrentLat] = useState(lat || 12.9647);
  const [currentLng, setCurrentLng] = useState(lng || 77.5113);
  const [zoom, setZoom] = useState(16);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Sync external coordinates
  useEffect(() => {
    if (lat && lng) {
      setCurrentLat(lat);
      setCurrentLng(lng);
    }
  }, [lat, lng]);

  // Convert lat/lng to OpenStreetMap tile coordinates
  const lat2tile = (latitude: number, z: number) => {
    return Math.floor(
      ((1 - Math.log(Math.tan((latitude * Math.PI) / 180) + 1 / Math.cos((latitude * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, z)
    );
  };

  const lng2tile = (longitude: number, z: number) => {
    return Math.floor(((longitude + 180) / 360) * Math.pow(2, z));
  };

  const tile2lat = (y: number, z: number) => {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  };

  const tile2lng = (x: number, z: number) => {
    return (x / Math.pow(2, z)) * 360 - 180;
  };

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDragging || !dragStart) return;
    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;

    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      // Convert pixel offset to coordinate shifts based on current zoom
      const metersPerPixel = (156543.03392 * Math.cos((currentLat * Math.PI) / 180)) / Math.pow(2, zoom);
      const latShift = (dy * metersPerPixel) / 111320;
      const lngShift = -(dx * metersPerPixel) / (111320 * Math.cos((currentLat * Math.PI) / 180));

      const newLat = currentLat + latShift;
      const newLng = currentLng + lngShift;

      setCurrentLat(newLat);
      setCurrentLng(newLng);
      setDragStart({ x: clientX, y: clientY });
    }
  };

  const endDrag = async () => {
    if (isDragging) {
      setIsDragging(false);
      setDragStart(null);
      // Reverse geocode after dragging stops
      const result = await locationService.reverseGeocode(currentLat, currentLng);
      onLocationChange(result);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => startDrag(e.clientX, e.clientY);
  const handleMouseMove = (e: React.MouseEvent) => moveDrag(e.clientX, e.clientY);
  const handleMouseUp = () => void endDrag();
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handleTouchEnd = () => void endDrag();

  const handleMapClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dx = e.clientX - rect.left - centerX;
    const dy = e.clientY - rect.top - centerY;

    const metersPerPixel = (156543.03392 * Math.cos((currentLat * Math.PI) / 180)) / Math.pow(2, zoom);
    const latShift = -(dy * metersPerPixel) / 111320;
    const lngShift = (dx * metersPerPixel) / (111320 * Math.cos((currentLat * Math.PI) / 180));

    const newLat = currentLat + latShift;
    const newLng = currentLng + lngShift;

    setCurrentLat(newLat);
    setCurrentLng(newLng);

    const result = await locationService.reverseGeocode(newLat, newLng);
    onLocationChange(result);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(19, z + 1));
  const handleZoomOut = () => setZoom((z) => Math.max(12, z - 1));

  const handleRecenter = async () => {
    const res = await locationService.getCurrentPosition();
    if (res.success && res.lat && res.lng) {
      setCurrentLat(res.lat);
      setCurrentLng(res.lng);
      const geocoded = await locationService.reverseGeocode(res.lat, res.lng);
      onLocationChange(geocoded);
    }
  };

  // Compute 3x3 surrounding tiles for smooth raster background
  const centerTileX = lng2tile(currentLng, zoom);
  const centerTileY = lat2tile(currentLat, zoom);
  const tiles: { x: number; y: number; key: string }[] = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      tiles.push({
        x: centerTileX + dx,
        y: centerTileY + dy,
        key: `${zoom}-${centerTileX + dx}-${centerTileY + dy}`
      });
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[300px] sm:h-[360px] md:h-full md:min-h-[420px] rounded-2xl overflow-hidden bg-slate-100 select-none touch-none border border-slate-200/80 shadow-inner group ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleMapClick}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* RASTER TILE LAYER (OpenStreetMap tiles with fallback background) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="relative w-[768px] h-[768px] grid grid-cols-3 grid-rows-3 flex-shrink-0 transition-transform duration-75">
          {tiles.map((tile) => (
            <div key={tile.key} className="w-[256px] h-[256px] relative overflow-hidden bg-slate-100 border-none">
              <img
                src={`https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`}
                alt="map-tile"
                className="w-full h-full object-cover filter saturate-110"
                loading="eager"
                onError={(e) => {
                  // Fallback to placeholder if tile network is offline
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* TOP SEARCH OVERLAY BAR (Reference Screenshot 4) */}
      <div className="absolute top-3 inset-x-3 z-30 space-y-2 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        {/* Search input / selected location pill */}
        <div className="flex items-center justify-between bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-md">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-800 truncate" title={selectedAddressText}>
              {selectedAddressText || 'Bengaluru, Karnataka, India'}
            </span>
          </div>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors ml-2 flex-shrink-0"
              title="Change location"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Location pill with crosshair and locality */}
        {localityBadgeText && (
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200/90 shadow-xs">
            <Crosshair className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="text-[11px] font-bold text-slate-700 truncate">{localityBadgeText}</span>
          </div>
        )}
      </div>

      {/* EXACT REFERENCE GREEN SPEECH BUBBLE & CENTER PIN (Screenshot 4) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-20 flex flex-col items-center">
        {/* Green Speech Bubble */}
        <div className="bg-[#1b5e20] text-white py-1.5 px-3 rounded-lg shadow-xl text-center leading-tight max-w-[230px] sm:max-w-none sm:whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
          <p className="text-xs font-black tracking-tight">Your order would be delivered here</p>
          <p className="text-[11px] font-normal text-emerald-100 opacity-95">Place the pin to your exact location</p>
        </div>
        {/* Speech Bubble Arrow pointing to the pin */}
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1b5e20] shadow-sm" />

        {/* Pin Marker with Amber/Gold Accent and Center Dot */}
        <div className="mt-1 flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-amber-400 border-2 border-white shadow-lg flex items-center justify-center transform -translate-y-0.5">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
          </div>
          {/* Subtle Pin shadow on the ground */}
          <div className="w-2.5 h-1 bg-slate-900/40 rounded-full blur-[1px] -mt-0.5" />
        </div>
      </div>

      {/* MAP INTERACTIVE CONTROLS (Bottom-Right) */}
      <div
        className="absolute bottom-3 right-3 z-30 flex flex-col gap-1.5 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={handleRecenter}
          className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition-all active:scale-95"
          title="Recenter GPS"
        >
          <Navigation className="w-4 h-4 text-emerald-600" />
        </button>
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all font-bold active:scale-95"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-xl bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-all font-bold active:scale-95"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* MAP ATTRIBUTION (Bottom-Left) */}
      <div
        className="absolute bottom-2 left-2 z-20 pointer-events-none text-[9px] font-medium text-slate-600 bg-white/80 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1.5"
      >
        <span>© OpenStreetMap contributors</span>
        <span>•</span>
        <span className="font-bold text-slate-800">BUILDORA 60 GIS</span>
      </div>
    </div>
  );
};
