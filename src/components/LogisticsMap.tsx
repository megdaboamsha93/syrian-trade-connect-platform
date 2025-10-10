import { useEffect } from 'react';
// @ts-ignore
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useLanguage } from '@/contexts/LanguageContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Port/Hub coordinates for major trade routes
const portCoordinates: Record<string, [number, number]> = {
  // Middle East Ports
  'Syria': [35.5138, 35.7800], // Latakia Port
  'Lebanon': [33.9010, 35.4951], // Beirut Port
  'Turkey': [41.0205, 28.9747], // Istanbul Port
  'Iraq': [30.5085, 47.7830], // Umm Qasr Port
  'Jordan': [29.5321, 35.0063], // Aqaba Port
  'Egypt': [31.2001, 29.9187], // Alexandria Port
  'UAE': [25.2867, 55.3364], // Dubai Port
  'Saudi Arabia': [21.5433, 39.1728], // Jeddah Port
  
  // European Ports
  'Germany': [53.5511, 9.9937], // Hamburg Port
  'France': [43.2965, 5.3698], // Marseille Port
  'Italy': [40.8518, 14.2681], // Naples Port
  'Greece': [37.9420, 23.6463], // Piraeus Port
  'Cyprus': [34.9174, 33.6290], // Limassol Port
  'Spain': [41.3851, 2.1734], // Barcelona Port
  'Netherlands': [51.9225, 4.4792], // Rotterdam Port
  
  // Major Hubs
  'Russia': [43.1332, 131.9113], // Vladivostok (Far East)
  'China': [31.2304, 121.4737], // Shanghai Port
  'India': [18.9388, 72.8354], // Mumbai Port
  'Singapore': [1.2644, 103.8220], // Singapore Port
};

// Land/city coordinates for land, air, and rail routes
const cityCoordinates: Record<string, [number, number]> = {
  'Syria': [33.5138, 36.2765], // Damascus
  'Lebanon': [33.8886, 35.4955], // Beirut
  'Turkey': [39.9334, 32.8597], // Ankara
  'Iraq': [33.3152, 44.3661], // Baghdad
  'Jordan': [31.9454, 35.9284], // Amman
  'Egypt': [30.0444, 31.2357], // Cairo
  'UAE': [25.2048, 55.2708], // Dubai
  'Saudi Arabia': [24.7136, 46.6753], // Riyadh
  'Germany': [52.5200, 13.4050], // Berlin
  'France': [48.8566, 2.3522], // Paris
  'Italy': [41.9028, 12.4964], // Rome
  'Greece': [37.9838, 23.7275], // Athens
  'Cyprus': [35.1856, 33.3823], // Nicosia
  'Russia': [55.7558, 37.6173], // Moscow
  'China': [39.9042, 116.4074], // Beijing
};

// Key waypoints for realistic sea routes (avoiding land)
const seaWaypoints: Record<string, [number, number][]> = {
  // Mediterranean routes
  'med-east-west': [
    [35.5, 25.0], // Between Cyprus and Crete
    [37.0, 15.0], // Sicily strait
  ],
  // Suez Canal route
  'suez': [
    [30.0, 32.5], // Suez Canal north
    [29.0, 33.0], // Suez Canal south
    [20.0, 40.0], // Red Sea
  ],
  // Gulf routes
  'gulf': [
    [26.0, 56.0], // Strait of Hormuz
    [25.0, 60.0], // Arabian Sea
  ],
};

interface LogisticsMapProps {
  providers: any[];
  selectedProvider: string | null;
  onProviderSelect: (id: string | null) => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, 6);
  }, [center, map]);
  
  return null;
}

