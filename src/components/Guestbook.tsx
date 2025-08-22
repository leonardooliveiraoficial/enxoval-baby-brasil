import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { babyButtonVariants } from "@/components/ui/button-variants";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, Heart, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  author_name: string;
  message: string;
  approved: boolean;
  created_at: string;
}

export const Guestbook = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [formData, setFormData] = useState({
    author_name: '',
    message: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('guestbook-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'guestbook_messages'
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('guestbook_messages')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar mensagens",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.author_name.trim() || !formData.message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha seu nome e mensagem",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('guestbook_messages')
        .insert({
          author_name: formData.author_name.trim(),
          message: formData.message.trim()
        });

      if (error) throw error;

      setFormData({ author_name: '', message: '' });
      toast({
        title: "Mensagem enviada!",
        description: "Sua mensagem será aprovada em breve ❤️",
      });

    } catch (error: any) {
      console.error('Error submitting message:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            Deixe uma Mensagem
          </h2>
          <p className="text-muted-foreground">
            Compartilhe seus votos de felicidade e carinho para nossa família ❤️
          </p>
        </div>

        {/* Message Form */}
        <Card className="mb-8 shadow-card">
          <CardHeader>
            <CardTitle className="text-xl text-foreground">Nova Mensagem</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="author_name">Seu nome *</Label>
                <Input
                  id="author_name"
                  type="text"
                  placeholder="Digite seu nome"
                  value={formData.author_name}
                  onChange={(e) => setFormData({...formData, author_name: e.target.value})}
                  maxLength={100}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Sua mensagem *</Label>
                <Textarea
                  id="message"
                  placeholder="Deixe uma mensagem especial para Lilian, Vinicius e o bebê..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  maxLength={500}
                  rows={4}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {formData.message.length}/500 caracteres
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className={cn(babyButtonVariants({ variant: "heart", size: "lg" }))}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Mensagem
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Messages List */}
        <div className="space-y-6">
          <h3 className="text-2xl font-semibold text-foreground mb-4">
            Mensagens de Carinho ({messages.length})
          </h3>
          
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-baby-blue/20 rounded-full"></div>
                      <div className="h-4 bg-baby-blue/20 rounded w-1/4"></div>
                      <div className="h-3 bg-baby-blue/20 rounded w-24 ml-auto"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-baby-blue/20 rounded w-full"></div>
                      <div className="h-4 bg-baby-blue/20 rounded w-3/4"></div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <Card className="p-8 text-center">
              <Heart className="w-12 h-12 mx-auto mb-4 text-primary/50" />
              <p className="text-muted-foreground">
                Seja o primeiro a deixar uma mensagem de carinho!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <Card key={message.id} className="p-6 shadow-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gradient-hero rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="font-medium text-foreground">{message.author_name}</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    {message.message}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};