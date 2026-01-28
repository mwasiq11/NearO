import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  categories: Category[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CategoryCombobox({
  value,
  onChange,
  categories,
  placeholder = 'Select category...',
  disabled = false,
  className,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Check if current value is a custom category (not in the list)
  const isCustomCategory = value && !categories.some(cat => cat.name === value);
  
  // Get display value
  const displayValue = value || placeholder;
  
  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if search query could be a new custom category
  const canAddCustom = searchQuery.trim() && 
    !categories.some(cat => cat.name.toLowerCase() === searchQuery.toLowerCase());

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue === value ? '' : selectedValue);
    setOpen(false);
    setSearchQuery('');
  };

  const handleAddCustom = () => {
    if (canAddCustom) {
      onChange(searchQuery.trim());
      setOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-full justify-between', className)}
        >
          <span className={cn(!value && 'text-muted-foreground')}>
            {displayValue}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or type new category..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {searchQuery ? (
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground mb-2">
                    No categories found
                  </p>
                  {canAddCustom && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustom}
                      className="mt-2"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add "{searchQuery.trim()}"
                    </Button>
                  )}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Type to search categories
                </p>
              )}
            </CommandEmpty>
            
            {filteredCategories.length > 0 && (
              <CommandGroup heading="Categories">
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => handleSelect(category.name)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === category.name ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{category.name}</span>
                      {category.description && (
                        <span className="text-xs text-muted-foreground">
                          {category.description}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {canAddCustom && filteredCategories.length > 0 && (
              <CommandGroup heading="Custom">
                <CommandItem onSelect={handleAddCustom}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Add "{searchQuery.trim()}"</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
