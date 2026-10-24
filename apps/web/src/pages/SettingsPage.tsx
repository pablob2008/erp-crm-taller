import { Building2, UserCog, Palette } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { ArcaSettingsPanel } from "@/components/settings/ArcaSettingsPanel"
import { ThemeAccentPicker } from "@/components/settings/ThemeAccentPicker"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Universal Page Header */}
      <PageHeader
        title="Configuración"
        subtitle="Datos de la sucursal, facturación electrónica ARCA y personalización visual del taller"
      />

      {/* Facturación Electrónica ARCA */}
      <ArcaSettingsPanel />

      {/* Grid de Configuración y Preferencias */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personalización Visual y Color de Acento */}
        <Card className="border-border/40 p-5 md:col-span-2">
          <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-border/30">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Palette className="h-5 w-5 text-theme-accent" />
              <span>Personalización Visual y Tema</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <ThemeAccentPicker />
          </CardContent>
        </Card>

        {/* Datos de Sucursal Placeholder */}
        <Card className="border-border/40 p-5">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between border-b border-border/30">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>Datos de Sucursal</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground text-center">
              <Building2 className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">Sucursal Principal</p>
              <p className="text-xs">Nombre, dirección, teléfono y datos fiscales de la casa central.</p>
            </div>
          </CardContent>
        </Card>

        {/* Perfil de Usuario Placeholder */}
        <Card className="border-border/40 p-5">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between border-b border-border/30">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCog className="h-4 w-4 text-muted-foreground" />
              <span>Perfil de Usuario</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground text-center">
              <UserCog className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm font-medium">Cuenta Activa</p>
              <p className="text-xs">Nombre de usuario, rol de operador y correo de acceso.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
