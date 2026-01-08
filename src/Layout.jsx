import React from 'react';
import { useLocation } from "react-router-dom";
import PublicLayout from './components/layout/PublicLayout';
import ProtectedLayout from './components/layout/ProtectedLayout';
import ErrorBoundary from './components/common/ErrorBoundary';

function getPageName(location, currentPageName) {
  if (currentPageName) return currentPageName;
  const path = location.pathname;
  if (path === '/' || path === '') return 'HomePublica';
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const segment = cleanPath.split('?')[0].split('#')[0];
  return segment.split('/')[0] || 'HomePublica';
}

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const pageName = getPageName(location, currentPageName);

  const PUBLIC_PAGES = [
    'HomePublica',
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