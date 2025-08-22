import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Home, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { babyButtonVariants } from "@/components/ui/button-variants";

export default function Pendente() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 15 seconds
    const timeout = setTimeout(() => {
      navigate('/');
    }, 15000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-yellow-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl text-yellow-700">
            Pagamento Pendente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Seu pagamento está sendo processado. Aguarde a confirmação.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⏳ O processamento pode levar alguns minutos. Você receberá um e-mail assim que for aprovado.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-left">
              <h4 className="font-semibold text-sm mb-2">O que acontece agora:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Seu pagamento está em análise</li>
                <li>Você receberá um e-mail com o resultado</li>
                <li>O processo pode levar até 24 horas</li>
                <li>Nenhuma cobrança adicional será feita</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => navigate('/')}
                className={cn(babyButtonVariants({ variant: "heart", size: "lg" }), "w-full")}
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
              
              <Button 
                onClick={() => navigate('/enxoval')}
                variant="outline"
                className="w-full"
              >
                Ver Mais Presentes
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              📧 Fique atento ao seu e-mail! Enviaremos uma confirmação assim que o pagamento for processado.
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            Redirecionando automaticamente em 15 segundos...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}