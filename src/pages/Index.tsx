import { useState } from "react";
import { TravelSidebar } from "@/components/TravelSidebar";
import { MainContent } from "@/components/MainContent";
import { useGenerateItinerary } from "@/hooks/useGenerateItinerary";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Menu, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { 
    generateItinerary, 
    isLoading, 
    error, 
    itinerary, 
    resetItinerary,
    swapActivity,
    swappingActivityId,
    lastRequest,
  } = useGenerateItinerary();

  const { user, loading: authLoading, signOut } = useAuth();

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">טוען...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGenerate = async (request: any) => {
    await generateItinerary(request);
    // Close sidebar on mobile after generating
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div dir="rtl" className="flex flex-col min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary rounded-lg">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">מתכנן הטיולים</span>
            </div>
            
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] max-w-sm p-0 overflow-y-auto">
                <TravelSidebar 
                  onGenerate={handleGenerate} 
                  isLoading={isLoading}
                  user={user}
                  onSignOut={handleSignOut}
                />
              </SheetContent>
            </Sheet>
          </div>
        </header>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: Show sidebar */}
        {!isMobile && (
          <TravelSidebar 
            onGenerate={generateItinerary} 
            isLoading={isLoading}
            user={user}
            onSignOut={handleSignOut}
          />
        )}
        
        <MainContent 
          itinerary={itinerary} 
          isLoading={isLoading} 
          error={error}
          onReset={resetItinerary}
          swappingActivityId={swappingActivityId}
          onSwapActivity={swapActivity}
          destination={lastRequest?.destination}
          showSaveButton={!!itinerary && !!user}
        />
      </div>
    </div>
  );
};

export default Index;
