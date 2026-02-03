import React from 'react';
import { useLocation } from "react-router-dom";
import PublicLayout from './components/layout/PublicLayout';
import ProtectedLayout from './components/layout/ProtectedLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

function getPageName(location, currentPageName) {
  if (currentPageName) return currentPageName;
  const path = location.pathname;
  if (path === '/' || path === '') return 'Home';
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const segment = cleanPath.split('?')[0].split('#')[0];
  return segment.split('/')[0] || 'Home';
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const pageName = getPageName(location, currentPageName);

  const PUBLIC_PAGES = [
    'Home',
    'FAQ', 
    'TermosDeUso', 
    'PrivacyPolicy', 
    'Contato'
  ];

  const isPublicPage = PUBLIC_PAGES.includes(pageName);

  return (
    <ErrorBoundary>
      {isPublicPage ? (
        <PublicLayout>
          {children}
        </PublicLayout>
      ) : (
        <ProtectedLayout pageName={pageName}>
          {children}
        </ProtectedLayout>
      )}
    </ErrorBoundary>
  );
}