import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Log audit action helper
const logAuditAction = async (supabase: any, user_id: string, action: string, entity: string, entity_id: string | null, meta: any = {}) => {
  await supabase
    .from('audit_logs')
    .insert({
      user_id,
      action,
      entity,
      entity_id,
      meta
    });
};

// Render markdown to HTML (basic implementation)
const renderMarkdown = (markdown: string, variables: Record<string, string> = {}): string => {
  let html = markdown;
  
  // Replace variables first
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    html = html.replace(regex, value);
  });
  
  // Basic markdown rendering
  html = html
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^\s*(.+)/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
    
  return html;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the JWT and get user info
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = await req.json();
    const { action } = requestBody;

    console.log('Admin Contents Action:', action);

    switch (action) {
      case 'get_story': {
        const { data, error } = await supabase
          .from('story_content')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) throw error;

        return new Response(JSON.stringify(data || {
          id: 1,
          content: 'Digite a história aqui...',
          updated_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_template': {
        const { data, error } = await supabase
          .from('thankyou_template')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (error) throw error;

        return new Response(JSON.stringify(data || {
          id: 1,
          subject: 'Obrigado pela sua contribuição!',
          body_markdown: 'Olá {{name}},\n\nObrigado pela sua contribuição de {{total_brl}} para nosso enxoval!\n\nPedido: {{order_id}}',
          updated_at: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_story': {
        const { content, couple_photo } = requestBody;
        
        if (!content) {
          return new Response(
            JSON.stringify({ error: 'Content is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // First try to update, if no rows affected, insert
        const updateData: any = { 
          content: content.trim(),
          updated_at: new Date().toISOString()
        };
        
        if (couple_photo !== undefined) {
          updateData.couple_photo = couple_photo;
        }
        
        const { data: storyUpdateData, error: updateError } = await supabase
          .from('story_content')
          .update(updateData)
          .eq('id', 1)
          .select()
          .maybeSingle();

        let data = storyUpdateData;
        let error = updateError;

        if (!storyUpdateData && !updateError) {
          // No rows were updated, try to insert
          const insertData: any = { 
            id: 1,
            content: content.trim(),
            updated_at: new Date().toISOString()
          };
          
          if (couple_photo !== undefined) {
            insertData.couple_photo = couple_photo;
          }
          
          const { data: insertData2, error: insertError } = await supabase
            .from('story_content')
            .insert(insertData)
            .select()
            .single();
          
          data = insertData2;
          error = insertError;
        }

        if (error) throw error;

        await logAuditAction(supabase, user.id, 'update_story', 'story_content', '1', {
          content_length: content.trim().length
        });

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_template': {
        const { subject, body_markdown } = requestBody;
        
        if (!subject || !body_markdown) {
          return new Response(
            JSON.stringify({ error: 'Subject and body are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // First try to update, if no rows affected, insert
        const { data: updateData, error: updateError } = await supabase
          .from('thankyou_template')
          .update({ 
            subject: subject.trim(),
            body_markdown: body_markdown.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('id', 1)
          .select()
          .maybeSingle();

        let data = updateData;
        let error = updateError;

        if (!updateData && !updateError) {
          // No rows were updated, try to insert
          const { data: insertData, error: insertError } = await supabase
            .from('thankyou_template')
            .insert({ 
              id: 1,
              subject: subject.trim(),
              body_markdown: body_markdown.trim(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();
          
          data = insertData;
          error = insertError;
        }

        if (error) throw error;

        await logAuditAction(supabase, user.id, 'update_thankyou_template', 'thankyou_template', '1', {
          subject,
          body_length: body_markdown.trim().length
        });

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'send_test_email': {
        if (!resend) {
          return new Response(
            JSON.stringify({ error: 'Email service not configured. Please set RESEND_API_KEY.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { email, name, order_id, total_brl } = requestBody;
        
        if (!email) {
          return new Response(
            JSON.stringify({ error: 'Email is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get current template
        const { data: template, error: templateError } = await supabase
          .from('thankyou_template')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (templateError) throw templateError;

        if (!template) {
          return new Response(
            JSON.stringify({ error: 'Template not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Render template with test variables
        const variables = {
          name: name || 'Teste',
          order_id: order_id || 'TEST-001',
          total_brl: total_brl || 'R$ 150,00'
        };

        const htmlBody = renderMarkdown(template.body_markdown, variables);

        try {
          const emailResponse = await resend.emails.send({
            from: "Enxoval <onboarding@resend.dev>",
            to: [email],
            subject: `[TESTE] ${template.subject}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px 10px 0 0;">
                  <h2 style="margin: 0; color: #333;">🧪 EMAIL DE TESTE</h2>
                  <p style="margin: 5px 0 0 0; color: #666;">Este é um email de teste enviado pelo painel administrativo.</p>
                </div>
                <div style="padding: 30px 20px; background: white; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
                  ${htmlBody}
                </div>
                <div style="padding: 20px; text-align: center; color: #999; font-size: 12px;">
                  <p>Variáveis de teste utilizadas:</p>
                  <p>Nome: ${variables.name} | Pedido: ${variables.order_id} | Total: ${variables.total_brl}</p>
                </div>
              </div>
            `,
          });

          await logAuditAction(supabase, user.id, 'send_test_email', 'thankyou_template', '1', {
            recipient: email,
            email_id: emailResponse.data?.id
          });

          return new Response(JSON.stringify({ 
            success: true, 
            email_id: emailResponse.data?.id 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (emailError: any) {
          console.error('Email sending error:', emailError);
          return new Response(
            JSON.stringify({ error: `Failed to send email: ${emailError.message}` }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Error in admin-contents function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});