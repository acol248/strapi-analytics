interface ContentType {
  uid: string;
  attributes: Record<string, any>;
  info: {
    singularName: string;
    pluralName: string;
    displayName: string;
  };
  isDisplayed: boolean;
  kind: 'collectionType' | 'singleType';
  options: Record<string, any>;
  pluginOptions: Record<string, any>;
  apiID: string;
}

interface ContentTypeConfig {
  uid: string;
  apiID: string;
  plugin: string | null;
  schema: {
    attributes: Record<string, any>;
    collectionName: string;
    description: string | null;
    displayName: string;
    kind: 'collectionType' | 'singleType';
    singularName: string;
    pluralName: string;
    restrictRelationsTo: string[] | null;
    timestamps: boolean;
    visible: boolean;
  };
}
