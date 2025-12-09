import { Sankey, Tooltip, Layer, Rectangle } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SankeyData } from "@/hooks/useModeShifts";

interface ModeShiftSankeyProps {
  data: SankeyData | undefined;
  isLoading: boolean;
}

// Colors for each node
const NODE_COLORS: Record<string, string> = {
  "Car": "hsl(142, 76%, 36%)",           // Green - positive environmental impact
  "Bus": "hsl(221, 83%, 53%)",           // Blue - transit
  "Rail": "hsl(217, 91%, 60%)",          // Light blue - transit
  "Scooter / Moped": "hsl(25, 95%, 53%)", // Orange
  "Cycling": "hsl(48, 96%, 53%)",        // Yellow - active mode
  "Walking": "hsl(45, 93%, 47%)",        // Gold - active mode
  "New Trip": "hsl(220, 9%, 46%)",       // Gray - induced demand
  "P-Bike": "hsl(173, 80%, 40%)",        // Teal
  "E-Bike": "hsl(187, 85%, 43%)",        // Cyan
};

interface CustomNodeProps {
  x: number;
  y: number;
  width: number;
  height: number;
  index: number;
  payload: {
    name: string;
    value: number;
  };
}

const CustomNode = ({ x, y, width, height, payload }: CustomNodeProps) => {
  const isTarget = payload.name === "P-Bike" || payload.name === "E-Bike";
  const color = NODE_COLORS[payload.name] || "hsl(220, 9%, 46%)";
  
  return (
    <Layer>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        fillOpacity={0.9}
        rx={4}
        ry={4}
      />
      <text
        x={isTarget ? x + width + 8 : x - 8}
        y={y + height / 2}
        textAnchor={isTarget ? "start" : "end"}
        dominantBaseline="middle"
        className="fill-foreground text-sm font-medium"
      >
        {payload.name}
      </text>
      <text
        x={isTarget ? x + width + 8 : x - 8}
        y={y + height / 2 + 16}
        textAnchor={isTarget ? "start" : "end"}
        dominantBaseline="middle"
        className="fill-muted-foreground text-xs"
      >
        {payload.value?.toLocaleString() || 0}
      </text>
    </Layer>
  );
};

interface CustomLinkProps {
  sourceX: number;
  targetX: number;
  sourceY: number;
  targetY: number;
  sourceControlX: number;
  targetControlX: number;
  linkWidth: number;
  payload: {
    source: { name: string };
    target: { name: string };
    value: number;
  };
}

const CustomLink = (props: CustomLinkProps) => {
  const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, payload } = props;
  const sourceColor = NODE_COLORS[payload.source.name] || "hsl(220, 9%, 46%)";
  
  return (
    <Layer>
      <path
        d={`
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `}
        fill="none"
        stroke={sourceColor}
        strokeWidth={linkWidth}
        strokeOpacity={0.4}
        className="transition-all hover:stroke-opacity-70"
      />
    </Layer>
  );
};

export function ModeShiftSankey({ data, isLoading }: ModeShiftSankeyProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mode Shift Analysis</CardTitle>
          <CardDescription>
            Visualizing where bike trips are coming from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[500px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data && data.links.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mode Shift Analysis</CardTitle>
        <CardDescription>
          Showing estimated previous travel modes for recorded bike trips (extrapolated from 10% survey sample)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-[500px] items-center justify-center text-muted-foreground">
            <p>No survey data available. Run the survey seeding function to generate mock data.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Sankey
              width={800}
              height={500}
              data={data}
              node={(props) => <CustomNode {...props} />}
              link={(props) => <CustomLink {...props} />}
              nodePadding={40}
              nodeWidth={12}
              margin={{ top: 20, right: 120, bottom: 20, left: 120 }}
            >
              <Tooltip
                content={({ payload }) => {
                  if (!payload || !payload.length) return null;
                  const data = payload[0].payload;
                  if (data.source && data.target) {
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-lg">
                        <p className="font-medium">
                          {data.source.name} → {data.target.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.value?.toLocaleString()} trips
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.value?.toLocaleString()} trips
                      </p>
                    </div>
                  );
                }}
              />
            </Sankey>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
