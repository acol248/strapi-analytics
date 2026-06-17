// Hooks
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

// Helpers
import { getTranslation } from '../../utils/getTranslation';
import { generateCode, getCode } from '../../helpers';

// Permissions
import pluginPermissions from '../../permissions';

// Strapi
import { Box, Button, Field, Main } from '@strapi/design-system';
import { Layouts, Page, useRBAC } from '@strapi/strapi/admin';

const SettingsPage = () => {
  const perm = useRBAC(pluginPermissions);

  const { formatMessage } = useIntl();

  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<{ code: string } | null>(null);

  // get page data
  useEffect(() => {
    if (!perm.allowedActions.canRead) return;

    getCode()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [perm.allowedActions.canRead]);

  // return loading state whilst fetching data
  if (loading) return <Page.Loading />;

  return (
    <Layouts.Root>
      <Layouts.Header
        title={formatMessage({ id: getTranslation('settings.title') })}
        primaryAction={
          <Button
            disabled={!perm.allowedActions.canCreate}
            onClick={() =>
              perm.allowedActions.canCreate && generateCode().then(setData).catch(console.error)
            }
          >
            {formatMessage({ id: getTranslation('settings.generate') })}
          </Button>
        }
      />

      {perm.allowedActions.canRead && (
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
      )}
    </Layouts.Root>
  );
};

const ProtectedSettingsPage = () => (
  <Page.Protect permissions={pluginPermissions.settings}>
    <SettingsPage />
  </Page.Protect>
);

export default ProtectedSettingsPage;
