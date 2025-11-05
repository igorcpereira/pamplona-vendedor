import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const CreateMockFichas = () => {
  const createMockData = async () => {
    try {
      const now = new Date();
      
      const mockFichas = [
        {
          status: 'pendente',
          nome_cliente: null,
          telefone_cliente: null,
          created_at: new Date(now.getTime() - 5 * 60000).toISOString(), // 5 min atrás
        },
        {
          status: 'processando',
          nome_cliente: null,
          telefone_cliente: null,
          created_at: new Date(now.getTime() - 3 * 60000).toISOString(), // 3 min atrás
        },
        {
          status: 'processado',
          nome_cliente: 'João Silva Santos',
          telefone_cliente: '(11) 98765-4321',
          url_bucket: JSON.stringify({ 
            nome: 'João Silva Santos',
            telefone: '(11) 98765-4321',
            tipo: 'Noivo'
          }),
          created_at: new Date(now.getTime() - 10 * 60000).toISOString(), // 10 min atrás
        },
        {
          status: 'erro',
          nome_cliente: null,
          telefone_cliente: null,
          created_at: new Date(now.getTime() - 1 * 60000).toISOString(), // 1 min atrás
        },
      ];

      const { data, error } = await supabase
        .from('fichas')
        .insert(mockFichas)
        .select();

      if (error) {
        console.error('Erro ao criar fichas mockup:', error);
        toast.error('Erro ao criar fichas mockup');
        return;
      }

      console.log('Fichas mockup criadas:', data);
      toast.success('4 fichas mockup criadas com sucesso!');
      
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar fichas mockup');
    }
  };

  return (
    <Button 
      onClick={createMockData}
      variant="outline"
      size="sm"
      className="fixed bottom-20 right-4 z-50"
    >
      Criar Fichas Mockup
    </Button>
  );
};
