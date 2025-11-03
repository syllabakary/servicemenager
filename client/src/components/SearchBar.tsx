import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  selectedCity: string;
  selectedService: string;
  onSearchChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onServiceChange: (value: string) => void;
  cities: string[];
  services: string[];
}

export function SearchBar({
  searchTerm,
  selectedCity,
  selectedService,
  onSearchChange,
  onCityChange,
  onServiceChange,
  cities,
  services,
}: SearchBarProps) {
  return (
    <div className="sticky top-16 z-40 bg-background border-y border-border shadow-md py-4">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Rechercher une agence..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>

          <Select value={selectedCity} onValueChange={onCityChange}>
            <SelectTrigger data-testid="select-city">
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-city-all">Toutes les villes</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city} data-testid={`option-city-${city.toLowerCase().replace(/\s+/g, '-')}`}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedService} onValueChange={onServiceChange}>
            <SelectTrigger data-testid="select-service">
              <SelectValue placeholder="Tous les services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" data-testid="option-service-all">Tous les services</SelectItem>
              {services.map((service) => (
                <SelectItem key={service} value={service} data-testid={`option-service-${service.toLowerCase().replace(/\s+/g, '-')}`}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
