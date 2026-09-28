'use client';

import { AuthProvider } from './AuthContext';
import { PersonaProvider } from './PersonaContext';
import { ChatProvider } from './ChatContext';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <PersonaProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </PersonaProvider>
    </AuthProvider>
  );
}
