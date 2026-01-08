import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  actionText = "Começar",
  className = ""
}) => (
  <Card className={`text-center border-0 shadow-lg bg-white/80 ${className}`}>
    <CardContent className="p-8">
      {Icon && <Icon className="w-16 h-16 text-slate-300 mx-auto mb-4" />}
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6">{description}</p>
      {action && (
        <Button onClick={action} className="bg-emerald-600 hover:bg-emerald-700">
          {actionText}
        </Button>
      )}
    </CardContent>
  </Card>
);