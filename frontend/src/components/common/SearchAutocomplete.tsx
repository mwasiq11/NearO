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
  type: 'service' | 'category' | 'tag';
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
}

export function SearchAutocomplete({
  value,
  onValueChange,
  suggestions,
  placeholder = "Search services",
  className,
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
    const grouped: Record<string, SearchSuggestion[]> = {
      service: [],
      category: [],
      tag: [],
    };
    filteredSuggestions.forEach(s => {
      grouped[s.type].push(s);
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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className="pl-9"
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
                {groupedSuggestions.service.length > 0 && (
                  <CommandGroup heading="Services">
                    {groupedSuggestions.service.map((suggestion) => (
                      <CommandItem
                        key={`service-${suggestion.value}`}
                        value={suggestion.value}
                        onSelect={() => handleSelect(suggestion)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{suggestion.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {groupedSuggestions.category.length > 0 && (
                  <CommandGroup heading="Categories">
                    {groupedSuggestions.category.map((suggestion) => (
                      <CommandItem
                        key={`category-${suggestion.value}`}
                        value={suggestion.value}
                        onSelect={() => handleSelect(suggestion)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <span className="mr-2">📂</span>
                        <span className="flex-1">{suggestion.label}</span>
                        {suggestion.count && (
                          <span className="text-xs text-muted-foreground">
                            {suggestion.count}
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {groupedSuggestions.tag.length > 0 && (
                  <CommandGroup heading="Tags">
                    {groupedSuggestions.tag.map((suggestion) => (
                      <CommandItem
                        key={`tag-${suggestion.value}`}
                        value={suggestion.value}
                        onSelect={() => handleSelect(suggestion)}
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <span className="mr-2">#</span>
                        <span className="flex-1">{suggestion.label}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
