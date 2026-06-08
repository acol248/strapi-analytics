// Hooks
import { useIntl } from 'react-intl';

// Helpers
import { getTranslation } from '../../utils/getTranslation';

// Strapi
import { Main } from '@strapi/design-system';
import { Layouts } from '@strapi/strapi/admin';

const SettingsPage = () => {
  const { formatMessage } = useIntl();

  return (
    <Layouts.Root>
      <Layouts.Header
        title={formatMessage({ id: getTranslation('plugin.name') })}
        subtitle={formatMessage({ id: getTranslation('plugin.description') })}
      />

      <Layouts.Content>
        <Main>

        </Main>
      </Layouts.Content>
    </Layouts.Root>
  );
};

export default SettingsPage;
