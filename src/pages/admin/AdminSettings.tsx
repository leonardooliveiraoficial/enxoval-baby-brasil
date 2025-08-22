import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Shield, LogOut, CreditCard, Save, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MercadoPagoConfigStatus {
  id?: number;
  has_access_token?: boolean;
  has_webhook_secret?: boolean;
  has_account_id?: boolean;
  account_id?: string;
  updated_at?: string;
  configured?: boolean;
}

interface MercadoPagoFormData {
  access_token: string;
  account_id: string;
  webhook_secret: string;
}

export default function AdminSettings() {
  const { user, profile, signOut } = useAuth();
  const { toast } = useToast();
  
  // MercadoPago settings states
  const [configStatus, setConfigStatus] = useState<MercadoPagoConfigStatus | null>(null);
  const [formData, setFormData] = useState<MercadoPagoFormData>({
    access_token: '',
    account_id: '',
    webhook_secret: ''
  });
  const [loadingMP, setLoadingMP] = useState(true);
  const [savingMP, setSavingMP] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showTokens, setShowTokens] = useState({
    access_token: false,
    webhook_secret: false
  });

  useEffect(() => {
    fetchMercadoPagoConfig();
  }, []);

  const fetchMercadoPagoConfig = async () => {
    try {
      const { data, error } = await supabase.rpc('get_mercadopago_config_status');

      if (error) throw error;

      const configData = data as MercadoPagoConfigStatus || { configured: false };
      setConfigStatus(configData);
      // Clear form when loading new config
      setFormData({
        access_token: '',
        account_id: configData.account_id || '',
        webhook_secret: ''
      });
    } catch (error: any) {
      console.error('Error fetching MercadoPago config:', error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message || 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setLoadingMP(false);
    }
  };

  const handleMercadoPagoSave = async () => {
    if (!formData.access_token.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O Access Token é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setSavingMP(true);
    try {
      // Only update account_id through the secure function (access_token and webhook_secret are handled via secrets)
      const { data, error } = await supabase.rpc('update_mercadopago_config', {
        p_account_id: formData.account_id || null
      });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "As configurações do Mercado Pago foram atualizadas com sucesso. Note que credenciais sensíveis devem ser configuradas via secrets do Supabase.",
        variant: "default"
      });

      fetchMercadoPagoConfig(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSavingMP(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.access_token.trim()) {
      toast({
        title: "Token necessário",
        description: "Insira o Access Token antes de testar a conexão",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-mercadopago-test', {
        body: { access_token: formData.access_token }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Conexão bem-sucedida",
          description: "O Access Token está válido e a conexão foi estabelecida",
          variant: "default"
        });
      } else {
        throw new Error(data.error || "Erro desconhecido");
      }
    } catch (error: any) {
      toast({
        title: "Falha na conexão",
        description: error.message || "Não foi possível conectar com o Mercado Pago. Verifique o Access Token.",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleHealthCheck = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('mp-health');

      if (error) throw error;

      console.log("Health check result:", data);

      if (data.status === "SUCCESS" && data.init_point) {
        toast({
          title: "Health Check ✅",
          description: "Sistema funcionando! Preference criada com sucesso."
        });
        
        // Abrir o init_point em nova aba
        window.open(data.init_point, '_blank');
      } else if (data.status === "ERROR") {
        throw new Error(data.error || "Erro no health check");
      } else {
        toast({
          title: "Health Check ⚠️",
          description: `Status: ${data.statusHTTP} - ${JSON.stringify(data.responseBody)}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Health check error:", error);
      toast({
        title: "Health Check ❌",
        description: error.message || "Erro ao executar health check",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="max-w-screen-lg mx-auto pt-4 pb-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua conta administrativa
        </p>
      </div>

      <Tabs defaultValue="geral" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="integrações">Integrações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="geral" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações da Conta
                </CardTitle>
                <CardDescription>
                  Detalhes da sua conta de administrador
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">E-mail:</span>
                  <span className="text-sm text-muted-foreground">{user?.email}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Função:</span>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {profile?.role || 'Carregando...'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge variant="default">Ativo</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessão</CardTitle>
                <CardDescription>
                  Gerencie sua sessão atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sair do Sistema
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrações" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Mercado Pago
                  {configStatus?.has_access_token && (
                    <Badge variant="outline" className="text-xs">
                      ✓ Configurado
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={testing || savingMP || loadingMP}
                    size="sm"
                  >
                    {testing ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Testar
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleHealthCheck}
                    disabled={testing || savingMP || loadingMP}
                    size="sm"
                  >
                    Health Check
                  </Button>
                  <Button onClick={handleMercadoPagoSave} disabled={savingMP || testing || loadingMP}>
                    <Save className="w-4 h-4 mr-2" />
                    {savingMP ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-6">
              {loadingMP ? (
                <div>Carregando configurações...</div>
              ) : (
                <>
                  <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border-l-4 border-amber-500">
                    <h3 className="font-semibold text-sm mb-2 text-amber-800 dark:text-amber-200">⚠️ Aviso de Segurança:</h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Por motivos de segurança, credenciais sensíveis (Access Token e Webhook Secret) não são exibidas. Configure-as via Supabase Secrets para máxima segurança.
                    </p>
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-primary">
                    <h3 className="font-semibold text-sm mb-2">Status da Configuração:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${configStatus?.has_access_token ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span>Access Token {configStatus?.has_access_token ? '✓' : '✗'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${configStatus?.has_webhook_secret ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span>Webhook Secret {configStatus?.has_webhook_secret ? '✓' : '(opcional)'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${configStatus?.has_account_id ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span>Account ID {configStatus?.has_account_id ? '✓' : '(opcional)'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="access-token">Access Token * (Para teste apenas)</Label>
                    <div className="relative">
                      <Input
                        id="access-token"
                        type={showTokens.access_token ? "text" : "password"}
                        value={formData.access_token}
                        onChange={(e) => setFormData(prev => ({ ...prev, access_token: e.target.value }))}
                        placeholder="APP_USR-..."
                        className="font-mono pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowTokens(prev => ({ ...prev, access_token: !prev.access_token }))}
                      >
                        {showTokens.access_token ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      <strong>Obrigatório para testes.</strong> Use apenas para testar conexão. Configure via Supabase Secrets em produção.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="account-id">ID da Conta (Opcional)</Label>
                    <Input
                      id="account-id"
                      value={formData.account_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                      placeholder="1234567890"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Para divisão de pagamentos ou uso de conta específica. Deixe em branco se não souber.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="webhook-secret">Webhook Secret (Para teste apenas)</Label>
                    <div className="relative">
                      <Input
                        id="webhook-secret"
                        type={showTokens.webhook_secret ? "text" : "password"}
                        value={formData.webhook_secret}
                        onChange={(e) => setFormData(prev => ({ ...prev, webhook_secret: e.target.value }))}
                        placeholder="your-webhook-secret"
                        className="font-mono pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2"
                        onClick={() => setShowTokens(prev => ({ ...prev, webhook_secret: !prev.webhook_secret }))}
                      >
                        {showTokens.webhook_secret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Secret para validação de webhooks. Configure via Supabase Secrets em produção.
                    </p>
                  </div>

                  {configStatus?.updated_at && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>Última atualização:</strong> {new Date(configStatus.updated_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informações Importantes</CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">🔐 Segurança:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                  <li>Credenciais sensíveis devem ser configuradas via <strong>Supabase Secrets</strong></li>
                  <li>Nunca exponha Access Tokens em logs ou código frontend</li>
                  <li>Use este formulário apenas para testes de desenvolvimento</li>
                  <li>Configure o Webhook Secret para maior segurança</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-sm mb-2">Ambiente de Teste vs Produção:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
                  <li>Use credenciais de <strong>teste</strong> para desenvolvimento</li>
                  <li>Use credenciais de <strong>produção</strong> apenas quando for fazer vendas reais</li>
                  <li>Nunca misture credenciais de teste e produção</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}