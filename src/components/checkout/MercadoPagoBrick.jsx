import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function MercadoPagoBrick({ publicKey, amount, payerEmail, payerCpf, onSubmit }) {
  const [loading, setLoading] = useState(true);
  const [sdkError, setSdkError] = useState(null);
  const brickControllerRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!publicKey || !amount || amount <= 0 || initializedRef.current) return;

    const loadSDK = () => new Promise((resolve, reject) => {
      if (window.MercadoPago) { resolve(); return; }
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    const initBrick = async () => {
      try {
        await loadSDK();
        const mp = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
        const bricksBuilder = mp.bricks();

        brickControllerRef.current = await bricksBuilder.create('payment', 'mp-payment-brick-container', {
          initialization: {
            amount,
            payer: {
              email: payerEmail || '',
              identification: {
                type: 'CPF',
                number: payerCpf?.replace(/\D/g, '') || ''
              }
            }
          },
          customization: {
            paymentMethods: {
              creditCard: 'all',
              debitCard: 'all',
              bankTransfer: ['pix']
            },
            visual: {
              style: {
                customVariables: {
                  baseColor: '#059669',
                  baseColorFirstVariant: '#047857',
                  baseColorSecondVariant: '#065f46'
                }
              }
            }
          },
          callbacks: {
            onReady: () => setLoading(false),
            onSubmit: async ({ formData }) => {
              await onSubmit(formData);
            },
            onError: (error) => {
              console.error('MP Brick error:', error);
            }
          }
        });

        initializedRef.current = true;
      } catch (err) {
        console.error('Erro ao inicializar brick:', err);
        setSdkError('Erro ao carregar o formulário de pagamento. Recarregue a página.');
        setLoading(false);
      }
    };

    initBrick();

    return () => {
      if (brickControllerRef.current) {
        brickControllerRef.current.unmount();
        initializedRef.current = false;
      }
    };
  }, [publicKey, amount]);

  if (sdkError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {sdkError}
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="flex items-center justify-center py-10 gap-3">
          <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
          <span className="text-sm text-slate-600">Carregando formulário de pagamento...</span>
        </div>
      )}
      <div id="mp-payment-brick-container" />
    </div>
  );
}