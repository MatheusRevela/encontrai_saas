import React from 'react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, CheckCircle, Gift } from 'lucide-react';

const achievements = {
  first_search: {
    title: "Primeiro Passo!",
    description: "Fez sua primeira busca",
    icon: Zap,
    color: "bg-blue-100 text-blue-800 border-blue-300"
  },
  first_unlock: {
    title: "Desbloqueador!",
    description: "Primeira startup desbloqueada",
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-800 border-emerald-300"
  },
  feedback_giver: {
    title: "Colaborador!",
    description: "Deu feedback sobre uma solução",
    icon: Star,
    color: "bg-amber-100 text-amber-800 border-amber-300"
  },
  power_user: {
    title: "Power User!",
    description: "5+ buscas realizadas",
    icon: Trophy,
    color: "bg-purple-100 text-purple-800 border-purple-300"
  },
  referral: {
    title: "Embaixador!",
    description: "Indicou a plataforma",
    icon: Gift,
    color: "bg-pink-100 text-pink-800 border-pink-300"
  }
};

export default function AchievementBadge({ type, showAnimation = true }) {
  const achievement = achievements[type];
  if (!achievement) return null;

  const Icon = achievement.icon;

  return (
    <motion.div
      initial={showAnimation ? { scale: 0, rotate: -180 } : {}}
      animate={showAnimation ? { scale: 1, rotate: 0 } : {}}
      transition={{ type: "spring", duration: 0.6 }}
    >
      <Badge className={`${achievement.color} gap-2 px-3 py-1`}>
        <Icon className="w-4 h-4" />
        <div>
          <p className="font-semibold text-xs">{achievement.title}</p>
          <p className="text-xs opacity-80">{achievement.description}</p>
        </div>
      </Badge>
    </motion.div>
  );
}