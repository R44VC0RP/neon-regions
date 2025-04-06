import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface RegionCardProps {
  name: string
  code: string
  location: string
  recordCount: number
  isLoading?: boolean
  progress?: number | null
}

export function RegionCard({
  name,
  code,
  location,
  recordCount,
  isLoading = false,
  progress = 0
}: RegionCardProps) {
  return (
    <Card className="w-full ">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          <span className="text-sm text-muted-foreground">{code}</span>
        </CardTitle>
        <CardDescription>{location}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Records</span>
            <span className="text-sm text-muted-foreground">
              {isLoading ? 'Seeding...' : recordCount.toLocaleString()}
            </span>
          </div>
          {isLoading && progress !== null && (
            <Progress value={progress} className="h-2" />
          )}
        </div>
      </CardContent>
    </Card>
  )
} 