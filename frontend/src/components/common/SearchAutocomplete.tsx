import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import { useDebounce } from "@/hooks/useDebounce"

interface SearchSuggestion {
  type?: string;
  group?: string;
  value: string;
  label: string;
  count?: number;
}

interface SearchAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  suggestions: SearchSuggestion[];
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  leadingPaddingClassName?: string;
  groupLabels?: Record<string, string>;
}

export function SearchAutocomplete({
  value,
  onValueChange,
  suggestions,
  placeholder = "Search services",
  className,
  inputClassName,
  leadingPaddingClassName = "pl-11",
  groupLabels,
}: SearchAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  
  // Debounce the input value for filtering
  const debouncedValue = useDebounce(value, 300);

  // Filter suggestions based on debounced input
  const filteredSuggestions = React.useMemo(() => {
    if (!debouncedValue) return suggestions.slice(0, 8); // Show top 8 when empty
    return suggestions
      .filter(s => s.label.toLowerCase().includes(debouncedValue.toLowerCase()))
      .slice(0, 8);
  }, [suggestions, debouncedValue]);

  const groupedSuggestions = React.useMemo(() => {
    const grouped: Record<string, SearchSuggestion[]> = {};
    filteredSuggestions.forEach(s => {
      const groupKey = s.group || s.type || 'suggestions';
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(s);
    });
    return grouped;
  }, [filteredSuggestions]);

  const handleSelect = (suggestion: SearchSuggestion) => {
    onValueChange(suggestion.value);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(e.target.value);
    if (!open) {
      setOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) {
      setOpen(true);
    }
  };

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  React.useEffect(() => {
    if (filteredSuggestions.length === 0) {
      setOpen(false);
    }
  }, [filteredSuggestions.length]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={cn(leadingPaddingClassName, inputClassName)}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
          <Command shouldFilter={false}>
          <CommandList>
            {filteredSuggestions.length === 0 ? (
              <CommandEmpty>No suggestions found.</CommandEmpty>
            ) : (
              <>
                {Object.entries(groupedSuggestions).map(([groupKey, groupSuggestions]) => (
                  <CommandGroup key={groupKey} heading={groupLabels?.[groupKey] || groupKey}>
                    {groupSuggestions.map((suggestion) => (
                      <CommandItem
                        key={`${groupKey}-${suggestion.value}`}
                        value={suggestion.value}
                        onSelect={() => handleSelect(suggestion)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {groupKey === 'service' && <Search className="mr-2 h-4 w-4 text-muted-foreground" />}
                        {groupKey === 'category' && <span className="mr-2">📂</span>}
                        {groupKey === 'tag' && <span className="mr-2">#</span>}
                        <span className="flex-1">{suggestion.label}</span>
                        {suggestion.count && (
                          <span className="text-xs text-muted-foreground">
                            {suggestion.count}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
