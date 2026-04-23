import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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

const POPULAR_CURRENCIES = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
];

const ALL_CURRENCIES = [
  ...POPULAR_CURRENCIES,
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
];

interface CurrencySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CurrencySelector({
  value,
  onChange,
  disabled = false,
  className,
}: CurrencySelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const selectedCurrency = ALL_CURRENCIES.find(c => c.code === value) || ALL_CURRENCIES[0];

  const filteredCurrencies = ALL_CURRENCIES.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-[110px] justify-between font-bold', className)}
        >
          <span>{selectedCurrency.code}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder="Search currency..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="border-none focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No currency found.</CommandEmpty>
            
            <CommandGroup heading="Popular">
              {POPULAR_CURRENCIES.filter(c => 
                 c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                 c.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  onSelect={() => {
                    onChange(currency.code);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === currency.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="font-bold">{currency.code}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[80px]">{currency.name}</span>
                  </div>
                  <span className="font-medium text-primary">{currency.symbol}</span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="All Currencies">
              {filteredCurrencies
                .filter(c => !POPULAR_CURRENCIES.some(p => p.code === c.code))
                .map((currency) => (
                <CommandItem
                  key={currency.code}
                  value={currency.code}
                  onSelect={() => {
                    onChange(currency.code);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className={cn(
                        'h-4 w-4',
                        value === currency.code ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="font-bold">{currency.code}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[80px]">{currency.name}</span>
                  </div>
                  <span className="font-medium text-primary">{currency.symbol}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
