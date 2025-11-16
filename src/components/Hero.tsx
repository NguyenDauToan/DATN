import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";
import heroImage from "@/assets/hero-learning.jpg";
import { useState } from "react";
import { useAuth } from "@/data/AuthContext.jsx";
import AuthDialog from "@/pages/user/AuthDialog";

interface HeroProps {
    onCTAClick?: () => void; // khai báo props
  }
  export const Hero: React.FC<HeroProps> = ({ onCTAClick })=>{
    const [openAuth, setOpenAuth] = useState(false);
    const { setUser } = useAuth();

    const handleLoginSuccess = (user: any) => {
        setUser(user);
        setOpenAuth(false);
    };
    return (
        <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImage})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-transparent" />
            </div>

            <div className="container relative z-10 px-4 py-20">
                <div className="max-w-2xl animate-fade-in">
                    <div className="inline-flex items-center gap-2 bg-card/90 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium">Nền tảng luyện thi tiếng Anh</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-6">
                        Chinh phục tiếng Anh<br />
                        <span className="text-accent">cùng chúng tôi</span>
                    </h1>

                    <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
                        Hệ thống luyện thi toàn diện với hàng ngàn bài tập Grammar, Vocabulary, Reading và nhiều hơn nữa.
                        Học thông minh, tiến bộ nhanh chóng!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            variant="hero"
                            size="lg"
                            className="group"
                            onClick={() => setOpenAuth(true)}
                        >
                            Bắt đầu ngay
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                        <Button variant="outline" size="lg" className="bg-card/90 backdrop-blur-sm hover:bg-card">
                            Xem thêm
                        </Button>
                    </div>
                    <AuthDialog
                        open={openAuth}
                        onClose={() => setOpenAuth(false)}
                        onLoginSuccess={handleLoginSuccess}
                    />
                </div>
            </div>
        </section>
    );
};
