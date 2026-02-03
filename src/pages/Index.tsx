import { useState } from "react";
import { TravelSidebar } from "@/components/TravelSidebar";
import { MainContent } from "@/components/MainContent";
import { useGenerateItinerary } from "@/hooks/useGenerateItinerary";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Menu, X } from "lucide-react";
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
    <div dir="rtl" className="flex min-h-screen bg-background">
      {/* Mobile: Show toggle button and sheet */}
      {isMobile ? (
        <>
          {/* Floating menu button for mobile */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant="default"
                size="icon"
                className="fixed top-4 right-4 z-50 shadow-lg rounded-full h-12 w-12"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm p-0">
              <TravelSidebar 
                onGenerate={handleGenerate} 
                isLoading={isLoading}
                user={user}
                onSignOut={handleSignOut}
              />
            </SheetContent>
          </Sheet>
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
        </>
      ) : (
        <>
          {/* Desktop: Show sidebar normally */}
          <TravelSidebar 
            onGenerate={generateItinerary} 
            isLoading={isLoading}
            user={user}
            onSignOut={handleSignOut}
          />
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
        </>
      )}
    </div>
  );
};

export default Index;
