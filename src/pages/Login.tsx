import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TelegramLoginWidget } from '../components/auth/TelegramLoginWidget';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-sm mx-auto my-1 sm:my-6 px-2 sm:px-0 flex flex-col justify-center">
      {/* Primary Telegram Login Widget */}
      <TelegramLoginWidget
        onSuccess={() => navigate('/')}
        title="Telegram ile Giriş Yap"
        subtitle="3 adımda şifresiz ve anında güvenli giriş yapın."
      />
    </div>
  );
};
