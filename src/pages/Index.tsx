import { Hero } from "@/components/Hero";
import { CategoryCard } from "@/components/CategoryCard";
import { StatsCard } from "@/components/StatsCard";
import { ExammCard } from "@/components/ExammCard";
import { FeatureCard } from "@/components/FeatureCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Headphones,
  PenTool,
  MessageCircle,
  Award,
  TrendingUp,
  Clock,
  Sparkles,
  Target,
  Users,
  ArrowRight
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/data/AuthContext.js"; // import AuthContext
import AuthDialog from "@/pages/user/LoginPage"; // import AuthDialog
const Index = () => {
  const skills = [
    {
      title: "Reading",
      description: "Rèn luyện kỹ năng đọc hiểu với các bài đọc đa dạng và câu hỏi phân tích chi tiết",
      icon: BookOpen,
      totalExercises: 120,
      completedExercises: 35,
      color: "primary" as const,
    },
    {
      title: "Listening",
      description: "Phát triển khả năng nghe hiểu qua các bài nghe từ dễ đến khó với nhiều giọng đọc",
      icon: Headphones,
      totalExercises: 100,
      completedExercises: 28,
      color: "secondary" as const,
    },
    {
      title: "Writing",
      description: "Nâng cao kỹ năng viết với các dạng bài luận, thư, email theo chuẩn quốc tế",
      icon: PenTool,
      totalExercises: 80,
      completedExercises: 15,
      color: "accent" as const,
    },
    {
      title: "Speaking",
      description: "Luyện tập phát âm và giao tiếp với các tình huống thực tế và bài tập đóng vai",
      icon: MessageCircle,
      totalExercises: 90,
      completedExercises: 22,
      color: "primary" as const,
    },
  ];

  const features = [
    {
      icon: Sparkles,
      title: "Nội dung chất lượng",
      description: "Hàng ngàn bài tập được biên soạn bởi giáo viên chuyên nghiệp",
      color: "primary" as const,
    },
    {
      icon: Target,
      title: "Học có mục tiêu",
      description: "Lộ trình học tập rõ ràng theo từng cấp độ và kỳ thi",
      color: "secondary" as const,
    },
    {
      icon: Users,
      title: "Cộng đồng lớn",
      description: "Hơn 10,000 học sinh đang học tập và tiến bộ cùng nhau",
      color: "accent" as const,
    },
  ];

  const testimonials = [
    {
      name: "Nguyễn Minh Anh",
      role: "Học sinh lớp 12",
      content: "Nhờ English Practice mà em đã đạt 850 điểm TOEIC. Các bài tập rất đa dạng và phù hợp với đề thi thật!",
      rating: 5,
    },
    {
      name: "Trần Hoàng Long",
      role: "Sinh viên năm 2",
      content: "Nền tảng này giúp mình cải thiện kỹ năng Listening rất nhiều. Giao diện dễ sử dụng và bài tập phong phú.",
      rating: 5,
    },
    {
      name: "Lê Thị Hương",
      role: "Học sinh lớp 11",
      content: "Em đã từ 6.0 lên 7.5 IELTS chỉ sau 3 tháng. Phần Writing có feedback chi tiết giúp em rất nhiều!",
      rating: 5,
    },
  ];

  const exams = [
    {
      name: "TOEIC",
      description: "Test of English for International Communication - Chứng chỉ tiếng Anh giao tiếp quốc tế",
      totalTests: 25,
      completedTests: 8,
      estimatedTime: "120 phút",
      difficulty: "Intermediate" as const,
    },
    {
      name: "IELTS",
      description: "International English Language Testing System - Hệ thống kiểm tra tiếng Anh quốc tế",
      totalTests: 30,
      completedTests: 12,
      estimatedTime: "165 phút",
      difficulty: "Advanced" as const,
    },
    {
      name: "TOEFL",
      description: "Test of English as a Foreign Language - Bài thi tiếng Anh như ngôn ngữ thứ hai",
      totalTests: 20,
      completedTests: 5,
      estimatedTime: "180 phút",
      difficulty: "Advanced" as const,
    },
    {
      name: "VSTEP",
      description: "Vietnamese Standardized Test of English Proficiency - Bài thi chuẩn hóa tiếng Anh Việt Nam",
      totalTests: 15,
      completedTests: 6,
      estimatedTime: "150 phút",
      difficulty: "Intermediate" as const,
    },
  ];

  const stats = [
    {
      title: "Bài tập đã hoàn thành",
      value: 146,
      icon: Award,
      color: "primary" as const,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Điểm trung bình",
      value: "8.5/10",
      icon: TrendingUp,
      color: "secondary" as const,
      trend: { value: 5, isPositive: true },
    },
    {
      title: "Thời gian học",
      value: "24h",
      icon: Clock,
      color: "accent" as const,
      trend: { value: 8, isPositive: true },
    },
  ];
  const [openAuth, setOpenAuth] = useState(false);
  const { setUser } = useAuth();

  const handleLoginSuccess = (user: any) => {
    setUser(user);
    setOpenAuth(false);
  };
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero onCTAClick={() => setOpenAuth(true)} />

      {/* Stats Section */}
      <section className="py-16 bg-background">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Thống kê ấn tượng</h2>
            <p className="text-muted-foreground text-lg">Con số nói lên chất lượng đào tạo</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map(stat => (
              <StatsCard key={stat.title} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tại sao chọn chúng tôi?</h2>
            <p className="text-muted-foreground text-lg">Những ưu điểm vượt trội của English Practice</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map(feature => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-16 bg-background">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Luyện tập 4 kỹ năng</h2>
            <p className="text-muted-foreground text-lg">Phát triển toàn diện khả năng tiếng Anh của bạn</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {skills.map(skill => (
              <CategoryCard key={skill.title} {...skill} />
            ))}
          </div>
        </div>
      </section>

      {/* Exams Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Luyện thi chứng chỉ quốc tế</h2>
            <p className="text-muted-foreground text-lg">Chuẩn bị cho các kỳ thi uy tín thế giới</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map(exam => (
              <ExammCard key={exam.name} {...exam} onClick={() => setOpenAuth(true)} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-background">
        <div className="container px-4">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Học viên nói gì về chúng tôi</h2>
            <p className="text-muted-foreground text-lg">Những câu chuyện thành công thực tế</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(testimonial => (
              <TestimonialCard key={testimonial.name} {...testimonial} onClick={() => setOpenAuth(true)} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Sẵn sàng chinh phục tiếng Anh?</h2>
          <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Tham gia cùng hàng ngàn học sinh đang tiến bộ mỗi ngày
          </p>
          <Button
            variant="hero"
            size="lg"
            className="bg-card text-foreground hover:bg-card/90"
            onClick={() => setOpenAuth(true)}
          >
            Đăng ký ngay
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      <Footer />

      {/* AuthDialog */}
          // Index.tsx hoặc Header.tsx
      <AuthDialog
        open={openAuth}
        onClose={() => setOpenAuth(false)}
        onLoginSuccess={(user) => {
          // ĐỪNG navigate ở đây nữa
          // Chỉ cần close dialog hoặc set state UI
          console.log("Login thành công", user);
          setOpenAuth(false);
        }}
      />

    </div>
  );
};

export default Index;
