// Hooks
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// Helpers
import { getContentType } from '../../helpers';

// Strapi
import { Main, Typography } from '@strapi/design-system';
import { Layouts } from '@strapi/strapi/admin';

const ModelPage = () => {
  const { uid } = useParams();

  const [contentType, setContentType] = useState<ContentTypeConfig | null>(null);

  // get content type details
  useEffect(() => {
    getContentType(uid!)
      .then((d) => setContentType(d.data))
      .catch(console.error);
  }, [uid]);

  return (
    <>
      <Layouts.Header title={contentType?.schema.displayName} />

      <Layouts.Content>
        <Main>
          <Typography>Coming Soon...</Typography>
        </Main>
      </Layouts.Content>
    </>
  );
};

export default ModelPage;
