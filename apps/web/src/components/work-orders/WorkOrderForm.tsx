import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabase } from "@/context/SupabaseProvider";
import { createWorkOrder } from "@/lib/services/work-orders";
import { workOrderSchema } from "@/lib/validations/work-orders";
import type { WorkOrderFormValues } from "@/lib/validations/work-orders";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerSearch } from "./CustomerSearch";
import { useToast } from "@/hooks/use-toast";

export function WorkOrderForm() {
  const { supabase, user } = useSupabase();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      customer_id: "",
      device_brand: "",
      device_model: "",
      reported_problem: "",
      device_color: "",
      aesthetic_condition: "",
      accessories: "",
      suggested_solution: "",
      status: "received" as const,
      estimated_cost: 0,
      estimated_delivery_at: "",
      advance_payment: 0,
    },
  });

  const selectedCustomerId = form.watch("customer_id");
  const isCustomerSelected = !!selectedCustomerId;

  const onSubmit = async (values: WorkOrderFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('branch_id').eq('id', user.id).single();
      if (!profile?.branch_id) throw new Error("No branch ID found");

      const result = await createWorkOrder(supabase, profile.branch_id, user.id, values);
      toast({
        title: "Orden de trabajo creada",
        description: "La orden se ha registrado correctamente.",
      });
      if (result.paymentError) {
        toast({
          title: "Advertencia",
          description: "Orden creada, pero el adelanto no pudo registrarse en caja. Hacelo manualmente.",
          variant: "destructive",
        });
      }
      navigate("/orders");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Hubo un problema al crear la orden de trabajo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Nueva Orden de Trabajo</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* 1. Selección de Cliente */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b pb-2">1. Cliente</h3>
              <FormField
                control={form.control}
                name="customer_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Buscar o crear cliente</FormLabel>
                    <FormControl>
                      <CustomerSearch 
                        selectedCustomerId={field.value}
                        onCustomerSelect={field.onChange} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 2. Datos del Dispositivo */}
            <div className={`space-y-4 transition-opacity ${isCustomerSelected ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              <h3 className="text-lg font-medium border-b pb-2">2. Datos del Equipo</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="device_brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Samsung" {...field} disabled={!isCustomerSelected} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="device_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Galaxy S21" {...field} disabled={!isCustomerSelected} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="device_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Negro" {...field} disabled={!isCustomerSelected} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="aesthetic_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Estético (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Rayón en pantalla" {...field} disabled={!isCustomerSelected} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="accessories"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accesorios que deja (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Cargador, funda" {...field} disabled={!isCustomerSelected} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 3. Problema y Solución */}
            <div className={`space-y-4 transition-opacity ${isCustomerSelected ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              <h3 className="text-lg font-medium border-b pb-2">3. Detalles de Reparación</h3>
              
              <FormField
                control={form.control}
                name="reported_problem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Falla Reportada *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describa el problema que reporta el cliente..." {...field} disabled={!isCustomerSelected} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="suggested_solution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Solución Sugerida (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas internas o solución propuesta..." {...field} disabled={!isCustomerSelected} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 4. Presupuesto y Tiempos */}
            <div className={`space-y-4 transition-opacity ${isCustomerSelected ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
              <h3 className="text-lg font-medium pb-2 mb-2">4. Presupuesto y Tiempos</h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado inicial</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isCustomerSelected}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50 border border-border/40 shadow-sm w-full">
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="received">Recibida</SelectItem>
                            <SelectItem value="quotation">Presupuesto</SelectItem>
                          </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_delivery_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Entrega estimada (Opcional)</FormLabel>
                      <FormControl>
                        <input
                          type="date"
                          {...field}
                          disabled={!isCustomerSelected}
                          className="bg-background/50 border border-border/40 shadow-sm rounded-md px-3 py-2 text-sm w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="estimated_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Presupuesto estimado</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                          {...field}
                          disabled={!isCustomerSelected}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advance_payment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adelanto / Seña</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="0.00"
                          {...field}
                          disabled={!isCustomerSelected}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medio de Pago</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isCustomerSelected}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50 border border-border/40 shadow-sm w-full">
                              <SelectValue placeholder="Seleccionar método" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cash">Efectivo</SelectItem>
                            <SelectItem value="qr">QR</SelectItem>
                            <SelectItem value="transfer">Transferencia</SelectItem>
                            <SelectItem value="card">Tarjeta</SelectItem>
                          </SelectContent>
                        </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <CardFooter className="px-0 pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate("/orders")}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isCustomerSelected || isSubmitting}>
                {isSubmitting ? "Creando..." : "Crear Orden"}
              </Button>
            </CardFooter>

          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
