import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { formatarTelefone } from "@/lib/utils";

interface FichaAtendimentoProps {
  data: any;
  processingTime?: number;
}

export const FichaAtendimento = ({ data, processingTime }: FichaAtendimentoProps) => {
  let parsedData;
  
  try {
    // Novo formato: array [{ fields: {...} }]
    if (Array.isArray(data)) {
      parsedData = data[0]?.fields || {};
    } else if (data?.fields) {
      parsedData = data.fields;
    } else if (data?.resposta) {
      // Fallback para formato antigo
      if (typeof data.resposta === 'string') {
        if (data.resposta.includes('[object Object]')) {
          return (
            <div className="p-6 bg-destructive/10 border border-destructive rounded-lg">
              <h3 className="text-lg font-bold text-destructive mb-2">Erro no Servidor</h3>
              <p className="text-sm text-foreground mb-4">
                O servidor retornou uma resposta inválida.
              </p>
            </div>
          );
        }
        parsedData = JSON.parse(data.resposta);
      } else {
        parsedData = data.resposta;
      }
    } else {
      parsedData = data;
    }
  } catch (error) {
    return (
      <div className="p-6 bg-destructive/10 border border-destructive rounded-lg">
        <h3 className="text-lg font-bold text-destructive mb-2">Erro ao Processar Resposta</h3>
        <p className="text-sm text-foreground">
          {error instanceof Error ? error.message : 'Erro desconhecido'}
        </p>
      </div>
    );
  }
  
  // Normalizar nomes das seções
  const normalized = {
    cabecalho: parsedData.Cabecalho || parsedData.cabecalho || {},
    paleto: parsedData.paleto || {},
    calca: parsedData.calca || {},
    camisa: parsedData.Camisa || parsedData.camisa || {},
    colete: parsedData.colete || {},
    gravata: parsedData.gravata || {},
    rodape: parsedData.rodape || {}
  };
  
  const { cabecalho, paleto, calca, camisa, colete, gravata, rodape } = normalized;

  const renderCabecalho = (data: any) => {
    if (!data) return null;
    
    const nome = data.nome || data.cliente_nome || '-';
    const numeroFicha = data.numero_ficha || '-';
    const telefone = formatarTelefone(data.telefone || data.cliente_telefone);
    
    const getTipo = () => {
      if (data.tipo_ajuste) return 'Ajuste';
      if (data.tipo_aluguel) return 'Aluguel';
      if (data.tipo_venda) return 'Venda';
      return data.tipo || '-';
    };
    
    return (
      <div className="mb-8 pb-6 border-b-2 border-border">
        <div className="grid grid-cols-12 gap-4 mb-3">
          <div className="col-span-8">
            <Label className="text-xs font-bold">CLIENTE</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {nome}
            </div>
          </div>
          <div className="col-span-4">
            <Label className="text-xs font-bold">NÚMERO DA FICHA</Label>
            <div className="text-2xl font-bold text-destructive px-3 py-1">
              {numeroFicha}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-12 gap-4 mb-3">
          <div className="col-span-5">
            <Label className="text-xs font-bold">FONES</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {telefone}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-bold">TIPO</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {getTipo()}
            </div>
          </div>
          <div className="col-span-3">
            <Label className="text-xs font-bold">DATA MEDIDA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.data_medida || '-'}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-bold">HORA MEDIDA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.hora_medida || '-'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-3">
          <div className="col-span-3">
            <Label className="text-xs font-bold">PROVA 1</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.data_prova1 || '-'}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-bold">HORA 1</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.hora_prova1 || '-'}
            </div>
          </div>
          <div className="col-span-3">
            <Label className="text-xs font-bold">PROVA 2</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.data_prova2 || '-'}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-bold">HORA 2</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.hora_prova2 || '-'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold">DATA DE DEVOLUÇÃO</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.data_devolucao || '-'}
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">DATA DA FESTA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.data_evento || '-'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPaleto = (data: any) => {
    if (!data) return null;
    return (
      <div className="mb-8 pb-6 border-b-2 border-border">
        <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
          Paletó
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <Label className="text-xs font-bold">DESCRIÇÃO</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.paleto_descritivo || '-'}
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">VALOR</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1 font-semibold text-green-600">
              {data.paleto_valor ? `R$ ${data.paleto_valor}` : '-'}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <Label className="text-xs font-bold">SOB MEDIDA</Label>
          <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
            {data.paleto_sobmedida || data.paleto_sob_medida || '-'}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-3">
          <div className="col-span-4">
            <Label className="text-xs font-bold">CINTURA</Label>
            <div className="flex gap-2 items-center mt-1">
              <span className="text-xs">SOLTAR:</span>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                {data.paleto_cintura_soltar || '-'}
              </div>
              <span className="text-xs">APERTAR:</span>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                {data.paleto_cintura_apertar || '-'}
              </div>
            </div>
          </div>
          <div className="col-span-3">
            <Label className="text-xs font-bold">MEDIDA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.paleto_cintura_medida_valor || (data.paleto_cintura_medida_checkbox ? '☑' : '☐')}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-bold">MARCA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.paleto_cintura_marca_checkbox ? '☑' : '☐'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-3">
          <div className="col-span-4">
            <Label className="text-xs font-bold">COMPRIMENTO</Label>
            <div className="flex gap-2 items-center mt-1">
              <span className="text-xs">MENOS:</span>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                {data.paleto_comprimento_menos || '-'}
              </div>
              <span className="text-xs">MAIS:</span>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                {data.paleto_comprimento_mais || '-'}
              </div>
            </div>
          </div>
          <div className="col-span-3">
            <Label className="text-xs font-bold">MEDIDA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.paleto_comprimento_medida || (data.paleto_comprimento_medida_checkbox ? '☑' : '☐')}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-bold">MARCA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.paleto_comprimento_marca_checkbox ? '☑' : '☐'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-3">
          <div className="col-span-4">
            <Label className="text-xs font-bold">MANGA</Label>
            <div className="flex gap-2 items-center mt-1">
              <span className="text-xs">MENOS:</span>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                {data.paleto_manga_menos || '-'}
              </div>
              <span className="text-xs">MAIS:</span>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                {data.paleto_manga_mais || '-'}
              </div>
            </div>
          </div>
          <div className="col-span-3">
            <Label className="text-xs font-bold">MEDIDA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.paleto_manga_medida_info || (data.paleto_manga_medida_checkbox ? '☑' : '☐')}
            </div>
          </div>
          <div className="col-span-2">
            <Label className="text-xs font-bold">MARCA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.paleto_manga_marca_checkbox ? '☑' : '☐'}
            </div>
          </div>
        </div>

        {data.paleto_descritivo && (
          <div className="mb-3">
            <Label className="text-xs font-bold">DESCRIÇÃO</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.paleto_descritivo}
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs font-bold">OUTROS</Label>
          <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
            {data.paleto_outros_texto || '-'}
          </div>
        </div>
      </div>
    );
  };

  const renderCalca = (data: any) => {
    if (!data) return null;
    return (
      <div className="mb-8 pb-6 border-b-2 border-border">
        <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
          Calça
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <Label className="text-xs font-bold">DESCRIÇÃO</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.calca_descritivo || '-'}
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">VALOR</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1 font-semibold text-green-600">
              {data.calca_valor ? `R$ ${data.calca_valor}` : '-'}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <Label className="text-xs font-bold">SOB MEDIDA</Label>
          <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
            {data.calca_sobmedida || data.calca_sob_medida || '-'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold">CINTURA</Label>
              <div className="flex gap-2 items-center mt-1 mb-2">
                <span className="text-xs">SOLTAR:</span>
                <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                  {data.calca_cintura_soltar || '-'}
                </div>
                <span className="text-xs">APERTAR:</span>
                <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                  {data.calca_cintura_apertar || '-'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">MEDIDA</Label>
                  <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                    {data.calca_cintura_medida_text || (data.calca_cintura_medida_box ? '☑' : '☐')}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">MARCA</Label>
                  <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                    {data.calca_cintura_marca ? '☑' : '☐'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">JOELHO</Label>
              <div className="flex gap-2 items-center mt-1 mb-2">
                <span className="text-xs">APERTAR:</span>
                <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                  {data.calca_joelho_apertar || '-'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">BOCA</Label>
                  <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                    {data.calca_joelho_boca_text || (data.calca_joelho_boca_box ? '☑' : '☐')}
                  </div>
                </div>
                <div>
                  <Label className="text-xs">MARCA</Label>
                  <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                    {data.calca_joelho_marca_box ? '☑' : '☐'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-xs font-bold">COXA</Label>
              <div className="flex gap-2 items-center mt-1 mb-2">
                <span className="text-xs">SOLTAR:</span>
                <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                  {data.calca_coxa_soltar || '-'}
                </div>
                <span className="text-xs">APERTAR:</span>
                <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                  {data.calca_coxa_apertar || '-'}
                </div>
              </div>
              <div>
                <Label className="text-xs">MARCA</Label>
                <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                  {data.calca_coxa_marca ? '☑' : '☐'}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">BARRA</Label>
              <div className="flex gap-2 items-center mt-1 mb-2">
                <span className="text-xs">SOLTAR:</span>
                <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                  {data.calca_barra_soltar || '-'}
                </div>
                <span className="text-xs">APERTAR:</span>
                <div className="text-sm bg-muted/30 px-2 py-1 rounded">
                  {data.calca_barra_apertar || '-'}
                </div>
              </div>
              <div>
                <Label className="text-xs">MEDIDA</Label>
                <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                  {data.calca_barra_medida_text || (data.calca_barra_medida_box ? '☑' : '☐')}
                </div>
              </div>
              {data.calca_barra_descritivo && (
                <div className="mt-2">
                  <Label className="text-xs">DESCRIÇÃO</Label>
                  <div className="text-sm bg-muted/30 px-2 py-1 rounded-md mt-1">
                    {data.calca_barra_descritivo}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCamisa = (data: any) => {
    if (!data) return null;
    return (
      <div className="mb-8 pb-6 border-b-2 border-border">
        <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
          Camisa
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <Label className="text-xs font-bold">DESCRIÇÃO</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.camisa_descritivo || '-'}
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">VALOR</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1 font-semibold text-green-600">
              {data.camisa_valor ? `R$ ${data.camisa_valor}` : '-'}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <Label className="text-xs font-bold">SOB MEDIDA</Label>
          <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
            {data.camisa_sob_medida || '-'}
          </div>
        </div>

        <div className="mb-3">
          <Label className="text-xs font-bold">COLARINHO</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Original</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.camisa_colarinho_original ? '☑' : '☐'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Alargador</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.camisa_colarinho_alargador ? '☑' : '☐'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Ponta</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.camisa_colarinho_ponta ? '☑' : '☐'}
              </div>
            </div>
          </div>
          {data.camisa_colarinho_info && (
            <div className="mt-2">
              <div className="text-sm bg-muted/30 px-3 py-2 rounded-md">
                {data.camisa_colarinho_info}
              </div>
            </div>
          )}
        </div>

        <div className="mb-3">
          <Label className="text-xs font-bold">CINTURA</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Pence</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.camisa_cintura_pence ? '☑' : '☐'}
              </div>
              {data.camisa_cintura_pence_info && (
                <div className="text-xs mt-1">{data.camisa_cintura_pence_info}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Marca</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.camisa_cintura_marca ? '☑' : '☐'}
              </div>
              {data.camisa_cintura_marca_info && (
                <div className="text-xs mt-1">{data.camisa_cintura_marca_info}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Lateral</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.camisa_cintura_lateral ? '☑' : '☐'}
              </div>
              {data.camisa_cintura_lateral_info && (
                <div className="text-xs mt-1">{data.camisa_cintura_lateral_info}</div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <Label className="text-xs font-bold">MANGA</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Apertar</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.camisa_manga_apertar_checkbox ? '☑' : '☐'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Medida</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.camisa_manga_medida_checkbox ? '☑' : '☐'}
              </div>
              {data.camisa_manga_medida_info && (
                <div className="text-xs mt-1">{data.camisa_manga_medida_info}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Menos</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.camisa_manga_menos_checkbox ? '☑' : '☐'}
              </div>
              {data.camisa_manga_menos_info && (
                <div className="text-xs mt-1">{data.camisa_manga_menos_info}</div>
              )}
            </div>
          </div>
          {data.camisa_manga_info && (
            <div className="mt-2">
              <div className="text-sm bg-muted/30 px-3 py-2 rounded-md">
                {data.camisa_manga_info}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderColete = (data: any) => {
    if (!data) return null;
    const hasData = Object.values(data).some(val => val !== null && val !== undefined && val !== '');
    if (!hasData) return null;

    return (
      <div className="mb-8 pb-6 border-b-2 border-border">
        <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
          Colete
        </h3>

        <div className="mb-3">
          <Label className="text-xs font-bold">SOB MEDIDA</Label>
          <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
            {data.colete_sobmedida || '-'}
          </div>
        </div>

        <div className="mb-3">
          <Label className="text-xs font-bold">PEITO</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Apertar</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.colete_peito_apertar || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Soltar</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.colete_peito_soltar || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Marca</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.colete_peito_marca ? '☑' : '☐'}
              </div>
            </div>
          </div>
          {data.colete_peito_descritivo && (
            <div className="mt-2">
              <div className="text-sm bg-muted/30 px-3 py-2 rounded-md">
                {data.colete_peito_descritivo}
              </div>
            </div>
          )}
        </div>

        <div className="mb-3">
          <Label className="text-xs font-bold">CINTURA</Label>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Apertar</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.colete_cintura_apertar || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Soltar</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.colete_cintura_soltar || '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Marca</div>
              <div className="text-sm bg-muted/30 px-2 py-1 rounded-md">
                {data.colete_cintura_marca ? '☑' : '☐'}
              </div>
            </div>
          </div>
          {data.colete_cintura_descritivo && (
            <div className="mt-2">
              <div className="text-sm bg-muted/30 px-3 py-2 rounded-md">
                {data.colete_cintura_descritivo}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGravata = (data: any) => {
    if (!data) return null;
    const hasData = Object.values(data).some(val => val !== null && val !== undefined && val !== '');
    if (!hasData) return null;

    return (
      <div className="mb-8 pb-6 border-b-2 border-border">
        <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
          Gravata
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <Label className="text-xs font-bold">MODELO</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.modelo || '-'}
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">MEDIDA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.medida || '-'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <Label className="text-xs font-bold">VALOR</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1 font-semibold text-green-600">
              {data.gravata_valor || '-'}
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">OUTROS</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.outros || '-'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRodape = (data: any) => {
    if (!data) return null;
    return (
      <div className="mb-4">
        <h3 className="text-base font-bold mb-4 bg-accent/50 p-2 rounded-md uppercase">
          Acessórios e Valores
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <Label className="text-xs font-bold">FAIXA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.rodape_faixa || '-'}
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">SAPATO</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.rodape_sapato || '-'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <Label className="text-xs font-bold">ABOTOADURA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.rodape_botoadura || '-'}
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">OUTROS</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.rodape_outros || '-'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-bold">VALOR TOTAL</Label>
            <div className="text-lg bg-green-600/10 border-2 border-green-600 px-3 py-2 rounded-md mt-1 font-bold text-green-600">
              {data.rodape_valor ? `R$ ${data.rodape_valor}` : '-'}
            </div>
          </div>
          <div>
            <Label className="text-xs font-bold">GARANTIA</Label>
            <div className="text-sm bg-muted/30 px-3 py-2 rounded-md mt-1">
              {data.rodape_garantia || '-'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {processingTime && processingTime > 0 && (
        <div className="mb-4 text-sm text-muted-foreground text-right">
          Processado em {processingTime}s
        </div>
      )}
      {renderCabecalho(cabecalho)}
      {renderPaleto(paleto)}
      {renderCalca(calca)}
      {renderCamisa(camisa)}
      {renderColete(colete)}
      {renderGravata(gravata)}
      {renderRodape(rodape)}
    </div>
  );
};
