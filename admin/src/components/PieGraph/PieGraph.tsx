import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

// Hooks
import { useTheme } from 'styled-components';
import { useIntl } from 'react-intl';

// Strapi
import { Box, Flex, Typography } from '@strapi/design-system';

// Styles
import { StyledPieGraph } from './PieGraph.style';

// Utils
import { getTranslation } from '../../utils/getTranslation';

// Types
export interface AnalyticsData {
  action: string;
  timestamp: string;
  [key: string]: any;
}

export interface Props {
  label: string;
  metric: string;
  data: AnalyticsData[];
}

const PieGraphTooltip = ({ active, payload }: any) => {
  const theme = useTheme();

  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;

  return (
    <Box
      padding={3}
      background={theme.colors.neutral0}
      shadow="popupShadow"
      borderRadius={theme.borderRadius}
    >
      <Flex direction="column" alignItems="start" gap={1}>
        <Typography variant="pi" textColor="neutral600" fontWeight="bold">
          {item.name}
        </Typography>
        <Typography variant="omega" textColor="primary600" fontWeight="bold">
          {item.value} events
        </Typography>
      </Flex>
    </Box>
  );
};

const PieGraph = ({ label, metric, data }: Props) => {
  const theme = useTheme();
  const { formatMessage } = useIntl();

  const filteredData = data.filter((item) => metric === 'all' || item.action === metric);
  const groupKey = metric === 'all' ? 'action' : 'url';

  const counts: Record<string, number> = {};
  filteredData.forEach((item) => {
    const value = item[groupKey] || 'Unknown';
    counts[value] = (counts[value] || 0) + 1;
  });

  const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  let pieData: { name: string; value: number }[] = [];
  if (sortedEntries.length <= 6) {
    pieData = sortedEntries.map(([name, value]) => ({ name, value }));
  } else {
    const topEntries = sortedEntries.slice(0, 5);
    const otherCount = sortedEntries.slice(5).reduce((acc, curr) => acc + curr[1], 0);
    pieData = topEntries.map(([name, value]) => ({ name, value }));
    pieData.push({ name: 'Other', value: otherCount });
  }

  const COLORS = [
    theme.colors.primary600,
    theme.colors.secondary600,
    theme.colors.success600,
    theme.colors.warning600,
    theme.colors.danger600,
    theme.colors.neutral600,
  ];

  if (pieData.length === 0) {
    return (
      <StyledPieGraph>
        <Typography>{label}</Typography>
        <Flex flex={1} alignItems="center" justifyContent="center">
          <Typography textColor="neutral600">
            {formatMessage({ id: getTranslation('components.graph.no-data') })}
          </Typography>
        </Flex>
      </StyledPieGraph>
    );
  }

  return (
    <StyledPieGraph>
      <Typography>{label}</Typography>
      <div className="pie-container">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PieGraphTooltip />} />
            <Legend
              iconType="circle"
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{
                fontSize: '12px',
                paddingLeft: '10px',
                maxWidth: '50%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </StyledPieGraph>
  );
};

export default PieGraph;
