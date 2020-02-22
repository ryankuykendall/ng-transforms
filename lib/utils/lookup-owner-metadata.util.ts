import fs from 'fs';
import * as fileUtil from './file.util';

import {
  IOwnerMetadata,
  IOwnerDetailCascade,
  OwnerDetail,
} from '../commands/ng-create-component-lookup.interface';

export class LookupOwnerMetadata {
  static createFromFilepath(filepath: string | null): LookupOwnerMetadata {
    let metadata: IOwnerMetadata = {
      cascade: [],
      lookup: {},
    };

    if (filepath && fs.existsSync(filepath)) {
      metadata = fileUtil.loadJSONFile(filepath) as IOwnerMetadata;
    }

    return new LookupOwnerMetadata(metadata);
  }

  private cascade!: IOwnerDetailCascade[];
  private lookup!: Map<string, OwnerDetail>;

  constructor(private metadata: IOwnerMetadata) {
    this.cascade = metadata.cascade;
    this.lookup = new Map<string, OwnerDetail>(Object.entries(metadata.lookup));
  }

  find(filepath: string): OwnerDetail | undefined {
    let owner: OwnerDetail | undefined = this.lookup.get(filepath);
    if (owner) return owner;
    return this.cascade.find(({ filepathPrefix }) => filepath.startsWith(filepathPrefix));
  }

  leadsSummary(): Map<string, number> {
    const ownersMap: Map<string, number> = new Map<string, number>();

    // Specific files
    Array.from(Object.entries(this.lookup)).forEach(([filepath, detail]) => {
      detail.leads.forEach((username: string) => {
        const leadCount = ownersMap.get(username) || 0;
        ownersMap.set(username, leadCount + 1);
      });
    });

    // Cascade items
    this.cascade.forEach((cascadeItem: IOwnerDetailCascade) => {
      cascadeItem.leads.forEach((username: string) => {
        const leadCount = ownersMap.get(username) || 0;
        ownersMap.set(username, leadCount + 1);
      });
    });

    return ownersMap;
  }
}
