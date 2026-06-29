// Components
import { WidgetGrid, Widget, compactLayout } from '../../components/WidgetGrid';
import AreaGraph from '../../components/AreaGraph';
import BarGraph from '../../components/BarGraph';
import PieGraph from '../../components/PieGraph';
import FunnelGraph from '../../components/FunnelGraph';
import DataCard from '../../components/DataCard';

// Hooks
import { useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useTheme } from 'styled-components';

// Helpers
import { getTranslation } from '../../utils/getTranslation';
import {
  generateId,
  getData,
  getUIDName,
  padTimeSeries,
  startTime,
  endTime,
  deriveScale,
  getLocale,
} from '../../helpers';
import { getLayouts, saveLayout } from '../../helpers/request';

// Strapi
import { Layouts } from '@strapi/strapi/admin';
import { Main, Box, Typography, IconButton, Button, SimpleMenu, MenuItem, DatePicker } from '@strapi/design-system';
import { Flex } from '@strapi/design-system';
import { Pencil, Plus, Check } from '@strapi/icons';

// Types
type EventType = 'page_view' | 'click' | 'custom';

interface AnalyticsData {
  action: EventType | string;
  timestamp: string;
  [key: string]: any;
}

const WIDGET_DEFAULTS: Record<string, Partial<Widget> & { title?: string }> = {
  datacard: { colSpan: 3, rowSpan: 5, title: 'New Metric Card' },
  area_chart: { colSpan: 6, rowSpan: 5, title: 'New Area Chart' },
  bar_chart: { colSpan: 6, rowSpan: 5, title: 'New Bar Chart' },
  pie_chart: { colSpan: 6, rowSpan: 5, title: 'New Pie Chart' },
  funnel_chart: { colSpan: 6, rowSpan: 5, title: 'New Funnel Chart' },
};

const DEFAULT_LAYOUT: Widget[] = [
  {
    id: generateId(),
    type: 'datacard',
    metric: 'all',
    title: 'Total Events',
    colStart: 1,
    colSpan: 6,
    rowStart: 1,
    rowSpan: 5,
  },
  {
    id: generateId(),
    type: 'datacard',
    metric: 'page_view',
    title: 'Page Views',
    colStart: 7,
    colSpan: 6,
    rowStart: 1,
    rowSpan: 5,
  },
  {
    id: generateId(),
    type: 'area_chart',
    metric: 'page_view',
    title: 'Page Views',
    colStart: 1,
    colSpan: 12,
    rowStart: 6,
    rowSpan: 8,
  },
];

const METRICS = [
  { value: 'all', label: 'All Events' },
  { value: 'page_view', label: 'Page Views' },
  { value: 'click', label: 'Clicks' },
  { value: 'file_download', label: 'File Downloads' },
  { value: 'form_submit', label: 'Form Submissions' },
  { value: 'search', label: 'Searches' },
  { value: 'scroll', label: 'Scrolls' },
  { value: 'custom', label: 'Custom Events' },
];

