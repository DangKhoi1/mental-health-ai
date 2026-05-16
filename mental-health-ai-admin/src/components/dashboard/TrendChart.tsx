"use client"

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartConfig = {
  users: {
    label: "Người dùng mới",
    color: "var(--chart-1)",
  },
  assessments: {
    label: "Bài đánh giá",
    color: "var(--chart-2)",
  },
  chats: {
    label: "Lượt chat AI",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

interface TrendChartProps {
  data: { date: string; users: number; assessments: number; chats: number }[];
  days: number;
}

export function TrendChart({ data, days }: TrendChartProps) {
  return (
    <Card className="ring-1 ring-border border-none bg-white/50 backdrop-blur-sm shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl">Biểu đồ xu hướng</CardTitle>
          <CardDescription>
            Thống kê hoạt động hệ thống trong {days} ngày qua
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[4/3] w-full max-h-[350px]">
          <BarChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("vi-VN", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="users" fill="var(--color-users)" radius={4} />
            <Bar dataKey="assessments" fill="var(--color-assessments)" radius={4} />
            <Bar dataKey="chats" fill="var(--color-chats)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
