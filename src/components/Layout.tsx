import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Header } from "@/components/Header";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full">
        <ResizablePanelGroup direction="horizontal" className="min-h-screen">
          <ResizablePanel 
            defaultSize={20} 
            minSize={15} 
            maxSize={35}
          >
            <div className="h-full">
              <AppSidebar />
            </div>
          </ResizablePanel>
          
          <ResizableHandle withHandle className="w-2 bg-border hover:bg-border/80 transition-colors" />
          
          <ResizablePanel defaultSize={80} minSize={65}>
            <div className="flex flex-col h-full">
              <Header />
              <main className="flex-1 p-6 bg-background overflow-auto">
                {children}
              </main>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  );
}