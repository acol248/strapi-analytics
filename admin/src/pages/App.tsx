import { Routes, Route } from 'react-router-dom';

// Helpers
import { getContentTypes } from '../helpers';
import { getTranslation } from '../utils/getTranslation';

// Hooks
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

// Pages
import MainPage from './Main';

// Strapi
import { Layouts, Page, SubNav } from '@strapi/strapi/admin';
import { Divider, Flex } from '@strapi/design-system';

const App = () => {
  const { formatMessage } = useIntl();

  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);

  // get list of content types on load
  useEffect(() => {
    getContentTypes()
      .then((d) => setContentTypes(d.data))
      .catch(console.error);
  }, []);

  return (
    <Layouts.Root
      sideNav={
        <SubNav.Main>
          <SubNav.Header label={formatMessage({ id: getTranslation('plugin.name') })} />

          <Divider marginBottom={4} />

          <SubNav.Content>
            <Flex direction="column" gap={2} paddingLeft={2} paddingRight={2} paddingBottom={4}>
              <SubNav.Link
                style={{ width: '100%' }}
                label={formatMessage({ id: getTranslation('sidebar.item.overview') })}
                to="/strapi-analytics"
                end
              />
            </Flex>

            <SubNav.Section
              label={formatMessage({ id: getTranslation('sidebar.section.content-types') })}
            >
              {contentTypes
                .filter(({ isDisplayed }) => isDisplayed)
                .map(({ uid, info }) => (
                  <SubNav.Link
                    key={uid}
                    label={info.displayName}
                    to={`/strapi-analytics/uid/${uid}`}
                  />
                ))}
            </SubNav.Section>
          </SubNav.Content>
        </SubNav.Main>
      }
    >
      <Routes>
        <Route index element={<MainPage />} />
        <Route path="uid/:uid" element={<MainPage />} />
        <Route path="*" element={<Page.Error />} />
      </Routes>
    </Layouts.Root>
  );
};

export default App;
