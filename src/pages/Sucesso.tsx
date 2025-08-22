import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { babyButtonVariants } from "@/components/ui/button-variants";

export default function Sucesso() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 10 seconds
    const timeout = setTimeout(() => {
      navigate('/');
    }, 10000);

    return () => clearTimeout(timeout);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20 p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            Pagamento Aprovado! 🎉
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-3">
            <p className="text-muted-foreground">
              Obrigado pelo seu presente! Seu pagamento foi processado com sucesso.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <Heart className="w-4 h-4 inline mr-2" />
                Lilian e Vinicius ficarão muito felizes com seu carinho!
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Em breve você receberá um e-mail de confirmação com os detalhes do seu presente.
            </p>
            
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

          <p className="text-xs text-muted-foreground">
            Redirecionando automaticamente em 10 segundos...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}