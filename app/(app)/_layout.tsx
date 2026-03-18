import SidebarLayout from '@/components/navigation/SidebarLayout';
import TabsLayout from '@/components/navigation/TabsLayout';
import { useIsDesktop } from '@/hooks/useIsDesktop';

export default function AppLayout(): React.JSX.Element {
  const isDesktop: boolean = useIsDesktop();

  return isDesktop ? <SidebarLayout /> : <TabsLayout />;
}

