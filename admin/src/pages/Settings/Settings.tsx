// Hooks
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

// Helpers
import { getTranslation } from '../../utils/getTranslation';
import { generateCode, getCode } from '../../helpers';

// Strapi
import { Box, Button, Field, Main } from '@strapi/design-system';
import { Layouts } from '@strapi/strapi/admin';

const SettingsPage = () => {
  const { formatMessage } = useIntl();

  const [data, setData] = useState<{ code: string } | null>(null);

  // get page data
  useEffect(() => {
    getCode().then(setData).catch(console.error);
  }, []);

  return (
    <Layouts.Root>
      <Layouts.Header
        title={formatMessage({ id: getTranslation('settings.title') })}
        primaryAction={
          <Button onClick={() => generateCode().then(setData).catch(console.error)}>
            {formatMessage({ id: getTranslation('settings.generate') })}
          </Button>
        }
      />

      <Layouts.Content>
        <Main>
          <Box background="neutral0" padding={4} shadow="tableShadow" hasRadius>
            <Field.Root hint={formatMessage({ id: getTranslation('settings.code.hint') })}>
              <Field.Label>
                {formatMessage({ id: getTranslation('settings.code.label') })}
              </Field.Label>
              <Field.Input value={data?.code || ''} readOnly />
              <Field.Hint />
            </Field.Root>
          </Box>
        </Main>
      </Layouts.Content>
    </Layouts.Root>
  );
};

export default SettingsPage;
