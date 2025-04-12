import React from 'react';
import { Input } from '../../components/ui/Input';
import { Checkbox } from '../../components/ui/Checkbox';
import { Search } from 'lucide-react';
import { FilterOptions } from './VoterContext';

interface VoterFiltersProps {
  filterOptions: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
}

const VoterFilters: React.FC<VoterFiltersProps> = ({ filterOptions, onFilterChange }) => {
  const updateFilter = (key: keyof FilterOptions, value: any) => {
    onFilterChange({
      ...filterOptions,
      [key]: value,
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Tìm kiếm theo email, số điện thoại hoặc địa chỉ ví..."
          className="pl-9 bg-white dark:bg-gray-800"
          value={filterOptions.searchTerm}
          onChange={(e) => updateFilter('searchTerm', e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showVerified"
            checked={filterOptions.showVerified}
            onCheckedChange={(checked) => updateFilter('showVerified', !!checked)}
          />
          <label htmlFor="showVerified" className="text-sm text-gray-700 dark:text-gray-300">
            Đã xác minh
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="showUnverified"
            checked={filterOptions.showUnverified}
            onCheckedChange={(checked) => updateFilter('showUnverified', !!checked)}
          />
          <label htmlFor="showUnverified" className="text-sm text-gray-700 dark:text-gray-300">
            Chưa xác minh
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="showWithTicket"
            checked={filterOptions.showWithTicket}
            onCheckedChange={(checked) => updateFilter('showWithTicket', !!checked)}
          />
          <label htmlFor="showWithTicket" className="text-sm text-gray-700 dark:text-gray-300">
            Có phiếu bầu
          </label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="showWithoutTicket"
            checked={filterOptions.showWithoutTicket}
            onCheckedChange={(checked) => updateFilter('showWithoutTicket', !!checked)}
          />
          <label htmlFor="showWithoutTicket" className="text-sm text-gray-700 dark:text-gray-300">
            Chưa có phiếu bầu
          </label>
        </div>
      </div>
    </div>
  );
};

export default VoterFilters;
