export interface IConfigLinterRC {
  types: string[];
  'max-len': number;
  'min-len': number;
  debug: boolean;
  showInvalidHeader: boolean;

  /**
   * https://github.com/legend80s/commit-msg-linter/issues/23
   * default false
   */
  scopeRequired: boolean;

  /** default false */
  englishOnly: boolean;

  scopeDescriptions: string;
  invalidScopeDescriptions: string;

  subjectDescriptions: string;
  invalidSubjectDescriptions: string;

  postSubjectDescriptions: string[];
  lang: string;
}
