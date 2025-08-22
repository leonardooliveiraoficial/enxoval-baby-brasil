import { useState, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Mail, Upload, Image as ImageIcon, Check, X, Trash2, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StoryContent {
  id: number;
  content: string;
  couple_photo?: string;
  updated_at: string;
}

interface ThankYouTemplate {
  id: number;
  subject: string;
  body_markdown: string;
  updated_at: string;
}

interface GuestbookMessage {
  id: string;
  author_name: string;
  message: string;
  approved: boolean;
  created_at: string;
}

export default function AdminContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [storyContent, setStoryContent] = useState<StoryContent | null>(null);
  const [thankYouTemplate, setThankYouTemplate] = useState<ThankYouTemplate | null>(null);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmailDialog, setTestEmailDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const { toast } = useToast();

  // Get active tab from search params, defaulting to 'story'
  const activeTab = searchParams.get('tab') || 'story';

  const setActiveTab = (tab: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  const fetchContent = async () => {
    try {
      // Fetch story content
      const { data: storyResponse, error: storyError } = await supabase.functions.invoke('admin-contents', {
        body: { action: 'get_story' }
      });

      if (storyError) throw storyError;

      // Fetch thank you template
      const { data: templateResponse, error: templateError } = await supabase.functions.invoke('admin-contents', {
        body: { action: 'get_template' }
      });

      if (templateError) throw templateError;

      setStoryContent(storyResponse);
      setThankYouTemplate(templateResponse);
    } catch (error: any) {
      console.error('Error fetching content:', error);
      toast({
        title: "Erro ao carregar conteúdo",
        description: error.message || 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      let query = supabase
        .from('guestbook_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messageFilter === 'approved') {
        query = query.eq('approved', true);
      } else if (messageFilter === 'pending') {
        query = query.eq('approved', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar mensagens",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages();
    }
  }, [activeTab, messageFilter]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `couple-photo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(`couple/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(`couple/${fileName}`);

      // Update story content with new photo
      const { error: updateError } = await supabase.functions.invoke('admin-contents', {
        body: {
          action: 'update_story',
          content: storyContent?.content || '',
          couple_photo: publicUrl
        }
      });

      if (updateError) throw updateError;

      toast({
        title: "Foto enviada",
        description: "Foto do casal atualizada com sucesso"
      });

      fetchContent();
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveStory = async () => {
    if (!storyContent) return;

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('admin-contents', {
        body: {
          action: 'update_story',
          content: storyContent.content,
          couple_photo: storyContent.couple_photo
        }
      });

      if (error) throw error;

      toast({
        title: "História atualizada",
        description: "Nossa História foi atualizada com sucesso"
      });

      fetchContent();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar história",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!thankYouTemplate) return;

    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('admin-contents', {
        body: {
          action: 'update_template',
          subject: thankYouTemplate.subject,
          body_markdown: thankYouTemplate.body_markdown
        }
      });

      if (error) throw error;

      toast({
        title: "Template atualizado",
        description: "Template de agradecimento foi atualizado com sucesso"
      });

      fetchContent();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar template",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email obrigatório",
        description: "Digite um email para o teste",
        variant: "destructive"
      });
      return;
    }

    setSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('admin-contents', {
        body: {
          action: 'send_test_email',
          email: testEmail,
          name: 'Teste Admin',
          order_id: 'TEST-001',
          total_brl: 'R$ 150,00'
        }
      });

      if (error) throw error;

      toast({
        title: "Email de teste enviado",
        description: `Email enviado para ${testEmail} com sucesso`
      });

      setTestEmailDialog(false);
      setTestEmail('');
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email de teste",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleToggleApproval = async (messageId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.functions.invoke('admin-messages', {
        body: {
          action: 'toggle_approval',
          message_id: messageId,
          approved: !currentStatus
        }
      });

      if (error) throw error;

      toast({
        title: "Mensagem atualizada",
        description: `Mensagem ${!currentStatus ? 'aprovada' : 'rejeitada'} com sucesso`
      });

      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar mensagem",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta mensagem?')) return;

    try {
      const { error } = await supabase.functions.invoke('admin-messages', {
        body: {
          action: 'delete',
          message_id: messageId
        }
      });

      if (error) throw error;

      toast({
        title: "Mensagem excluída",
        description: "Mensagem excluída com sucesso"
      });

      fetchMessages();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir mensagem",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleExportMessagesCSV = async () => {
    try {
      let query = supabase
        .from('guestbook_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messageFilter === 'approved') {
        query = query.eq('approved', true);
      } else if (messageFilter === 'pending') {
        query = query.eq('approved', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      const headers = ['Data', 'Autor', 'Mensagem', 'Status'];
      const csvContent = [
        headers.join(','),
        ...(data || []).map(msg => [
          format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
          `"${msg.author_name.replace(/"/g, '""')}"`,
          `"${msg.message.replace(/"/g, '""')}"`,
          msg.approved ? 'Aprovada' : 'Pendente'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `mensagens_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Exportação concluída",
        description: "Arquivo CSV baixado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const messageColumns: ColumnDef<GuestbookMessage>[] = [
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    },
    {
      accessorKey: "author_name",
      header: "Autor",
    },
    {
      accessorKey: "message",
      header: "Mensagem",
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.original.message}>
          {row.original.message}
        </div>
      ),
    },
    {
      accessorKey: "approved",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.approved ? "default" : "secondary"}>
          {row.original.approved ? "Aprovada" : "Pendente"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleApproval(row.original.id, row.original.approved)}
            title={row.original.approved ? "Rejeitar" : "Aprovar"}
          >
            {row.original.approved ? (
              <X className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteMessage(row.original.id)}
            title="Excluir"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="max-w-screen-lg mx-auto pt-4 pb-6">
        <div>Carregando conteúdo...</div>
      </div>
    );
  }

  const approvedCount = messages.filter(m => m.approved).length;
  const pendingCount = messages.filter(m => !m.approved).length;

  return (
    <div className="max-w-screen-lg mx-auto pt-4 pb-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Conteúdos</h2>
        <p className="text-muted-foreground">Gerencie o conteúdo do site</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex">
            <TabsTrigger value="story" aria-selected={activeTab === 'story'}>Nossa História</TabsTrigger>
            <TabsTrigger value="thankyou" aria-selected={activeTab === 'thankyou'}>Template de Agradecimento</TabsTrigger>
            <TabsTrigger value="messages" aria-selected={activeTab === 'messages'}>Mensagens</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="story" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Nossa História
                <Button onClick={handleSaveStory} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div>
                <Label htmlFor="couple-photo">Foto do Casal</Label>
                <div className="mt-2 space-y-4">
                  {storyContent?.couple_photo && (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border">
                      <img 
                        src={storyContent.couple_photo} 
                        alt="Foto do casal"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadingPhoto}
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      {uploadingPhoto ? (
                        <>
                          <Upload className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          {storyContent?.couple_photo ? 'Trocar Foto' : 'Enviar Foto'}
                        </>
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Recomendado: 800x800px, máx 5MB
                    </span>
                  </div>
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="story-content">Conteúdo (Markdown)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Use # para títulos, **texto** para negrito, e parágrafos simples.
                </p>
                <Textarea
                  id="story-content"
                  value={storyContent?.content || ''}
                  onChange={(e) => setStoryContent(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="Digite a história aqui..."
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              
              {storyContent?.updated_at && (
                <p className="text-sm text-muted-foreground">
                  Última atualização: {new Date(storyContent.updated_at).toLocaleString('pt-BR')}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thankyou" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Template de Agradecimento
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setTestEmailDialog(true)}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Testar Email
                  </Button>
                  <Button onClick={handleSaveTemplate} disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div>
                <Label htmlFor="email-subject">Assunto do Email</Label>
                <Input
                  id="email-subject"
                  value={thankYouTemplate?.subject || ''}
                  onChange={(e) => setThankYouTemplate(prev => prev ? { ...prev, subject: e.target.value } : null)}
                  placeholder="Assunto do email"
                />
              </div>

              <div>
                <Label htmlFor="email-body">Corpo do Email (Markdown)</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Variáveis disponíveis: {`{{name}}, {{order_id}}, {{total_brl}}`}
                </p>
                <Textarea
                  id="email-body"
                  value={thankYouTemplate?.body_markdown || ''}
                  onChange={(e) => setThankYouTemplate(prev => prev ? { ...prev, body_markdown: e.target.value } : null)}
                  placeholder="Corpo do email..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              {thankYouTemplate?.updated_at && (
                <p className="text-sm text-muted-foreground">
                  Última atualização: {new Date(thankYouTemplate.updated_at).toLocaleString('pt-BR')}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Mensagens</h2>
              <p className="text-muted-foreground">Gerencie as mensagens dos visitantes</p>
            </div>
            <Button onClick={handleExportMessagesCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{messages.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Button
              variant={messageFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMessageFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={messageFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMessageFilter('approved')}
            >
              Aprovadas
            </Button>
            <Button
              variant={messageFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMessageFilter('pending')}
            >
              Pendentes
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lista de Mensagens</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <DataTable 
                columns={messageColumns} 
                data={messages}
                searchKey="author_name"
                searchPlaceholder="Buscar por autor..."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialog} onOpenChange={setTestEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email de Teste</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-email">Email de Destino</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
              />
            </div>

            <div className="bg-muted p-3 rounded-lg text-sm">
              <p><strong>Variáveis de teste:</strong></p>
              <ul className="mt-2 space-y-1">
                <li>Nome: "Teste Admin"</li>
                <li>ID do Pedido: "TEST-001"</li>
                <li>Valor Total: "R$ 150,00"</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setTestEmailDialog(false)}
                disabled={sendingTest}
              >
                Cancelar
              </Button>
              <Button onClick={handleSendTestEmail} disabled={sendingTest}>
                {sendingTest ? 'Enviando...' : 'Enviar Teste'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}