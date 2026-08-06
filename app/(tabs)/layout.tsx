import BottomNav from "@/components/BottomNav";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-md">
      <main className="px-4 pb-28 pt-6">{children}</main>
      <BottomNav />
    </div>
  );
}
