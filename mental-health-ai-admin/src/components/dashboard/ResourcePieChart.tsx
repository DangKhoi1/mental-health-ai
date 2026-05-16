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

const chartConfig = {
  count: {
    label: "Số lượng",
  },
  RES_MEDITATION: {
    label: "Thiền",
    color: "var(--chart-1)",
  },
  RES_BREATHING: {
    label: "Hít thở",
    color: "var(--chart-2)",
  },
  RES_ARTICLE: {
    label: "Bài viết",
    color: "var(--chart-3)",
  },
  RES_VIDEO: {
    label: "Video",
    color: "var(--chart-4)",
  },
  RES_MUSIC: {
    label: "Âm nhạc",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

interface ResourcePieChartProps {
  data: { category: string; count: number }[];
}

const categoryAliasMap: Record<string, keyof typeof chartConfig> = {
  RES_MEDITATION: "RES_MEDITATION",
  MEDITATION: "RES_MEDITATION",
  RES_BREATHING: "RES_BREATHING",
  BREATHING: "RES_BREATHING",
  RES_ARTICLE: "RES_ARTICLE",
  ARTICLE: "RES_ARTICLE",
  RES_VIDEO: "RES_VIDEO",
  VIDEO: "RES_VIDEO",
  RES_MUSIC: "RES_MUSIC",
  MUSIC: "RES_MUSIC",
};

export function ResourcePieChart({ data }: ResourcePieChartProps) {
  const normalizedData = data.reduce((acc, item) => {
    const normalizedCategory = categoryAliasMap[item.category] ?? item.category;
    const previousCount = acc.get(normalizedCategory) ?? 0;
    acc.set(normalizedCategory, previousCount + item.count);
    return acc;
  }, new Map<string, number>());

  const chartData = Array.from(normalizedData.entries()).map(([category, count]) => ({
    category,
    count,
    fill: `var(--color-${category}, hsl(var(--chart-5)))`,
  }));

  const totalResources = chartData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className="flex flex-col h-full ring-1 ring-border border-none bg-white/50 backdrop-blur-sm shadow-sm">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">Phân bổ tài liệu</CardTitle>
        <CardDescription>Tổng cộng {totalResources} nội dung</CardDescription>
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
                  nameKey="category"
                  className="grid grid-cols-2 justify-items-start gap-x-5 gap-y-2 [&>div]:shrink-0 [&>div]:whitespace-nowrap"
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="category"
              cx="50%"
              cy="44%"
              outerRadius={88}
              label={false}
              labelLine={false}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
