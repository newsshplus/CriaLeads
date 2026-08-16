import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { COUNTRY_CITIES } from '../constants';

interface CitySelectorProps {
  country: string;
  selectedCity: string;
  onSelectCity: (city: string) => void;
}

const CitySelector: React.FC<CitySelectorProps> = ({ country, selectedCity, onSelectCity }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(selectedCity);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(selectedCity);
  }, [selectedCity]);

  const citiesList = useMemo(() => {
    return COUNTRY_CITIES[country] || [];
  }, [country]);

  const filteredCities = useMemo(() => {
    if (!inputValue) return citiesList;
    return citiesList.filter(city => 
      city.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [citiesList, inputValue]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        if (inputValue !== selectedCity) {
            onSelectCity(inputValue);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, inputValue, selectedCity, onSelectCity]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onSelectCity(val);
    setIsOpen(true);
  };

  const handleSelect = (city: string) => {
    setInputValue(city);
    onSelectCity(city);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
          Cidade <span className="text-gray-400 font-normal text-xs">(Opcional)</span>
      </label>
      <div className="relative">
        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white text-gray-900"
          placeholder="Todas as cidades..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
        />
        <ChevronDown 
            className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" 
            onClick={() => setIsOpen(!isOpen)}
        />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredCities.length > 0 ? (
            filteredCities.map((city) => (
              <button
                key={city}
                type="button"
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                onClick={() => handleSelect(city)}
              >
                {city}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-xs text-gray-500 italic">
               Nenhuma cidade listada encontrada.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitySelector;