import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', gradient = false }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${
        gradient ? 'bg-gradient-to-br from-white to-gray-50' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'green' | 'blue' | 'gold' | 'red';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, trend }) => {
  const colors = {
    green: 'from-[#00A86B] to-[#008F5A]',
    blue: 'from-[#0077B6] to-[#005F8F]',
    gold: 'from-[#FFD700] to-[#FFC700]',
    red: 'from-red-500 to-red-600',
  };

  const iconBg = {
    green: 'bg-[#00A86B]/10 text-[#00A86B]',
    blue: 'bg-[#0077B6]/10 text-[#0077B6]',
    gold: 'bg-[#FFD700]/10 text-[#FFC700]',
    red: 'bg-red-500/10 text-red-600',
  };

  return (
    <Card className="p-6 relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colors[color]} opacity-5`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-lg ${iconBg[color]}`}>
            {icon}
          </div>
          {trend && (
            <span className="text-sm font-medium text-green-600">{trend}</span>
          )}
        </div>
        <h3 className="text-gray-600 text-sm font-medium mb-1">{title}</h3>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );
};
