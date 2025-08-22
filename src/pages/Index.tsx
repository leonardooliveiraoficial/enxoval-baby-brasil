import { Header } from "@/components/Header";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { babyButtonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { Heart, Gift, Calendar, MapPin, Baby } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-baby.jpg";
import teddyImage from "@/assets/teddy-bear.jpg";

const Index = () => {
  // Dados mockados - serão substituídos pela integração com Supabase
  const mockProgress = {
    current: 125000, // R$ 1.250,00 em centavos
    goal: 300000    // R$ 3.000,00 em centavos
  };

  const featuredProducts = [
    { id: 1, name: "Kit Roupinhas Recém-nascido", price: 15000, image: teddyImage, category: "Roupinhas" },
    { id: 2, name: "Fraldas RN - 1 Pacote", price: 4500, image: teddyImage, category: "Fraldas" },
    { id: 3, name: "Manta Soft Azul", price: 8900, image: teddyImage, category: "Acessórios" },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-[70vh] flex items-center justify-center bg-gradient-hero overflow-hidden">
          {/* Background Image with Picture Element */}
          <div className="absolute inset-0 z-0">
            <picture>
              <source srcSet="/images/hero-baby.avif" type="image/avif" />
              <source srcSet="/images/hero-baby.webp" type="image/webp" />
              <img 
                  src={heroImage} 
                  alt="Promoções de enxoval" 
                  width={1920} 
                  height={1080} 
                  loading="eager" 
                  className="w-full h-full object-cover"
                  style={{ filter: 'brightness(0.9)' }}
                />
            </picture>
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/70"></div>
          </div>
          <div className="container mx-auto px-4 text-center z-10">
            <div className="max-w-4xl mx-auto space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Nosso Pequeno Príncipe
                <Heart className="inline-block ml-3 text-primary animate-gentle-pulse" size={48} />
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Chegada prevista para <strong>Janeiro de 2026</strong>
              </p>
              
              <div className="flex items-center justify-center gap-6 text-lg text-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Janeiro 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>Lilian & Vinicius</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  asChild
                  size="lg" 
                  className={cn(babyButtonVariants({ variant: "heart", size: "xl" }))}
                  aria-label="Ver lista do enxoval"
                >
                  <Link to="/enxoval">
                    <Gift className="h-5 w-5" />
                    Ver Enxoval
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute top-20 left-10 animate-float opacity-70">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <div className="absolute bottom-32 right-16 animate-float opacity-60" style={{animationDelay: "1s"}}>
            <Heart className="h-6 w-6 text-baby-blue-dark" />
          </div>
        </section>

        {/* Welcome Section */}
        <section className="py-16 bg-soft-white">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="shadow-card border-tender-gray/50">
                <CardHeader>
                  <CardTitle className="text-2xl text-foreground flex items-center justify-center gap-2">
                    <Gift className="h-6 w-6 text-primary" />
                    Bem-vindos ao Nosso Enxoval
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Cada presente é um gesto de amor para nosso bebê
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-sm text-muted-foreground">
                    Obrigado por fazer parte deste momento especial! ❤️
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-gradient-soft">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Itens em Destaque
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Alguns dos itens que mais precisamos para a chegada do nosso pequeno
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="shadow-card hover:shadow-soft transition-gentle border-tender-gray/50">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg bg-baby-blue/10">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-gentle hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="bg-warm-beige px-2 py-1 rounded-full text-xs font-medium text-foreground">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(product.price)}
                      </span>
                      <Button 
                        asChild
                        size="sm" 
                        className={cn(babyButtonVariants({ variant: "tender", size: "sm" }))}
                        aria-label={`Presentear ${product.name}`}
                      >
                        <Link to="/enxoval">Presentear</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
              <div className="text-center mt-12">
                <Button 
                  asChild
                  size="lg" 
                  className={cn(babyButtonVariants({ variant: "outline", size: "lg" }))}
                  aria-label="Ver todos os itens do enxoval"
                >
                  <Link to="/enxoval">Ver Todos os Itens</Link>
                </Button>
              </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl font-bold text-foreground">
                Faça Parte da Nossa História
              </h2>
              <p className="text-lg text-muted-foreground">
                Sua contribuição fará toda a diferença na chegada do nosso pequeno príncipe. 
                Cada presente é um símbolo do amor que já cerca nosso bebê.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button 
                  asChild
                  size="lg" 
                  className={cn(babyButtonVariants({ variant: "heart", size: "lg" }))}
                >
                  <Link to="/enxoval">
                    <Heart className="h-5 w-5" />
                    Contribuir Agora
                  </Link>
                </Button>
                <Button 
                  asChild
                  variant="outline" 
                  size="lg" 
                  className={cn(babyButtonVariants({ variant: "outline", size: "lg" }))}
                >
                  <Link to="/nossa-historia">Nossa História</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-tender-gray/30 py-8 text-center">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Baby className="h-6 w-6 text-primary" />
            <span className="font-semibold text-foreground">Lilian & Vinicius</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Criado com muito amor para nosso pequeno príncipe ❤️
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;