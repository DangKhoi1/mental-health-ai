'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_DATA = [
    {
        question: "Mental Health AI là gì?",
        answer: "Mental Health AI là công cụ hỗ trợ bạn theo dõi và thấu hiểu cảm xúc của mình mỗi ngày. Chúng tôi cung cấp không gian riêng tư để bạn ghi lại suy nghĩ, nhận diện mẫu hình cảm xúc, và tìm kiếm sự cân bằng trong cuộc sống."
    },
    {
        question: "Dữ liệu của tôi có được bảo mật không?",
        answer: "Tuyệt đối. Mọi thông tin bạn chia sẻ đều được mã hóa và bảo vệ. Chỉ bạn mới có quyền truy cập vào dữ liệu cá nhân của mình. Chúng tôi không bao giờ chia sẻ thông tin của bạn với bên thứ ba."
    },
    {
        question: "Mental Health AI có thay thế cho tư vấn chuyên nghiệp không?",
        answer: "Không. Chúng tôi là công cụ hỗ trợ, không phải dịch vụ y tế hay tư vấn tâm lý. Nếu bạn đang gặp khó khăn nghiêm trọng về sức khỏe tinh thần, vui lòng tìm đến sự giúp đỡ của các chuyên gia."
    },
    {
        question: "Tôi có thể sử dụng trên nhiều thiết bị không?",
        answer: "Có. Bạn có thể truy cập Mental Health AI trên máy tính, điện thoại, hoặc máy tính bảng. Dữ liệu của bạn được đồng bộ tự động giữa các thiết bị."
    }
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faq" className="py-16 px-4 sm:px-6 lg:px-8 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-medium text-foreground tracking-tight">
                        Bạn có thắc mắc?
                    </h2>
                    <p className="mx-auto text-center text-lg text-muted-foreground font-light">
                        Chúng tôi luôn sẵn sàng hỗ trợ bạn
                    </p>
                </div>
                <div className="max-w-3xl mx-auto">
                    <div className="space-y-4">
                        {FAQ_DATA.map((faq, index) => {
                            const isOpen = openIndex === index;

                            return (
                                <div
                                    key={faq.question}
                                    className="border border-border/60 rounded-[20px] bg-card shadow-sm hover:shadow-xl hover:shadow-sky-900/5 transition-all duration-300 overflow-hidden"
                                >
                                    <button
                                        type="button"
                                        id={`faq-trigger-${index}`}
                                        className="w-full flex items-center justify-between gap-4 px-8 py-6 text-left"
                                        onClick={() => setOpenIndex(isOpen ? null : index)}
                                        aria-expanded={isOpen}
                                        aria-controls={`faq-panel-${index}`}
                                    >
                                        <span className="text-foreground font-medium text-lg leading-tight">
                                            {faq.question}
                                        </span>
                                        <ChevronDown
                                            className={`size-5 shrink-0 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''
                                                }`}
                                        />
                                    </button>

                                    <div
                                        id={`faq-panel-${index}`}
                                        role="region"
                                        aria-labelledby={`faq-trigger-${index}`}
                                        className={`grid transition-all duration-300 ease-in-out ${isOpen
                                                ? 'grid-rows-[1fr] opacity-100'
                                                : 'grid-rows-[0fr] opacity-0'
                                            }`}
                                    >
                                        <div className="overflow-hidden px-8 pb-6 text-muted-foreground text-base leading-relaxed font-light">
                                            <p>{faq.answer}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
