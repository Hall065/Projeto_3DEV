import { SearchField } from '@/components/common/VisualPrimitives';
import { useFilterStore } from '@/stores/filter.store';

interface FilterBarProps {
  placeholder?: string;
}

export function FilterBar({ placeholder = 'Buscar...' }: FilterBarProps) {
  const { search, setSearch } = useFilterStore();

  return <SearchField placeholder={placeholder} value={search} onChangeText={setSearch} />;
}
