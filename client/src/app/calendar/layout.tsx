import { Layout } from '@/components/layout/Layout';

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Layout>{children}</Layout>;
}
