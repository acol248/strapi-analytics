import { Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

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
export interface Props {
  label: string;
  data: { name: string; value: number }[];
}

const PieGraphTooltip = ({ active, payload }: any) => {
  const theme = useTheme();

  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0].payload;

  return (
    <Box
      padding={3}
      background="neutral0"
      borderColor="neutral150"
      borderStyle="solid"
      borderWidth="1px"
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

const PieGraph = ({ label, data }: Props) => {
  const theme = useTheme();
  const { formatMessage } = useIntl();

  const COLORS = [
    theme.colors.primary600,
    theme.colors.secondary600,
    theme.colors.success600,
    theme.colors.warning600,
    theme.colors.danger600,
    theme.colors.neutral600,
  ];

  const pieData = (data || []).map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  if (pieData.length === 0) {
    return (
      <StyledPieGraph>
        <Typography variant="delta" fontWeight="bold" textColor="neutral800">
          {label}
        </Typography>
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
      <Typography variant="delta" fontWeight="bold" textColor="neutral800">
        {label}
      </Typography>
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
              stroke={theme.colors.neutral0}
              strokeWidth={2}
            />
            <Tooltip content={<PieGraphTooltip />} />
            <Legend
              iconType="circle"
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{
                fontSize: theme.fontSizes[1] || '12px',
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
