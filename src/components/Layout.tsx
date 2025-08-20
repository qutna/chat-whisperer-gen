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
            maxSize={40}
            className="min-w-[200px]"
          >
            <AppSidebar />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          <ResizablePanel defaultSize={80} minSize={60}>
            <div className="flex flex-col h-full">
              <Header />
              <main className="flex-1 p-6 bg-background">
                {children}
              </main>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SidebarProvider>
  );
}