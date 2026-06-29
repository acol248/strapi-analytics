import { Cell, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from 'recharts';

// Hooks
import { useTheme } from 'styled-components';
import { useIntl } from 'react-intl';

// Strapi
import { Box, Flex, Typography } from '@strapi/design-system';

// Styles
import { StyledFunnelGraph } from './FunnelGraph.style';

// Types
import { AnalyticsData } from '../PieGraph/PieGraph';

// Utils
import { getTranslation } from '../../utils/getTranslation';

export interface Props {
  label: string;
  metric: string;
  data: AnalyticsData[];
}

const FunnelTooltip = ({ active, payload }: any) => {
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
        {item.percent !== undefined && (
          <Typography variant="pi" textColor="success600" fontWeight="bold">
            {item.percent.toFixed(1)}% of top step
          </Typography>
        )}
      </Flex>
    </Box>
  );
};

const FunnelGraph = ({ label, metric, data }: Props) => {
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

  const totalMax = sortedEntries.length > 0 ? sortedEntries[0][1] : 1;

  const funnelData = sortedEntries.slice(0, 5).map(([name, value]) => ({
    name,
    value,
    percent: totalMax > 0 ? (value / totalMax) * 100 : 0,
  }));

  const COLORS = [
    theme.colors.primary600,
    theme.colors.secondary600,
    theme.colors.success600,
    theme.colors.warning600,
    theme.colors.danger600,
  ];

  if (funnelData.length === 0) {
    return (
      <StyledFunnelGraph>
        <Typography>{label}</Typography>
        <Flex flex={1} alignItems="center" justifyContent="center">
          <Typography textColor="neutral600">
            {formatMessage({ id: getTranslation('components.graph.no-data') })}
          </Typography>
        </Flex>
      </StyledFunnelGraph>
    );
  }

  return (
    <StyledFunnelGraph>
      <Typography>{label}</Typography>
      <div className="funnel-container">
        <ResponsiveContainer width="100%" height="90%">
          <FunnelChart margin={{ top: 10, right: 100, left: 10, bottom: 10 }}>
            <Tooltip content={<FunnelTooltip />} />
            <Funnel dataKey="value" data={funnelData} isAnimationActive>
              <LabelList
                position="right"
                dataKey="name"
                fill={theme.colors.neutral800}
                stroke="none"
                style={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              {funnelData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    </StyledFunnelGraph>
  );
};

export default FunnelGraph;
