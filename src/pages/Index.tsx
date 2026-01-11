import { TravelSidebar } from "@/components/TravelSidebar";
import { MainContent } from "@/components/MainContent";
import { useGenerateItinerary } from "@/hooks/useGenerateItinerary";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { 
    generateItinerary, 
    isLoading, 
    error, 
    itinerary, 
    resetItinerary,
    swapActivity,
    swappingActivityId,
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

  return (
    <div className="flex min-h-screen bg-background">
      <MainContent 
        itinerary={itinerary} 
        isLoading={isLoading} 
        error={error}
        onReset={resetItinerary}
        swappingActivityId={swappingActivityId}
        onSwapActivity={swapActivity}
      />
      <TravelSidebar 
        onGenerate={generateItinerary} 
        isLoading={isLoading}
        user={user}
        onSignOut={handleSignOut}
      />
    </div>
  );
};

export default Index;
