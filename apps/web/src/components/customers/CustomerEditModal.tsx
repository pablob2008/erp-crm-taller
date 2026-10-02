import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { useSupabase } from "@/context/SupabaseProvider"
import { useToast } from "@/hooks/use-toast"
import {
  updateCustomer,
  createCustomer,
  type Customer,
} from "@/lib/services/customers"
import { CustomerForm, type CustomerFormData } from "./CustomerForm"

interface CustomerEditModalProps {
  open: boolean
  customer?: Customer | null
  mode?: "create" | "edit"
  onClose: () => void
  onSuccess?: (customer: Customer) => void
}

export function CustomerEditModal({
  open,
  customer,
  mode: propMode,
  onClose,
  onSuccess,
}: CustomerEditModalProps) {
  const { supabase, profile } = useSupabase()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const mode = propMode ?? (customer ? "edit" : "create")

  const handleSubmit = async (formData: CustomerFormData) => {
    setLoading(true)
    try {
      if (mode === "create") {
        if (!profile?.branch_id) {
          throw new Error("No se detectó una sucursal activa para crear el cliente.")
        }

        const created = await createCustomer(supabase, profile.branch_id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          tax_id: formData.tax_id,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        })

        toast({
          title: "Cliente creado",
          description: `${created.first_name} ${created.last_name} fue registrado con éxito.`,
        })

        onSuccess?.(created)
        onClose()
      } else {
        if (!customer) return

        const updated = await updateCustomer(supabase, customer.id, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          tax_id: formData.tax_id,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
        })

        toast({
          title: "Cliente actualizado",
          description: `Los datos de ${updated.first_name} ${updated.last_name} han sido guardados.`,
        })

        onSuccess?.(updated)
        onClose()
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : mode === "create"
          ? "Error al crear el cliente."
          : "Error al actualizar el cliente."
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-md border-border/40 shadow-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Nuevo Cliente" : "Editar Cliente"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completá los datos personales y de contacto para dar de alta al cliente."
              : "Modificá la información de contacto y facturación del cliente."}
          </DialogDescription>
        </DialogHeader>

        <CustomerForm
          initialData={
            customer
              ? {
                  first_name: customer.first_name,
                  last_name: customer.last_name,
                  tax_id: customer.tax_id,
                  phone: customer.phone,
                  email: customer.email,
                  address: customer.address,
                }
              : null
          }
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
          submitLabel={mode === "create" ? "Crear Cliente" : "Guardar Cambios"}
          showCancel={true}
        />
      </DialogContent>
    </Dialog>
  )
}
