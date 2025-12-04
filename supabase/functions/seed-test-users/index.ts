import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const testUsers = [
      {
        email: "cliente@teste.com",
        password: "Cliente123!",
        user_metadata: {
          nome: "Maria Silva Cliente",
          tipo: "cliente",
          whatsapp: "(11) 99999-1234",
        },
      },
      {
        email: "advogado@teste.com",
        password: "Advogado123!",
        user_metadata: {
          nome: "Dr. João Santos",
          tipo: "advogado",
        },
      },
      {
        email: "admin@teste.com",
        password: "Admin123!",
        user_metadata: {
          nome: "Administrador Sistema",
          tipo: "admin",
        },
      },
    ];

    const results = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const userExists = existingUsers?.users?.some((u) => u.email === userData.email);

      if (userExists) {
        results.push({ email: userData.email, status: "already exists" });
        continue;
      }

      // Create user
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: userData.user_metadata,
      });

      if (error) {
        results.push({ email: userData.email, status: "error", error: error.message });
      } else {
        // Create profile
        const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
          id: data.user.id,
          email: userData.email,
          nome: userData.user_metadata.nome,
          tipo: userData.user_metadata.tipo,
          whatsapp: userData.user_metadata.whatsapp || null,
          saldo_lcoin: userData.user_metadata.tipo === "advogado" ? 100 : 0,
          oab_status: userData.user_metadata.tipo === "advogado" ? "pendente" : null,
        });

        results.push({
          email: userData.email,
          status: profileError ? "user created, profile error" : "success",
          profileError: profileError?.message,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
