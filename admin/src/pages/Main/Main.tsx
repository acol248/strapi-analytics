// Components
import AreaGraph from '../../components/AreaGraph';

// Hooks
import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';

// Helpers
import { getTranslation } from '../../utils/getTranslation';
import { getData, padTimeSeries } from '../../helpers';

// Strapi
import { Layouts } from '@strapi/strapi/admin';
import { Main, Box, Typography, IconButton, Checkbox } from '@strapi/design-system';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { SimpleMenu, MenuItem } from '@strapi/design-system';
import { Flex, Grid } from '@strapi/design-system';
import { Filter } from '@strapi/icons';

// Styles
import { StyledOverviewCard } from './Main.style';

// Types
type Timescale = 'minute' | 'hour' | 'day';
type EventType = 'page_view' | 'click' | 'custom';

interface AnalyticsData {
  action: EventType | string;
  timestamp: string;
  [key: string]: any;
}

// Default quantities for each chart timescale
const TIME_DEFAULTS = { minute: 60, hour: 24, day: 30 };
const EVENT_TYPES: EventType[] = ['page_view', 'click', 'custom'];

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

  const [data, setData] = useState<AnalyticsData[]>([]);
  const [scale, setScale] = useState<Timescale>('hour');
  const [selectedGraphs, setSelectedGraphs] = useState<EventType[]>(EVENT_TYPES);

  // Calculate most popular URL in given time range
  const mostPopularUrl = useMemo(() => {
    if (!data || !Array.isArray(data)) return '';

    const rangeMs = {
      minute: TIME_DEFAULTS.minute * 60 * 1000,
      hour: TIME_DEFAULTS.hour * 60 * 60 * 1000,
      day: TIME_DEFAULTS.day * 24 * 60 * 60 * 1000,
    }[scale];

    const now = Date.now();

    const urlCounts: Record<string, number> = {};

    for (const item of data) {
      if (item.action === 'page_view' && item.url) {
        const t = Date.parse(item.timestamp);
        if (Number.isNaN(t) || now - t > rangeMs) continue;
        urlCounts[item.url] = (urlCounts[item.url] || 0) + 1;
      }
    }

    return Object.entries(urlCounts).reduce(
      (max, entry) => {
        if (entry[1] > max[1]) return entry;
        return max;
      },
      ['', 0]
    )[0];
  }, [data, scale]);

  // Calculate total page views and clicks
  const totalPageViews = useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;

    const rangeMs = {
      minute: TIME_DEFAULTS.minute * 60 * 1000,
      hour: TIME_DEFAULTS.hour * 60 * 60 * 1000,
      day: TIME_DEFAULTS.day * 24 * 60 * 60 * 1000,
    }[scale];

    const now = Date.now();

    return data.filter((item) => {
      if (item.action !== 'page_view') return false;
      const t = Date.parse(item.timestamp);
      return !Number.isNaN(t) && now - t <= rangeMs;
    }).length;
  }, [data, scale]);

  // Calculate total clicks
  const totalClicks = useMemo(() => {
    if (!data || !Array.isArray(data)) return 0;

    const rangeMs = {
      minute: TIME_DEFAULTS.minute * 60 * 1000,
      hour: TIME_DEFAULTS.hour * 60 * 60 * 1000,
      day: TIME_DEFAULTS.day * 24 * 60 * 60 * 1000,
    }[scale];

    const now = Date.now();

    return data.filter((item) => {
      if (item.action !== 'click') return false;
      const t = Date.parse(item.timestamp);
      return !Number.isNaN(t) && now - t <= rangeMs;
    }).length;
  }, [data, scale]);

  // Process data for page views chart
  const graphs = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    const grouped: Record<string, Record<string, { x: string; y: number }>> = {};

    for (const item of data) {
      if (!selectedGraphs.includes(item.action as EventType)) continue;

      const timescale = scaleFormat(item.timestamp, scale);

      grouped[item.action] = grouped[item.action] || {};
      if (!grouped[item.action][timescale])
        grouped[item.action][timescale] = { x: item.timestamp, y: 0 };
      grouped[item.action][timescale].y += 1;
    }

    return selectedGraphs.map((action) => {
      const values = grouped[action] ? Object.values(grouped[action]) : [];
      return {
        action,
        data: padTimeSeries(values, scale, TIME_DEFAULTS[scale], new Date()),
      };
    });
  }, [data, scale, selectedGraphs]);

  /**
   * Add/remove target graph from selectedGraphs state
   * @param graph target graph name
   */
  const addRemoveGraph = (graph: EventType) => {
    setSelectedGraphs((prev) => {
      if (prev.includes(graph)) return prev.filter((g) => g !== graph);
      return [...prev, graph];
    });
  };

  // get data
  useEffect(() => {
    getData({ type: 'full' }).then(setData).catch(console.error);
  }, []);

  return (
    <>
      <Layouts.Header
        title={formatMessage({ id: getTranslation('overview.title') })}
        primaryAction={
          <Flex gap={2}>
            <SingleSelect size="S" value={scale} onChange={(v) => setScale(v as Timescale)}>
              <SingleSelectOption value="minute">
                {formatMessage(
                  { id: getTranslation('overview.time.minute'), defaultMessage: '{value} Minutes' },
                  { value: TIME_DEFAULTS.minute }
                )}
              </SingleSelectOption>
              <SingleSelectOption value="hour">
                {formatMessage(
                  { id: getTranslation('overview.time.hour'), defaultMessage: '{value} Hours' },
                  { value: TIME_DEFAULTS.hour }
                )}
              </SingleSelectOption>
              <SingleSelectOption value="day">
                {formatMessage(
                  { id: getTranslation('overview.time.day'), defaultMessage: '{value} Days' },
                  { value: TIME_DEFAULTS.day }
                )}
              </SingleSelectOption>
            </SingleSelect>

            <SimpleMenu
              tag={IconButton}
              icon={<Filter />}
              label={formatMessage({ id: getTranslation('overview.filters') })}
              popoverPlacement="bottom-end"
            >
              {EVENT_TYPES.map((type) => (
                <MenuItem key={type} onClick={() => addRemoveGraph(type)}>
                  <Flex gap={2}>
                    <Checkbox checked={selectedGraphs.includes(type)} />
                    <Typography variant="omega">
                      {formatMessage({
                        id: getTranslation(`overview.filters.${type.replace('_', '-')}`),
                      })}
                    </Typography>
                  </Flex>
                </MenuItem>
              ))}
            </SimpleMenu>
          </Flex>
        }
      />

      <Layouts.Content>
        <Main>
          <Grid.Root
            gap={{
              large: 5,
              medium: 2,
              initial: 1,
            }}
            marginBottom={6}
          >
            <Grid.Item col={4} s={6} xs={12}>
              <StyledOverviewCard>
                <Typography variant="delta" fontWeight="bold" marginBottom={2}>
                  {formatMessage({ id: getTranslation('overview.total-page-views') })}
                </Typography>
                <Typography className="overview-card__content" variant="alpha">
                  {totalPageViews || 0}
                </Typography>
              </StyledOverviewCard>
            </Grid.Item>

            <Grid.Item col={4} s={6} xs={12}>
              <StyledOverviewCard>
                <Typography variant="delta" fontWeight="bold" marginBottom={2}>
                  {formatMessage({ id: getTranslation('overview.most-popular-url') })}
                </Typography>
                <Typography className="overview-card__content" variant="alpha">
                  {mostPopularUrl || '-'}
                </Typography>
              </StyledOverviewCard>
            </Grid.Item>

            <Grid.Item col={4} s={6} xs={12}>
              <StyledOverviewCard>
                <Typography variant="delta" fontWeight="bold" marginBottom={2}>
                  {formatMessage({ id: getTranslation('overview.total-clicks') })}
                </Typography>
                <Typography className="overview-card__content" variant="alpha">
                  {totalClicks || 0}
                </Typography>
              </StyledOverviewCard>
            </Grid.Item>
          </Grid.Root>

          {graphs.map((g) => (
            <Box background="neutral0" hasRadius padding={6} marginBottom={6} shadow="tableShadow">
              <Box marginBottom={4}>
                <Typography variant="delta" fontWeight="bold">
                  {formatMessage({
                    id: getTranslation(`overview.graph.${g.action.replace('_', '-')}.title`),
                  })}
                </Typography>
              </Box>

              <Box key={g.action} width="100%" height="300px" marginBottom={4}>
                <AreaGraph data={g.data} />
              </Box>
            </Box>
          ))}
        </Main>
      </Layouts.Content>
    </>
  );
};

export default MainPage;
