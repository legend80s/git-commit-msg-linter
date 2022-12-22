export interface IConfigLinterRC {
  types: string[];
  'max-len': number;
  'min-len': number;
  debug: boolean;
  showInvalidHeader: boolean;

  /**
   * default false
   */
  scopeRequired: boolean;
  validScopes: string | string[];

  /** default false */
  englishOnly: boolean;

  scopeDescriptions: string;
  invalidScopeDescriptions: string;

  subjectDescriptions: string;
  invalidSubjectDescriptions: string;

  postSubjectDescriptions: string[];
  lang: string;
}
