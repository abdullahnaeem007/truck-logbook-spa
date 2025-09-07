import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { LngLatLike } from 'maplibre-gl'

type MapViewProps = {
  geo: GeoJSON.Feature<GeoJSON.LineString>
}

export default function MapView({ geo }: MapViewProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const map = new maplibregl.Map({
      container: ref.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [0, 0],
      zoom: 2,
      dragRotate: false,
      pitchWithRotate: false,
      attributionControl: false,
      cooperativeGestures: true,
    })

    // Minimal controls
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left')

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(ref.current)

    map.on('load', () => {
      // Route source
      if (!map.getSource('route')) {
        map.addSource('route', {
          type: 'geojson',
          data: geo,
          lineMetrics: true, // enables nicer gradients/animations if needed
        })
      }

      // Soft casing behind the line (for contrast on any basemap)
      if (!map.getLayer('route-casing')) {
        map.addLayer({
          id: 'route-casing',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#ffffff',
            'line-width': 10,
            'line-opacity': 0.85,
          },
        })
      }

      // Main route line (subtle fade-in)
      if (!map.getLayer('route-line')) {
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#2563EB',              // indigo-600
            'line-width': 5,
            'line-opacity': 0,                    // start hidden
          },
        })
        // trigger fade-in
        map.setPaintProperty('route-line', 'line-opacity', 1)
      }

      // Start/End markers (minimal dots + labels)
      const coords = geo.geometry.coordinates.map((p) => [p[0], p[1]] as [number, number])
      if (coords.length >= 2) {
        const markers: GeoJSON.FeatureCollection<GeoJSON.Point> = {
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { label: 'Start' }, geometry: { type: 'Point', coordinates: coords[0] } },
            { type: 'Feature', properties: { label: 'End' },   geometry: { type: 'Point', coordinates: coords[coords.length - 1] } },
          ],
        }

        if (!map.getSource('route-points')) {
          map.addSource('route-points', { type: 'geojson', data: markers })
        } else {
          (map.getSource('route-points') as maplibregl.GeoJSONSource).setData(markers)
        }

        if (!map.getLayer('route-point-circles')) {
          map.addLayer({
            id: 'route-point-circles',
            type: 'circle',
            source: 'route-points',
            paint: {
              'circle-radius': 6,
              'circle-color': '#111827',
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 2,
            },
          })
        }
        if (!map.getLayer('route-point-labels')) {
          map.addLayer({
            id: 'route-point-labels',
            type: 'symbol',
            source: 'route-points',
            layout: {
              'text-field': ['get', 'label'],
              'text-size': 12,
              'text-offset': [0, 1.2],
              'text-anchor': 'top',
              'text-allow-overlap': true,
            },
            paint: { 'text-color': '#111827', 'text-halo-color': '#ffffff', 'text-halo-width': 0.8 },
          })
        }
      }

      // Fit nicely
      if (coords.length) {
        const b = new maplibregl.LngLatBounds(
          coords[0] as LngLatLike,
          coords[0] as LngLatLike
        )
        coords.forEach((c) => b.extend(c as LngLatLike))
        map.fitBounds(b, { padding: 56, animate: true, duration: 800 })
      }
    })

    return () => {
      ro.disconnect()
      map.remove()
    }
  }, [geo])

  // Minimal, pretty container
  return (
    <div
      ref={ref}
      className="w-full h-[420px] rounded-2xl border border-slate-200 shadow-sm overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100"
    />
  )
}
