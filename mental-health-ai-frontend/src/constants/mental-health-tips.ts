export type TipCategory = 'LOW_MOOD' | 'HIGH_STRESS' | 'POSITIVE' | 'NEUTRAL';

export interface MentalHealthTip {
    id: number;
    text: string;
    category: TipCategory;
    author?: string;
}

export const MENTAL_HEALTH_TIPS: MentalHealthTip[] = [
    
    { id: 1, text: "Hãy dành 5-10 phút để viết nhật ký cảm xúc. Việc gọi tên cảm xúc giúp bạn kiểm soát chúng tốt hơn.", category: 'LOW_MOOD' },
    { id: 2, text: "Một cuộc đi bộ ngắn ngoài trời có thể giúp cải thiện tâm trạng của bạn nhờ ánh sáng tự nhiên.", category: 'LOW_MOOD' },
    { id: 3, text: "Đừng ngần ngại chia sẻ cảm xúc với một người bạn tin cậy. Kết nối xã hội là liều thuốc tinh thần tuyệt vời.", category: 'LOW_MOOD' },
    { id: 4, text: "Hãy thử nghe một bản nhạc yêu thích hoặc xem một bộ phim hài nhẹ nhàng để thay đổi trạng thái cảm xúc.", category: 'LOW_MOOD' },
    { id: 5, text: "Cho phép bản thân nghỉ ngơi. Đôi khi, không làm gì cả cũng là một cách để chữa lành.", category: 'LOW_MOOD' },

    
    { id: 6, text: "Thử kỹ thuật hít thở 4-7-8: Hít vào 4s, giữ 7s, thở ra 8s. Làm 4 lần để giảm căng thẳng tức thì.", category: 'HIGH_STRESS' },
    { id: 7, text: "Hãy tạm rời xa màn hình điện thoại và máy tính trong 15 phút. Đôi mắt và tâm trí bạn cần được nghỉ ngơi.", category: 'HIGH_STRESS' },
    { id: 8, text: "Uống một cốc nước ấm hoặc trà thảo mộc. Hydrat hóa giúp cơ thể và tâm trí vận hành trơn tru hơn.", category: 'HIGH_STRESS' },
    { id: 9, text: "Liệt kê 3 việc quan trọng nhất cần làm hôm nay và tạm quên những việc còn lại. Đừng cố gắng ôm đồm tất cả.", category: 'HIGH_STRESS' },
    { id: 10, text: "Thực hiện bài tập giãn cơ nhẹ nhàng. Căng thẳng tâm lý thường tích tụ ở vai và cổ.", category: 'HIGH_STRESS' },

    
    { id: 11, text: "Tuyệt vời! Hãy tận dụng nguồn năng lượng này để lan tỏa niềm vui đến người xung quanh.", category: 'POSITIVE' },
    { id: 12, text: "Ghi lại điều gì đã khiến bạn cảm thấy tốt hôm nay để có thể áp dụng cho những ngày sau.", category: 'POSITIVE' },
    { id: 13, text: "Đây là thời điểm tốt để thử thách bản thân với một mục tiêu mới hoặc một sở thích mới.", category: 'POSITIVE' },
    { id: 14, text: "Hãy dành lời khen cho ai đó. Niềm vui được chia sẻ là niềm vui được nhân đôi.", category: 'POSITIVE' },
    { id: 15, text: "Duy trì thói quen tốt hiện tại của bạn. Sự kiên trì là chìa khóa của sức khỏe bền vững.", category: 'POSITIVE' },

    
    { id: 16, text: "Chánh niệm là việc tập trung vào hiện tại. Hãy thử ăn một bữa trong sự tĩnh lặng và cảm nhận hương vị.", category: 'NEUTRAL' },
    { id: 17, text: "Giấc ngủ là nền tảng của sức khỏe. Hãy cố gắng đi ngủ và thức dậy đúng giờ mỗi ngày.", category: 'NEUTRAL' },
    { id: 18, text: "Lòng biết ơn giúp nuôi dưỡng sự tích cực. Hãy nghĩ về 3 điều bạn biết ơn ngay lúc này.", category: 'NEUTRAL' },
    { id: 19, text: "Học cách nói 'không' với những điều khiến bạn quá tải là một kỹ năng quan trọng để bảo vệ bản thân.", category: 'NEUTRAL' },
    { id: 20, text: "Kết nối với thiên nhiên, dù chỉ là chăm sóc một chậu cây nhỏ, cũng giúp tâm hồn thư thái hơn.", category: 'NEUTRAL' },
];
