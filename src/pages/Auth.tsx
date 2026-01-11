import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plane, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("נא למלא את כל השדות");
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("אימייל או סיסמה שגויים");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("התחברת בהצלחה!");
      navigate("/");
    } catch (err) {
      toast.error("שגיאה בהתחברות");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast.error("נא למלא את כל השדות");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }

    if (password.length < 6) {
      toast.error("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        if (error.message.includes("already registered")) {
          toast.error("משתמש עם אימייל זה כבר קיים");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("נרשמת בהצלחה! בדוק את האימייל שלך לאימות החשבון");
    } catch (err) {
      toast.error("שגיאה בהרשמה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
            <Plane className="h-8 w-8 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">מתכנן הטיולים</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">תכנן את ההרפתקה שלך</p>
          </div>
        </div>

        <Card className="border-slate-200 dark:border-slate-700 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">ברוכים הבאים</CardTitle>
            <CardDescription>התחבר או צור חשבון חדש כדי להתחיל</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">התחברות</TabsTrigger>
                <TabsTrigger value="signup">הרשמה</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="ps-10"
                        disabled={isLoading}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="ps-10"
                        disabled={isLoading}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                        מתחבר...
                      </>
                    ) : (
                      "התחבר"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">אימייל</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="ps-10"
                        disabled={isLoading}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="לפחות 6 תווים"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="ps-10"
                        disabled={isLoading}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">אימות סיסמה</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-confirm"
                        type="password"
                        placeholder="הזן שוב את הסיסמה"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="ps-10"
                        disabled={isLoading}
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="ms-2 h-4 w-4 animate-spin" />
                        נרשם...
                      </>
                    ) : (
                      "צור חשבון"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Back to home link */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="ms-2 h-4 w-4" />
            חזרה לדף הראשי
          </Button>
        </div>
      </div>
    </div>
  );
}
