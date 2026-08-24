import { z } from "zod";

export const newCustomerSchema = z.object({
  first_name: z.string().min(2, "Mínimo 2 caracteres"),
  last_name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: z.string().optional(),
  tax_id: z.string().optional(),
});

export type NewCustomerFormValues = z.infer<typeof newCustomerSchema>;

export const workOrderSchema = z.object({
  customer_id: z.string().uuid("Seleccione un cliente"),
  device_brand: z.string().min(1, "Requerido"),
  device_model: z.string().min(1, "Requerido"),
  reported_problem: z.string().min(1, "Requerido"),
  device_color: z.string().optional(),
  aesthetic_condition: z.string().optional(),
  accessories: z.string().optional(),
  suggested_solution: z.string().optional(),
  status: z.enum(["received", "quotation"]).default("received"),
  estimated_cost: z.coerce.number().min(0).default(0),
  estimated_delivery_at: z.string().optional(),
  advance_payment: z.coerce.number().min(0, "No puede ser negativo").default(0),
  payment_method: z.enum(["cash", "qr", "transfer", "card"]).default("cash"),
});

export type WorkOrderFormValues = z.infer<typeof workOrderSchema>;
