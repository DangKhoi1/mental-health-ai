import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="border-t border-border bg-sky-50/10 px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
                <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
                    <div>
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-primary">
                                <Image src="/mental_health.png" alt="Logo" width={24} height={24} className="brightness-0 invert" />
                            </div>
                            <span className="text-lg font-semibold text-foreground">Mental Health AI</span>
                        </div>
                        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                            Công cụ hỗ trợ theo dõi sức khỏe tinh thần mỗi ngày bằng trải nghiệm đơn giản và riêng tư.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Điều hướng</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link href="/trangchu" className="text-muted-foreground transition-colors hover:text-primary">Trang chủ</Link></li>
                            <li><Link href="#features" className="text-muted-foreground transition-colors hover:text-primary">Tính năng</Link></li>
                            <li><Link href="#about" className="text-muted-foreground transition-colors hover:text-primary">Về chúng tôi</Link></li>
                            <li><Link href="#faq" className="text-muted-foreground transition-colors hover:text-primary">Câu hỏi thường gặp</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Tài khoản</h4>
                        <ul className="space-y-2.5 text-sm">
                            <li><Link href="/auth/login" className="text-muted-foreground transition-colors hover:text-primary">Đăng nhập</Link></li>
                            <li><Link href="/auth/register" className="text-muted-foreground transition-colors hover:text-primary">Đăng ký</Link></li>
                            <li><Link href="/assessment" className="text-muted-foreground transition-colors hover:text-primary">Làm bài đánh giá</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 rounded-xl border border-amber-100 bg-amber-50/80 p-3.5 text-center text-sm text-amber-900/80">
                    <span className="font-semibold">Lưu ý:</span> Ứng dụng này phục vụ mục đích học tập, không thay thế chẩn đoán hoặc điều trị y khoa chuyên nghiệp.
                </div>

                <div className="mt-6 border-t border-border pt-5 text-center text-sm text-muted-foreground">
                    © 2026 Mental Health AI. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
