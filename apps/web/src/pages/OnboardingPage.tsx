import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSupabase } from '@/context/SupabaseProvider'
import { checkAnyBranchExists } from '@/lib/services/branches'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Package } from 'lucide-react'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { supabase, session, profile, refreshProfile } = useSupabase()

  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form fields matching the RPC signature
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [taxId, setTaxId] = useState('')
  const [serviceConditions, setServiceConditions] = useState('')

  // Guard: redirect away if branches already exist
  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }

    // If user already has a branch, go to dashboard
    if (profile?.branch_id) {
      navigate('/', { replace: true })
      return
    }

    let cancelled = false
    checkAnyBranchExists()
      .then((exists) => {
        if (cancelled) return
        if (exists) {
          // Branches already exist — this user should be on pending-approval
          navigate('/pending-approval', { replace: true })
        } else {
          setChecking(false)
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false)
      })

    return () => {
      cancelled = true
    }
  }, [session, profile, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: rpcError } = await supabase.rpc('create_initial_branch_and_setup_owner', {
      p_name: name,
      p_address: address || null,
      p_phone: phone || null,
      p_email: email || null,
      p_tax_id: taxId || null,
      p_service_conditions: serviceConditions || null,
    })

    if (rpcError) {
      setError(rpcError.message)
      setLoading(false)
      return
    }

    // Refresh profile so context picks up the new branch_id
    await refreshProfile()
    navigate('/', { replace: true })
  }

  if (checking) {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Package className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Configuración Inicial</CardTitle>
          <CardDescription>
            Creá la sucursal principal de tu taller para comenzar a usar el sistema.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la Sucursal *</Label>
              <Input
                id="name"
                placeholder="Ej: Taller Central"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                placeholder="Ej: Av. Corrientes 1234"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="Ej: +54 11 1234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ej: taller@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">CUIT</Label>
              <Input
                id="taxId"
                placeholder="Ej: 20-12345678-9"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceConditions">Condiciones de Servicio</Label>
              <textarea
                id="serviceConditions"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Condiciones generales del servicio..."
                value={serviceConditions}
                onChange={(e) => setServiceConditions(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? 'Creando sucursal...' : 'Crear Sucursal y Comenzar'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
