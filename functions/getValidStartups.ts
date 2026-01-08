import { createClient } from 'npm:@base44/sdk@0.1.0';

const base44 = createClient({
  appId: Deno.env.get('BASE44_APP_ID'),
});

Deno.serve(async (req) => {
  // Handle CORS pre-flight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
      } 
    });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized: Missing Authorization header');
    }
    const token = authHeader.split(' ')[1];
    base44.auth.setToken(token);
    await base44.auth.me(); // Ensures the user is logged in

    const { ids } = await req.json();

    // If no IDs are provided, return an empty array
    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Efficiently fetch all valid and active startups in a single database query.
    // This naturally handles missing IDs, as they simply won't be in the result set.
    const validStartups = await base44.entities.Startup.filter({
      id: { $in: ids },
      ativo: true
    });

    return new Response(JSON.stringify(validStartups || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('Error in getValidStartups function:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
});