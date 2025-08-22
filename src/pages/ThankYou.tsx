import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { babyButtonVariants } from "@/components/ui/button-variants";
import { Heart, Home, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from 'react-router-dom';

export const ThankYou = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderStatus = searchParams.get('status');

  useEffect(() => {
    // Optional: You could fetch order details here if needed
  }, []);

  const isSuccess = orderStatus === 'success';

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full shadow-button">
        <CardHeader className="text-center pb-6">
          <div className="mb-6">
            {isSuccess ? (
              <div className="w-20 h-20 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-foreground animate-gentle-pulse" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-warm-beige rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-10 h-10 text-foreground" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            {isSuccess ? 'Muito obrigado! ❤️' : 'Obrigado pelo carinho! ❤️'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-6">
          {isSuccess ? (
            <>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Seu presente foi confirmado com sucesso! Ficamos emocionados com sua 
                generosidade e carinho. 
              </p>
              <p className="text-muted-foreground">
                Você receberá um email de confirmação em breve com todos os detalhes 
                do seu presente.
              </p>
              <div className="bg-baby-blue/20 p-6 rounded-lg">
                <p className="text-foreground font-medium">
                  "Cada presente que recebemos nos enche de alegria e nos lembra 
                  de como somos abençoados por ter pessoas maravilhosas como você 
                  em nossas vidas."
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  - Lilian e Vinicius
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Mesmo que o pagamento não tenha sido finalizado, sua intenção 
                de presentear nosso bebê já aquece nossos corações.
              </p>
              <p className="text-muted-foreground">
                Você sempre pode tentar novamente quando desejar. Estamos aqui 
                esperando com muito amor!
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              onClick={() => navigate('/')}
              className={cn(babyButtonVariants({ 
                variant: "heart", 
                size: "lg" 
              }), "flex-1")}
            >
              <Home className="w-4 h-4 mr-2" />
              Voltar ao Início
            </Button>
            
            <Button
              onClick={() => navigate('/enxoval')}
              className={cn(babyButtonVariants({ 
                variant: "outline", 
                size: "lg" 
              }), "flex-1")}
            >
              <Gift className="w-4 h-4 mr-2" />
              Ver Outros Presentes
            </Button>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Nosso pequeno príncipe chegará em <strong>Janeiro de 2026</strong>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};