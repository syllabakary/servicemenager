import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FaSearch } from "react-icons/fa";

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
    <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 border-2 border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <div className="relative">
          <FaSearch className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[site-primary] pointer-events-none" />
          <Input
            type="search"
            placeholder="Rechercher une agence..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 md:pl-12 h-12 md:h-14 text-base border-2 border-gray-200 focus:border-[site-primary] focus:ring-2 focus:ring-[site-primary]/20 rounded-xl"
            data-testid="input-search"
          />
        </div>

        <Select value={selectedCity} onValueChange={onCityChange}>
          <SelectTrigger 
            data-testid="select-city"
            className="h-12 md:h-14 text-base border-2 border-gray-200 focus:border-[site-primary] rounded-xl"
          >
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
          <SelectTrigger 
            data-testid="select-service"
            className="h-12 md:h-14 text-base border-2 border-gray-200 focus:border-[site-primary] rounded-xl"
          >
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
  );
}
