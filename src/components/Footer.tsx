import { BookOpen, Facebook, Twitter, Instagram, Mail } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">English Practice</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nền tảng luyện thi tiếng Anh toàn diện cho học sinh phổ thông
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Kỹ năng</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Reading</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Listening</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Writing</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Speaking</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Chứng chỉ</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">TOEIC</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">IELTS</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">TOEFL</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">VSTEP</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Liên hệ</h4>
            <div className="flex gap-4 mb-4">
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              Email: contact@englishpractice.vn
            </p>
          </div>
        </div>
        
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 English Practice. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
