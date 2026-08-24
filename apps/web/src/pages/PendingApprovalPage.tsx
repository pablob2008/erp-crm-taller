import { useSupabase } from '@/context/SupabaseProvider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, LogOut } from 'lucide-react'

export default function PendingApprovalPage() {
  const { supabase } = useSupabase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Clock className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Aprobación Pendiente</CardTitle>
          <CardDescription>
            Tu cuenta ha sido registrada correctamente, pero aún no ha sido asignada a una sucursal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Contactá al administrador de tu taller para que te asigne una sucursal y un rol.
            Una vez aprobado, podrás acceder al sistema.
          </p>
          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
