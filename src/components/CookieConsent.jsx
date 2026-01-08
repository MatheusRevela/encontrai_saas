import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Cookie, X } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowConsent(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md">
      <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Cookie className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-sm mb-2">
                Consentimento de cookies
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Utilizamos cookies para melhorar sua experiência, analisar o tráfego do site e personalizar conteúdo. 
                Ao continuar navegando, você concorda com nossa{' '}
                <a href={createPageUrl('PrivacyPolicy')} className="text-emerald-600 hover:underline">
                  política de privacidade
                </a>.
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={acceptCookies}
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs px-3 py-1"
                >
                  Aceitar
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={declineCookies}
                  className="text-xs px-3 py-1"
                >
                  Recusar
                </Button>
              </div>
            </div>
            <button
              onClick={declineCookies}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}