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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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

  // Filter suggestions based on input
  const filteredSuggestions = React.useMemo(() => {
    if (!value) return suggestions.slice(0, 8); // Show top 8 when empty
    return suggestions
      .filter(s => s.label.toLowerCase().includes(value.toLowerCase()))
      .slice(0, 8);
  }, [suggestions, value]);

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
    if (!open && filteredSuggestions.length > 0) {
      setOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (filteredSuggestions.length > 0) {
      setOpen(true);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
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
        </div>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
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
      </PopoverContent>
    </Popover>
  )
}
