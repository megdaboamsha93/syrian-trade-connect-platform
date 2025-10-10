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

// Country coordinates for common Middle Eastern and European countries
const countryCoordinates: Record<string, [number, number]> = {
  'Syria': [34.8021, 38.9968],
  'Lebanon': [33.8547, 35.8623],
  'Turkey': [38.9637, 35.2433],
  'Iraq': [33.2232, 43.6793],
  'Jordan': [30.5852, 36.2384],
  'Egypt': [26.8206, 30.8025],
  'UAE': [23.4241, 53.8478],
  'Saudi Arabia': [23.8859, 45.0792],
  'Germany': [51.1657, 10.4515],
  'France': [46.2276, 2.2137],
  'Italy': [41.8719, 12.5674],
  'Greece': [39.0742, 21.8243],
  'Cyprus': [35.1264, 33.4299],
  'Russia': [61.5240, 105.3188],
  'China': [35.8617, 104.1954],
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
          const originCoords = countryCoordinates[route.origin_country];
          const destCoords = countryCoordinates[route.destination_country];

          if (!originCoords || !destCoords) return null;

          const routeColor = getRouteColor(route.service_type);

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

              {/* Route Line */}
              <Polyline
                // @ts-ignore
                positions={[originCoords, destCoords]}
                pathOptions={{
                  color: routeColor,
                  weight: 2,
                  opacity: 0.6,
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
