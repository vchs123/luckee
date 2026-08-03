import { useEffect, useRef } from "react";
import type { Experience } from "~/data/types";

interface Props {
  experiences: Experience[];
}

export function MelbourneMap({ experiences }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const pinned = experiences.filter(x => x.lat && x.lng);
    if (!pinned.length) return;

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return;

      // Fix default marker icon paths broken by bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center: [-37.8136, 144.9631],
        zoom: 14,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      pinned.forEach(x => {
        const icon = L.divIcon({
          className: "",
          html: `<div class="melb-marker">${x.e}</div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          popupAnchor: [0, -22],
        });
        L.marker([x.lat!, x.lng!], { icon })
          .addTo(map)
          .bindPopup(`<strong>${x.n}</strong><br/><span style="font-size:12px;color:#6b4d82">${x.t}</span>`);
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [experiences]);

  return <div ref={containerRef} className="melb-map" />;
}