const MainPage = () => {
  const { formatMessage } = useIntl();
  const { uid } = useParams();
  const theme = useTheme();
  const locale = getLocale();

  const [displayName, setDisplayName] = useState<string | undefined>(undefined);
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 864e5));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [editMode, setEditMode] = useState<boolean>(false);
  const [layout, setLayout] = useState<Widget[]>(DEFAULT_LAYOUT);

  /**
   * Update widget in layout by id
   * @param id target widget to update
   * @param updates partial updates to apply to the widget
   */
  const updateWidget = useCallback(
    (id: string, updates: Partial<Widget>) => {
      setLayout((prev) => {
        const newLayout = prev.map((w) => (w.id === id ? { ...w, ...updates } : w));
        // optimistic save
        saveLayout({ isGlobal: !uid, modelUid: uid || undefined, layout: newLayout }).catch(console.error);

        return newLayout;
      });
    },
    [layout, uid]
  );

  /**
   * Remove widget from layout by id
   * @param id target widget to remove
   */
  const deleteWidget = useCallback(
    (id: string) => {
      setLayout((prev) => {
        const newLayout = prev.filter((w) => w.id !== id);
        saveLayout({ isGlobal: !uid, modelUid: uid || undefined, layout: newLayout }).catch(console.error);

        return newLayout;
      });
    },
    [layout, uid]
  );

  /**
   * Add a new widget to the layout
   * @param type widget type to setup
   */
  const addWidget = useCallback(
    (type?: string) => {
      const newId = generateId();
      const kind = type || 'datacard';
      const spec = WIDGET_DEFAULTS[kind] || { colSpan: 3, rowSpan: 1, title: 'New Widget' };

      const newWidget: Widget = {
        id: newId,
        type: kind as any,
        metric: 'all',
        title: spec.title || 'New Widget',
        colStart: 1,
        colSpan: spec.colSpan as number,
        rowStart: 1,
        rowSpan: spec.rowSpan as number,
      };

      setLayout((prev) => {
        const newLayout = compactLayout([...prev, newWidget]);
        saveLayout({ isGlobal: !uid, modelUid: uid || undefined, layout: newLayout }).catch(console.error);

        return newLayout;
      });
    },
    [layout, uid]
  );

  /**
   * Compute the value for a given metric based on the current data
   * @param metric metric to compute value for
   * @returns the count of events for the given metric, or total events if 'all' is selected
   */
  const computeMetricValue = (metric: string) => {
    if (metric === 'all') return data.length;

    return data.filter((item) => item.action === metric).length;
  };

  // Load layout from backend on mount
  useEffect(() => {
    let mounted = true;

    getLayouts({ isGlobal: !uid, modelUid: uid || undefined })
      .then((res) => {
        if (!mounted) return;
        if (Array.isArray(res) && res.length > 0) {
          // prefer first matching layout
          setLayout(res[0].layout || DEFAULT_LAYOUT);
        } else {
          setLayout(DEFAULT_LAYOUT);
        }
      })
      .catch(() => {
        setLayout(DEFAULT_LAYOUT);
      });

    return () => {
      mounted = false;
    };
  }, [uid]);

  // Load content type display name if uid is present
  useEffect(() => {
    if (!uid) return setDisplayName(undefined);

    getUIDName(uid)
      .then(({ displayName }) => setDisplayName(displayName))
      .catch(console.error);
  }, [uid]);

  // Get analytics data
  useEffect(() => {
    const options: Record<string, string | number> = { type: 'full' };
    if (uid) options.uid = uid;

    getData(options, startDate, endDate).then(setData).catch(console.error);
  }, [uid, startDate, endDate]);

  return (
    <>
      <Layouts.Header
        title={displayName || formatMessage({ id: getTranslation('dashboard.title') })}
        primaryAction={
          <Flex gap={2}>
            <Flex gap={1} maxWidth="300px" alignItems="center">
              <DatePicker
                size="S"
                locale={locale}
                initialDate={startDate}
                maxDate={endDate}
                onChange={(d) => d && setStartDate(d)}
              />
              <span>-</span>
              <DatePicker
                size="S"
                locale={locale}
                initialDate={endDate}
                minDate={startDate}
                maxDate={new Date()}
                onChange={(d) => d && setEndDate(d)}
              />
            </Flex>

            <IconButton
              label={formatMessage({ id: getTranslation('dashboard.edit') })}
              onClick={() => setEditMode((em) => !em)}
            >
              {editMode ? <Check /> : <Pencil />}
            </IconButton>
          </Flex>
        }
      />

      <Layouts.Content>
        <Main>
          {editMode && (
            <Box
              padding={4}
              background="neutral0"
              shadow="tableShadow"
              hasRadius
              marginBottom={6}
              style={{ border: `1.5px dashed ${theme.colors.primary600}` }}
            >
              <Flex justifyContent="space-between" alignItems="center">
                <Typography variant="delta" fontWeight="bold">
                  Dashboard Editor
                </Typography>
                <Flex gap={2}>
                  <SimpleMenu
                    label={formatMessage({ id: getTranslation('dashboard.add-widget') })}
                    tag={IconButton}
                    icon={<Plus />}
                  >
                    <MenuItem onSelect={() => addWidget('datacard')}>
                      {formatMessage({ id: getTranslation('dashboard.add-widget.data-card') })}
                    </MenuItem>
                    <MenuItem onSelect={() => addWidget('area_chart')}>
                      {formatMessage({ id: getTranslation('dashboard.add-widget.area-chart') })}
                    </MenuItem>
                    <MenuItem onSelect={() => addWidget('bar_chart')}>
                      {formatMessage({ id: getTranslation('dashboard.add-widget.bar-chart') })}
                    </MenuItem>
                    <MenuItem onSelect={() => addWidget('pie_chart')}>
                      {formatMessage({ id: getTranslation('dashboard.add-widget.pie-chart') })}
                    </MenuItem>
                    <MenuItem onSelect={() => addWidget('funnel_chart')}>
                      {formatMessage({ id: getTranslation('dashboard.add-widget.funnel-chart') })}
                    </MenuItem>
                  </SimpleMenu>

                  <Button variant="tertiary" onClick={() => setLayout(DEFAULT_LAYOUT)}>
                    Reset to Default Layout
                  </Button>
                </Flex>
              </Flex>
            </Box>
          )}

          <WidgetGrid
            layout={layout}
            onChangeLayout={(l) => {
              setLayout(l);
              saveLayout({ isGlobal: !uid, modelUid: uid || undefined, layout: l }).catch(console.error);
            }}
            editMode={editMode}
            metrics={METRICS}
            onUpdateWidget={updateWidget}
            onDeleteWidget={deleteWidget}
            renderWidget={(widget) => {
              const renderers: Record<string, (w: Widget) => JSX.Element | null> = {
                datacard: (w) => {
                  const cardValue = computeMetricValue(w.metric);
                  return <DataCard label={w.title} value={cardValue} />;
                },
                area_chart: (w) => {
                  const rawChartPoints = data
                    .filter((item) => item.action === w.metric || w.metric === 'all')
                    .map((d) => ({ x: d.timestamp, y: 1 }));

                  const usedScale = deriveScale(startDate, endDate);
                  if (!usedScale) {
                    return <Typography>{formatMessage({ id: getTranslation('dashboard.chart.no-scale') })}</Typography>;
                  }

                  const quantity = startTime(usedScale, startDate, endDate);
                  const anchor = endTime(usedScale, endDate);
                  const padded = padTimeSeries(rawChartPoints, usedScale, quantity, anchor);

                  return <AreaGraph label={w.title} data={padded} scale={usedScale} />;
                },
                bar_chart: (w) => {
                  const rawChartPoints = data
                    .filter((item) => item.action === w.metric || w.metric === 'all')
                    .map((d) => ({ x: d.timestamp, y: 1 }));

                  const usedScale = deriveScale(startDate, endDate);
                  if (!usedScale) {
                    return <Typography>{formatMessage({ id: getTranslation('dashboard.chart.no-scale') })}</Typography>;
                  }

                  const quantity = startTime(usedScale, startDate, endDate);
                  const anchor = endTime(usedScale, endDate);
                  const padded = padTimeSeries(rawChartPoints, usedScale, quantity, anchor);

                  return <BarGraph label={w.title} data={padded} scale={usedScale} />;
                },
                pie_chart: (w) => {
                  return <PieGraph label={w.title} metric={w.metric} data={data} />;
                },
                funnel_chart: (w) => {
                  return <FunnelGraph label={w.title} metric={w.metric} data={data} />;
                },
              };

              const renderer = renderers[widget.type];

              return renderer ? renderer(widget) : null;
            }}
          />
        </Main>
      </Layouts.Content>
    </>
  );
};

export default MainPage;