export function LogisticsMap({ providers, selectedProvider }: LogisticsMapProps) {
  const { language } = useLanguage();

  // Center on Syria by default
  const defaultCenter: [number, number] = [34.8021, 38.9968];

  // Get all unique routes from all providers
  const allRoutes = providers.flatMap(provider => 
    provider.shipping_routes?.map((route: any) => ({
      ...route,
      provider_name: language === 'ar' ? provider.company_name_ar : provider.company_name_en,
      provider_id: provider.id,
    })) || []
  );

  // Filter routes if a provider is selected
  const displayedRoutes = selectedProvider
    ? allRoutes.filter(route => route.provider_id === selectedProvider)
    : allRoutes;

  // Get route color based on service type
  const getRouteColor = (serviceType: string) => {
    switch (serviceType) {
      case 'air': return '#3B82F6'; // blue
      case 'sea': return '#0EA5E9'; // sky
      case 'land': return '#10B981'; // green
      case 'rail': return '#F59E0B'; // amber
      default: return '#6B7280'; // gray
    }
  };

  // Calculate realistic route with waypoints
  const calculateRoute = (
    origin: [number, number],
    dest: [number, number],
    serviceType: string
  ): [number, number][] => {
    if (serviceType === 'air') {
      // Air routes can be direct
      return [origin, dest];
    }

    if (serviceType === 'sea') {
      // Add waypoints for sea routes to follow coastlines
      const route: [number, number][] = [origin];
      
      // If route crosses Mediterranean
      if (origin[1] < 40 && dest[1] < 40 && Math.abs(origin[1] - dest[1]) > 10) {
        route.push(...seaWaypoints['med-east-west']);
      }
      
      // If route involves Gulf region
      if ((origin[1] > 45 && origin[1] < 60) || (dest[1] > 45 && dest[1] < 60)) {
        route.push(...seaWaypoints['gulf']);
      }
      
      route.push(dest);
      return route;
    }

    // Land and rail routes - direct for now
    return [origin, dest];
  };

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
      <MapContainer
        // @ts-ignore
        center={defaultCenter}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={defaultCenter} />

        {/* Draw routes */}
        {displayedRoutes.map((route, index) => {
          // Use port coords for sea routes, city coords for others
          const originCoords = route.service_type === 'sea' 
            ? portCoordinates[route.origin_country]
            : cityCoordinates[route.origin_country] || portCoordinates[route.origin_country];
          
          const destCoords = route.service_type === 'sea'
            ? portCoordinates[route.destination_country]
            : cityCoordinates[route.destination_country] || portCoordinates[route.destination_country];

          if (!originCoords || !destCoords) return null;

          const routeColor = getRouteColor(route.service_type);
          const routePath = calculateRoute(originCoords, destCoords, route.service_type);

          return (
            <div key={`${route.id}-${index}`}>
              {/* Origin Marker */}
              <Marker 
                // @ts-ignore
                position={originCoords}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{route.origin_country}</div>
                    {route.origin_city && <div className="text-muted-foreground">{route.origin_city}</div>}
                    <div className="text-xs mt-1">{language === 'ar' ? 'نقطة انطلاق' : 'Origin'}</div>
                  </div>
                </Popup>
              </Marker>

              {/* Destination Marker */}
              <Marker 
                // @ts-ignore
                position={destCoords}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{route.destination_country}</div>
                    {route.destination_city && <div className="text-muted-foreground">{route.destination_city}</div>}
                    <div className="text-xs mt-1">{language === 'ar' ? 'وجهة' : 'Destination'}</div>
                  </div>
                </Popup>
              </Marker>

              {/* Route Line with waypoints */}
              <Polyline
                // @ts-ignore
                positions={routePath}
                pathOptions={{
                  color: routeColor,
                  weight: 3,
                  opacity: 0.7,
                  dashArray: route.service_type === 'air' ? '10, 10' : undefined,
                }}
              >
                <Popup>
                  <div className="text-sm space-y-1">
                    <div className="font-semibold">{route.route_name}</div>
                    <div className="text-muted-foreground">{route.provider_name}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="capitalize">{route.service_type}</span>
                      {route.transit_time_days && (
                        <span>• {route.transit_time_days} {language === 'ar' ? 'يوم' : 'days'}</span>
                      )}
                    </div>
                    {route.frequency && (
                      <div className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'التردد:' : 'Frequency:'} {route.frequency}
                      </div>
                    )}
                  </div>
                </Popup>
              </Polyline>
            </div>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-card/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg z-[1000]">
        <div className="text-xs font-semibold mb-2">
          {language === 'ar' ? 'أنواع الخدمات' : 'Service Types'}
        </div>
        <div className="space-y-1">
          {['air', 'sea', 'land', 'rail'].map(type => (
            <div key={type} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                style={{ backgroundColor: getRouteColor(type) }}
              />
              <span>
                {language === 'ar' 
                  ? type === 'air' ? 'جوي' : type === 'sea' ? 'بحري' : type === 'land' ? 'بري' : 'سكك حديدية'
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
