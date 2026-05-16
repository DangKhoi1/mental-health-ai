"use client"

import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const moodColorMap: Record<string, string> = {
  "Rất tốt": "#22c55e",
  "Tốt": "#3b82f6",
  "Trung bình": "#f59e0b",
  "Thấp": "#f97316",
  "Rất thấp": "#ef4444",
};

const chartConfig = {
  count: {
    label: "Số lượng",
  },
  "Rất tốt": {
    label: "Rất tốt",
    color: "hsl(var(--chart-2))",
  },
  "Tốt": {
    label: "Tốt",
    color: "hsl(var(--chart-1))",
  },
  "Trung bình": {
    label: "Trung bình",
    color: "hsl(var(--chart-3))",
  },
  "Thấp": {
    label: "Thấp",
    color: "hsl(var(--chart-4))",
  },
  "Rất thấp": {
    label: "Rất thấp",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

interface MoodPieChartProps {
  data: { label: string; count: number; percent: number }[];
  avgScore: number;
}

export function MoodPieChart({ data, avgScore }: MoodPieChartProps) {
  const chartData = data.map((item) => ({
    label: item.label,
    count: item.count,
    fill: moodColorMap[item.label] ?? "hsl(var(--chart-5))",
  }));

  return (
    <Card className="flex flex-col h-full ring-1 ring-border border-none bg-white/50 backdrop-blur-sm shadow-sm">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">Phân bổ tâm trạng</CardTitle>
        <CardDescription>Điểm trung bình: {avgScore}/10</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto h-80 w-full max-w-sm pb-0"
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend
              verticalAlign="bottom"
              content={
                <ChartLegendContent
                  nameKey="label"
                  className="grid grid-cols-2 justify-items-start gap-x-5 gap-y-2 [&>div]:shrink-0 [&>div]:whitespace-nowrap"
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              innerRadius={60}
              outerRadius={90}
              strokeWidth={5}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
