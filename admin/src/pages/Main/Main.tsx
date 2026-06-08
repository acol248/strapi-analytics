import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Hooks
import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useTheme } from 'styled-components';

// Helpers
import { getTranslation } from '../../utils/getTranslation';
import { getData, padTimeSeries } from '../../helpers';

// Strapi
import { Main, Box, Typography } from '@strapi/design-system';
import { Layouts } from '@strapi/strapi/admin';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';

// Types
interface AnalyticsData {
  action: string;
  timestamp: string;
}

// Default quantities for each chart timescale
const TIME_DEFAULTS = {
  minute: 60,
  hour: 24,
  day: 30,
};

/**
 * Helper function to format timestamp based on selected timescale
 * @param value timestamp string
 * @param scale selected timescale ('minute', 'hour', 'day')
 * @returns formatted timestamp string
 */
const scaleFormat = (value: string, scale: 'minute' | 'hour' | 'day') => {
  switch (scale) {
    case 'minute':
      return value.slice(0, 16).replace('T', ' ');
    case 'hour':
      return value.slice(0, 13).replace('T', ' ');
    case 'day':
      return value.slice(0, 10);
    default:
      return value;
  }
};

const MainPage = () => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  const [data, setData] = useState<AnalyticsData[]>([]);
  const [scale, setScale] = useState<'minute' | 'hour' | 'day'>('hour');

  // Process data for page views chart
  const pageViewData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    // Group data by timescale and count page views
    const groupedData = data.reduce<Record<string, { timestamp: string; value: number }>>(
      (acc, item) => {
        if (item.action !== 'page_view') return acc;

        const timescale = scaleFormat(item.timestamp, scale);

        if (!acc[timescale]) acc[timescale] = { timestamp: item.timestamp, value: 0 };
        acc[timescale].value += 1;

        return acc;
      },
      {}
    );

    return padTimeSeries(Object.values(groupedData), scale, TIME_DEFAULTS[scale], new Date());
  }, [data, scale]);

  // get data
  useEffect(() => {
    getData().then(setData).catch(console.error);
  }, []);

  return (
    <Layouts.Root>
      <Layouts.Header
        title={formatMessage({ id: getTranslation('plugin.name') })}
        primaryAction={
          <SingleSelect value={scale} onChange={(v: 'minute' | 'hour' | 'day') => setScale(v)}>
            <SingleSelectOption value="minute">Minute</SingleSelectOption>
            <SingleSelectOption value="hour">Hour</SingleSelectOption>
            <SingleSelectOption value="day">Day</SingleSelectOption>
          </SingleSelect>
        }
      />

      <Layouts.Content>
        <Main>
          <Box background="neutral0" hasRadius padding={6} shadow="tableShadow">
            <Box marginBottom={4}>
              <Typography variant="delta" fontWeight="bold">
                {formatMessage({ id: getTranslation('overview.page-views.title') })}
              </Typography>
            </Box>

            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={pageViewData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.neutral200} />

                  <XAxis
                    dataKey="timestamp"
                    tick={{ fill: theme.colors.neutral600, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{ fill: theme.colors.neutral600, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    contentStyle={{
                      background: theme.colors.neutral0,
                      border: `1px solid ${theme.colors.neutral200}`,
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Page Views"
                    stroke={theme.colors.primary600}
                    fillOpacity={0.1}
                    fill={theme.colors.primary600}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Box>
        </Main>
      </Layouts.Content>
    </Layouts.Root>
  );
};

export default MainPage;
