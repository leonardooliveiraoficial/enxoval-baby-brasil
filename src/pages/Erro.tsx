import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, RefreshCw, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { babyButtonVariants } from "@/components/ui/button-variants";

export default function Erro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-red-50 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700">
            Ops! Algo deu errado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Não foi possível processar seu pagamento. Mas não se preocupe!
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                Nenhuma cobrança foi realizada. Você pode tentar novamente.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-left">
              <h4 className="font-semibold text-sm mb-2">Possíveis causas:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Dados do cartão incorretos</li>
                <li>Saldo insuficiente</li>
                <li>Cartão bloqueado ou vencido</li>
                <li>Problema temporário no sistema</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => navigate('/enxoval')}
                className={cn(babyButtonVariants({ variant: "heart", size: "lg" }), "w-full")}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              💡 Dica: Verifique os dados do seu cartão e tente novamente. Se o problema persistir, entre em contato com seu banco.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}