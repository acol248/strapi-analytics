// Components
import AreaGraph from '../../components/AreaGraph';
import DataCard from '../../components/DataCard';
import { WidgetGrid, Widget, compactLayout } from '../../components/WidgetGrid';

// Hooks
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useTheme } from 'styled-components';

// Helpers
import { getTranslation } from '../../utils/getTranslation';
import { getData, padTimeSeries } from '../../helpers';

// Strapi
import { Layouts } from '@strapi/strapi/admin';
import {
  Main,
  Box,
  Typography,
  IconButton,
  Button,
  SimpleMenu,
  MenuItem,
} from '@strapi/design-system';
import { SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { Flex } from '@strapi/design-system';
import { Pencil, Plus, Check } from '@strapi/icons';

// Types
type Timescale = 'minute' | 'hour' | 'day';
type EventType = 'page_view' | 'click' | 'custom';

interface AnalyticsData {
  action: EventType | string;
  timestamp: string;
  [key: string]: any;
}

const LOCAL_STORAGE_KEY = 'strapi-analytics-layout';

const WIDGET_DEFAULTS: Record<string, Partial<Widget> & { title?: string }> = {
  datacard: { colSpan: 3, rowSpan: 1, title: 'New Metric Card' },
  chart: { colSpan: 6, rowSpan: 2, title: 'New Chart' },
};

const DEFAULT_LAYOUT: Widget[] = [
  {
    id: '1',
    type: 'datacard',
    metric: 'all',
    title: 'Total Events',
    colStart: 1,
    colSpan: 3,
    rowStart: 1,
    rowSpan: 1,
  },
  {
    id: '2',
    type: 'datacard',
    metric: 'page_view',
    title: 'Page Views',
    colStart: 4,
    colSpan: 3,
    rowStart: 1,
    rowSpan: 1,
  },
  {
    id: '3',
    type: 'datacard',
    metric: 'click',
    title: 'Clicks',
    colStart: 7,
    colSpan: 3,
    rowStart: 1,
    rowSpan: 1,
  },
  {
    id: '4',
    type: 'datacard',
    metric: 'form_submit',
    title: 'Form Submissions',
    colStart: 10,
    colSpan: 3,
    rowStart: 1,
    rowSpan: 1,
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

const TIME_DEFAULTS = { minute: 60, hour: 24, day: 30 };

const MainPage = () => {
  const { formatMessage } = useIntl();
  const { uid } = useParams();
  const theme = useTheme();

  const [data, setData] = useState<AnalyticsData[]>([]);
  const [scale, setScale] = useState<Timescale>('day');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [layout, setLayout] = useState<Widget[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved layout', e);
      }
    }

    return DEFAULT_LAYOUT;
  });

  /**
   * Update widget in layout by id
   * @param id target widget to update
   * @param updates partial updates to apply to the widget
   */
  const updateWidget = (id: string, updates: Partial<Widget>) => {
    setLayout((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  };

  /**
   * Remove widget from layout by id
   * @param id target widget to remove
   */
  const deleteWidget = (id: string) => setLayout((prev) => prev.filter((w) => w.id !== id));

  /**
   * Add a new widget to the layout
   * @param type widget type to setup
   */
  const addWidget = (type?: string) => {
    const newId = `w-${Date.now()}`;
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

    setLayout((prev) => compactLayout([...prev, newWidget]));
  };

  /**
   * Compute the value for a given metric based on the current data
   * @param metric metric to compute value for
   * @returns the count of events for the given metric, or total events if 'all' is selected
   */
  const computeMetricValue = (metric: string) => {
    if (metric === 'all') return data.length;

    return data.filter((item) => item.action === metric).length;
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  // Get analytics data
  useEffect(() => {
    const time = `${TIME_DEFAULTS[scale]}${scale[0]}`;
    const options: Record<string, string | number> = { type: 'full' };
    if (uid) options.uid = uid;

    getData(options, time).then(setData).catch(console.error);
  }, [scale, uid]);

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

            <IconButton
              label={formatMessage({ id: getTranslation('overview.edit') })}
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
                    label={formatMessage({ id: getTranslation('overview.add-widget') })}
                    tag={IconButton}
                    icon={<Plus />}
                  >
                    <MenuItem onSelect={() => addWidget('datacard')}>
                      {formatMessage({ id: getTranslation('overview.add-widget.data-card') })}
                    </MenuItem>
                    <MenuItem onSelect={() => addWidget('chart')}>
                      {formatMessage({ id: getTranslation('overview.add-widget.chart') })}
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
              console.log('onChangeLayout', l);
              setLayout(l);
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
                chart: (w) => {
                  const rawChartPoints = data
                    .filter((item) => item.action === w.metric || w.metric === 'all')
                    .map((d) => ({ x: d.timestamp, y: 1 }));

                  const padded = padTimeSeries(rawChartPoints, scale, TIME_DEFAULTS[scale]);
                  return <AreaGraph label={w.title} data={padded} />;
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
