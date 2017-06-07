export type statusType = 'DRAFT' | 'INREVIEW' | 'PUBLISHED';

/**
 * Model for the status of routes, exhibits, exhibit pages, media and tags.
 */
export abstract class Status {

  /**
   * Returns an array of possible status values.
   *
   * @returns an array containing all possible status values
   */
  static getValues(): string[] {
    return ['DRAFT', 'INREVIEW', 'PUBLISHED'];
  }

  /**
   * Returns an array of status values that can be used to filter search results.
   * Useful for ngFor directives in search options.
   *
   * @returns an array of possible status values + value represenging any status
   */
  static getValuesForSearch(): string[] {
    return ['ALL'].concat(Status.getValues());
  }
}
