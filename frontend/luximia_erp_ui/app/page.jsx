// app/page.jsxx
'use client';

import { useAuth } from '@/context/AuthContext';
import DashboardPage from '@/dashboard/page';
import HomePage from '@/home/page';
import { useEffect, useState } from 'react';
import Overlay from '@/components/loaders/Overlay';

export default function IndexPage() {
  const { hasPermission } = useAuth();
  const [checked, setChecked] = useState(false);
  const [canView, setCanView] = useState(false);

  useEffect(() => {
    setCanView(hasPermission('cxc.can_view_dashboard'));
    setChecked(true);
  }, [hasPermission]);

  if (!checked) {
    return <Overlay className="p-8" />;
  }

  return canView ? <DashboardPage /> : <HomePage />;
}
