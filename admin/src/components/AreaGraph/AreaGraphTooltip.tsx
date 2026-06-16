// Hooks
import { useTheme } from 'styled-components';

// Strapi
import { Badge, Box, Flex, Typography } from '@strapi/design-system';

// Types
type PayloadItem = {
  value?: number | string;
  name?: string;
};

export type AreaGraphTooltipProps = {
  active?: boolean;
  label?: number | string;
  payload?: PayloadItem[];
};

const AreaGraphTooltip = ({ active, label, payload }: AreaGraphTooltipProps) => {
  const theme = useTheme();

  if (!active || !payload || payload.length === 0) return null;

  const item = payload[0];
  const dateLabel =
    typeof label === 'number' || typeof label === 'string' ? new Date(label as any).toLocaleString('en-GB') : '';

  return (
    <Box padding={3} background={theme.colors.neutral0} shadow="popupShadow" borderRadius={theme.borderRadius}>
      <Flex direction="column" alignItems="start" gap={1}>
        <Typography variant="pi" textColor="neutral600">{dateLabel}</Typography>
        <Typography variant="omega" textColor="primary600" fontWeight="bold">
          {item.value}
        </Typography>
      </Flex>
    </Box>
  );
};

export default AreaGraphTooltip;
