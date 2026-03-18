import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Lock, User, AtSign, Loader2 } from "lucide-react";
import { toast } from "sonner";

const LoginPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);

        // Simulate API delay
        setTimeout(() => {
            setIsLoading(false);
            localStorage.setItem("user_token", "mock_jwt_token_12345");
            localStorage.setItem("user_role", "analyst");
            toast.success("Welcome back, Analyst!");
            navigate("/");
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-3xl"></div>
            </div>

            <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/10 shadow-2xl overflow-hidden relative z-10">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <CardHeader className="text-center space-y-2 pb-8 pt-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-white tracking-tight">
                        Secure Analytical Portal
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-base">
                        Enter your credentials to access insights
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <div className="relative group">
                                <AtSign className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                <Input
                                    type="email"
                                    placeholder="name@company.com"
                                    className="bg-black/20 border-white/10 text-white pl-10 h-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-600"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="relative group">
                                <User className="absolute left-3 top-3 w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="bg-black/20 border-white/10 text-white pl-10 h-12 focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-600"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 rounded-xl"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Authenticating...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>

                        <div className="text-center text-sm text-gray-500 pt-2">
                            <p>Protected by Enterprise Grade Security</p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
