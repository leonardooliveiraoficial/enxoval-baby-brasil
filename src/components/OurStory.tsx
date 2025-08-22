import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Baby } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const OurStory = () => {
  const [content, setContent] = useState('');
  const [couplePhoto, setCouplePhoto] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStory();
  }, []);

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase
        .from('story_content')
        .select('content, couple_photo')
        .eq('id', 1)
        .single();

      if (error) throw error;
      setContent(data?.content || '');
      setCouplePhoto(data?.couple_photo || '');
    } catch (error) {
      console.error('Error fetching story:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar nossa história",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderMarkdown = (markdown: string) => {
    // Simple markdown to JSX conversion
    const lines = markdown.split('\n');
    const elements: JSX.Element[] = [];
    let currentParagraph: string[] = [];
    let key = 0;

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(' ');
        elements.push(
          <p key={key++} className="text-muted-foreground leading-relaxed mb-4">
            {text.replace(/\*\*(.+?)\*\*/g, (_, match) => match).split(/\*\*(.+?)\*\*/).map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
            )}
          </p>
        );
        currentParagraph = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('# ')) {
        flushParagraph();
        elements.push(
          <h1 key={key++} className="text-2xl md:text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Heart className="w-6 w-6 text-primary" />
            {trimmed.substring(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        flushParagraph();
        elements.push(
          <h2 key={key++} className="text-xl md:text-2xl font-semibold text-foreground mb-4 mt-6 flex items-center gap-2">
            <Baby className="w-5 h-5 text-primary" />
            {trimmed.substring(3)}
          </h2>
        );
      } else if (trimmed === '') {
        flushParagraph();
      } else {
        currentParagraph.push(trimmed);
      }
    }
    
    flushParagraph();
    return elements;
  };

  if (loading) {
    return (
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-12 bg-baby-blue/20 rounded w-1/2 mb-8 mx-auto"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="h-[500px] bg-baby-blue/20 rounded-2xl"></div>
            <div className="space-y-4">
              <div className="h-4 bg-baby-blue/20 rounded w-full"></div>
              <div className="h-4 bg-baby-blue/20 rounded w-3/4"></div>
              <div className="h-4 bg-baby-blue/20 rounded w-5/6"></div>
              <div className="h-8 bg-baby-blue/20 rounded w-1/3 mt-8"></div>
              <div className="h-4 bg-baby-blue/20 rounded w-full"></div>
              <div className="h-4 bg-baby-blue/20 rounded w-4/5"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
            <Heart className="w-10 h-10 text-primary animate-gentle-pulse" />
            Nossa História
            <Heart className="w-8 h-8 text-baby-blue-dark" />
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-primary via-baby-blue to-primary mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
          {/* Photo Section */}
          <div className="order-2 lg:order-1">
            {couplePhoto ? (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-baby-blue/10 to-warm-beige/20 rounded-3xl transform rotate-3 group-hover:rotate-6 transition-transform duration-500"></div>
                <div className="relative">
                  <img 
                    src={couplePhoto} 
                    alt="Lilian e Vinicius"
                    className="w-full h-[500px] object-cover rounded-2xl shadow-elegant border-4 border-white"
                    loading="lazy"
                  />
                  <div className="absolute -bottom-4 -right-4 bg-white rounded-full p-3 shadow-soft">
                    <Baby className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[500px] bg-gradient-to-br from-baby-blue/20 to-warm-beige/30 rounded-2xl border-4 border-tender-gray/30">
                <div className="text-center text-muted-foreground">
                  <Baby className="w-16 h-16 mx-auto mb-4 text-baby-blue-dark/50" />
                  <p className="text-lg">Foto do Casal</p>
                  <p className="text-sm">Em breve...</p>
                </div>
              </div>
            )}
          </div>

          {/* Story Content */}
          <div className="order-1 lg:order-2">
            <Card className="shadow-elegant border-tender-gray/50 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <article className="prose prose-lg max-w-none">
                  <div className="space-y-6 text-muted-foreground leading-relaxed">
                    {renderMarkdown(content)}
                  </div>
                </article>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="flex justify-center items-center gap-8 pt-8">
          <div className="flex items-center gap-2 text-primary">
            <Heart className="w-5 h-5 animate-gentle-pulse" />
            <span className="text-sm font-medium">Janeiro 2026</span>
          </div>
          <div className="w-px h-8 bg-gradient-to-b from-primary to-baby-blue"></div>
          <div className="flex items-center gap-2 text-baby-blue-dark">
            <Baby className="w-5 h-5" />
            <span className="text-sm font-medium">Nosso Príncipe</span>
          </div>
        </div>
      </div>
    </section>
  );
};