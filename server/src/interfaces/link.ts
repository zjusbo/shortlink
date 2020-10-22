export interface Link {
  shortLink: string;
  originalLink: string;
  creationDate?: string;
  usageCount?: number;
}

export type Links = Link[];

export function parseLinks(json: string): Links {
  const jsonObj = JSON.parse(json);
  if (!jsonObj) return [];

  let links: Links = [];
  for (let obj of jsonObj) {
    links.push({
      originalLink: obj["originalLink"],
      shortLink: obj["shortLink"],
      creationDate: obj["creationDate"],
      usageCount: obj["usageCount"] ?? 0,
    });
  }
  return links;
}
