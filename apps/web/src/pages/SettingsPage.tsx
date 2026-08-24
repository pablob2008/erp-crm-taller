import { Building2, UserCog, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Configuración</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datos de Sucursal</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <Building2 className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm">Sin configurar.</p>
              <p className="text-xs">Nombre, dirección y datos fiscales de la sucursal.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfil de Usuario</CardTitle>
            <UserCog className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <UserCog className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm">Perfil no configurado.</p>
              <p className="text-xs">Nombre, rol y datos de contacto del usuario.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preferencias</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
              <Settings className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm">Preferencias por defecto.</p>
              <p className="text-xs">Tema, idioma, notificaciones y otras opciones del sistema.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
