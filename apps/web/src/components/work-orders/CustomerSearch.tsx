import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, UserPlus } from "lucide-react";
import { useSupabase } from "@/context/SupabaseProvider";
import { searchCustomers } from "@/lib/services/customers";
import type { Customer } from "@/lib/services/customers";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InlineCustomerForm } from "./InlineCustomerForm";

interface CustomerSearchProps {
  onCustomerSelect: (customerId: string) => void;
  selectedCustomerId?: string;
}

export function CustomerSearch({ onCustomerSelect, selectedCustomerId }: CustomerSearchProps) {
  const { supabase } = useSupabase();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [, setLoading] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  
  const debouncedQuery = useDebounce(query, 300);

  // We only fetch when the user types
  useEffect(() => {
    let active = true;

    if (!debouncedQuery) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    searchCustomers(supabase, debouncedQuery)
      .then((data) => {
        if (active) setCustomers(data);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedQuery, supabase]);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedCustomerId
              ? selectedCustomer
                ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}`
                : "Cliente seleccionado"
              : "Seleccionar cliente..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Buscar por nombre, teléfono o DNI..." 
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center py-4 px-2 space-y-3">
                  <p className="text-sm text-muted-foreground">No se encontraron clientes.</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => {
                      setOpen(false);
                      setShowNewCustomer(true);
                    }}
                    className="w-full"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear nuevo cliente
                  </Button>
                </div>
              </CommandEmpty>
              
              <CommandGroup>
                {customers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={(currentValue) => {
                      onCustomerSelect(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedCustomerId === customer.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{customer.first_name} {customer.last_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {customer.phone && `Tel: ${customer.phone}`} {customer.tax_id && `| DNI: ${customer.tax_id}`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <InlineCustomerForm 
        open={showNewCustomer} 
        onOpenChange={setShowNewCustomer}
        initialName={query}
        onCustomerCreated={(c) => {
          setCustomers(prev => [c, ...prev]);
          onCustomerSelect(c.id);
        }}
      />
    </>
  );
}
