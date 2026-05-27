import { AssessmentTemplate } from '@/types';
import { FileCheck } from 'lucide-react';

interface AssessmentTemplatesProps {
    templates: AssessmentTemplate[];
    onStart: (templateId: string) => void;
}

export default function AssessmentTemplates({ templates, onStart }: AssessmentTemplatesProps) {
    if (templates.length === 0) {
        return (
            <div className="col-span-full text-center py-12 bg-card rounded-2xl border border-border">
                <div className="size-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <FileCheck className="size-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                    Chưa có bài đánh giá nào
                </h3>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template, index) => (
                <div
                    key={`${template.assessmentTemplateId}-${index}`}
                    className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                    <h3 className="font-semibold text-foreground mb-2">
                        {template.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {template.description}
                    </p>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">
                            {template.totalQuestions || '?'} câu hỏi
                        </span>
                        <button
                            onClick={() => onStart(template.assessmentTemplateId)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
                        >
                            Bắt đầu
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
