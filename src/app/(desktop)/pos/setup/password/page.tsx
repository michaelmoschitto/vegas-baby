"use client";

import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { validateVendorPassword } from "./actions";

export default function PasswordPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const result = await validateVendorPassword(password);

    if (result.success) {
      router.push("/pos/setup");
    } else {
      setError(result.error || "Invalid password");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-md">
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 border-2 border-gray-200">
        <CardHeader>
          <CardTitle>Vendor Setup Access</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Enter Vendor Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="pr-10 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-sm text-rose-600 font-medium">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full bg-rose-600 hover:bg-rose-700 text-white transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Access Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
