import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

export interface CustomerFormData {
  first_name: string
  last_name: string
  tax_id?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}

export interface CustomerFormProps {
  initialData?: CustomerFormData | null
  onSubmit: (data: CustomerFormData) => Promise<void> | void
  onCancel?: () => void
  loading?: boolean
  submitLabel?: string
  showCancel?: boolean
}

export function CustomerForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = "Guardar",
  showCancel = true,
}: CustomerFormProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [taxId, setTaxId] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (initialData) {
      setFirstName(initialData.first_name || "")
      setLastName(initialData.last_name || "")
      setTaxId(initialData.tax_id || "")
      setPhone(initialData.phone || "")
      setEmail(initialData.email || "")
      setAddress(initialData.address || "")
    } else {
      setFirstName("")
      setLastName("")
      setTaxId("")
      setPhone("")
      setEmail("")
      setAddress("")
    }
    setErrors({})
  }, [initialData])

  const validate = () => {
    const nextErrors: Record<string, string> = {}
    if (!firstName.trim()) {
      nextErrors.firstName = "El nombre es obligatorio."
    }
    if (!lastName.trim()) {
      nextErrors.lastName = "El apellido es obligatorio."
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = "Formato de correo electrónico inválido."
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validate()) return

    await onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      tax_id: taxId.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="firstName">
            Nombre <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Juan"
            disabled={loading}
          />
          {errors.firstName && (
            <p className="text-xs text-destructive">{errors.firstName}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastName">
            Apellido <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Pérez"
            disabled={loading}
          />
          {errors.lastName && (
            <p className="text-xs text-destructive">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="taxId">DNI / CUIT</Label>
          <Input
            id="taxId"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            placeholder="20-12345678-9"
            disabled={loading}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+54 9 11 1234-5678"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cliente@ejemplo.com"
          disabled={loading}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Dirección</Label>
        <Textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Av. Corrientes 1234, CABA"
          rows={2}
          disabled={loading}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {showCancel && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
