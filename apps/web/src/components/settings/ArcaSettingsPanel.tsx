import { useState, useEffect, useCallback } from "react"
import { useSupabase } from "@/context/SupabaseProvider"
import {
  fetchArcaConfig,
  upsertArcaConfig,
  checkArcaCertificates,
  uploadArcaCertificate,
  type ArcaConfig,
  type ArcaConfigInput,
  type TaxCondition,
  type ArcaEnvironment,
} from "@/lib/services/arca"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  FileText,
  Upload,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ArcaSettingsPanel() {
  const { supabase, profile } = useSupabase()
  const { toast } = useToast()
  const branchId = profile?.branch_id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<ArcaConfig | null>(null)
  const [certs, setCerts] = useState({ hasCert: false, hasKey: false })

  // Form state
  const [cuit, setCuit] = useState("")
  const [ptoVta, setPtoVta] = useState(1)
  const [taxCondition, setTaxCondition] = useState<TaxCondition>("monotributo")
  const [businessName, setBusinessName] = useState("")
  const [fantasyName, setFantasyName] = useState("")
  const [iibb, setIibb] = useState("")
  const [activityStartDate, setActivityStartDate] = useState("")
  const [environment, setEnvironment] = useState<ArcaEnvironment>("homologacion")
  const [isActive, setIsActive] = useState(false)

  const loadConfig = useCallback(async () => {
    if (!branchId) return
    try {
      setLoading(true)
      const [cfg, certStatus] = await Promise.all([
        fetchArcaConfig(supabase, branchId),
        checkArcaCertificates(supabase, branchId),
      ])
      setConfig(cfg)
      setCerts(certStatus)
      if (cfg) {
        setCuit(cfg.cuit || "")
        setPtoVta(cfg.pto_vta || 1)
        setTaxCondition(cfg.tax_condition || "monotributo")
        setBusinessName(cfg.business_name || "")
        setFantasyName(cfg.fantasy_name || "")
        setIibb(cfg.iibb || "")
        setActivityStartDate(cfg.activity_start_date || "")
        setEnvironment(cfg.environment || "homologacion")
        setIsActive(cfg.is_active || false)
      }
    } catch (err: unknown) {
      console.error("Error loading ARCA config:", err)
    } finally {
      setLoading(false)
    }
  }, [branchId, supabase])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  const handleSave = async () => {
    if (!branchId) return
    if (!cuit.trim() || cuit.replace(/\D/g, "").length < 11) {
      toast({ variant: "destructive", title: "CUIT inválido", description: "El CUIT debe tener 11 dígitos." })
      return
    }
    setSaving(true)
    try {
      const input: ArcaConfigInput = {
        cuit: cuit.replace(/\D/g, ""),
        pto_vta: ptoVta,
        tax_condition: taxCondition,
        business_name: businessName.trim() || null,
        fantasy_name: fantasyName.trim() || null,
        iibb: iibb.trim() || null,
        activity_start_date: activityStartDate || null,
        is_active: isActive,
        environment,
      }
      await upsertArcaConfig(supabase, branchId, input)
      toast({ title: "Configuración guardada", description: "Los datos fiscales se actualizaron correctamente." })
      await loadConfig()
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Error al guardar", description: err instanceof Error ? err.message : "Error desconocido." })
    } finally {
      setSaving(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "cert.crt" | "private.key") => {
    if (!branchId || !e.target.files?.[0]) return
    try {
      await uploadArcaCertificate(supabase, branchId, e.target.files[0], type)
      toast({ title: "Archivo subido", description: `${type} se cargó correctamente.` })
      const certStatus = await checkArcaCertificates(supabase, branchId)
      setCerts(certStatus)
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Error al subir", description: err instanceof Error ? err.message : "Error desconocido." })
    }
  }

  if (!branchId) {
    return (
      <Card className="border border-border/40 bg-background/40 backdrop-blur-md shadow-sm">
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          No se detectó una sucursal asignada. Contactá al administrador.
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card className="border border-border/40 bg-background/40 backdrop-blur-md shadow-sm">
        <CardContent className="py-8 flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando configuración fiscal...
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border/40 bg-background/40 backdrop-blur-md shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Facturación Electrónica (ARCA / AFIP)</CardTitle>
        </div>
        {config?.is_active ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-green-700 bg-green-100 border border-green-200">
            <CheckCircle2 className="h-3 w-3" /> Activa
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold text-muted-foreground bg-muted/40 border border-border/40">
            <XCircle className="h-3 w-3" /> Inactiva
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Datos Fiscales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>CUIT *</Label>
            <Input placeholder="20-12345678-9" value={cuit} onChange={(e) => setCuit(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Punto de Venta *</Label>
            <Input type="number" min={1} max={99999} value={ptoVta} onChange={(e) => setPtoVta(parseInt(e.target.value) || 1)} />
          </div>
          <div className="space-y-1">
            <Label>Condición Impositiva *</Label>
            <Select value={taxCondition} onValueChange={(v) => setTaxCondition(v as TaxCondition)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monotributo">Monotributo</SelectItem>
                <SelectItem value="responsable_inscripto">Responsable Inscripto</SelectItem>
                <SelectItem value="exento">Exento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Entorno</Label>
            <Select value={environment} onValueChange={(v) => setEnvironment(v as ArcaEnvironment)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="homologacion">Homologación (Pruebas)</SelectItem>
                <SelectItem value="produccion">Producción</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Razón Social</Label>
            <Input placeholder="Juan Pérez" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Nombre de Fantasía</Label>
            <Input placeholder="Taller TechFix" value={fantasyName} onChange={(e) => setFantasyName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Ingresos Brutos</Label>
            <Input placeholder="Nro. IIBB" value={iibb} onChange={(e) => setIibb(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Inicio de Actividades</Label>
            <Input type="date" value={activityStartDate} onChange={(e) => setActivityStartDate(e.target.value)} />
          </div>
        </div>

        {/* Certificados */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-primary" /> Certificados Digitales
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/60">
              <div className="flex items-center gap-2">
                {certs.hasCert ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Certificado (.crt)</span>
              </div>
              <label className="cursor-pointer">
                <input type="file" accept=".crt,.pem" className="hidden" onChange={(e) => handleUpload(e, "cert.crt")} />
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/40 bg-background/40 hover:bg-accent transition-colors">
                  <Upload className="h-3 w-3" /> {certs.hasCert ? "Reemplazar" : "Subir"}
                </span>
              </label>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/60">
              <div className="flex items-center gap-2">
                {certs.hasKey ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">Clave Privada (.key)</span>
              </div>
              <label className="cursor-pointer">
                <input type="file" accept=".key,.pem" className="hidden" onChange={(e) => handleUpload(e, "private.key")} />
                <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/40 bg-background/40 hover:bg-accent transition-colors">
                  <Upload className="h-3 w-3" /> {certs.hasKey ? "Reemplazar" : "Subir"}
                </span>
              </label>
            </div>
          </div>
          {!certs.hasCert && !certs.hasKey && environment === "homologacion" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-kpi-amber/10 border border-kpi-amber/20 text-sm text-kpi-amber">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Sin certificados, la facturación funcionará en <strong>modo simulación</strong> (Mock). Los comprobantes generados no serán válidos ante ARCA.</span>
            </div>
          )}
        </div>

        {/* Activación y guardado */}
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm font-medium">Activar facturación electrónica</span>
          </label>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Guardar Configuración
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
