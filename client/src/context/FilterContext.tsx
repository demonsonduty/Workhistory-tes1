import { createContext, useContext, ReactNode, useState } from 'react';
import { FilterState } from '@/types/workHistory';

interface FilterContextType {
  filter: FilterState;
  setFilter: (filter: FilterState) => void;
  resetFilters: () => void;
}

const defaultFilter: FilterState = {
  year: 'all',
  customer: 'all',
  jobType: 'all',
  workCenter: 'all'
};

const FilterContext = createContext<FilterContextType>({
  filter: defaultFilter,
  setFilter: () => {},
  resetFilters: () => {}
});

export const useFilter = () => useContext(FilterContext);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filter, setFilter] = useState<FilterState>(defaultFilter);

  const resetFilters = () => {
    setFilter(defaultFilter);
  };

  return (
    <FilterContext.Provider value={{ filter, setFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};
